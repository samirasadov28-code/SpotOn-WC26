import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const KO_FIXTURES = [
  // R32 — June 28–July 3
  { bracket_slot: 1,  ko_stage: 'r32',   kickoff_at: '2026-06-28T17:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { bracket_slot: 2,  ko_stage: 'r32',   kickoff_at: '2026-06-28T21:00:00Z', venue: 'MetLife Stadium, New York' },
  { bracket_slot: 3,  ko_stage: 'r32',   kickoff_at: '2026-06-29T17:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { bracket_slot: 4,  ko_stage: 'r32',   kickoff_at: '2026-06-29T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { bracket_slot: 5,  ko_stage: 'r32',   kickoff_at: '2026-06-30T17:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { bracket_slot: 6,  ko_stage: 'r32',   kickoff_at: '2026-06-30T20:00:00Z', venue: 'Gillette Stadium, Boston' },
  { bracket_slot: 7,  ko_stage: 'r32',   kickoff_at: '2026-06-30T23:00:00Z', venue: 'NRG Stadium, Houston' },
  { bracket_slot: 8,  ko_stage: 'r32',   kickoff_at: '2026-07-01T02:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { bracket_slot: 9,  ko_stage: 'r32',   kickoff_at: '2026-07-01T17:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { bracket_slot: 10, ko_stage: 'r32',   kickoff_at: '2026-07-01T21:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { bracket_slot: 11, ko_stage: 'r32',   kickoff_at: '2026-07-02T17:00:00Z', venue: 'Lumen Field, Seattle' },
  { bracket_slot: 12, ko_stage: 'r32',   kickoff_at: '2026-07-02T21:00:00Z', venue: 'BMO Field, Toronto' },
  { bracket_slot: 13, ko_stage: 'r32',   kickoff_at: '2026-07-03T17:00:00Z', venue: 'Rose Bowl, Pasadena' },
  { bracket_slot: 14, ko_stage: 'r32',   kickoff_at: '2026-07-03T20:00:00Z', venue: 'BC Place, Vancouver' },
  { bracket_slot: 15, ko_stage: 'r32',   kickoff_at: '2026-07-03T23:00:00Z', venue: 'Estadio Akron, Guadalajara' },
  { bracket_slot: 16, ko_stage: 'r32',   kickoff_at: '2026-07-04T02:00:00Z', venue: 'Estadio BBvA, Monterrey' },
  // R16 — July 5–8
  { bracket_slot: 17, ko_stage: 'r16',   kickoff_at: '2026-07-05T17:00:00Z', venue: 'MetLife Stadium, New York' },
  { bracket_slot: 18, ko_stage: 'r16',   kickoff_at: '2026-07-05T21:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { bracket_slot: 19, ko_stage: 'r16',   kickoff_at: '2026-07-06T17:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { bracket_slot: 20, ko_stage: 'r16',   kickoff_at: '2026-07-06T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { bracket_slot: 21, ko_stage: 'r16',   kickoff_at: '2026-07-07T17:00:00Z', venue: 'NRG Stadium, Houston' },
  { bracket_slot: 22, ko_stage: 'r16',   kickoff_at: '2026-07-07T21:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { bracket_slot: 23, ko_stage: 'r16',   kickoff_at: '2026-07-08T17:00:00Z', venue: 'MetLife Stadium, New York' },
  { bracket_slot: 24, ko_stage: 'r16',   kickoff_at: '2026-07-08T21:00:00Z', venue: 'AT&T Stadium, Dallas' },
  // QF — July 10–11
  { bracket_slot: 25, ko_stage: 'qf',    kickoff_at: '2026-07-10T17:00:00Z', venue: 'MetLife Stadium, New York' },
  { bracket_slot: 26, ko_stage: 'qf',    kickoff_at: '2026-07-10T21:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { bracket_slot: 27, ko_stage: 'qf',    kickoff_at: '2026-07-11T17:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { bracket_slot: 28, ko_stage: 'qf',    kickoff_at: '2026-07-11T21:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  // SF — July 14–15
  { bracket_slot: 29, ko_stage: 'sf',    kickoff_at: '2026-07-14T21:00:00Z', venue: 'MetLife Stadium, New York' },
  { bracket_slot: 30, ko_stage: 'sf',    kickoff_at: '2026-07-15T21:00:00Z', venue: 'AT&T Stadium, Dallas' },
  // 3rd Place — July 18
  { bracket_slot: 31, ko_stage: 'third', kickoff_at: '2026-07-18T17:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  // Final — July 19
  { bracket_slot: 32, ko_stage: 'final', kickoff_at: '2026-07-19T20:00:00Z', venue: 'MetLife Stadium, New York' },
]

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })

  const supabase = createClient(url, key)

  const { count } = await supabase.from('matches')
    .select('id', { count: 'exact', head: true })
    .eq('stage', 'knockout')

  if (count && count > 0) {
    return NextResponse.json({ message: `Already seeded: ${count} KO matches exist` })
  }

  const { error } = await supabase.from('matches').insert(
    KO_FIXTURES.map(f => ({ ...f, stage: 'knockout' }))
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seeded: KO_FIXTURES.length })
}
