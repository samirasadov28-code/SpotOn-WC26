import { createClient } from '@supabase/supabase-js'
import { transliterateName } from '@/lib/transliterate'
import PredictionsViewClient from './PredictionsViewClient'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function UserPredictionsPage({ params }: { params: { userId: string } }) {
  const { userId } = params
  const supabase = svc()

  const [userRes, matchRes, gpRes, kpRes, teamsRes] = await Promise.all([
    supabase.from('users').select('display_name').eq('id', userId).single(),
    supabase.from('matches')
      .select('id, stage, group_letter, bracket_slot, ko_stage, kickoff_at, actual_home_score, actual_away_score, home_team:teams!matches_home_team_id_fkey(id,name,fifa_code,group_letter,flag_emoji), away_team:teams!matches_away_team_id_fkey(id,name,fifa_code,group_letter,flag_emoji)')
      .order('kickoff_at'),
    supabase.from('predictions_group')
      .select('match_id, pred_home_score, pred_away_score')
      .eq('user_id', userId),
    supabase.from('predictions_knockout')
      .select('bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score')
      .eq('user_id', userId),
    supabase.from('teams').select('id, name, fifa_code, group_letter, flag_emoji'),
  ])

  const displayName = transliterateName((userRes.data as any)?.display_name ?? 'Unknown player')

  return (
    <PredictionsViewClient
      userId={userId}
      displayName={displayName}
      matches={(matchRes.data ?? []) as any[]}
      groupPreds={(gpRes.data ?? []) as any[]}
      koPreds={(kpRes.data ?? []) as any[]}
      teams={(teamsRes.data ?? []) as any[]}
    />
  )
}
