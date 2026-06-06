import { STATIC_TEAMS } from '@/lib/teams-data'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import TeamProfileClient from '@/components/TeamProfileClient'

export default async function TeamPage({ params }: { params: { code: string } }) {
  const team = STATIC_TEAMS.find(t => t.fifaCode === params.code.toUpperCase())
  if (!team) notFound()

  let players: any[] = []
  try {
    const supabase = await createClient()
    const { data: teamRow } = await supabase.from('teams').select('id').eq('fifa_code', team.fifaCode).single()
    if (teamRow?.id) {
      const { data } = await supabase.from('players').select('*').eq('team_id', teamRow.id).eq('is_active', true).order('shirt_number')
      players = data ?? []
    }
  } catch { /* DB not configured yet */ }

  return <TeamProfileClient team={team} players={players} />
}
