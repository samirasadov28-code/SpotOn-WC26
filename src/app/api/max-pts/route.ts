import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { STAGE_POINTS } from '@/lib/scoring/advancement'
import { loadGroupData, computeUserR32Positions, R32_DEFS } from '@/lib/scoring/group-qualifiers'

function slotStage(slot: number): string {
  if (slot <= 16) return 'r32'
  if (slot <= 24) return 'r16'
  if (slot <= 28) return 'qf'
  if (slot <= 30) return 'sf'
  if (slot === 31) return 'third_match'
  return 'final'
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

  // All KO matches — teams and results
  const { data: koMatches } = await supabase
    .from('matches')
    .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score')
    .eq('stage', 'knockout')
    .order('bracket_slot')

  const eliminatedTeams = new Set<string>()
  const playedSlots = new Set<number>()
  const matchBySlot = new Map<number, any>()

  for (const m of (koMatches ?? []) as any[]) {
    matchBySlot.set(m.bracket_slot as number, m)
    if (m.actual_home_score !== null && m.home_team_id && m.away_team_id) {
      playedSlots.add(m.bracket_slot as number)
      eliminatedTeams.add(
        (m.actual_home_score as number) > (m.actual_away_score as number)
          ? m.away_team_id
          : m.home_team_id
      )
    }
  }

  // KO predictions
  const { data: predsData } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score')

  // R32 predictions derived from group predictions
  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()
  const userR32PosMap = new Map<string, Map<string, string>>()
  for (const [userId, userGroupPreds] of predsByUser) {
    userR32PosMap.set(userId, computeUserR32Positions(userGroupPreds, groupMatchesByGroup, teamsByGroup, true))
  }

  // Current scores
  const { data: scores } = await supabase.from('scores').select('user_id, total_pts')

  // Group KO predictions by user
  const userKoPreds = new Map<string, Map<number, any>>()
  for (const p of (predsData ?? []) as any[]) {
    if (!userKoPreds.has(p.user_id)) userKoPreds.set(p.user_id, new Map())
    userKoPreds.get(p.user_id)!.set(p.bracket_slot as number, p)
  }

  const result: Record<string, number> = {}

  for (const score of (scores ?? []) as any[]) {
    const basePts: number = score.total_pts ?? 0
    const slotPreds = userKoPreds.get(score.user_id)
    const r32Pos = userR32PosMap.get(score.user_id)
    let maxAdditional = 0

    // --- R32 score pts for unplayed R32 matches where user's pair is correct ---
    if (slotPreds && r32Pos) {
      for (const def of R32_DEFS) {
        if (playedSlots.has(def.slot)) continue
        const match = matchBySlot.get(def.slot)
        if (!match?.home_team_id || !match?.away_team_id) continue
        const predHome = r32Pos.get(def.homePos)
        const predAway = r32Pos.get(def.awayPos)
        const slotPred = slotPreds.get(def.slot)
        if (
          predHome === match.home_team_id &&
          predAway === match.away_team_id &&
          slotPred?.pred_home_score != null &&
          slotPred?.pred_away_score != null
        ) {
          maxAdditional += 3
        }
      }
    }

    // --- R16+ advancement + score pts ---
    // Process in bracket order so predicted losers are tracked before later rounds
    // userSimEliminated: teams user predicted to lose → can't earn pts in later slots
    const userSimEliminated = new Set<string>()

    // Include 3rd-place match (slot 31) after SF
    const orderedSlots = [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]

    for (const slot of orderedSlots) {
      if (playedSlots.has(slot)) {
        // Even for played slots, track predicted loser to avoid double-counting later
        const pred = slotPreds?.get(slot)
        if (pred?.pred_home_team_id && pred?.pred_away_team_id &&
            pred.pred_home_score != null && pred.pred_away_score != null) {
          const ph = pred.pred_home_score as number, pa = pred.pred_away_score as number
          if (ph !== pa) userSimEliminated.add(ph > pa ? pred.pred_away_team_id : pred.pred_home_team_id)
        }
        continue
      }

      const pred = slotPreds?.get(slot)
      if (!pred) continue

      const match = matchBySlot.get(slot)
      const stage = slotStage(slot)
      const stagePts = STAGE_POINTS[stage] ?? 0

      const predH: string | null = pred.pred_home_team_id ?? null
      const predA: string | null = pred.pred_away_team_id ?? null
      const actualH: string | null = match?.home_team_id ?? null
      const actualA: string | null = match?.away_team_id ?? null
      const matchTeams = new Set([actualH, actualA].filter(Boolean) as string[])

      // A team is viable if: not eliminated by actual result, not eliminated in user's own bracket,
      // and (if actual teams are assigned) the team is actually in this match
      const hViable = Boolean(
        predH &&
        !eliminatedTeams.has(predH) &&
        !userSimEliminated.has(predH) &&
        (matchTeams.size === 0 || matchTeams.has(predH))
      )
      const aViable = Boolean(
        predA &&
        predA !== predH &&
        !eliminatedTeams.has(predA) &&
        !userSimEliminated.has(predA) &&
        (matchTeams.size === 0 || matchTeams.has(predA))
      )

      if (hViable) maxAdditional += stagePts
      if (aViable) maxAdditional += stagePts

      // Final winner bonus: predict the correct winner
      if (slot === 32) {
        const ph = pred.pred_home_score ?? 0, pa = pred.pred_away_score ?? 0
        const predWinner = ph >= pa ? predH : predA
        if (predWinner && !eliminatedTeams.has(predWinner) && !userSimEliminated.has(predWinner) &&
            (matchTeams.size === 0 || matchTeams.has(predWinner))) {
          maxAdditional += STAGE_POINTS['winner'] ?? 16
        }
      }

      // Score pts (up to 3): both teams must be viable AND form the correct pair for this match
      if (
        hViable && aViable &&
        pred.pred_home_score != null && pred.pred_away_score != null
      ) {
        // Pair is valid if match has no teams yet, OR both predicted teams are exactly in the match
        const pairValid = matchTeams.size === 0 || (actualH === predH && actualA === predA)
        if (pairValid) maxAdditional += 3
      }

      // Track predicted loser — they can't earn advancement pts in subsequent rounds
      if (predH && predA && pred.pred_home_score != null && pred.pred_away_score != null) {
        const ph = pred.pred_home_score as number, pa = pred.pred_away_score as number
        if (ph !== pa) userSimEliminated.add(ph > pa ? predA : predH)
      }
    }

    result[score.user_id] = basePts + maxAdditional
  }

  return NextResponse.json(result)
}
