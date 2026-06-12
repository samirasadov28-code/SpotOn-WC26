import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'
import { transliterateName } from '@/lib/transliterate'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const LANG_NAMES: Record<string, string> = {
  en: 'English', uk: 'Ukrainian', az: 'Azerbaijani', fr: 'French', es: 'Spanish',
  de: 'German', pt: 'Portuguese', it: 'Italian', nl: 'Dutch', tr: 'Turkish',
  zh: 'Chinese (Simplified)', ar: 'Arabic', hi: 'Hindi', ru: 'Russian',
  bn: 'Bengali', ja: 'Japanese', id: 'Indonesian',
}

export async function POST(request: NextRequest) {
  const { day, leagueId, leagueName, playerNames, lang = 'en' } = await request.json()
  if (!day) return NextResponse.json({ error: 'Missing day' }, { status: 400 })

  const supabase = getServiceClient()
  const baseCacheKey = `${leagueId ?? 'global'}:${day}`
  const langCacheKey = lang === 'en' ? baseCacheKey : `${baseCacheKey}:${lang}`

  // Check cache for requested language
  const { data: cached } = await (supabase as any)
    .from('day_recaps')
    .select('recap_text')
    .eq('cache_key', langCacheKey)
    .single()
  if (cached?.recap_text) return NextResponse.json({ recap: cached.recap_text })

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ recap: 'Recap feature requires GROQ_API_KEY to be configured.' })
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  // For non-English: get or generate English recap first, then translate
  if (lang !== 'en') {
    let englishRecap = ''
    const { data: enCached } = await (supabase as any)
      .from('day_recaps').select('recap_text').eq('cache_key', baseCacheKey).single()
    if (enCached?.recap_text) {
      englishRecap = enCached.recap_text
    } else {
      // Generate English recap (will be cached below)
      englishRecap = await generateEnglishRecap(supabase, groq, day, leagueId, leagueName, baseCacheKey)
    }

    if (!englishRecap) return NextResponse.json({ recap: 'No results yet — check back after the matches!' })

    // Translate
    const langName = LANG_NAMES[lang] ?? lang
    const translation = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Translate the following football prediction contest recap into ${langName}. Keep all names, scores, and emojis exactly as-is. Only translate the surrounding text.\n\n${englishRecap}`,
      }],
    })
    const translatedText = translation.choices[0]?.message?.content ?? englishRecap

    await (supabase as any).from('day_recaps').upsert(
      { cache_key: langCacheKey, league_id: null, day_date: day, recap_text: translatedText, created_at: new Date().toISOString() },
      { onConflict: 'cache_key' }
    )
    return NextResponse.json({ recap: translatedText })
  }

  // English: generate fresh recap
  const recapText = await generateEnglishRecap(supabase, groq, day, leagueId, leagueName, baseCacheKey)
  return NextResponse.json({ recap: recapText || 'No results yet — check back after the matches!' })
}

async function generateEnglishRecap(
  supabase: any, groq: Groq, day: string,
  leagueId: string | null, leagueName: string, cacheKey: string
): Promise<string> {
  const start = new Date(day + 'T06:00:00Z')
  const end   = new Date(start.getTime() + 24 * 3600_000)

  const { data: matches } = await supabase
    .from('matches')
    .select('id, actual_home_score, actual_away_score, home_team:teams!matches_home_team_id_fkey(name,fifa_code), away_team:teams!matches_away_team_id_fkey(name,fifa_code)')
    .gte('kickoff_at', start.toISOString())
    .lt('kickoff_at', end.toISOString())
    .eq('stage', 'group')
    .order('kickoff_at')

  if (!matches?.length) return ''

  const finishedMatches = matches.filter((m: any) => m.actual_home_score !== null)
  if (!finishedMatches.length) return ''

  const matchIds = matches.map((m: any) => m.id)
  const { data: users } = await supabase.from('users').select('id, display_name')
  const { data: preds } = await supabase
    .from('predictions_group')
    .select('user_id, match_id, pred_home_score, pred_away_score')
    .in('match_id', matchIds)
    .limit(5000)

  let relevantUserIds: Set<string> | null = null
  if (leagueId) {
    const { data: members } = await supabase
      .from('league_members').select('user_id').eq('league_id', leagueId)
    relevantUserIds = new Set((members ?? []).map((m: any) => m.user_id))
  }

  // Transliterate all names to English
  const userMap = new Map((users ?? []).map((u: any) => [
    u.id,
    transliterateName(u.display_name ?? 'Anonymous'),
  ]))

  function pts(ph: number, pa: number, ah: number, aa: number) {
    if (ph === ah && pa === aa) return 3
    if ((ph - pa) === (ah - aa)) return 2
    if (Math.sign(ph - pa) === Math.sign(ah - aa)) return 1
    return 0
  }

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

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are the hilarious, enthusiastic commentator for a friend-group World Cup prediction contest called SpotOn WC26. Write a fun, punchy Day Recap for the league "${leagueName}" based on today's match results and predictions. Write ONLY in English.

Rules:
- Start with a 1-sentence hook about the day's drama
- Go through each match with color: mention who nailed the exact score, who got lucky, who was wildly wrong
- Call out people by name — celebrate the heroes and gently roast the disasters
- Note any unusually bold or cowardly predictions
- End with a day standings mini-table (just text)
- Use football banter, emojis, and fun energy
- Keep it under 400 words
- DO NOT use markdown headers (no ## or **), no bold text
- IMPORTANT: Put each sentence or completed thought on its own line. Use a blank line between topics/matches. This is critical for readability.

Match data:
${promptData}`,
    }],
  })

  const recapText = completion.choices[0]?.message?.content ?? ''

  await supabase.from('day_recaps').upsert(
    { cache_key: cacheKey, league_id: leagueId ?? null, day_date: day, recap_text: recapText, created_at: new Date().toISOString() },
    { onConflict: 'cache_key' }
  )

  return recapText
}
