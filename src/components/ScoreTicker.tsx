'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { getTeamName } from '@/lib/team-name'
import { flagUrl } from '@/lib/flag-map'

interface TickerMatch {
  id: string
  kickoff_at: string | null
  actual_home_score: number | null
  actual_away_score: number | null
  home_team: { name: string; fifa_code: string | null } | null
  away_team: { name: string; fifa_code: string | null } | null
}

function toCDTDate(isoStr: string): string {
  return new Date(new Date(isoStr).getTime() - 6 * 3600_000).toISOString().slice(0, 10)
}

function formatKickoff(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC'
}

function TickerItem({ m, lang }: { m: TickerMatch; lang: string }) {
  const hCode = m.home_team?.fifa_code ?? null
  const aCode = m.away_team?.fifa_code ?? null
  const hName = m.home_team ? (getTeamName(hCode, lang) ?? m.home_team.name) : '?'
  const aName = m.away_team ? (getTeamName(aCode, lang) ?? m.away_team.name) : '?'

  return (
    <span className="inline-flex items-center gap-1.5 mx-4">
      {hCode && <img src={flagUrl(hCode, 40)} alt={hCode} className="h-3.5 w-auto rounded-sm inline-block" />}
      <span>{hName}</span>
      {m.actual_home_score !== null && m.actual_away_score !== null ? (
        <span className="font-bold mx-0.5">{m.actual_home_score}–{m.actual_away_score}</span>
      ) : (
        <span className="text-white/50 mx-0.5">
          {m.kickoff_at ? formatKickoff(m.kickoff_at) : 'vs'}
        </span>
      )}
      <span>{aName}</span>
      {aCode && <img src={flagUrl(aCode, 40)} alt={aCode} className="h-3.5 w-auto rounded-sm inline-block" />}
    </span>
  )
}

export default function ScoreTicker() {
  const { lang } = useTranslation()
  const [matches, setMatches] = useState<TickerMatch[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchMatches() {
    const supabase = createClient()
    const nowCDT = toCDTDate(new Date().toISOString())
    const cdtDayStart = new Date(nowCDT + 'T06:00:00Z')
    const cdtDayEnd   = new Date(cdtDayStart.getTime() + 24 * 3600_000)

    const { data: todayData } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,fifa_code), away_team:teams!matches_away_team_id_fkey(name,fifa_code)')
      .gte('kickoff_at', cdtDayStart.toISOString())
      .lt('kickoff_at', cdtDayEnd.toISOString())
      .order('kickoff_at')

    if (todayData && todayData.length > 0) {
      setMatches(todayData as unknown as TickerMatch[])
      setLoading(false)
      return
    }

    const { data: nextData } = await supabase
      .from('matches')
      .select('kickoff_at')
      .gt('kickoff_at', new Date().toISOString())
      .order('kickoff_at')
      .limit(1)

    if (!nextData || nextData.length === 0) { setLoading(false); return }

    const nextCDTDay = toCDTDate((nextData[0] as any).kickoff_at!)
    const nextStart = new Date(nextCDTDay + 'T06:00:00Z')
    const nextEnd   = new Date(nextStart.getTime() + 24 * 3600_000)

    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,fifa_code), away_team:teams!matches_away_team_id_fkey(name,fifa_code)')
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

  const separator = <span className="text-white/30 mx-2">·</span>

  return (
    <>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .ticker-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          animation: ticker 25s linear infinite;
        }
        @media (min-width: 768px) {
          .ticker-track { animation-duration: 45s; }
        }
        .ticker-wrap:hover .ticker-track,
        .ticker-wrap:active .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
      <div
        className="ticker-wrap bg-[#0B1F3A] text-white h-8 overflow-hidden flex items-center w-full select-none"
        aria-label="Live score ticker"
      >
        <span className="ticker-track text-sm font-medium tracking-wide">
          {matches.map((m, i) => (
            <span key={m.id} className="inline-flex items-center">
              {i > 0 && separator}
              <TickerItem m={m} lang={lang} />
            </span>
          ))}
        </span>
      </div>
    </>
  )
}
