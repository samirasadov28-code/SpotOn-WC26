import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const { day, leagueId, leagueName, playerNames } = await request.json()
  if (!day) return NextResponse.json({ error: 'Missing day' }, { status: 400 })

  const supabase = getServiceClient()

  // Check cache
  const cacheKey = `${leagueId ?? 'global'}:${day}`
  const { data: cached } = await (supabase as any)
    .from('day_recaps')
    .select('recap_text')
    .eq('cache_key', cacheKey)
    .single()
  if (cached?.recap_text) return NextResponse.json({ recap: cached.recap_text })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ recap: 'Recap feature requires ANTHROPIC_API_KEY to be configured.' })
  }

  // Fetch match data for the day
  const start = new Date(day + 'T06:00:00Z')
  const end   = new Date(start.getTime() + 24 * 3600_000)

  const { data: matches } = await (supabase as any)
    .from('matches')
    .select('id, actual_home_score, actual_away_score, home_team:teams!matches_home_team_id_fkey(name,fifa_code), away_team:teams!matches_away_team_id_fkey(name,fifa_code)')
    .gte('kickoff_at', start.toISOString())
    .lt('kickoff_at', end.toISOString())
    .eq('stage', 'group')
    .order('kickoff_at')

  if (!matches?.length) return NextResponse.json({ recap: 'No matches found for this day.' })

  const finishedMatches = matches.filter((m: any) => m.actual_home_score !== null)
  if (!finishedMatches.length) return NextResponse.json({ recap: 'No results yet — check back after the matches!' })

  // Fetch predictions for those matches
  const matchIds = matches.map((m: any) => m.id)
  const { data: users } = await (supabase as any).from('users').select('id, display_name')
  const { data: preds } = await (supabase as any)
    .from('predictions_group')
    .select('user_id, match_id, pred_home_score, pred_away_score')
    .in('match_id', matchIds)
    .limit(5000)

  // Filter to league members if applicable
  let relevantUserIds: Set<string> | null = null
  if (leagueId) {
    const { data: members } = await (supabase as any)
      .from('league_members').select('user_id').eq('league_id', leagueId)
    relevantUserIds = new Set((members ?? []).map((m: any) => m.user_id))
  }

  const userMap = new Map((users ?? []).map((u: any) => [u.id, u.display_name ?? u.id.slice(0, 6)]))

  function pts(ph: number, pa: number, ah: number, aa: number) {
    if (ph === ah && pa === aa) return 3
    if ((ph - pa) === (ah - aa)) return 2
    if (Math.sign(ph - pa) === Math.sign(ah - aa)) return 1
    return 0
  }

  // Build per-match prediction summaries
  const matchSummaries = finishedMatches.map((m: any) => {
    const home = m.home_team?.name ?? '?'
    const away = m.away_team?.name ?? '?'
    const result = `${m.actual_home_score}–${m.actual_away_score}`
    const matchPreds = (preds ?? []).filter((p: any) =>
      p.match_id === m.id &&
      (!relevantUserIds || relevantUserIds.has(p.user_id)) &&
      p.pred_home_score !== null
    )
    const exactHits = matchPreds.filter((p: any) => pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score) === 3)
    const wrongPicks = matchPreds.filter((p: any) => pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score) === 0)
    const ptsBreakdown = matchPreds.map((p: any) => ({
      name: userMap.get(p.user_id) ?? '?',
      pred: `${p.pred_home_score}–${p.pred_away_score}`,
      pts: pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score),
    }))
    return {
      match: `${home} vs ${away}`,
      result,
      predictions: ptsBreakdown,
      exactNames: exactHits.map((p: any) => userMap.get(p.user_id) ?? '?'),
      wrongNames: wrongPicks.map((p: any) => userMap.get(p.user_id) ?? '?'),
    }
  })

  // Build day leaderboard
  const dayPts = new Map<string, number>()
  for (const p of (preds ?? []).filter((p: any) => !relevantUserIds || relevantUserIds.has(p.user_id))) {
    const m = finishedMatches.find((fm: any) => fm.id === p.match_id)
    if (!m || p.pred_home_score === null) continue
    const p2 = pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score)
    dayPts.set(p.user_id, (dayPts.get(p.user_id) ?? 0) + p2)
  }
  const dayRanking = [...dayPts.entries()]
    .map(([uid, p]) => ({ name: userMap.get(uid) ?? '?', pts: p }))
    .sort((a, b) => b.pts - a.pts)

  const promptData = JSON.stringify({ date: day, matches: matchSummaries, dayRanking }, null, 2)

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are the hilarious, enthusiastic commentator for a friend-group World Cup prediction contest called SpotOn WC26. Write a fun, punchy Day Recap for the league "${leagueName}" based on today's match results and predictions.

Rules:
- Start with a 1-sentence hook about the day's drama
- Go through each match with color: mention who nailed the exact score, who got lucky, who was wildly wrong
- Call out people by name — celebrate the heroes and gently roast the disasters
- Note any unusually bold or cowardly predictions
- End with a day standings mini-table (just text)
- Use football banter, emojis, and fun energy
- Keep it under 400 words
- DO NOT use markdown headers (no ## or **), just plain flowing text with emojis

Match data:
${promptData}`,
    }],
  })

  const recapText = (message.content[0] as any).text ?? ''

  // Cache it
  await (supabase as any).from('day_recaps').upsert(
    { cache_key: cacheKey, league_id: leagueId ?? null, day_date: day, recap_text: recapText, created_at: new Date().toISOString() },
    { onConflict: 'cache_key' }
  )

  return NextResponse.json({ recap: recapText })
}
