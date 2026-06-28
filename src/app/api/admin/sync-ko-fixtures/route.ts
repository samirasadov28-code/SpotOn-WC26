import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Actual WC2026 R32 bracket (from official FIFA schedule)
// kickoff_at in UTC
const R32_FIXTURES = [
  { slot:  1, homeFifa: 'RSA', awayFifa: 'CAN', kickoff: '2026-06-28 20:00:00+00' },
  { slot:  2, homeFifa: 'GER', awayFifa: 'PAR', kickoff: '2026-06-29 21:30:00+00' },
  { slot:  3, homeFifa: 'NED', awayFifa: 'MAR', kickoff: '2026-06-30 02:00:00+00' },
  { slot:  4, homeFifa: 'BRA', awayFifa: 'JPN', kickoff: '2026-06-29 18:00:00+00' },
  { slot:  5, homeFifa: 'FRA', awayFifa: 'SWE', kickoff: '2026-06-30 22:00:00+00' },
  { slot:  6, homeFifa: 'CIV', awayFifa: 'NOR', kickoff: '2026-06-30 18:00:00+00' },
  { slot:  7, homeFifa: 'MEX', awayFifa: 'ECU', kickoff: '2026-07-01 02:00:00+00' },
  { slot:  8, homeFifa: 'ENG', awayFifa: 'COD', kickoff: '2026-07-01 17:00:00+00' },
  { slot:  9, homeFifa: 'USA', awayFifa: 'BIH', kickoff: '2026-07-02 01:00:00+00' },
  { slot: 10, homeFifa: 'BEL', awayFifa: 'SEN', kickoff: '2026-07-01 21:00:00+00' },
  { slot: 11, homeFifa: 'POR', awayFifa: 'CRO', kickoff: '2026-07-03 00:00:00+00' },
  { slot: 12, homeFifa: 'ESP', awayFifa: 'AUT', kickoff: '2026-07-02 20:00:00+00' },
  { slot: 13, homeFifa: 'SUI', awayFifa: 'ALG', kickoff: '2026-07-03 04:00:00+00' },
  { slot: 14, homeFifa: 'ARG', awayFifa: 'CPV', kickoff: '2026-07-03 23:00:00+00' },
  { slot: 15, homeFifa: 'COL', awayFifa: 'GHA', kickoff: '2026-07-04 02:30:00+00' },
  { slot: 16, homeFifa: 'AUS', awayFifa: 'EGY', kickoff: '2026-07-03 19:00:00+00' },
]

// Correct kickoff times for R16–Final (also incorrect in the migration)
const LATER_KICKOFFS = [
  { slot: 17, kickoff: '2026-07-04 22:00:00+00' },
  { slot: 18, kickoff: '2026-07-04 18:00:00+00' },
  { slot: 19, kickoff: '2026-07-05 21:00:00+00' },
  { slot: 20, kickoff: '2026-07-06 01:00:00+00' },
  { slot: 21, kickoff: '2026-07-06 20:00:00+00' },
  { slot: 22, kickoff: '2026-07-07 01:00:00+00' },
  { slot: 23, kickoff: '2026-07-07 17:00:00+00' },
  { slot: 24, kickoff: '2026-07-07 21:00:00+00' },
  { slot: 25, kickoff: '2026-07-09 21:00:00+00' },
  { slot: 26, kickoff: '2026-07-10 20:00:00+00' },
  { slot: 27, kickoff: '2026-07-11 22:00:00+00' },
  { slot: 28, kickoff: '2026-07-12 02:00:00+00' },
  { slot: 29, kickoff: '2026-07-14 20:00:00+00' },
  { slot: 30, kickoff: '2026-07-15 20:00:00+00' },
  { slot: 31, kickoff: '2026-07-18 22:00:00+00' },
  { slot: 32, kickoff: '2026-07-19 20:00:00+00' },
]

export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Build fifa_code → id map from teams table
  const { data: teams, error: teamErr } = await supabase.from('teams').select('id, fifa_code')
  if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 })
  const teamMap = new Map((teams ?? []).map((t: any) => [t.fifa_code as string, t.id as string]))

  const results: any[] = []

  // Update R32 slots with team IDs + correct kickoff
  for (const f of R32_FIXTURES) {
    const homeId = teamMap.get(f.homeFifa)
    const awayId = teamMap.get(f.awayFifa)
    if (!homeId || !awayId) {
      results.push({ slot: f.slot, status: `team_not_found: ${!homeId ? f.homeFifa : f.awayFifa}` })
      continue
    }
    const { error } = await supabase.from('matches')
      .update({ home_team_id: homeId, away_team_id: awayId, kickoff_at: f.kickoff })
      .eq('stage', 'knockout').eq('bracket_slot', f.slot)
    results.push({ slot: f.slot, status: error ? `error: ${error.message}` : 'ok', home: f.homeFifa, away: f.awayFifa })
  }

  // Update R16–Final kickoff times only (no teams known yet)
  for (const f of LATER_KICKOFFS) {
    const { error } = await supabase.from('matches')
      .update({ kickoff_at: f.kickoff })
      .eq('stage', 'knockout').eq('bracket_slot', f.slot)
    results.push({ slot: f.slot, status: error ? `error: ${error.message}` : 'ok (kickoff only)' })
  }

  return NextResponse.json({ results, teamMapSize: teamMap.size })
}

// Allow GET so it can be triggered directly from the browser address bar
export async function GET() {
  return POST()
}
