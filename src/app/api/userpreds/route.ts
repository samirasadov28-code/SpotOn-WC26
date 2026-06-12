import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { transliterateName } from '@/lib/transliterate'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { userId } → { displayName, matches, teams, groupPreds, koPreds }
export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  const supabase = svc()
  const [userRes, matchRes, teamsRes, gpRes, kpRes] = await Promise.all([
    supabase.from('users').select('display_name').eq('id', userId).single(),
    supabase.from('matches')
      .select('id, stage, group_letter, bracket_slot, ko_stage, kickoff_at, actual_home_score, actual_away_score, home_team_id, away_team_id')
      .order('kickoff_at'),
    supabase.from('teams').select('id, name, fifa_code, group_letter, flag_emoji'),
    supabase.from('predictions_group')
      .select('match_id, pred_home_score, pred_away_score')
      .eq('user_id', userId),
    supabase.from('predictions_knockout')
      .select('bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score')
      .eq('user_id', userId),
  ])

  return NextResponse.json({
    displayName: transliterateName((userRes.data as any)?.display_name ?? 'Unknown player'),
    matches: matchRes.data ?? [],
    teams: teamsRes.data ?? [],
    groupPreds: gpRes.data ?? [],
    koPreds: kpRes.data ?? [],
  })
}
