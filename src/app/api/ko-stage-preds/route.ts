import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { simulateAllMatchups } from '@/lib/bracket-sim'
import type { MatchInfo, TeamInfo } from '@/lib/bracket-sim'

/**
 * Returns actual advancing teams + per-user predicted advancing teams for a KO stage.
 *
 * stage: 'r16' | 'qf' | 'sf' | 'final' | 'third'
 *
 * For each stage, columns represent "winner of prev-round slot X":
 *   r16:   columns W M73–W M88  (winners of R32 slots 1–16)
 *   qf:    columns W M89–W M96  (winners of R16 slots 17–24)
 *   sf:    columns W M97–W M100 (winners of QF slots 25–28)
 *   final: columns W M101, W M102 (winners of SF slots 29–30)
 *   third: columns L M101, L M102 (losers of SF slots 29–30)
 *
 * actual: { [colPos]: teamId }       — actual winner/loser of that slot
 * preds:  { [userId]: { [colPos]: teamId } } — user's predicted winner/loser
 * roundPts: { [userId]: number }     — advancement pts earned in this stage
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const stage: string = body.stage ?? 'r16'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ actual: {}, preds: {}, roundPts: {} }, { status: 500 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // prevSlots: the round whose WINNERS become the columns for this view
  const STAGE_PREV: Record<string, [number, number]> = {
    r16: [1, 16], qf: [17, 24], sf: [25, 28], final: [29, 30], third: [29, 30],
  }
  const prevRange = STAGE_PREV[stage]
  if (!prevRange) return NextResponse.json({ actual: {}, preds: {}, roundPts: {} })

  const isThird = stage === 'third'
  const prefix = isThird ? 'L' : 'W'

  // Fetch all matches and teams
  const [matchRes, teamRes] = await Promise.all([
    supabase.from('matches').select('id, stage, group_letter, bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score, actual_winner_id'),
    supabase.from('teams').select('id, name, fifa_code, group_letter, flag_emoji'),
  ])

  const allMatchRows = (matchRes.data ?? []) as any[]
  const allTeams: TeamInfo[] = (teamRes.data ?? []).map((t: any) => ({
    id: t.id, name: t.name, fifa_code: t.fifa_code, group_letter: t.group_letter, flag_emoji: t.flag_emoji,
  }))
  const allMatches: MatchInfo[] = allMatchRows.map((m: any) => ({
    id: m.id,
    group_letter: m.group_letter,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
  }))

  // Build actual column map from played matches
  const actual: Record<string, string> = {}
  for (const m of allMatchRows) {
    if (m.stage !== 'knockout') continue
    const slot = m.bracket_slot as number
    if (slot < prevRange[0] || slot > prevRange[1]) continue
    if (m.actual_home_score === null || !m.home_team_id || !m.away_team_id) continue

    let winnerId: string = m.actual_winner_id
    if (!winnerId) {
      const ah = m.actual_home_score as number, aa = m.actual_away_score as number
      winnerId = ah > aa ? m.home_team_id : m.away_team_id
    }
    const loserId = winnerId === m.home_team_id ? m.away_team_id : m.home_team_id

    const colPos = `${prefix} M${slot + 72}`
    actual[colPos] = isThird ? loserId : winnerId
  }

  // Build teamMap and actual slot teams for fallback when simulation has no group preds
  const teamMap = new Map<string, TeamInfo>()
  for (const t of allTeams) teamMap.set(t.id, t)

  const actualSlotTeams = new Map<number, { home: string | null; away: string | null }>()
  for (const m of allMatchRows) {
    if (m.stage !== 'knockout') continue
    actualSlotTeams.set(m.bracket_slot as number, { home: m.home_team_id ?? null, away: m.away_team_id ?? null })
  }

  // Group predictions per user
  const groupMatchIds = allMatchRows.filter(m => m.stage === 'group').map((m: any) => m.id as string)
  const userGroupPreds = new Map<string, Map<string, { h: number; a: number }>>()
  if (groupMatchIds.length > 0) {
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('predictions_group')
        .select('user_id, match_id, pred_home_score, pred_away_score')
        .in('match_id', groupMatchIds)
        .range(offset, offset + 999)
      if (!data?.length) break
      for (const p of data as any[]) {
        if (p.pred_home_score === null) continue
        if (!userGroupPreds.has(p.user_id)) userGroupPreds.set(p.user_id, new Map())
        userGroupPreds.get(p.user_id)!.set(p.match_id, { h: p.pred_home_score, a: p.pred_away_score })
      }
      if (data.length < 1000) break
      offset += 1000
    }
  }

  // KO score predictions per user
  const userKOPreds = new Map<string, Map<number, { h: number; a: number }>>()
  {
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('predictions_knockout')
        .select('user_id, bracket_slot, pred_home_score, pred_away_score')
        .range(offset, offset + 999)
      if (!data?.length) break
      for (const p of data as any[]) {
        if (p.pred_home_score === null) continue
        if (!userKOPreds.has(p.user_id)) userKOPreds.set(p.user_id, new Map())
        userKOPreds.get(p.user_id)!.set(p.bracket_slot as number, { h: p.pred_home_score, a: p.pred_away_score })
      }
      if (data.length < 1000) break
      offset += 1000
    }
  }

  const allUserIds = new Set([...userGroupPreds.keys(), ...userKOPreds.keys()])
  const preds: Record<string, Record<string, string>> = {}
  const roundPts: Record<string, number> = {}

  for (const userId of allUserIds) {
    const gp = userGroupPreds.get(userId) ?? new Map()
    const kp = userKOPreds.get(userId) ?? new Map()
    if (gp.size === 0 && kp.size === 0) continue

    // Full bracket simulation
    const matchups = simulateAllMatchups(gp, kp, allMatches, allTeams)
    const userSlot = new Map(matchups.map(m => [m.slot, { home: m.home, away: m.away }]))

    const userCols: Record<string, string> = {}
    let pts = 0

    for (let slot = prevRange[0]; slot <= prevRange[1]; slot++) {
      const colPos = `${prefix} M${slot + 72}`
      const matchup = userSlot.get(slot)
      if (!matchup) continue

      const pred = kp.get(slot)
      if (!pred || pred.h === pred.a) continue

      // Use simulated teams; fall back to actual DB teams if simulation returned null
      let home = matchup?.home ?? null
      let away = matchup?.away ?? null
      if (!home || !away) {
        const actual = actualSlotTeams.get(slot)
        if (actual) {
          if (!home && actual.home) home = teamMap.get(actual.home) ?? null
          if (!away && actual.away) away = teamMap.get(actual.away) ?? null
        }
      }

      // Determine user's predicted winner (or loser for third-place)
      let predictedTeam: TeamInfo | null
      if (isThird) {
        predictedTeam = pred.h > pred.a ? away : home // loser
      } else {
        predictedTeam = pred.h > pred.a ? home : away // winner
      }
      if (!predictedTeam) continue

      userCols[colPos] = predictedTeam.id

      // Round pts: +pts if prediction matches actual
      if (actual[colPos] && actual[colPos] === predictedTeam.id) {
        // Stage pts for next round (the current stage in view)
        const nextStageMap: Record<string, string> = { r16: 'r16', qf: 'qf', sf: 'sf', final: 'final', third: 'third_match' }
        pts += STAGE_POINTS[nextStageMap[stage]] ?? 0
      }
    }

    if (Object.keys(userCols).length > 0) preds[userId] = userCols
    if (pts > 0) roundPts[userId] = pts
  }

  return NextResponse.json({ actual, preds, roundPts })
}
