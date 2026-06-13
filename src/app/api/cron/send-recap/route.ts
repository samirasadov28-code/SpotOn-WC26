import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import { sendDayRecapEmail } from '@/lib/notifications/email'
import { transliterateName } from '@/lib/transliterate'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function pts(ph: number, pa: number, ah: number, aa: number) {
  if (ph === ah && pa === aa) return 3
  if ((ph - pa) === (ah - aa)) return 2
  if (Math.sign(ph - pa) === Math.sign(ah - aa)) return 1
  return 0
}

function toCDTDate(iso: string) {
  return new Date(new Date(iso).getTime() - 6 * 3600_000).toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = svc()

  // Find the most recently completed matchday (group stage, all results in)
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('kickoff_at, actual_home_score')
    .eq('stage', 'group')
    .not('actual_home_score', 'is', null)
    .order('kickoff_at', { ascending: false })
    .limit(20) as any

  if (!recentMatches?.length) {
    return NextResponse.json({ message: 'No completed matches' })
  }

  // Find the latest CDT matchday that has results
  const latestDay = toCDTDate(recentMatches[0].kickoff_at)

  // Check if we already sent recap for this day (use day_recaps table as sent log)
  const sentKey = `sent:global:${latestDay}`
  const { data: alreadySent } = await (supabase as any)
    .from('day_recaps')
    .select('cache_key')
    .eq('cache_key', sentKey)
    .single()

  if (alreadySent) {
    return NextResponse.json({ message: `Recap already sent for ${latestDay}` })
  }

  // Verify all matches on that day have results before sending
  const dayStart = new Date(latestDay + 'T06:00:00Z')
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000)

  const { data: dayMatches } = await supabase
    .from('matches')
    .select('id, actual_home_score, actual_away_score, home_team:teams!matches_home_team_id_fkey(name,fifa_code), away_team:teams!matches_away_team_id_fkey(name,fifa_code)')
    .gte('kickoff_at', dayStart.toISOString())
    .lt('kickoff_at', dayEnd.toISOString())
    .eq('stage', 'group')
    .order('kickoff_at') as any

  const finished = (dayMatches ?? []).filter((m: any) => m.actual_home_score !== null)
  if (!finished.length) {
    return NextResponse.json({ message: `No finished matches for ${latestDay}` })
  }

  // Generate recap text (English)
  let recapText = ''
  const cacheKey = `global:${latestDay}`
  const { data: cached } = await (supabase as any)
    .from('day_recaps').select('recap_text').eq('cache_key', cacheKey).single()

  if (cached?.recap_text) {
    recapText = cached.recap_text
  } else if (process.env.GROQ_API_KEY) {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const matchIds = (dayMatches ?? []).map((m: any) => m.id)
    const { data: users } = await supabase.from('users').select('id, display_name') as any
    const { data: preds } = await supabase
      .from('predictions_group')
      .select('user_id, match_id, pred_home_score, pred_away_score')
      .in('match_id', matchIds)
      .limit(5000) as any

    const userMap = new Map((users ?? []).map((u: any) => [u.id, transliterateName(u.display_name ?? 'Anonymous')]))
    const matchSummaries = finished.map((m: any) => {
      const matchPreds = (preds ?? []).filter((p: any) => p.match_id === m.id && p.pred_home_score !== null)
      const exactHits = matchPreds.filter((p: any) => pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score) === 3)
      const wrongPicks = matchPreds.filter((p: any) => pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score) === 0)
      return {
        match: `${m.home_team?.name} vs ${m.away_team?.name}`,
        result: `${m.actual_home_score}–${m.actual_away_score}`,
        predictions: matchPreds.map((p: any) => ({ name: userMap.get(p.user_id) ?? '?', pred: `${p.pred_home_score}–${p.pred_away_score}`, pts: pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score) })),
        exactNames: exactHits.map((p: any) => userMap.get(p.user_id) ?? '?'),
        wrongNames: wrongPicks.map((p: any) => userMap.get(p.user_id) ?? '?'),
      }
    })
    const dayPts = new Map<string, number>()
    for (const p of (preds ?? [])) {
      const m = finished.find((fm: any) => fm.id === p.match_id)
      if (!m || p.pred_home_score === null) continue
      dayPts.set(p.user_id, (dayPts.get(p.user_id) ?? 0) + pts(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score))
    }
    const dayRanking = [...dayPts.entries()].map(([uid, p]) => ({ name: userMap.get(uid) ?? '?', pts: p })).sort((a, b) => b.pts - a.pts)

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `You are the hilarious, enthusiastic commentator for a friend-group World Cup prediction contest called SpotOn WC26. Write a fun, punchy Day Recap based on today's match results and predictions. Write ONLY in English.\n\nRules:\n- Start with a 1-sentence hook about the day's drama\n- Go through each match with color: mention who nailed the exact score, who got lucky, who was wildly wrong\n- Call out people by name\n- End with a day standings mini-table (just text)\n- Use football banter, emojis, and fun energy\n- Keep it under 400 words\n- DO NOT use markdown headers (no ## or **), no bold text\n- Put each sentence on its own line. Use a blank line between topics/matches.\n\nMatch data:\n${JSON.stringify({ date: latestDay, matches: matchSummaries, dayRanking }, null, 2)}` }],
    })
    recapText = completion.choices[0]?.message?.content ?? ''
    if (recapText) {
      await (supabase as any).from('day_recaps').upsert(
        { cache_key: cacheKey, league_id: null, day_date: latestDay, recap_text: recapText, created_at: new Date().toISOString() },
        { onConflict: 'cache_key' }
      )
    }
  }

  if (!recapText) {
    return NextResponse.json({ message: 'No recap text generated' })
  }

  // Get all users and leagues for context
  const { data: allUsers } = await supabase.from('users').select('id') as any

  // Send to all users
  let sent = 0
  for (const user of (allUsers ?? [])) {
    await sendDayRecapEmail(user.id, latestDay, recapText, null, 'SpotOn WC26')
    sent++
  }

  // Mark as sent
  await (supabase as any).from('day_recaps').upsert(
    { cache_key: sentKey, league_id: null, day_date: latestDay, recap_text: 'sent', created_at: new Date().toISOString() },
    { onConflict: 'cache_key' }
  )

  return NextResponse.json({ success: true, day: latestDay, sent })
}
