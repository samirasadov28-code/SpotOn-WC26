'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { getTeamName } from '@/lib/team-name'

interface TickerMatch {
  id: string
  kickoff_at: string | null
  actual_home_score: number | null
  actual_away_score: number | null
  home_team: { name: string; flag_emoji: string | null; fifa_code: string | null } | null
  away_team: { name: string; flag_emoji: string | null; fifa_code: string | null } | null
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ScoreTicker() {
  const { lang } = useTranslation()
  const [matches, setMatches] = useState<TickerMatch[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchMatches() {
    const supabase = createClient()

    // First try: today's matches with scores (live/recent results)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const { data: todayData } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(name,flag_emoji,fifa_code)')
      .gte('kickoff_at', todayStart.toISOString())
      .lte('kickoff_at', todayEnd.toISOString())
      .order('kickoff_at')

    if (todayData && todayData.length > 0) {
      setMatches(todayData as unknown as TickerMatch[])
      setLoading(false)
      return
    }

    // Fallback: next upcoming match day
    const { data: nextData } = await supabase
      .from('matches')
      .select('kickoff_at')
      .gt('kickoff_at', new Date().toISOString())
      .order('kickoff_at')
      .limit(1)

    if (!nextData || nextData.length === 0) { setLoading(false); return }

    const nextDay = new Date(nextData[0].kickoff_at)
    nextDay.setHours(0, 0, 0, 0)
    const nextDayEnd = new Date(nextDay)
    nextDayEnd.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(name,flag_emoji,fifa_code)')
      .gte('kickoff_at', nextDay.toISOString())
      .lte('kickoff_at', nextDayEnd.toISOString())
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

  const items: string[] = matches.map(m => {
    const hFlag = m.home_team?.flag_emoji ?? ''
    const aFlag = m.away_team?.flag_emoji ?? ''
    const hName = m.home_team ? (getTeamName(m.home_team.fifa_code, lang) ?? m.home_team.name) : '?'
    const aName = m.away_team ? (getTeamName(m.away_team.fifa_code, lang) ?? m.away_team.name) : '?'
    const when = m.kickoff_at ? formatDate(m.kickoff_at) : ''
    if (m.actual_home_score !== null && m.actual_away_score !== null) {
      return `${hFlag} ${hName} ${m.actual_home_score}–${m.actual_away_score} ${aName} ${aFlag}`
    }
    return `🔜 ${hFlag} ${hName} vs ${aName} ${aFlag} · ${when}`
  })

  if (items.length === 0) return null

  // Lock time: Jun 11 09:00 ET = 13:00 UTC, displayed in user's local timezone
  const lockDate = new Date('2026-06-11T13:00:00Z')
  const lockTime = lockDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
  const lockReminder = `🔒 Predictions lock · Jun 11 · ${lockTime}`
  const tickerText = [lockReminder, ...items].join('  ·  ')

  return (
    <>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .ticker-track {
          display: inline-block;
          white-space: nowrap;
          animation: ticker 70s linear infinite;
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
