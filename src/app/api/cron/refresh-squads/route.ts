import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { fetchSquad } from '@/lib/api-football/adapter'

// Mapping of fifa_code → API-Football team ID
// These IDs are approximate — verify against API-Football documentation
const FIFA_TO_API_ID: Record<string, number> = {
  MEX: 16, RSA: 815, KOR: 60, CZE: 65,
  CAN: 94, BIH: 1495, QAT: 882, SUI: 15,
  BRA: 6, MAR: 4, HAI: 96, SCO: 1160,
  USA: 2, PAR: 11, AUS: 25, TUR: 22,
  GER: 25, CUW: 9814, CIV: 108, ECU: 83,
  NED: 1118, JPN: 921, SWE: 23, TUN: 1533,
  BEL: 4, EGY: 81, IRN: 1513, NZL: 17,
  ESP: 9, CPV: 2017, KSA: 146, URU: 8,
  FRA: 2, SEN: 75, IRQ: 1523, NOR: 1532,
  ARG: 26, ALG: 1520, AUT: 49, JOR: 1526,
  POR: 38, COD: 1521, UZB: 1515, COL: 78,
  ENG: 10, CRO: 1518, GHA: 1527, PAN: 1531,
}

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data: teams, error: teamErr } = await supabase.from('teams').select('id, fifa_code')

  if (teamErr || !teams) {
    return NextResponse.json({ error: 'Failed to load teams' }, { status: 500 })
  }

  let total = 0
  let errors = 0

  for (const team of teams) {
    const apiId = FIFA_TO_API_ID[team.fifa_code]
    if (!apiId) continue

    try {
      const players = await fetchSquad(apiId)

      for (const p of players) {
        await supabase.from('players').upsert(
          {
            team_id: team.id,
            name: p.name,
            position: p.position,
            club: p.club,
            shirt_number: p.shirt_number,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        total++
      }
    } catch {
      console.error(`Failed to fetch squad for ${team.fifa_code}`)
      errors++
    }
  }

  return NextResponse.json({ success: true, playersUpserted: total, errors })
}
