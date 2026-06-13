import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET → { matches, teams }  (static data, no user-specific info)
export async function GET() {
  const supabase = svc()
  const [matchRes, teamRes] = await Promise.all([
    supabase
      .from('matches')
      .select('id, stage, group_letter, bracket_slot, ko_stage, kickoff_at, actual_home_score, actual_away_score, home_team_id, away_team_id')
      .order('kickoff_at'),
    supabase
      .from('teams')
      .select('id, name, fifa_code, group_letter, flag_emoji'),
  ])
  return NextResponse.json({
    matches: matchRes.data ?? [],
    teams: teamRes.data ?? [],
  })
}
