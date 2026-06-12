import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { day, leagueId } → { preds, champs, teams }
export async function POST(request: NextRequest) {
  const { day, leagueId } = await request.json()
  if (!day) return NextResponse.json({ error: 'missing day' }, { status: 400 })

  const supabase = svc()
  const start = new Date(day + 'T06:00:00Z')
  const end   = new Date(start.getTime() + 24 * 3600_000)

  // Matches for the day (just IDs)
  const { data: matchRows } = await supabase
    .from('matches').select('id')
    .gte('kickoff_at', start.toISOString()).lt('kickoff_at', end.toISOString())
    .eq('stage', 'group')

  const matchIds = (matchRows ?? []).map((m: any) => m.id)

  // League member filter
  let memberIds: string[] | null = null
  if (leagueId && leagueId !== 'global') {
    const { data: mem } = await supabase.from('league_members').select('user_id').eq('league_id', leagueId)
    memberIds = (mem ?? []).map((m: any) => m.user_id)
  }

  // Group predictions — paginate to avoid row limits
  const preds: any[] = []
  if (matchIds.length > 0) {
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('predictions_group')
        .select('user_id,match_id,pred_home_score,pred_away_score')
        .in('match_id', matchIds)
        .range(offset, offset + 999)
      if (!data?.length) break
      preds.push(...data)
      if (data.length < 1000) break
      offset += 1000
    }
  }

  // Champion predictions (bracket_slot=32) — paginate
  const champs: any[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('predictions_knockout')
      .select('user_id,pred_home_team_id,pred_away_team_id,pred_home_score,pred_away_score')
      .eq('bracket_slot', 32)
      .range(offset, offset + 999)
    if (!data?.length) break
    champs.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }

  const { data: teams } = await supabase.from('teams').select('id,name,fifa_code')

  const filteredPreds = memberIds ? preds.filter(p => memberIds!.includes(p.user_id)) : preds
  const filteredChamps = memberIds ? champs.filter(c => memberIds!.includes(c.user_id)) : champs

  return NextResponse.json({ preds: filteredPreds, champs: filteredChamps, teams: teams ?? [] })
}
