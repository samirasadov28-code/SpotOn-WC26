import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Access denied. Admin only.
      </div>
    )
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('*, home_team:teams!matches_home_team_id_fkey(name, flag_emoji, fifa_code), away_team:teams!matches_away_team_id_fkey(name, flag_emoji, fifa_code)')
    .order('kickoff_at')

  return <AdminClient matches={matches ?? []} />
}
