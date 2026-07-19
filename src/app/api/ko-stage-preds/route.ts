import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { STAGE_POINTS } from '@/lib/scoring/advancement'
import { simulateAllMatchups } from '@/lib/bracket-sim'
import type { MatchInfo, TeamInfo } from '@/lib/bracket-sim'

/**
 * Returns actual advancing teams + per-user predicted advancing teams for a KO stage.
 *
 * stage: 'r16' | 'qf' | 'sf' | 'final' | 'third'
 *
 * Column labels are the prev-round slot winner/loser:
 *   r16:   W M73–W M88  (winners of R32 slots 1–16)
 *   qf:    W M89–W M96  (winners of R16 slots 17–24)
 *   sf:    W M97–W M100 (winners of QF slots 25–28)
 *   final: W M101, W M102 (winners of SF slots 29–30)
 *   third: L M101, L M102 (losers of SF slots 29–30)
 *
 * actual:   { [colPos]: teamId }
 * preds:    { [userId]: { [colPos]: teamId } }
 * roundPts: { [userId]: number }
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

  // prevSlots: which KO slots feed into the current stage view
  const STAGE_PREV: Record<string, [number, number]> = {
    r16: [1, 16], qf: [17, 24], sf: [25, 28], final: [29, 30], third: [29, 30],
  }
  const prevRange = STAGE_PREV[stage]
  if (!prevRange) return NextResponse.json({ actual: {}, preds: {}, roundPts: {} })

  const isThird = stage === 'third'
  const prefix = isThird ? 'L' : 'W'

  // Stage pts awarded for a correct prediction in this view
  const STAGE_PTS_KEY: Record<string, string> = {
    r16: 'r16', qf: 'qf', sf: 'sf', final: 'final', third: 'third_match',
  }
  const stagePts = STAGE_POINTS[STAGE_PTS_KEY[stage]] ?? 0

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

  // teamMap: id → TeamInfo
  const teamMap = new Map<string, TeamInfo>()
  for (const t of allTeams) teamMap.set(t.id, t)

  // actualSlotTeams: bracket_slot → { home, away } team IDs from DB
  const actualSlotTeams = new Map<number, { home: string | null; away: string | null }>()
  for (const m of allMatchRows) {
    if (m.stage !== 'knockout') continue
    actualSlotTeams.set(m.bracket_slot as number, {
      home: m.home_team_id ?? null,
      away: m.away_team_id ?? null,
    })
  }

  // Build actual column map: colPos → teamId (winner or loser) of each played prev-round match
  const actual: Record<string, string> = {}
  for (const m of allMatchRows) {
    if (m.stage !== 'knockout') continue
    const slot = m.bracket_slot as number
    if (slot < prevRange[0] || slot > prevRange[1]) continue
    if (m.actual_home_score === null || !m.home_team_id || !m.away_team_id) continue

    let winnerId: string = m.actual_winner_id
    if (!winnerId) {
      winnerId = (m.actual_home_score as number) > (m.actual_away_score as number)
        ? m.home_team_id : m.away_team_id
    }
    const loserId = winnerId === m.home_team_id ? m.away_team_id : m.home_team_id
    const colPos = `${prefix} M${slot + 72}`
    actual[colPos] = isThird ? loserId : winnerId
  }

  // Fetch group predictions per user (paginated)
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

  // Fetch KO score predictions per user (paginated)
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

  // Winners mode: who won the tournament and 3rd place (16 + 8 bonus pts)
  // Uses actual DB slot teams (confirmed by syncKOBracket) + user score preds — no simulation needed.
  if (stage === 'winners') {
    const finalMatchRow = allMatchRows.find((m: any) => m.stage === 'knockout' && m.bracket_slot === 32) as any
    const thirdMatchRow = allMatchRows.find((m: any) => m.stage === 'knockout' && m.bracket_slot === 31) as any

    const actual: Record<string, string> = {}
    let actualChampionId: string | null = null
    if (finalMatchRow?.actual_home_score !== null && finalMatchRow?.home_team_id && finalMatchRow?.away_team_id) {
      actualChampionId = finalMatchRow.actual_winner_id ?? null
      if (!actualChampionId) {
        actualChampionId = (finalMatchRow.actual_home_score as number) >= (finalMatchRow.actual_away_score as number)
          ? finalMatchRow.home_team_id : finalMatchRow.away_team_id
      }
      if (actualChampionId) actual['champion'] = actualChampionId
    }
    let actualThirdWinnerId: string | null = null
    if (thirdMatchRow?.actual_home_score !== null && thirdMatchRow?.home_team_id && thirdMatchRow?.away_team_id) {
      actualThirdWinnerId = thirdMatchRow.actual_winner_id ?? null
      if (!actualThirdWinnerId) {
        actualThirdWinnerId = (thirdMatchRow.actual_home_score as number) >= (thirdMatchRow.actual_away_score as number)
          ? thirdMatchRow.home_team_id : thirdMatchRow.away_team_id
      }
      if (actualThirdWinnerId) actual['3rd_winner'] = actualThirdWinnerId
    }

    // Known teams in slots 31 and 32 from DB (set by syncKOBracket after SFs played)
    const finalSlotTeams = actualSlotTeams.get(32)
    const thirdSlotTeams = actualSlotTeams.get(31)

    for (const userId of allUserIds) {
      const kp = userKOPreds.get(userId) ?? new Map()
      const userCols: Record<string, string> = {}

      // Predicted champion: user's slot 32 score pred + actual slot 32 home/away teams
      const finalPred = kp.get(32)
      if (finalPred && finalPred.h !== finalPred.a && finalSlotTeams?.home && finalSlotTeams?.away) {
        const predChampionId = finalPred.h > finalPred.a ? finalSlotTeams.home : finalSlotTeams.away
        userCols['champion'] = predChampionId
      }

      // Predicted 3rd place winner: user's slot 31 score pred + actual slot 31 home/away teams
      const thirdPred = kp.get(31)
      if (thirdPred && thirdPred.h !== thirdPred.a && thirdSlotTeams?.home && thirdSlotTeams?.away) {
        const predThirdWinnerId = thirdPred.h > thirdPred.a ? thirdSlotTeams.home : thirdSlotTeams.away
        userCols['3rd_winner'] = predThirdWinnerId
      }

      let pts = 0
      if (actualChampionId && userCols['champion'] === actualChampionId) pts += STAGE_POINTS['winner'] ?? 16
      if (actualThirdWinnerId && userCols['3rd_winner'] === actualThirdWinnerId) pts += STAGE_POINTS['third_winner'] ?? 8

      if (Object.keys(userCols).length > 0) preds[userId] = userCols
      if (pts > 0) roundPts[userId] = pts
    }

    return NextResponse.json({ actual, preds, roundPts })
  }

  // Trophy mode (stage === 'final'): combined finals + 3rd place view with all bonuses
  if (stage === 'final') {
    // Build actual for all 4 columns: W M101, W M102, L M101, L M102
    const actual: Record<string, string> = {}
    for (const m of allMatchRows) {
      if (m.stage !== 'knockout') continue
      const slot = m.bracket_slot as number
      if (slot !== 29 && slot !== 30) continue
      if (m.actual_home_score === null || !m.home_team_id || !m.away_team_id) continue
      let winnerId: string = m.actual_winner_id
      if (!winnerId) {
        winnerId = (m.actual_home_score as number) > (m.actual_away_score as number)
          ? m.home_team_id : m.away_team_id
      }
      const loserId = winnerId === m.home_team_id ? m.away_team_id : m.home_team_id
      actual[`W M${slot + 72}`] = winnerId
      actual[`L M${slot + 72}`] = loserId
    }

    // Actual champion and 3rd place winner for bonus pts
    const finalMatchRow = allMatchRows.find((m: any) => m.stage === 'knockout' && m.bracket_slot === 32) as any
    const thirdMatchRow = allMatchRows.find((m: any) => m.stage === 'knockout' && m.bracket_slot === 31) as any
    let actualChampionId: string | null = null
    if (finalMatchRow?.actual_home_score !== null && finalMatchRow?.home_team_id && finalMatchRow?.away_team_id) {
      actualChampionId = finalMatchRow.actual_winner_id ?? null
      if (!actualChampionId) {
        actualChampionId = (finalMatchRow.actual_home_score as number) >= (finalMatchRow.actual_away_score as number)
          ? finalMatchRow.home_team_id : finalMatchRow.away_team_id
      }
    }
    let actualThirdWinnerId: string | null = null
    if (thirdMatchRow?.actual_home_score !== null && thirdMatchRow?.home_team_id && thirdMatchRow?.away_team_id) {
      actualThirdWinnerId = thirdMatchRow.actual_winner_id ?? null
      if (!actualThirdWinnerId) {
        actualThirdWinnerId = (thirdMatchRow.actual_home_score as number) >= (thirdMatchRow.actual_away_score as number)
          ? thirdMatchRow.home_team_id : thirdMatchRow.away_team_id
      }
    }

    const actualWinnerTeams = new Set([actual['W M101'], actual['W M102']].filter(Boolean))
    const actualLoserTeams = new Set([actual['L M101'], actual['L M102']].filter(Boolean))

    for (const userId of allUserIds) {
      const gp = userGroupPreds.get(userId) ?? new Map()
      const kp = userKOPreds.get(userId) ?? new Map()
      if (gp.size === 0 && kp.size === 0) continue

      const matchups = simulateAllMatchups(gp, kp, allMatches, allTeams)
      const simSlot = new Map(matchups.map(m => [m.slot, { home: m.home, away: m.away }]))

      const userCols: Record<string, string> = {}

      for (const slot of [29, 30]) {
        const pred = kp.get(slot)
        if (!pred || pred.h === pred.a) continue

        const simmed = simSlot.get(slot)
        let home: TeamInfo | null = simmed?.home ?? null
        let away: TeamInfo | null = simmed?.away ?? null
        if (!home || !away) {
          const dbTeams = actualSlotTeams.get(slot)
          if (dbTeams) {
            if (!home && dbTeams.home) home = teamMap.get(dbTeams.home) ?? null
            if (!away && dbTeams.away) away = teamMap.get(dbTeams.away) ?? null
          }
        }
        if (!home && !away) continue

        const winner = pred.h > pred.a ? home : away
        const loser = pred.h > pred.a ? away : home
        if (winner) userCols[`W M${slot + 72}`] = winner.id
        if (loser) userCols[`L M${slot + 72}`] = loser.id
      }

      let pts = 0
      for (const [col, teamId] of Object.entries(userCols)) {
        if (col.startsWith('W') && actualWinnerTeams.has(teamId)) pts += STAGE_POINTS['final'] ?? 12
        if (col.startsWith('L') && actualLoserTeams.has(teamId)) pts += STAGE_POINTS['third_match'] ?? 4
      }

      // Winner bonus (16 pts)
      if (actualChampionId) {
        const finalPred = kp.get(32)
        const finalSim = simSlot.get(32)
        if (finalPred && finalPred.h !== finalPred.a && finalSim) {
          const predWinnerId = finalPred.h > finalPred.a ? finalSim.home?.id : finalSim.away?.id
          if (predWinnerId && predWinnerId === actualChampionId) pts += STAGE_POINTS['winner'] ?? 16
        }
      }

      // Third winner bonus (8 pts)
      if (actualThirdWinnerId) {
        const thirdPred = kp.get(31)
        const thirdSim = simSlot.get(31)
        if (thirdPred && thirdPred.h !== thirdPred.a && thirdSim) {
          const predWinnerId = thirdPred.h > thirdPred.a ? thirdSim.home?.id : thirdSim.away?.id
          if (predWinnerId && predWinnerId === actualThirdWinnerId) pts += STAGE_POINTS['third_winner'] ?? 8
        }
      }

      if (Object.keys(userCols).length > 0) preds[userId] = userCols
      if (pts > 0) roundPts[userId] = pts
    }

    return NextResponse.json({ actual, preds, roundPts })
  }

  for (const userId of allUserIds) {
    const gp = userGroupPreds.get(userId) ?? new Map()
    const kp = userKOPreds.get(userId) ?? new Map()
    if (gp.size === 0 && kp.size === 0) continue

    // Simulate full bracket from user's group + KO score predictions
    const matchups = simulateAllMatchups(gp, kp, allMatches, allTeams)
    const simSlot = new Map(matchups.map(m => [m.slot, { home: m.home, away: m.away }]))

    const userCols: Record<string, string> = {}

    for (let slot = prevRange[0]; slot <= prevRange[1]; slot++) {
      const colPos = `${prefix} M${slot + 72}`

      // User must have a non-draw score prediction for this slot
      const pred = kp.get(slot)
      if (!pred || pred.h === pred.a) continue

      // Get teams from simulation; fall back to actual DB teams for this slot
      const simmed = simSlot.get(slot)
      let home: TeamInfo | null = simmed?.home ?? null
      let away: TeamInfo | null = simmed?.away ?? null
      if (!home || !away) {
        const dbTeams = actualSlotTeams.get(slot)
        if (dbTeams) {
          if (!home && dbTeams.home) home = teamMap.get(dbTeams.home) ?? null
          if (!away && dbTeams.away) away = teamMap.get(dbTeams.away) ?? null
        }
      }

      if (!home && !away) continue

      // Determine which team the user predicted would win (or lose for 3rd-place match)
      let predictedTeam: TeamInfo | null
      if (isThird) {
        predictedTeam = pred.h > pred.a ? away : home
      } else {
        predictedTeam = pred.h > pred.a ? home : away
      }
      if (!predictedTeam) continue

      userCols[colPos] = predictedTeam.id
    }

    // Round pts — stage-based: award stagePts for each unique predicted team
    // that appears ANYWHERE in the actual advancing set, regardless of which slot.
    const actualTeamSet = new Set(Object.values(actual))
    const predictedTeamSet = new Set(Object.values(userCols))
    let pts = 0
    for (const teamId of predictedTeamSet) {
      if (actualTeamSet.has(teamId)) pts += stagePts
    }

    if (Object.keys(userCols).length > 0) preds[userId] = userCols
    if (pts > 0) roundPts[userId] = pts
  }

  return NextResponse.json({ actual, preds, roundPts })
}
