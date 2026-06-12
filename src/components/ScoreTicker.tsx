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

// CDT = UTC-6. All "match days" are grouped by Central Daylight Time.
function toCDTDate(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() - 6 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

function formatKickoff(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC'
}

export default function ScoreTicker() {
  const { lang } = useTranslation()
  const [matches, setMatches] = useState<TickerMatch[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchMatches() {
    const supabase = createClient()

    // Current CDT "today"
    const nowCDT = toCDTDate(new Date().toISOString())

    // Try today's CDT match day first (may span two UTC days)
    const cdtDayStart = new Date(nowCDT + 'T06:00:00Z') // CDT midnight = UTC 06:00
    const cdtDayEnd   = new Date(new Date(cdtDayStart).getTime() + 24 * 60 * 60 * 1000)

    const { data: todayData } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(name,flag_emoji,fifa_code)')
      .gte('kickoff_at', cdtDayStart.toISOString())
      .lt('kickoff_at', cdtDayEnd.toISOString())
      .order('kickoff_at')

    if (todayData && todayData.length > 0) {
      setMatches(todayData as unknown as TickerMatch[])
      setLoading(false)
      return
    }

    // Fallback: find next upcoming match and show all games on that CDT day
    const { data: nextData } = await supabase
      .from('matches')
      .select('kickoff_at')
      .gt('kickoff_at', new Date().toISOString())
      .order('kickoff_at')
      .limit(1)

    if (!nextData || nextData.length === 0) { setLoading(false); return }

    const nextCDTDay = toCDTDate(nextData[0].kickoff_at!)
    const nextStart = new Date(nextCDTDay + 'T06:00:00Z')
    const nextEnd   = new Date(nextStart.getTime() + 24 * 60 * 60 * 1000)

    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(name,flag_emoji,fifa_code)')
      .gte('kickoff_at', nextStart.toISOString())
      .lt('kickoff_at', nextEnd.toISOString())
      .order('kickoff_at')

    if (data) setMatches(data as unknown as TickerMatch[])
    setLoading(false)
  }

  useEffect(() => {
    fetchMatches()
    const supabase = createClient()
    const channel = supabase
      .channel('score-ticker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchMatches)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || matches.length === 0) return null

  const items = matches.map(m => {
    const hFlag = m.home_team?.flag_emoji ?? ''
    const aFlag = m.away_team?.flag_emoji ?? ''
    const hName = m.home_team ? (getTeamName(m.home_team.fifa_code, lang) ?? m.home_team.name) : '?'
    const aName = m.away_team ? (getTeamName(m.away_team.fifa_code, lang) ?? m.away_team.name) : '?'
    if (m.actual_home_score !== null && m.actual_away_score !== null) {
      return `${hFlag} ${hName} ${m.actual_home_score}–${m.actual_away_score} ${aName} ${aFlag}`
    }
    const when = m.kickoff_at ? formatKickoff(m.kickoff_at) : ''
    return `🔜 ${hFlag} ${hName} vs ${aName} ${aFlag} · ${when}`
  })

  const tickerText = items.join('     ·     ')

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
          animation: ticker 25s linear infinite;
        }
        @media (min-width: 768px) {
          .ticker-track { animation-duration: 45s; }
        }
        .ticker-wrap:hover .ticker-track {
          animation-play-state: paused;
        }
        .ticker-wrap:active .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
      <div
        className="ticker-wrap bg-[#0B1F3A] text-white h-8 overflow-hidden flex items-center w-full select-none"
        aria-label="Live score ticker"
      >
        <span className="ticker-track text-sm font-medium tracking-wide px-4">
          {tickerText}
        </span>
      </div>
    </>
  )
}
