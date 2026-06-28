import { createClient } from '@supabase/supabase-js'
import { scoreGroupMatch } from './group'
import { STAGE_POINTS } from './advancement'

function slotStage(slot: number): string {
  if (slot <= 16) return 'r32'
  if (slot <= 24) return 'r16'
  if (slot <= 28) return 'qf'
  if (slot <= 30) return 'sf'
  if (slot === 31) return 'third_match'
  return 'final'
}

export async function rescoreAllGroupPts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // All finished group matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, actual_home_score, actual_away_score')
    .eq('stage', 'group')
    .not('actual_home_score', 'is', null) as any

  if (!matches?.length) return

  // Fetch ALL group predictions in pages to avoid the default 1000-row limit
  const allPreds: any[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('predictions_group')
      .select('user_id, match_id, pred_home_score, pred_away_score')
      .order('match_id')
      .range(from, from + PAGE - 1) as any
    if (error || !data?.length) break
    allPreds.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  const matchMap = new Map((matches as any[]).map((m: any) => [m.id, m]))

  // Sum group pts per user from scratch
  const groupPtsMap = new Map<string, number>()
  for (const p of allPreds) {
    if (p.pred_home_score === null || p.pred_away_score === null) continue
    const m = matchMap.get(p.match_id)
    if (!m) continue
    const pts = scoreGroupMatch(
      { predHome: p.pred_home_score, predAway: p.pred_away_score },
      { actualHome: m.actual_home_score, actualAway: m.actual_away_score }
    )
    groupPtsMap.set(p.user_id, (groupPtsMap.get(p.user_id) ?? 0) + pts)
  }

  // Get existing scores to preserve advancement_pts and knockout_match_pts
  const { data: existingScores } = await supabase.from('scores').select('*') as any
  const existingMap = new Map((existingScores ?? []).map((s: any) => [s.user_id, s]))

  // Reset every user that already has a scores row (covers users with 0 group pts too)
  const allUserIds = new Set([...groupPtsMap.keys(), ...(existingScores ?? []).map((s: any) => s.user_id)])

  for (const userId of allUserIds) {
    const groupPts = groupPtsMap.get(userId) ?? 0
    const existing = existingMap.get(userId) as any
    const advPts = existing?.advancement_pts ?? 0
    const koPts = existing?.knockout_match_pts ?? 0
    await supabase.from('scores').upsert({
      user_id: userId,
      group_pts: groupPts,
      advancement_pts: advPts,
      knockout_match_pts: koPts,
      total_pts: groupPts + advPts + koPts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }
}

/**
 * Rescores KO advancement pts and KO match score pts from scratch.
 *
 * Advancement pts per slot:
 *   - STAGE_POINTS[stage] per correctly predicted HOME team
 *   - STAGE_POINTS[stage] per correctly predicted AWAY team
 *   - For the Final (slot 32): extra STAGE_POINTS['winner'] if predicted winner is correct
 *
 * KO match score pts (same rules as group stage): exact=3, GD=2, outcome=1
 */
export async function rescoreKOPts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // All KO matches with teams assigned (for advancement pts — awarded as soon as teams are confirmed)
  const { data: koMatchesWithTeams } = await supabase
    .from('matches')
    .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score')
    .eq('stage', 'knockout')
    .not('home_team_id', 'is', null) as any

  // All KO predictions
  const { data: preds } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score') as any

  const matchBySlot = new Map(((koMatchesWithTeams ?? []) as any[]).map((m: any) => [m.bracket_slot as number, m]))

  const userAdvPts = new Map<string, number>()
  const userKoPts = new Map<string, number>()

  for (const p of (preds ?? []) as any[]) {
    const match = matchBySlot.get(p.bracket_slot as number)
    if (!match) continue

    const stage = slotStage(p.bracket_slot)
    const stagePts = STAGE_POINTS[stage] ?? 0

    // Advancement: 1pt (or stage pts) per correctly predicted team — awarded once teams are confirmed
    let advAdd = 0
    if (p.pred_home_team_id && p.pred_home_team_id === match.home_team_id) advAdd += stagePts
    if (p.pred_away_team_id && p.pred_away_team_id === match.away_team_id) advAdd += stagePts

    // Final winner bonus — only once match is played
    if (p.bracket_slot === 32 && match.actual_home_score !== null) {
      const ah = match.actual_home_score as number, aa = match.actual_away_score as number
      const actualWinner = ah > aa ? match.home_team_id : match.away_team_id
      const ph = p.pred_home_score ?? 0, pa = p.pred_away_score ?? 0
      const predWinner = ph > pa ? p.pred_home_team_id : p.pred_away_team_id
      if (predWinner && predWinner === actualWinner) advAdd += STAGE_POINTS['winner'] ?? 16
    }

    userAdvPts.set(p.user_id, (userAdvPts.get(p.user_id) ?? 0) + advAdd)

    // KO score prediction pts — only for played matches
    if (match.actual_home_score !== null && p.pred_home_score !== null && p.pred_away_score !== null) {
      const ph = p.pred_home_score as number, pa = p.pred_away_score as number
      const ah = match.actual_home_score as number, aa = match.actual_away_score as number
      let koPts = 0
      if (ph === ah && pa === aa) koPts = 3
      else if (ph - pa === ah - aa) koPts = 2
      else if (Math.sign(ph - pa) === Math.sign(ah - aa)) koPts = 1
      userKoPts.set(p.user_id, (userKoPts.get(p.user_id) ?? 0) + koPts)
    }
  }

  // Preserve group_pts; overwrite advancement_pts and knockout_match_pts
  const { data: existingScores } = await supabase.from('scores').select('*') as any
  const existingMap = new Map(((existingScores ?? []) as any[]).map((s: any) => [s.user_id as string, s]))

  const allUserIds = new Set([
    ...userAdvPts.keys(), ...userKoPts.keys(),
    ...((existingScores ?? []) as any[]).map((s: any) => s.user_id as string),
  ])

  for (const userId of allUserIds) {
    const advPts = userAdvPts.get(userId) ?? 0
    const koPts = userKoPts.get(userId) ?? 0
    const existing = existingMap.get(userId) as any
    const groupPts = existing?.group_pts ?? 0
    await supabase.from('scores').upsert({
      user_id: userId,
      group_pts: groupPts,
      advancement_pts: advPts,
      knockout_match_pts: koPts,
      total_pts: groupPts + advPts + koPts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }
}
