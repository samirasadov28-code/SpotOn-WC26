import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { STAGE_POINTS } from '@/lib/scoring/advancement'

// Stage each bracket slot belongs to
function slotStage(slot: number): string {
  if (slot <= 16) return 'r32'
  if (slot <= 24) return 'r16'
  if (slot <= 28) return 'qf'
  if (slot <= 30) return 'sf'
  if (slot === 31) return 'third_match'
  return 'final' // slot 32 winner = winner
}

export async function POST(req: Request) {
  const { leagueId } = await req.json().catch(() => ({}))

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({}, { status: 500 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // All KO match results: which teams are eliminated
  const { data: koMatches } = await supabase
    .from('matches')
    .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score')
    .eq('stage', 'knockout')
    .order('bracket_slot')

  const eliminatedTeams = new Set<string>()
  const playedSlots = new Set<number>()
  for (const m of (koMatches ?? []) as any[]) {
    if (m.actual_home_score === null || !m.home_team_id || !m.away_team_id) continue
    playedSlots.add(m.bracket_slot)
    const homeWins = m.actual_home_score > m.actual_away_score
    eliminatedTeams.add(homeWins ? m.away_team_id : m.home_team_id)
  }

  // All KO predictions
  const { data: predsData } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score')

  // All current scores
  let scoresQuery = supabase.from('scores').select('user_id, total_pts')
  // leagueId filter not needed — we return all users; caller can filter
  const { data: scores } = await scoresQuery

  // Group predictions by user
  const userPreds = new Map<string, Map<number, any>>()
  for (const p of (predsData ?? []) as any[]) {
    if (!userPreds.has(p.user_id)) userPreds.set(p.user_id, new Map())
    userPreds.get(p.user_id)!.set(p.bracket_slot, p)
  }

  // For each user, compute max available pts
  const result: Record<string, number> = {}

  for (const score of (scores ?? []) as any[]) {
    const basePts: number = score.total_pts ?? 0
    const slotPreds = userPreds.get(score.user_id)
    if (!slotPreds) { result[score.user_id] = basePts; continue }

    let maxAdditional = 0
    for (const [slot, pred] of slotPreds) {
      if (playedSlots.has(slot)) continue // already played, points already counted
      const stage = slotStage(slot)
      const pts = stage === 'final' ? (STAGE_POINTS['final'] + STAGE_POINTS['winner']) : (STAGE_POINTS[stage] ?? 0)
      if (pts === 0) continue

      // Check if the predicted winner for this slot is still alive
      const homeScore: number = pred.pred_home_score ?? 0
      const awayScore: number = pred.pred_away_score ?? 0
      const predWinnerId: string | null = homeScore > awayScore
        ? pred.pred_home_team_id
        : homeScore < awayScore
        ? pred.pred_away_team_id
        : (pred.pred_home_team_id ?? pred.pred_away_team_id) // draw: take either

      // If no team predicted or the predicted winner is already eliminated → 0 additional
      if (!predWinnerId || eliminatedTeams.has(predWinnerId)) continue

      maxAdditional += pts
    }

    result[score.user_id] = basePts + maxAdditional
  }

  return NextResponse.json(result)
}
