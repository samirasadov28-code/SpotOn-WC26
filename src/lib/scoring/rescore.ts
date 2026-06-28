import { createClient } from '@supabase/supabase-js'
import { scoreGroupMatch } from './group'
import { STAGE_POINTS } from './advancement'
import { loadGroupData, computeUserR32Positions, R32_DEFS } from './group-qualifiers'

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
 * R32 advancement: computed from group predictions (pred_home_team_id is null in DB).
 * R16+: uses pred_home_team_id / pred_away_team_id directly.
 */
export async function rescoreKOPts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // All KO matches with teams assigned
  const { data: koMatchesWithTeams } = await supabase
    .from('matches')
    .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score')
    .eq('stage', 'knockout')
    .not('home_team_id', 'is', null) as any

  // All KO predictions (score preds + R16+ team preds)
  const { data: preds } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score') as any

  const matchBySlot = new Map(((koMatchesWithTeams ?? []) as any[]).map((m: any) => [m.bracket_slot as number, m]))

  // Compute R32 predictions from group predictions for all users
  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()
  // Map: userId -> Map<position, teamId>  e.g. '1F' -> teamId
  const userR32PosMap = new Map<string, Map<string, string>>()
  for (const [userId, userGroupPreds] of predsByUser) {
    userR32PosMap.set(userId, computeUserR32Positions(userGroupPreds, groupMatchesByGroup, teamsByGroup))
  }

  // Build actual R32 position → teamId from matches table using R32_DEFS
  const actualPosToTeam = new Map<string, string>()
  for (const def of R32_DEFS) {
    const m = matchBySlot.get(def.slot)
    if (!m) continue
    if (m.home_team_id) actualPosToTeam.set(def.homePos, m.home_team_id)
    if (m.away_team_id) actualPosToTeam.set(def.awayPos, m.away_team_id)
  }

  const userAdvPts = new Map<string, number>()
  const userKoPts = new Map<string, number>()

  // Collect all user IDs from predictions
  const allPredUserIds = new Set<string>((preds ?? []).map((p: any) => p.user_id as string))
  // Also include users who only have group preds (no KO preds yet)
  for (const uid of userR32PosMap.keys()) allPredUserIds.add(uid)

  // R32 advancement pts: 1pt per correctly predicted team position
  for (const [userId, posMap] of userR32PosMap) {
    let advAdd = 0
    for (const def of R32_DEFS) {
      const m = matchBySlot.get(def.slot)
      if (!m) continue // teams not confirmed yet
      if (m.home_team_id && posMap.get(def.homePos) === m.home_team_id) advAdd += STAGE_POINTS['r32'] ?? 1
      if (m.away_team_id && posMap.get(def.awayPos) === m.away_team_id) advAdd += STAGE_POINTS['r32'] ?? 1
    }
    if (advAdd > 0) userAdvPts.set(userId, (userAdvPts.get(userId) ?? 0) + advAdd)
  }

  // R32 score pts from predictions_knockout (scores are stored even if team IDs are null)
  for (const p of (preds ?? []) as any[]) {
    if ((p.bracket_slot as number) > 16) continue
    const match = matchBySlot.get(p.bracket_slot as number)
    if (!match || match.actual_home_score === null) continue
    if (p.pred_home_score === null || p.pred_away_score === null) continue
    // Only award score pts if user predicted this match pair (via their group predictions)
    const def = R32_DEFS.find(d => d.slot === p.bracket_slot)
    if (!def) continue
    const userPos = userR32PosMap.get(p.user_id)
    if (!userPos) continue
    const predHome = userPos.get(def.homePos)
    const predAway = userPos.get(def.awayPos)
    if (!predHome || !predAway || predHome !== match.home_team_id || predAway !== match.away_team_id) continue
    const ph = p.pred_home_score as number, pa = p.pred_away_score as number
    const ah = match.actual_home_score as number, aa = match.actual_away_score as number
    let koPts = 0
    if (ph === ah && pa === aa) koPts = 3
    else if (ph - pa === ah - aa) koPts = 2
    else if (Math.sign(ph - pa) === Math.sign(ah - aa)) koPts = 1
    userKoPts.set(p.user_id, (userKoPts.get(p.user_id) ?? 0) + koPts)
  }

  // R16+ advancement and score pts
  for (const p of (preds ?? []) as any[]) {
    if ((p.bracket_slot as number) <= 16) continue
    const match = matchBySlot.get(p.bracket_slot as number)
    if (!match) continue

    const stage = slotStage(p.bracket_slot)
    const stagePts = STAGE_POINTS[stage] ?? 0

    let advAdd = 0
    if (p.pred_home_team_id && p.pred_home_team_id === match.home_team_id) advAdd += stagePts
    if (p.pred_away_team_id && p.pred_away_team_id === match.away_team_id) advAdd += stagePts

    // Final winner bonus
    if (p.bracket_slot === 32 && match.actual_home_score !== null) {
      const ah = match.actual_home_score as number, aa = match.actual_away_score as number
      const actualWinner = ah > aa ? match.home_team_id : match.away_team_id
      const ph = p.pred_home_score ?? 0, pa = p.pred_away_score ?? 0
      const predWinner = ph > pa ? p.pred_home_team_id : p.pred_away_team_id
      if (predWinner && predWinner === actualWinner) advAdd += STAGE_POINTS['winner'] ?? 16
    }

    if (advAdd > 0) userAdvPts.set(p.user_id, (userAdvPts.get(p.user_id) ?? 0) + advAdd)

    // KO score pts
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
