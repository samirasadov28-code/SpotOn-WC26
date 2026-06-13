import { createClient } from '@supabase/supabase-js'
import { transliterateName } from '@/lib/transliterate'
import PredictionsViewClient from './PredictionsViewClient'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export default async function UserPredictionsPage({ params }: { params: { userId: string } }) {
  const { userId } = params
  const supabase = svc()

  const [matchRes, teamRes, gpRes, kpRes, userRes] = await Promise.all([
    supabase
      .from('matches')
      .select('id, stage, ko_stage, group_letter, bracket_slot, kickoff_at, actual_home_score, actual_away_score, home_team_id, away_team_id')
      .order('kickoff_at'),
    supabase.from('teams').select('id, name, fifa_code, group_letter, flag_emoji'),
    supabase.from('predictions_group')
      .select('match_id, pred_home_score, pred_away_score')
      .eq('user_id', userId),
    supabase.from('predictions_knockout')
      .select('bracket_slot, pred_home_score, pred_away_score')
      .eq('user_id', userId),
    supabase.from('users').select('display_name').eq('id', userId).single(),
  ])

  const teams = (teamRes.data ?? []) as any[]
  const tById = new Map(teams.map((t: any) => [t.id, t]))
  const matches = (matchRes.data ?? []).map((m: any) => ({
    ...m,
    home_team: m.home_team_id ? (tById.get(m.home_team_id) ?? null) : null,
    away_team: m.away_team_id ? (tById.get(m.away_team_id) ?? null) : null,
  }))

  const displayName = transliterateName((userRes.data as any)?.display_name ?? '')

  return (
    <PredictionsViewClient
      userId={userId}
      initialDisplayName={displayName}
      initialMatches={matches}
      initialTeams={teams}
      initialGroupPreds={(gpRes.data ?? []) as any[]}
      initialKoPreds={(kpRes.data ?? []) as any[]}
    />
  )
}
