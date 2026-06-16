import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { rescoreAllGroupPts } from '@/lib/scoring/rescore'

// API-Football league/season for FIFA World Cup 2026
const WC_LEAGUE_ID = process.env.API_FOOTBALL_WC_LEAGUE_ID ?? '1'
const WC_SEASON    = process.env.API_FOOTBALL_WC_SEASON    ?? '2026'

// Maps our FIFA codes → API-Football team IDs (same as refresh-squads)
const FIFA_TO_API_ID: Record<string, number> = {
  MEX:16, RSA:815, KOR:60, CZE:65, CAN:94, BIH:1495, QAT:882, SUI:15,
  BRA:6, MAR:4, HAI:96, SCO:1160, USA:2, PAR:11, AUS:25, TUR:22,
  GER:25, CUW:9814, CIV:108, ECU:83, NED:1118, JPN:921, SWE:23, TUN:1533,
  BEL:4, EGY:81, IRN:1513, NZL:17, ESP:9, CPV:2017, KSA:146, URU:8,
  FRA:2, SEN:75, IRQ:1523, NOR:1532, ARG:26, ALG:1520, AUT:49, JOR:1526,
  POR:38, COD:1521, UZB:1515, COL:78, ENG:10, CRO:1518, GHA:1527, PAN:1531,
}
const API_ID_TO_FIFA: Record<number, string> = Object.fromEntries(
  Object.entries(FIFA_TO_API_ID).map(([fifa, id]) => [id, fifa])
)

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string } }
  teams: { home: { id: number }; away: { id: number } }
  goals: { home: number | null; away: number | null }
}

async function fetchFinishedFixtures(date: string): Promise<ApiFixture[]> {
  const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${WC_LEAGUE_ID}&season=${WC_SEASON}&date=${date}&status=FT`
  const resp = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': process.env.API_FOOTBALL_KEY!,
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
    },
    next: { revalidate: 0 },
  })
  if (!resp.ok) throw new Error(`API-Football ${resp.status}`)
  const data = await resp.json()
  return (data.response ?? []) as ApiFixture[]
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ error: 'API_FOOTBALL_KEY not set' }, { status: 500 })
  }

  const supabase = getServiceClient()

  // Find group-stage matches that finished > 60 min ago and have no result yet
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: pending } = await supabase
    .from('matches')
    .select('id, kickoff_at, home_team:teams!matches_home_team_id_fkey(id, fifa_code), away_team:teams!matches_away_team_id_fkey(id, fifa_code)')
    .eq('stage', 'group')
    .is('actual_home_score', null)
    .lt('kickoff_at', cutoff) as any

  if (!pending || pending.length === 0) {
    return NextResponse.json({ success: true, updated: 0, message: 'No pending matches' })
  }

  // Collect unique UTC dates needed
  const dates = [...new Set((pending as any[]).map((m: any) => m.kickoff_at!.slice(0, 10)))]

  // Fetch finished fixtures for those dates
  const allFixtures: ApiFixture[] = []
  for (const date of dates) {
    try {
      const fixtures = await fetchFinishedFixtures(date)
      allFixtures.push(...fixtures)
    } catch { /* skip date on error */ }
  }

  // Index fixtures by [homeApiId, awayApiId]
  const fixtureMap = new Map<string, ApiFixture>()
  for (const f of allFixtures) {
    fixtureMap.set(`${f.teams.home.id}:${f.teams.away.id}`, f)
  }

  let updated = 0
  for (const match of pending as any[]) {
    const homeApiId = FIFA_TO_API_ID[match.home_team?.fifa_code]
    const awayApiId = FIFA_TO_API_ID[match.away_team?.fifa_code]
    if (!homeApiId || !awayApiId) continue

    const fixture = fixtureMap.get(`${homeApiId}:${awayApiId}`)
    if (!fixture || fixture.goals.home === null || fixture.goals.away === null) continue

    const homeScore = fixture.goals.home
    const awayScore = fixture.goals.away

    // Update match
    const { error: matchErr } = await supabase
      .from('matches')
      .update({ actual_home_score: homeScore, actual_away_score: awayScore, decided_by: 'ft', is_final: true })
      .eq('id', match.id)
    if (matchErr) continue

    updated++
  }

  // Full rescore from scratch after all results are in (idempotent — no double-counting)
  if (updated > 0) {
    await rescoreAllGroupPts()
  }

  return NextResponse.json({ success: true, updated })
}
