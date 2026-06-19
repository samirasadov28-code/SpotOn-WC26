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

const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-GB', uk: 'uk', az: 'az', fr: 'fr-FR', es: 'es-ES', de: 'de-DE',
  pt: 'pt-BR', it: 'it-IT', nl: 'nl-NL', tr: 'tr-TR', zh: 'zh-CN',
  ar: 'ar-SA', hi: 'hi-IN', ru: 'ru-RU', bn: 'bn-BD', ja: 'ja-JP', id: 'id-ID',
}

function toCDTDate(isoStr: string): string {
  return new Date(new Date(isoStr).getTime() - 6 * 3600_000).toISOString().slice(0, 10)
}

function formatKickoff(iso: string, locale: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

function TickerItem({ m, lang, locale }: { m: TickerMatch; lang: string; locale: string }) {
  const hCode = m.home_team?.fifa_code ?? null
  const aCode = m.away_team?.fifa_code ?? null
  const hName = m.home_team ? (getTeamName(hCode, lang) ?? m.home_team.name) : '?'
  const aName = m.away_team ? (getTeamName(aCode, lang) ?? m.away_team.name) : '?'

  const scoreOrTime = m.actual_home_score !== null && m.actual_away_score !== null
    ? <span className="font-bold text-green-300">{m.actual_home_score}–{m.actual_away_score}</span>
    : <span className="text-white/50">{m.kickoff_at ? formatKickoff(m.kickoff_at, locale) : '—'}</span>

  return (
    <span className="inline-flex items-center gap-1.5 px-1">
      {hCode && <span className="inline-block w-5 h-3.5 overflow-hidden rounded-sm flex-shrink-0"><img src={flagUrl(hCode, 40)} alt={hCode} className="w-full h-full object-cover" /></span>}
      <span className="font-medium">{hName}</span>
      <span className="text-white/30 text-[10px]">vs</span>
      {aCode && <span className="inline-block w-5 h-3.5 overflow-hidden rounded-sm flex-shrink-0"><img src={flagUrl(aCode, 40)} alt={aCode} className="w-full h-full object-cover" /></span>}
      <span className="font-medium">{aName}</span>
      <span className="text-white/40 mx-1 text-[10px]">·</span>
      {scoreOrTime}
    </span>
  )
}

export default function ScoreTicker() {
  const { lang } = useTranslation()
  const locale = LANG_TO_LOCALE[lang] ?? 'en-GB'
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

  const separator = <span className="text-white/40 mx-6 text-base select-none font-thin">|</span>

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
          animation: ticker 35s linear infinite;
        }
        @media (min-width: 768px) {
          .ticker-track { animation-duration: 55s; }
        }
        .ticker-wrap:hover .ticker-track,
        .ticker-wrap:active .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
      <div
        className="ticker-wrap sticky top-16 z-40 bg-[#0B1F3A] text-white h-8 overflow-hidden flex items-center w-full select-none"
        aria-label="Live score ticker"
      >
        <span className="ticker-track text-sm font-medium tracking-wide">
          {matches.map((m, i) => (
            <span key={m.id} className="inline-flex items-center">
              {i > 0 && separator}
              <TickerItem m={m} lang={lang} locale={locale} />
            </span>
          ))}
        </span>
      </div>
    </>
  )
}
