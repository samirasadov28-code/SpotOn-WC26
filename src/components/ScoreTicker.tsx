'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TickerMatch {
  id: string
  kickoff_at: string | null
  actual_home_score: number | null
  actual_away_score: number | null
  home_team: { name: string; flag_emoji: string | null } | null
  away_team: { name: string; flag_emoji: string | null } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ScoreTicker() {
  const [matches, setMatches] = useState<TickerMatch[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchMatches() {
    const supabase = createClient()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const dayAfter = new Date(tomorrow)
    dayAfter.setDate(dayAfter.getDate() + 1)

    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,flag_emoji), away_team:teams!matches_away_team_id_fkey(name,flag_emoji)')
      .gte('kickoff_at', tomorrow.toISOString())
      .lt('kickoff_at', dayAfter.toISOString())
      .order('kickoff_at')

    if (data) setMatches(data as unknown as TickerMatch[])
    setLoading(false)
  }

  useEffect(() => {
    fetchMatches()

    const supabase = createClient()
    const channel = supabase
      .channel('score-ticker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchMatches()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return null

  const scored = matches.filter(
    m => m.actual_home_score !== null && m.actual_away_score !== null
  )
  const upcoming = matches.filter(
    m => m.actual_home_score === null && m.kickoff_at && new Date(m.kickoff_at) > new Date()
  )

  const items: string[] = matches.map(m => {
    const hFlag = m.home_team?.flag_emoji ?? ''
    const aFlag = m.away_team?.flag_emoji ?? ''
    const hName = m.home_team?.name ?? '?'
    const aName = m.away_team?.name ?? '?'
    const when = m.kickoff_at ? formatDate(m.kickoff_at) : ''
    if (m.actual_home_score !== null && m.actual_away_score !== null) {
      return `${hFlag} ${hName} ${m.actual_home_score}–${m.actual_away_score} ${aName} ${aFlag}`
    }
    return `🔜 ${hFlag} ${hName} vs ${aName} ${aFlag} · ${when}`
  })

  if (items.length === 0) return null

  const tickerText = items.join('  ·  ')

  return (
    <>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .ticker-track {
          display: inline-block;
          white-space: nowrap;
          animation: ticker 90s linear infinite;
        }
        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
      <div
        className="ticker-wrap bg-[#0B1F3A] text-white h-8 overflow-hidden flex items-center w-full"
        aria-label="Live score ticker"
      >
        <span className="ticker-track text-sm font-medium tracking-wide px-4">
          {tickerText}
        </span>
      </div>
    </>
  )
}
