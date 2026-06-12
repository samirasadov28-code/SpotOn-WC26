import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { simulateBracket } from '@/lib/bracket-sim'
import type { TeamInfo, MatchInfo } from '@/lib/bracket-sim'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { leagueId? } → { top4: [[{team,votes},...], ...], champByUser: Record<userId, {name,fifa_code}|null> }
export async function POST(request: NextRequest) {
  const { leagueId } = await request.json()
  const supabase = svc()

  // Fetch all matches (group + ko) and teams
  const [matchRes, teamRes] = await Promise.all([
    supabase.from('matches').select('id, stage, group_letter, bracket_slot, home_team_id, away_team_id').order('kickoff_at'),
    supabase.from('teams').select('id, name, fifa_code, group_letter, flag_emoji'),
  ])

  const allMatches: MatchInfo[] = (matchRes.data ?? []).map((m: any) => ({
    id: m.id,
    group_letter: m.group_letter,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
  }))
  const allTeams: TeamInfo[] = (teamRes.data ?? []).map((t: any) => ({
    id: t.id, name: t.name, fifa_code: t.fifa_code, group_letter: t.group_letter, flag_emoji: t.flag_emoji,
  }))

  const groupMatchIds = allMatches.filter(m => (matchRes.data ?? []).find((r: any) => r.id === m.id && r.stage === 'group')).map(m => m.id)

  // Member filter
  let memberIds: Set<string> | null = null
  if (leagueId && leagueId !== 'global') {
    const { data: mem } = await supabase.from('league_members').select('user_id').eq('league_id', leagueId)
    memberIds = new Set((mem ?? []).map((m: any) => m.user_id))
  }

  // Fetch all group and KO predictions (paginate)
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

  // Group by user
  const userGroupPreds = new Map<string, Map<string, { h: number; a: number }>>()
  for (const p of groupPredRows) {
    if (p.pred_home_score === null) continue
    if (memberIds && !memberIds.has(p.user_id)) continue
    if (!userGroupPreds.has(p.user_id)) userGroupPreds.set(p.user_id, new Map())
    userGroupPreds.get(p.user_id)!.set(p.match_id, { h: p.pred_home_score, a: p.pred_away_score })
  }

  const userKOPreds = new Map<string, Map<number, { h: number; a: number }>>()
  for (const p of koPredRows) {
    if (p.pred_home_score === null) continue
    if (memberIds && !memberIds.has(p.user_id)) continue
    if (!userKOPreds.has(p.user_id)) userKOPreds.set(p.user_id, new Map())
    userKOPreds.get(p.user_id)!.set(p.bracket_slot, { h: p.pred_home_score, a: p.pred_away_score })
  }

  const allUserIds = new Set([...userGroupPreds.keys(), ...userKOPreds.keys()])

  // Simulate bracket per user
  const posVotes: [Map<string, number>, Map<string, number>, Map<string, number>, Map<string, number>] = [
    new Map(), new Map(), new Map(), new Map(),
  ]
  const champByUser: Record<string, { name: string; fifa_code: string } | null> = {}
  const positionsByUser: Record<string, Array<{ name: string; fifa_code: string } | null>> = {}
  const teamById = new Map(allTeams.map(t => [t.id, t]))

  for (const uid of allUserIds) {
    const gp = userGroupPreds.get(uid) ?? new Map()
    const kp = userKOPreds.get(uid) ?? new Map()
    const result = simulateBracket(gp, kp, allMatches, allTeams)

    const toTeamRef = (t: typeof result.champion) =>
      t ? { name: t.name, fifa_code: t.fifa_code } : null

    champByUser[uid] = toTeamRef(result.champion)
    positionsByUser[uid] = [
      toTeamRef(result.champion),
      toTeamRef(result.second),
      toTeamRef(result.third),
      toTeamRef(result.fourth),
    ]

    const positions = [result.champion, result.second, result.third, result.fourth]
    positions.forEach((team, i) => {
      if (team) posVotes[i].set(team.id, (posVotes[i].get(team.id) ?? 0) + 1)
    })
  }

  const top4 = posVotes.map(vm =>
    [...vm.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, votes]) => {
        const t = teamById.get(id)
        return t ? { team: { name: t.name, fifa_code: t.fifa_code }, votes } : null
      })
      .filter(Boolean)
  )

  return NextResponse.json({ top4, champByUser, positionsByUser })
}
