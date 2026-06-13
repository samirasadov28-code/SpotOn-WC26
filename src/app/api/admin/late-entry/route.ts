import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = svc()
  const { email } = await request.json() as { email: string }

  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Find user by email
  const { data: user, error: userErr } = await (supabase as any)
    .from('users')
    .select('id, display_name, email')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (userErr || !user) {
    return NextResponse.json({ error: `User not found for email: ${email}` }, { status: 404 })
  }

  const userId = user.id

  // Get all played group stage matches (have actual scores)
  const { data: playedMatches, error: matchErr } = await (supabase as any)
    .from('matches')
    .select('id')
    .eq('stage', 'group')
    .not('actual_home_score', 'is', null)

  if (matchErr) return NextResponse.json({ error: matchErr.message }, { status: 500 })

  const matches = (playedMatches ?? []) as { id: string }[]
  if (matches.length === 0) {
    return NextResponse.json({ message: 'No played group matches found', inserted: 0 })
  }

  // Check which matches already have predictions for this user
  const { data: existing } = await (supabase as any)
    .from('predictions_group')
    .select('match_id')
    .eq('user_id', userId)
    .in('match_id', matches.map((m: any) => m.id))

  const existingIds = new Set((existing ?? []).map((e: any) => e.match_id))
  const toInsert = matches.filter((m: any) => !existingIds.has(m.id))

  if (toInsert.length === 0) {
    return NextResponse.json({
      message: 'All played matches already have predictions',
      skipped: matches.length,
      inserted: 0,
    })
  }

  // Insert 0-0 predictions for all unset played matches
  const rows = toInsert.map((m: any) => ({
    user_id: userId,
    match_id: m.id,
    pred_home_score: 0,
    pred_away_score: 0,
  }))

  const { error: insertErr } = await (supabase as any)
    .from('predictions_group')
    .insert(rows)

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

  return NextResponse.json({
    message: `Late entry granted for ${user.display_name ?? email}`,
    userId,
    inserted: toInsert.length,
    skipped: existingIds.size,
  })
}
