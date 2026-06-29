import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { STAGE_POINTS } from '@/lib/scoring/advancement'
import { loadGroupData, computeUserR32Positions, R32_DEFS } from '@/lib/scoring/group-qualifiers'

const BRACKET_ADVANCE: Record<number, { nextSlot: number; side: 'home' | 'away' }> = {
  1:{nextSlot:18,side:'home'}, 2:{nextSlot:17,side:'home'}, 3:{nextSlot:18,side:'away'},
  4:{nextSlot:19,side:'home'}, 5:{nextSlot:17,side:'away'}, 6:{nextSlot:19,side:'away'},
  7:{nextSlot:20,side:'home'}, 8:{nextSlot:20,side:'away'}, 9:{nextSlot:22,side:'home'},
  10:{nextSlot:22,side:'away'},11:{nextSlot:21,side:'home'},12:{nextSlot:21,side:'away'},
  13:{nextSlot:24,side:'home'},14:{nextSlot:23,side:'home'},15:{nextSlot:24,side:'away'},
  16:{nextSlot:23,side:'away'},17:{nextSlot:25,side:'home'},18:{nextSlot:25,side:'away'},
  19:{nextSlot:27,side:'home'},20:{nextSlot:27,side:'away'},21:{nextSlot:26,side:'home'},
  22:{nextSlot:26,side:'away'},23:{nextSlot:28,side:'home'},24:{nextSlot:28,side:'away'},
  25:{nextSlot:29,side:'home'},26:{nextSlot:29,side:'away'},27:{nextSlot:30,side:'home'},
  28:{nextSlot:30,side:'away'},29:{nextSlot:32,side:'home'},30:{nextSlot:32,side:'away'},
}

function slotStage(slot: number): string {
  if (slot <= 16) return 'r32'
  if (slot <= 24) return 'r16'
  if (slot <= 28) return 'qf'
  if (slot <= 30) return 'sf'
  if (slot === 31) return 'third_match'
  return 'final'
}

/**
 * Cascade user's score predictions through actual R32 seeds to derive which teams
 * they predicted at each R16+ slot. Used as fallback when pred_home_team_id is null.
 */
function buildUserBracket(
  actualSlotTeams: Map<number, { home: string; away: string }>,
  slotPreds: Map<number, any>
): Map<number, { home: string | null; away: string | null }> {
  const bt = new Map<number, { home: string | null; away: string | null }>()
  for (const [slot, teams] of actualSlotTeams) bt.set(slot, { home: teams.home, away: teams.away })

  const ALL_SLOTS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
                     17,18,19,20,21,22,23,24,25,26,27,28,29,30,32]
  for (const slot of ALL_SLOTS) {
    const teams = bt.get(slot)
    if (!teams?.home || !teams?.away) continue
    const pred = slotPreds.get(slot)
    if (!pred || pred.pred_home_score == null || pred.pred_away_score == null) continue

    const ph = pred.pred_home_score as number, pa = pred.pred_away_score as number
    const winner = ph >= pa ? teams.home : teams.away
    const loser  = winner === teams.home ? teams.away : teams.home

    const adv = BRACKET_ADVANCE[slot]
    if (adv) {
      if (!bt.has(adv.nextSlot)) bt.set(adv.nextSlot, { home: null, away: null })
      const next = bt.get(adv.nextSlot)!
      if (adv.side === 'home') next.home = winner; else next.away = winner
    }
    if (slot === 29 || slot === 30) {
      if (!bt.has(31)) bt.set(31, { home: null, away: null })
      const tp = bt.get(31)!
      if (slot === 29) tp.home = loser; else tp.away = loser
    }
  }
  return bt
}

export async function POST(req: Request) {
  await req.json().catch(() => ({}))

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({}, { status: 500 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: koMatches } = await supabase
    .from('matches').select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score')
    .eq('stage', 'knockout').order('bracket_slot')

  const eliminatedTeams = new Set<string>()
  const playedSlots = new Set<number>()

  for (const m of (koMatches ?? []) as any[]) {
    if (m.actual_home_score !== null && m.home_team_id && m.away_team_id) {
      playedSlots.add(m.bracket_slot as number)
      eliminatedTeams.add(
        (m.actual_home_score as number) > (m.actual_away_score as number) ? m.away_team_id : m.home_team_id
      )
    }
  }

  // Actual R32 seeds (from real group standings)
  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()
  const actualR32Pos = computeUserR32Positions(new Map(), groupMatchesByGroup, teamsByGroup, false)
  const actualSlotTeams = new Map<number, { home: string; away: string }>()
  for (const def of R32_DEFS) {
    const h = actualR32Pos.get(def.homePos), a = actualR32Pos.get(def.awayPos)
    if (h && a) actualSlotTeams.set(def.slot, { home: h, away: a })
  }

  // Per-user R32 predicted positions (for R32 pair check)
  const userR32PosMap = new Map<string, Map<string, string>>()
  for (const [userId, groupPreds] of predsByUser) {
    userR32PosMap.set(userId, computeUserR32Positions(groupPreds, groupMatchesByGroup, teamsByGroup, true))
  }

  // All KO predictions including stored team IDs (used directly for R16+)
  const { data: predsData } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score')

  const { data: scores } = await supabase.from('scores').select('user_id, total_pts')

  const userKoPreds = new Map<string, Map<number, any>>()
  for (const p of (predsData ?? []) as any[]) {
    if (!userKoPreds.has(p.user_id)) userKoPreds.set(p.user_id, new Map())
    userKoPreds.get(p.user_id)!.set(p.bracket_slot as number, p)
  }

  const result: Record<string, number> = {}

  for (const score of (scores ?? []) as any[]) {
    const basePts: number = score.total_pts ?? 0
    const slotPreds = userKoPreds.get(score.user_id)
    if (!slotPreds) { result[score.user_id] = basePts; continue }

    // Cascade fallback: derive team IDs for slots where pred_home_team_id is null
    const cascade = buildUserBracket(actualSlotTeams, slotPreds)

    let maxAdditional = 0

    // R32 score pts: only when user's predicted pair matches the actual pair
    const r32Pos = userR32PosMap.get(score.user_id)
    if (r32Pos) {
      for (const def of R32_DEFS) {
        if (playedSlots.has(def.slot)) continue
        const actual = actualSlotTeams.get(def.slot)
        if (!actual || eliminatedTeams.has(actual.home) || eliminatedTeams.has(actual.away)) continue
        if (r32Pos.get(def.homePos) !== actual.home || r32Pos.get(def.awayPos) !== actual.away) continue
        const pred = slotPreds.get(def.slot)
        if (pred?.pred_home_score != null && pred?.pred_away_score != null) maxAdditional += 3
      }
    }

    // R16+ advancement pts
    // Strategy: use stored pred_home_team_id / pred_away_team_id (user's explicit picks).
    // Fall back to the cascade-derived team when stored ID is null (handles cases where
    // predictions were saved before groups were complete).
    // Score pts only when both predicted teams are alive — keeps max near ~250.
    const R16_PLUS = [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]

    for (const slot of R16_PLUS) {
      if (playedSlots.has(slot)) continue
      const pred = slotPreds.get(slot)
      if (!pred) continue

      const stage = slotStage(slot)
      const stagePts = STAGE_POINTS[stage] ?? 0
      const fallback = cascade.get(slot)

      // Primary: stored team ID; fallback: cascade-derived
      const homeTeam: string | null = pred.pred_home_team_id ?? fallback?.home ?? null
      const awayTeam: string | null = pred.pred_away_team_id ?? fallback?.away ?? null

      const hAlive = homeTeam != null && !eliminatedTeams.has(homeTeam)
      const aAlive = awayTeam != null && awayTeam !== homeTeam && !eliminatedTeams.has(awayTeam)

      if (hAlive) maxAdditional += stagePts
      if (aAlive) maxAdditional += stagePts

      // Final: winner bonus
      if (slot === 32) {
        const ph = pred.pred_home_score ?? 0, pa = pred.pred_away_score ?? 0
        const predWinner = ph >= pa ? homeTeam : awayTeam
        if (predWinner && !eliminatedTeams.has(predWinner)) maxAdditional += STAGE_POINTS['winner'] ?? 16
      }

      // Score pts: only when both predicted teams are alive (keeps total near ~250)
      if (hAlive && aAlive && pred.pred_home_score != null && pred.pred_away_score != null) {
        maxAdditional += 3
      }
    }

    result[score.user_id] = basePts + maxAdditional
  }

  return NextResponse.json(result)
}
