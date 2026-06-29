import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { loadGroupData, computeUserR32Positions, R32_DEFS } from '@/lib/scoring/group-qualifiers'
import { buildUserBracket, BRACKET_ADVANCE_INV } from '@/lib/scoring/bracket-cascade'

/**
 * Returns actual advancing teams + per-user predictions for a KO stage view.
 *
 * stage: 'r16' | 'qf' | 'sf' | 'final' | 'third'
 *
 * Response:
 *   actual: { [colPos]: teamId }      e.g. "W M73" → actual winner team ID
 *   preds:  { [userId]: { [colPos]: teamId } }
 *
 * colPos format: "W M{prevSlot+72}" for winners, "L M{slot+72}" for 3rd-place losers
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const stage: string = body.stage ?? 'r16'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({}, { status: 500 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Stage config: prevSlots = matches whose winners are shown as columns
  //               currSlots = prediction slots that store team IDs
  const STAGE_CONFIG: Record<string, { prevSlots: [number,number]; currSlots: [number,number]; isThird?: true }> = {
    r16:   { prevSlots: [1,  16], currSlots: [17, 24] },
    qf:    { prevSlots: [17, 24], currSlots: [25, 28] },
    sf:    { prevSlots: [25, 28], currSlots: [29, 30] },
    final: { prevSlots: [29, 30], currSlots: [32, 32] },
    third: { prevSlots: [29, 30], currSlots: [31, 31], isThird: true },
  }
  const cfg = STAGE_CONFIG[stage]
  if (!cfg) return NextResponse.json({ actual: {}, preds: {} })

  // Fetch all KO matches for actual results + team IDs
  const { data: koMatches } = await supabase
    .from('matches')
    .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score, actual_winner_id')
    .eq('stage', 'knockout')
    .order('bracket_slot')

  const matchBySlot = new Map<number, any>()
  for (const m of (koMatches ?? []) as any[]) matchBySlot.set(m.bracket_slot as number, m)

  // Build actual column map
  const actual: Record<string, string> = {}
  for (let slot = cfg.prevSlots[0]; slot <= cfg.prevSlots[1]; slot++) {
    const m = matchBySlot.get(slot)
    if (!m || m.actual_home_score === null) continue
    let winnerId: string | null = m.actual_winner_id ?? null
    if (!winnerId) {
      const ah = m.actual_home_score as number, aa = m.actual_away_score as number
      winnerId = ah > aa ? m.home_team_id : m.away_team_id
    }
    if (!winnerId) continue
    if (cfg.isThird) {
      const loserId = winnerId === m.home_team_id ? m.away_team_id : m.home_team_id
      if (loserId) actual[`L M${slot + 72}`] = loserId
    } else {
      actual[`W M${slot + 72}`] = winnerId
    }
  }

  // Build actual R32 slot teams (for cascade)
  const actualSlotTeams = new Map<number, { home: string; away: string }>()
  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()
  const actualR32Pos = computeUserR32Positions(new Map(), groupMatchesByGroup, teamsByGroup, false)
  for (const def of R32_DEFS) {
    const h = actualR32Pos.get(def.homePos), a = actualR32Pos.get(def.awayPos)
    if (h && a) actualSlotTeams.set(def.slot, { home: h, away: a })
    else {
      const m = matchBySlot.get(def.slot)
      if (m?.home_team_id && m?.away_team_id) actualSlotTeams.set(def.slot, { home: m.home_team_id, away: m.away_team_id })
    }
  }

  // All KO predictions
  const { data: predsData } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score')

  // Group preds by user
  const userKoPreds = new Map<string, Map<number, any>>()
  for (const p of (predsData ?? []) as any[]) {
    if (!userKoPreds.has(p.user_id)) userKoPreds.set(p.user_id, new Map())
    userKoPreds.get(p.user_id)!.set(p.bracket_slot as number, p)
  }

  // Build per-user predictions using stored team IDs + cascade fallback
  const preds: Record<string, Record<string, string>> = {}

  for (const [userId, slotPreds] of userKoPreds) {
    const cascade = buildUserBracket(actualSlotTeams, slotPreds)
    const userCols: Record<string, string> = {}

    for (let currSlot = cfg.currSlots[0]; currSlot <= cfg.currSlots[1]; currSlot++) {
      const p = slotPreds.get(currSlot)
      if (!p) continue
      const fallback = cascade.get(currSlot)

      const homeTeam: string | null = p.pred_home_team_id ?? fallback?.home ?? null
      const awayTeam: string | null = p.pred_away_team_id ?? fallback?.away ?? null

      const inv = BRACKET_ADVANCE_INV[currSlot]
      if (!inv) continue

      const prefix = cfg.isThird ? 'L' : 'W'
      if (homeTeam && inv.homeSlot) userCols[`${prefix} M${inv.homeSlot + 72}`] = homeTeam
      if (awayTeam && inv.awaySlot) userCols[`${prefix} M${inv.awaySlot + 72}`] = awayTeam
    }

    if (Object.keys(userCols).length > 0) preds[userId] = userCols
  }

  return NextResponse.json({ actual, preds })
}
