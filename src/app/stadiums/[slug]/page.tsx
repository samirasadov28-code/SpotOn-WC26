import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { STATIC_STADIUMS } from '@/lib/stadiums-data'
import StadiumDetailClient from '@/components/StadiumDetailClient'

export default async function StadiumPage({ params }: { params: { slug: string } }) {
  const stadium = STATIC_STADIUMS.find(s => s.slug === params.slug)
  if (!stadium) notFound()

  const supabase = await createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_team, away_team, kickoff_at, stage, group_letter, bracket_slot, venue')
    .ilike('venue', `${stadium.venuePrefix}%`)
    .order('kickoff_at', { ascending: true })

  return <StadiumDetailClient stadium={stadium} matches={matches ?? []} />
}
