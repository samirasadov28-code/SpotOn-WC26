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

async function generateRecap(day: string, supabase: ReturnType<typeof svc>): Promise<string> {
  const dayStart = new Date(day + 'T06:00:00Z')
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600_000)

  const { data: dayMatches } = await supabase
    .from('matches')
    .select('id, actual_home_score, actual_away_score, home_team:teams!matches_home_team_id_fkey(name,fifa_code), away_team:teams!matches_away_team_id_fkey(name,fifa_code)')
    .gte('kickoff_at', dayStart.toISOString())
    .lt('kickoff_at', dayEnd.toISOString())
    .eq('stage', 'group')
    .order('kickoff_at') as any

  const finished = (dayMatches ?? []).filter((m: any) => m.actual_home_score !== null)
  if (!finished.length) throw new Error('No finished matches for this day')

  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  const matchIds = finished.map((m: any) => m.id)
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
    messages: [{ role: 'user', content: `You are the hilarious, enthusiastic commentator for a friend-group World Cup prediction contest called SpotOn WC26. Write a fun, punchy Day Recap based on today's match results and predictions. Write ONLY in English.\n\nRules:\n- Start with a 1-sentence hook about the day's drama\n- Go through each match with color: mention who nailed the exact score, who got lucky, who was wildly wrong\n- Call out people by name\n- End with a day standings mini-table (just text)\n- Use football banter, emojis, and fun energy\n- Keep it under 400 words\n- DO NOT use markdown headers (no ## or **), no bold text\n- Put each sentence on its own line. Use a blank line between topics/matches.\n\nMatch data:\n${JSON.stringify({ date: day, matches: matchSummaries, dayRanking }, null, 2)}` }],
  })

  return completion.choices[0]?.message?.content ?? ''
}

// GET /api/admin/recap?day=YYYY-MM-DD  — fetch current recap for a day
export async function GET(request: NextRequest) {
  const day = request.nextUrl.searchParams.get('day')
  if (!day) return NextResponse.json({ error: 'Missing day param' }, { status: 400 })

  const supabase = svc()
  const { data } = await (supabase as any)
    .from('day_recaps')
    .select('recap_text, created_at')
    .eq('cache_key', `global:${day}`)
    .single()

  const sentCheck = await (supabase as any)
    .from('day_recaps')
    .select('created_at')
    .eq('cache_key', `sent:global:${day}`)
    .single()

  return NextResponse.json({
    day,
    recapText: data?.recap_text ?? null,
    generatedAt: data?.created_at ?? null,
    alreadySent: !!sentCheck.data,
    sentAt: sentCheck.data?.created_at ?? null,
  })
}

// POST /api/admin/recap  — regenerate or send
export async function POST(request: NextRequest) {
  const body = await request.json() as { day: string; action: 'regenerate' | 'send' }
  const { day, action } = body
  if (!day || !action) return NextResponse.json({ error: 'Missing day or action' }, { status: 400 })

  const supabase = svc()

  if (action === 'regenerate') {
    // Delete existing cached recap so we get a fresh one
    await (supabase as any).from('day_recaps').delete().eq('cache_key', `global:${day}`)

    let recapText: string
    try {
      recapText = await generateRecap(day, supabase)
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }

    if (!recapText) return NextResponse.json({ error: 'No recap generated' }, { status: 500 })

    await (supabase as any).from('day_recaps').upsert(
      { cache_key: `global:${day}`, league_id: null, day_date: day, recap_text: recapText, created_at: new Date().toISOString() },
      { onConflict: 'cache_key' }
    )
    return NextResponse.json({ success: true, recapText })
  }

  if (action === 'send') {
    const { data: cached } = await (supabase as any)
      .from('day_recaps').select('recap_text').eq('cache_key', `global:${day}`).single()

    if (!cached?.recap_text) {
      return NextResponse.json({ error: 'No recap text — generate first' }, { status: 400 })
    }

    const { data: allUsers } = await supabase.from('users').select('id') as any
    let sent = 0
    for (const user of (allUsers ?? [])) {
      await sendDayRecapEmail(user.id, day, cached.recap_text, null, 'SpotOn WC26')
      sent++
    }

    // Remove old sent marker so it can be re-sent, then mark as sent again
    await (supabase as any).from('day_recaps').delete().eq('cache_key', `sent:global:${day}`)
    await (supabase as any).from('day_recaps').upsert(
      { cache_key: `sent:global:${day}`, league_id: null, day_date: day, recap_text: 'sent', created_at: new Date().toISOString() },
      { onConflict: 'cache_key' }
    )

    return NextResponse.json({ success: true, sent })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
