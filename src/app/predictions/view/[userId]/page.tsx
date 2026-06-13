import { createClient } from '@supabase/supabase-js'
import { transliterateName } from '@/lib/transliterate'
import PredictionsViewClient from './PredictionsViewClient'

export const dynamic = 'force-dynamic'

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

function koStageFromSlot(slot: number | null): string | null {
  if (!slot) return null
  if (slot <= 16) return 'r32'
  if (slot <= 24) return 'r16'
  if (slot <= 28) return 'qf'
  if (slot <= 30) return 'sf'
  if (slot === 31) return 'third'
  if (slot === 32) return 'final'
  return null
}

export default async function UserPredictionsPage({ params }: { params: { userId: string } }) {
  const { userId } = params
  const supabase = svc()

  const [matchRes, teamRes, gpRes, kpRes, userRes] = await Promise.all([
    supabase
      .from('matches')
      .select('id, stage, group_letter, bracket_slot, kickoff_at, actual_home_score, actual_away_score, home_team_id, away_team_id')
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

  if (matchRes.error) console.error('[predictions/view] matchRes error:', matchRes.error)
  if (teamRes.error) console.error('[predictions/view] teamRes error:', teamRes.error)
  if (gpRes.error) console.error('[predictions/view] gpRes error:', gpRes.error)
  if (kpRes.error) console.error('[predictions/view] kpRes error:', kpRes.error)

  const teams = (teamRes.data ?? []) as any[]
  const tById = new Map(teams.map((t: any) => [t.id, t]))
  const matches = (matchRes.data ?? []).map((m: any) => ({
    ...m,
    ko_stage: m.stage !== 'group' ? koStageFromSlot(m.bracket_slot) : null,
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
