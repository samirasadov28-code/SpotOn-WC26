import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { simulateRounds } from '@/lib/bracket-sim'
import type { TeamInfo, MatchInfo, ExitRound } from '@/lib/bracket-sim'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { leagueId? } → { roundExits, topScores, goalStats }
export async function POST(request: NextRequest) {
  const { leagueId } = await request.json()
  const supabase = svc()

  const [matchRes, teamRes] = await Promise.all([
    supabase.from('matches').select('id, stage, group_letter, bracket_slot, home_team_id, away_team_id').order('kickoff_at'),
    supabase.from('teams').select('id, name, fifa_code, group_letter, flag_emoji'),
  ])

  const allMatches: MatchInfo[] = (matchRes.data ?? []).map((m: any) => ({
    id: m.id, group_letter: m.group_letter, home_team_id: m.home_team_id, away_team_id: m.away_team_id,
  }))
  const allTeams: TeamInfo[] = (teamRes.data ?? []).map((t: any) => ({
    id: t.id, name: t.name, fifa_code: t.fifa_code, group_letter: t.group_letter, flag_emoji: t.flag_emoji,
  }))
  const teamById = new Map(allTeams.map(t => [t.id, t]))

  const groupMatchIds = (matchRes.data ?? []).filter((m: any) => m.stage === 'group').map((m: any) => m.id)

  let memberIds: Set<string> | null = null
  if (leagueId && leagueId !== 'global') {
    const { data: mem } = await supabase.from('league_members').select('user_id').eq('league_id', leagueId)
    memberIds = new Set((mem ?? []).map((m: any) => m.user_id))
  }

  const groupPredRows: any[] = []
  if (groupMatchIds.length > 0) {
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('predictions_group')
        .select('user_id, match_id, pred_home_score, pred_away_score')
        .in('match_id', groupMatchIds)
        .range(offset, offset + 999)
      if (!data?.length) break
      groupPredRows.push(...data)
      if (data.length < 1000) break
      offset += 1000
    }
  }

  const koPredRows: any[] = []
  let koOffset = 0
  while (true) {
    const { data } = await supabase
      .from('predictions_knockout')
      .select('user_id, bracket_slot, pred_home_score, pred_away_score')
      .range(koOffset, koOffset + 999)
    if (!data?.length) break
    koPredRows.push(...data)
    if (data.length < 1000) break
    koOffset += 1000
  }

  const filterUser = (uid: string) => !memberIds || memberIds.has(uid)

  const userGroupPreds = new Map<string, Map<string, { h: number; a: number }>>()
  for (const p of groupPredRows) {
    if (p.pred_home_score === null || !filterUser(p.user_id)) continue
    if (!userGroupPreds.has(p.user_id)) userGroupPreds.set(p.user_id, new Map())
    userGroupPreds.get(p.user_id)!.set(p.match_id, { h: p.pred_home_score, a: p.pred_away_score })
  }

  const userKOPreds = new Map<string, Map<number, { h: number; a: number }>>()
  for (const p of koPredRows) {
    if (p.pred_home_score === null || !filterUser(p.user_id)) continue
    if (!userKOPreds.has(p.user_id)) userKOPreds.set(p.user_id, new Map())
    userKOPreds.get(p.user_id)!.set(p.bracket_slot, { h: p.pred_home_score, a: p.pred_away_score })
  }

  const allUserIds = new Set([...userGroupPreds.keys(), ...userKOPreds.keys()])

  // Round exit vote counts: teamId → round → count
  const roundVotes = new Map<string, Map<ExitRound, number>>()
  const ROUNDS: ExitRound[] = ['group', 'r32', 'r16', 'qf', 'sf', 'fourth', 'third', 'second', 'champion']

  for (const uid of allUserIds) {
    const gp = userGroupPreds.get(uid) ?? new Map()
    const kp = userKOPreds.get(uid) ?? new Map()
    const exits = simulateRounds(gp, kp, allMatches, allTeams)
    for (const [teamId, round] of exits) {
      if (!roundVotes.has(teamId)) roundVotes.set(teamId, new Map())
      const rv = roundVotes.get(teamId)!
      rv.set(round, (rv.get(round) ?? 0) + 1)
    }
  }

  // Build roundExits: for each round, top teams (sorted by count)
  const roundExits: Record<string, Array<{ fifaCode: string; name: string; count: number }>> = {}
  for (const round of ROUNDS) {
    const teams: Array<{ fifaCode: string; name: string; count: number }> = []
    for (const [teamId, rv] of roundVotes) {
      const count = rv.get(round) ?? 0
      if (count === 0) continue
      const t = teamById.get(teamId)
      if (t) teams.push({ fifaCode: t.fifa_code, name: t.name, count })
    }
    teams.sort((a, b) => b.count - a.count)
    roundExits[round] = teams.slice(0, 5)
  }

  // Top predicted scores (group stage)
  const scoreCounts = new Map<string, number>()
  for (const p of groupPredRows) {
    if (p.pred_home_score === null || !filterUser(p.user_id)) continue
    const key = `${p.pred_home_score}–${p.pred_away_score}`
    scoreCounts.set(key, (scoreCounts.get(key) ?? 0) + 1)
  }
  const topScores = [...scoreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([score, count]) => ({ score, count }))

  // Goal stats (group stage only)
  const userGoalTotals = new Map<string, { total: number; count: number; maxMatch: number; maxDiff: number; maxDiffScore: string; maxGoalScore: string }>()
  for (const p of groupPredRows) {
    if (p.pred_home_score === null || !filterUser(p.user_id)) continue
    const matchGoals = p.pred_home_score + p.pred_away_score
    const diff = Math.abs(p.pred_home_score - p.pred_away_score)
    if (!userGoalTotals.has(p.user_id)) {
      userGoalTotals.set(p.user_id, { total: 0, count: 0, maxMatch: 0, maxDiff: 0, maxDiffScore: '', maxGoalScore: '' })
    }
    const s = userGoalTotals.get(p.user_id)!
    s.total += matchGoals
    s.count++
    if (matchGoals > s.maxMatch) {
      s.maxMatch = matchGoals
      s.maxGoalScore = `${p.pred_home_score}–${p.pred_away_score}`
    }
    if (diff > s.maxDiff) {
      s.maxDiff = diff
      s.maxDiffScore = `${p.pred_home_score}–${p.pred_away_score}`
    }
  }

  const { data: users } = await supabase.from('users').select('id, display_name')
  const userNames = new Map((users ?? []).map((u: any) => [u.id, u.display_name ?? 'Unknown']))

  const goalList = [...userGoalTotals.entries()]
    .filter(([, s]) => s.count >= 10)
    .map(([uid, s]) => ({ uid, name: userNames.get(uid) ?? uid, ...s, avg: s.total / s.count }))

  goalList.sort((a, b) => b.total - a.total)
  const mostGoals = goalList[0] ?? null
  const leastGoals = goalList.length > 0 ? goalList[goalList.length - 1] : null

  goalList.sort((a, b) => b.avg - a.avg)
  const highestAvg = goalList[0] ?? null

  goalList.sort((a, b) => b.maxDiff - a.maxDiff)
  const boldestDiff = goalList[0] ?? null

  goalList.sort((a, b) => b.maxMatch - a.maxMatch)
  const mostMatchGoals = goalList[0] ?? null

  return NextResponse.json({
    roundExits,
    topScores,
    goalStats: { mostGoals, leastGoals, highestAvg, boldestDiff, mostMatchGoals },
    totalUsers: allUserIds.size,
  })
}
