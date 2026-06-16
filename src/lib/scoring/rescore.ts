import { createClient } from '@supabase/supabase-js'
import { scoreGroupMatch } from './group'

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
