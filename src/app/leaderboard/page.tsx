'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { transliterateName } from '@/lib/transliterate'
import { flagUrl } from '@/lib/flag-map'
import { getTeamName } from '@/lib/team-name'

const PREDICTIONS_TOTAL = 104

const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-GB', uk: 'uk', az: 'az', fr: 'fr-FR', es: 'es-ES', de: 'de-DE',
  pt: 'pt-BR', it: 'it-IT', nl: 'nl-NL', tr: 'tr-TR', zh: 'zh-CN',
  ar: 'ar-SA', hi: 'hi-IN', ru: 'ru-RU', bn: 'bn-BD', ja: 'ja-JP', id: 'id-ID',
}

interface UserLeague { id: string; name: string; join_code: string }

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  groupPts: number
  advancementPts: number
  knockoutPts: number
  totalPts: number
  predictionCount: number
  updatedAt: Date | null
}

interface H2HStats {
  bothRight: number; rivalOnly: number; youOnly: number; neither: number; rivalPtsLead: number
}

interface ScoreBreakdown {
  groupExact: number; groupGD: number; groupOutcome: number; groupTotal: number
  advTotal: number; koExact: number; koGD: number; koOutcome: number; koTotal: number
  h2h?: H2HStats
}

type TeamRef = { name: string; fifa_code: string } | null
type PositionRow = [TeamRef, TeamRef, TeamRef, TeamRef]

function toCDTDate(iso: string) {
  return new Date(new Date(iso).getTime() - 6 * 3600_000).toISOString().slice(0, 10)
}

function predPts(ph: number, pa: number, ah: number, aa: number) {
  if (ph === ah && pa === aa) return 3
  if ((ph - pa) === (ah - aa)) return 2
  if (Math.sign(ph - pa) === Math.sign(ah - aa)) return 1
  return 0
}

function getMatchPts(ph: number, pa: number, ah: number, aa: number) {
  if (ph === ah && pa === aa) return 3
  if (ph - pa === ah - aa) return 2
  if (Math.sign(ph - pa) === Math.sign(ah - aa)) return 1
  return 0
}

interface DayMatch {
  id: string; kickoff_at: string | null
  actual_home_score: number | null; actual_away_score: number | null
  home_team: { name: string; flag_emoji: string | null; fifa_code: string } | null
  away_team: { name: string; flag_emoji: string | null; fifa_code: string } | null
}

function PredCell({ ph, pa, ah, aa }: { ph: number|null; pa: number|null; ah: number|null; aa: number|null }) {
  if (ph === null || pa === null) return <span className="text-gray-300">—</span>
  if (ah === null || aa === null)
    return <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ph}–{pa}</span>
  const pts = predPts(ph, pa, ah, aa)
  const cls = pts===3 ? 'bg-green-100 text-green-800' : pts===2 ? 'bg-blue-100 text-blue-800' : pts===1 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-600'
  return <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-semibold ${cls}`}>{ph}–{pa} <span className="opacity-60">({pts})</span></span>
}

function MiniFlag({ team, lang }: { team: TeamRef; lang: string }) {
  if (!team) return <span className="text-gray-300 text-[10px]">?</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="inline-block w-4 h-3 overflow-hidden rounded-sm flex-shrink-0">
        <img src={flagUrl(team.fifa_code, 40)} alt="" className="w-full h-full object-cover" />
      </span>
      <span className="text-[10px] font-medium text-gray-700">{getTeamName(team.fifa_code, lang) ?? team.fifa_code}</span>
    </span>
  )
}

function PredictedFinishCell({ positions, lang, mode = 'champ' }: { positions: PositionRow | undefined; lang: string; mode?: 'champ' | 'top4' }) {
  if (!positions) return <span className="text-gray-300 text-[10px]">—</span>
  const medals = ['🥇', '🥈', '🥉', '4️⃣']
  const champ = positions[0]
  if (!champ) return <span className="text-gray-300 text-[10px]">—</span>
  if (mode === 'champ') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] w-4 shrink-0">🥇</span>
        <MiniFlag team={champ} lang={lang} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-0.5 min-w-[90px]">
      {positions.map((team, i) => team ? (
        <div key={i} className="flex items-center gap-1">
          <span className="text-[10px] w-4 shrink-0">{medals[i]}</span>
          <MiniFlag team={team} lang={lang} />
        </div>
      ) : null)}
    </div>
  )
}

function FinishToggle({ mode, onChange }: { mode: 'champ' | 'top4'; onChange: (m: 'champ' | 'top4') => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-yellow-400/40 text-[10px] font-semibold shrink-0">
      <button onClick={() => onChange('champ')}
        className={`px-2 py-1 transition-colors ${mode === 'champ' ? 'bg-yellow-400 text-[#0B1F3A]' : 'text-yellow-300 hover:bg-white/10'}`}>
        🥇
      </button>
      <button onClick={() => onChange('top4')}
        className={`px-2 py-1 transition-colors ${mode === 'top4' ? 'bg-yellow-400 text-[#0B1F3A]' : 'text-yellow-300 hover:bg-white/10'}`}>
        Top4
      </button>
    </div>
  )
}

// ── DayView ──────────────────────────────────────────────────────────────────

function DayView({ entries, currentUserId, leagueId, leagueName, positionsByUser, finishMode, setFinishMode }: {
  entries: LeaderboardEntry[]
  currentUserId: string | null
  leagueId: string
  leagueName: string
  positionsByUser: Record<string, PositionRow>
  finishMode: 'champ' | 'top4'
  setFinishMode: (m: 'champ' | 'top4') => void
}) {
  const supabase = createClient()
  const { lang, t } = useTranslation()
  const [allDays, setAllDays] = useState<string[]>([])
  const [koDateToStage, setKoDateToStage] = useState<Map<string, string>>(new Map())
  const [selectedDay, setSelectedDay] = useState('')
  const [dayMatches, setDayMatches] = useState<DayMatch[]>([])
  const [predsMap, setPredsMap] = useState<Map<string, Map<string, { h: number; a: number }>>>(new Map())
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState<'total' | 'day'>('total')
  const [recap, setRecap] = useState<string | null>(null)
  const [recapLoading, setRecapLoading] = useState(false)
  const [showRecap, setShowRecap] = useState(false)
  const dayScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setRecap(null) }, [lang])

  // Centre the selected day button in the scroll container
  useEffect(() => {
    if (!selectedDay || !dayScrollRef.current) return
    const container = dayScrollRef.current
    const btn = container.querySelector<HTMLElement>(`[data-day="${selectedDay}"]`)
    if (!btn) return
    const offset = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2
    container.scrollTo({ left: offset, behavior: 'smooth' })
  }, [selectedDay, allDays])

  useEffect(() => {
    Promise.all([
      supabase.from('matches').select('kickoff_at').eq('stage', 'group').order('kickoff_at'),
      supabase.from('matches').select('kickoff_at, bracket_slot').eq('stage', 'knockout').not('kickoff_at', 'is', null),
    ]).then(([groupRes, koRes]) => {
      const days = [...new Set((groupRes.data ?? []).map((m: any) => toCDTDate(m.kickoff_at)))]
      setAllDays(days)

      const koMap = new Map<string, string>()
      for (const m of (koRes.data ?? []) as any[]) {
        const day = toCDTDate(m.kickoff_at)
        const slot = m.bracket_slot as number
        const stage = slot <= 16 ? 'r32' : slot <= 24 ? 'r16' : slot <= 28 ? 'qf' : slot <= 30 ? 'sf' : slot === 32 ? 'final' : 'third'
        if (!koMap.has(day)) koMap.set(day, stage)
      }
      setKoDateToStage(koMap)

      const allKnown = new Set([...days, ...[...koMap.keys()]])
      const todayCDT = toCDTDate(new Date().toISOString())
      const pastDays = days.filter((d: string) => d <= todayCDT)
      const futureDays = days.filter((d: string) => d > todayCDT)
      const defaultDay = pastDays[pastDays.length - 1] ?? futureDays[0] ?? days[0] ?? ''
      const saved = typeof window !== 'undefined' ? localStorage.getItem('spoton_dayview_day') : null
      const restoredDay = saved && allKnown.has(saved) ? saved : defaultDay
      setSelectedDay(restoredDay)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedDay) return
    setLoading(true)
    setRecap(null)
    if (typeof window !== 'undefined') localStorage.setItem('spoton_dayview_day', selectedDay)

    const start = new Date(selectedDay + 'T06:00:00Z')
    const end   = new Date(start.getTime() + 24 * 3600_000)

    const isKoDay = koDateToStage.has(selectedDay)
    if (isKoDay) {
      supabase.from('matches')
        .select('id, kickoff_at, actual_home_score, actual_away_score, home_team:teams!matches_home_team_id_fkey(name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(name,flag_emoji,fifa_code)')
        .gte('kickoff_at', start.toISOString()).lt('kickoff_at', end.toISOString())
        .eq('stage', 'knockout').order('kickoff_at')
        .then(({ data }) => {
          setDayMatches((data ?? []) as DayMatch[])
          setPredsMap(new Map())
          setLoading(false)
        })
      return
    }

    Promise.all([
      supabase.from('matches')
        .select('id, kickoff_at, actual_home_score, actual_away_score, home_team:teams!matches_home_team_id_fkey(name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(name,flag_emoji,fifa_code)')
        .gte('kickoff_at', start.toISOString()).lt('kickoff_at', end.toISOString())
        .eq('stage', 'group').order('kickoff_at'),
      fetch('/api/dayview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: selectedDay, leagueId }),
      }).then(r => r.json()),
    ]).then(([matchRes, apiData]) => {
      const matches = ((matchRes as any).data ?? []) as DayMatch[]
      if (!matches.length) { setDayMatches([]); setPredsMap(new Map()); setLoading(false); return }

      const map = new Map<string, Map<string, { h: number; a: number }>>()
      for (const p of (apiData.preds ?? [])) {
        if (!map.has(p.user_id)) map.set(p.user_id, new Map())
        map.get(p.user_id)!.set(p.match_id, { h: p.pred_home_score, a: p.pred_away_score })
      }
      setDayMatches(matches)
      setPredsMap(map)
      setLoading(false)

      const hasResults = matches.some((m: DayMatch) => m.actual_home_score !== null)
      const seenKey = `spoton_recap_seen_${leagueId}_${selectedDay}`
      if (hasResults && !localStorage.getItem(seenKey)) {
        setShowRecap(true)
        fetchRecapInner(selectedDay, leagueId, leagueName, entries, seenKey)
          .then(text => { setRecap(text); setRecapLoading(false) })
      }
    })
  }, [selectedDay, leagueId, koDateToStage]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRecapInner = async (day: string, lgId: string, lgName: string, ents: LeaderboardEntry[], seenKey: string): Promise<string> => {
    setRecapLoading(true)
    try {
      const res = await fetch('/api/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, leagueId: lgId === 'global' ? null : lgId, leagueName: lgName, playerNames: ents.map(e => e.displayName), lang }),
      })
      const data = await res.json()
      const text = data.recap ?? ''
      if (text && !text.includes('requires GROQ_API_KEY')) localStorage.setItem(seenKey, '1')
      return text || 'Could not generate recap.'
    } catch { return 'Failed to load recap — check your connection.' }
  }

  const loadRecap = async () => {
    setShowRecap(true)
    if (recap || recapLoading) return
    const seenKey = `spoton_recap_seen_${leagueId}_${selectedDay}`
    const text = await fetchRecapInner(selectedDay, leagueId, leagueName, entries, seenKey)
    setRecap(text)
    setRecapLoading(false)
  }

  const locale = LANG_TO_LOCALE[lang] ?? 'en-GB'
  const isKoDay = koDateToStage.has(selectedDay)
  const dayLabel = selectedDay
    ? new Date(selectedDay + 'T12:00:00Z').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
    : ''

  const withDayPts = entries.map(entry => {
    const userPreds = predsMap.get(entry.userId)
    let dayPts = 0
    for (const m of dayMatches) {
      if (m.actual_home_score === null) continue
      const p = userPreds?.get(m.id)
      if (p) dayPts += predPts(p.h, p.a, m.actual_home_score!, m.actual_away_score!)
    }
    return { entry, dayPts }
  }).sort((a, b) =>
    sortMode === 'day'
      ? b.dayPts - a.dayPts || b.entry.totalPts - a.entry.totalPts
      : b.entry.totalPts - a.entry.totalPts || b.dayPts - a.dayPts
  )

  const dayRanked: Array<{ entry: LeaderboardEntry; dayPts: number; dayRank: number; totalRank: number }> = []
  for (let i = 0; i < withDayPts.length; i++) {
    const row = withDayPts[i]
    const dayRank = i === 0 ? 1 : row.dayPts < withDayPts[i - 1].dayPts ? i + 1 : dayRanked[i - 1].dayRank
    const totalRank = i === 0 ? 1 : row.entry.totalPts < withDayPts[i - 1].entry.totalPts ? i + 1 : dayRanked[i - 1].totalRank
    dayRanked.push({ ...row, dayRank, totalRank })
  }

  const rankIcon = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : String(r)

  return (
    <div>
      {/* Day picker — single scrollable row with arrows */}
      {(() => {
        const KO_STAGE_META = [
          { key: 'r32',   label: 'R32',  color: 'text-blue-600 bg-blue-50 border border-blue-200' },
          { key: 'r16',   label: 'R16',  color: 'text-indigo-600 bg-indigo-50 border border-indigo-200' },
          { key: 'qf',    label: 'QF',   color: 'text-purple-600 bg-purple-50 border border-purple-200' },
          { key: 'sf',    label: 'SF',   color: 'text-pink-600 bg-pink-50 border border-pink-200' },
          { key: 'third', label: '3rd',  color: 'text-orange-600 bg-orange-50 border border-orange-200' },
          { key: 'final', label: '🏆',   color: 'text-yellow-700 bg-yellow-50 border border-yellow-300' },
        ]
        const koDaysByStage = new Map<string, string[]>()
        for (const [day, stage] of koDateToStage) {
          if (!koDaysByStage.has(stage)) koDaysByStage.set(stage, [])
          koDaysByStage.get(stage)!.push(day)
        }
        for (const [, days] of koDaysByStage) days.sort()

        return (
          <div className="flex items-center gap-1 mb-4">
            <button onClick={() => { dayScrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' }) }}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors">‹</button>
            <div ref={dayScrollRef} className="flex gap-1.5 overflow-x-auto flex-1 items-center" style={{ scrollbarWidth: 'none' }}>
              {allDays.map(day => (
                <button key={day} data-day={day} onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 shrink-0 ${selectedDay === day ? 'bg-[#0B1F3A] text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {new Date(day + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                </button>
              ))}
              {KO_STAGE_META.map(s => {
                const days = koDaysByStage.get(s.key) ?? []
                if (days.length === 0) return null
                return (
                  <div key={s.key} className="flex items-center gap-1 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${s.color}`}>{s.label}</span>
                    {days.map(day => (
                      <button key={day} data-day={day} onClick={() => setSelectedDay(day)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 shrink-0 ${selectedDay === day ? 'bg-[#0B1F3A] text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {new Date(day + 'T12:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
            <button onClick={() => { dayScrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' }) }}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors">›</button>
          </div>
        )
      })()}

      {loading ? <div className="text-center text-gray-400 py-10 text-sm">{t('loading')}</div> : dayMatches.length === 0 ? (
        <div className="text-center text-gray-400 py-10 text-sm">{t('dv_no_matches')}</div>
      ) : (
        <>
          {/* Toolbar: [date label] [📰 Recap] flex-1 [Total|Day toggle] */}
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-gray-400 shrink-0">{dayLabel} · {dayMatches.length} matches</p>
            <button onClick={loadRecap}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:from-purple-500 hover:to-indigo-500 active:scale-95 transition-all shadow mx-auto">
              📰 {t('dv_recap_btn')}
            </button>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 text-[10px] font-semibold shrink-0">
              <button onClick={() => setSortMode('total')}
                className={`px-2.5 py-1.5 transition-colors ${sortMode === 'total' ? 'bg-[#0B1F3A] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                Total
              </button>
              <button onClick={() => setSortMode('day')}
                className={`px-2.5 py-1.5 transition-colors ${sortMode === 'day' ? 'bg-[#0B1F3A] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                Day
              </button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="min-w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#0B1F3A] text-white">
                  <th className="py-2 px-3 text-left sticky left-0 bg-[#0B1F3A] z-10 min-w-[150px]">{t('leaderboard_player')}</th>
                  {dayMatches.map(m => (
                    <th key={m.id} className="py-2 px-1 text-center font-normal min-w-[72px]">
                      <div className="flex items-center justify-center gap-0.5">
                        {m.home_team?.fifa_code && (
                          <span className="inline-block w-4 h-3 overflow-hidden rounded-sm flex-shrink-0">
                            <img src={flagUrl(m.home_team.fifa_code, 40)} alt="" className="w-full h-full object-cover" />
                          </span>
                        )}
                        <span className="font-semibold text-[9px]">{m.home_team?.fifa_code}</span>
                        <span className="text-white/40 text-[8px]">v</span>
                        <span className="font-semibold text-[9px]">{m.away_team?.fifa_code}</span>
                        {m.away_team?.fifa_code && (
                          <span className="inline-block w-4 h-3 overflow-hidden rounded-sm flex-shrink-0">
                            <img src={flagUrl(m.away_team.fifa_code, 40)} alt="" className="w-full h-full object-cover" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {m.actual_home_score !== null
                          ? <span className="font-bold opacity-100 text-green-300">{m.actual_home_score}–{m.actual_away_score} FT</span>
                          : m.kickoff_at ? new Date(m.kickoff_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : 'TBD'}
                      </div>
                    </th>
                  ))}
                  <th className="py-2 px-2 text-center text-yellow-300 text-[11px] min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>🏆 Predicted</span>
                      <FinishToggle mode={finishMode} onChange={setFinishMode} />
                    </div>
                  </th>
                  <th className="py-2 px-3 text-center font-bold whitespace-nowrap min-w-[52px]">{sortMode === 'day' ? t('pts') : '∑ ' + t('pts')}</th>
                </tr>
              </thead>
              <tbody>
                {dayRanked.map(({ entry, dayPts, dayRank, totalRank }, idx) => {
                  const isMe = entry.userId === currentUserId
                  const userPreds = predsMap.get(entry.userId)
                  const rowBg = isMe ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                  const positions = positionsByUser[entry.userId] as PositionRow | undefined
                  return (
                    <tr key={entry.userId} className={`border-t border-gray-100 ${rowBg}`}>
                      <td className={`py-2 px-3 sticky left-0 z-10 ${rowBg}`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="shrink-0 w-6 text-center font-bold text-sm">{rankIcon(sortMode === 'total' ? totalRank : dayRank)}</span>
                          <Link href={`/predictions/view/${entry.userId}`}
                            className="font-semibold text-[#0B1F3A] hover:underline truncate max-w-[95px]" title={entry.displayName}>
                            {entry.displayName}
                          </Link>
                          {isMe && <span className="text-[10px] text-blue-400 shrink-0">you</span>}
                        </div>
                      </td>
                      {dayMatches.map(m => {
                        const p = userPreds?.get(m.id)
                        return (
                          <td key={m.id} className="py-2 px-2 text-center">
                            <PredCell ph={p?.h ?? null} pa={p?.a ?? null} ah={m.actual_home_score} aa={m.actual_away_score} />
                          </td>
                        )
                      })}
                      <td className="py-2 px-2">
                        <PredictedFinishCell positions={positions} lang={lang} mode={finishMode} />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {sortMode === 'total'
                          ? <span className="font-bold text-sm text-[#0B1F3A]">{entry.totalPts}</span>
                          : <span className={`font-bold text-sm ${dayPts > 0 ? 'text-green-600' : 'text-gray-400'}`}>{dayPts}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-[10px]">
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">{t('dv_pts_exact')}</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">{t('dv_pts_gd')}</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">{t('dv_pts_outcome')}</span>
            <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">{t('dv_pts_wrong')}</span>
            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{t('dv_pts_pending')}</span>
          </div>
          {/* Qualified teams pill — shown after the last group matchday */}
          {allDays.length > 0 && selectedDay >= allDays[allDays.length - 1] && (
            <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-xs font-bold text-green-800">32 teams qualified for Round of 32</p>
                <p className="text-[10px] text-green-600">Group stage complete · Knockout bracket begins</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Recap popup */}
      {showRecap && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setShowRecap(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-lg font-bold text-[#0B1F3A]">📰 {t('dv_day_recap_title')}</h2>
                <p className="text-xs text-gray-400">{dayLabel} · {leagueName}</p>
              </div>
              <button onClick={() => setShowRecap(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
            </div>
            <div className="flex items-center gap-1.5 mb-4 text-[10px] text-purple-500 bg-purple-50 border border-purple-100 rounded-lg px-2.5 py-1.5 w-fit">
              <span>🤖</span><span>Generated by AI · may contain errors</span>
            </div>
            {recapLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-8 h-8 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">{t('dv_generating_recap')}</p>
              </div>
            ) : (
              <div className="text-sm text-gray-700 leading-relaxed">
                {(recap ?? '').split('\n').map((line, i) =>
                  line.trim() === '' ? <div key={i} className="h-3" /> : <p key={i} className="mb-1.5">{line}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stats View ────────────────────────────────────────────────────────────────

interface StatsData {
  roundExits: Record<string, Array<{ fifaCode: string; name: string; count: number }>>
  topScores: Array<{ score: string; count: number }>
  goalStats: {
    mostGoals: { name: string; total: number } | null
    leastGoals: { name: string; total: number } | null
    highestAvg: { name: string; avg: number } | null
    boldestDiff: { name: string; maxDiffScore: string; maxDiff: number } | null
    mostMatchGoals: { name: string; maxGoalScore: string; maxMatch: number } | null
  }
  totalUsers: number
}

const ROUND_LABEL_KEYS: Record<string, string> = {
  group: 'lb_round_group', r32: 'lb_round_r32', r16: 'lb_round_r16',
  qf: 'lb_round_qf', sf: 'lb_round_sf', fourth: 'lb_round_fourth', third: 'lb_round_third',
  second: 'lb_round_second', champion: 'lb_round_champion',
}

function StatsView({ top4, positionsByUser, lang, leagueId }: {
  top4: Array<Array<{ team: TeamRef & {}; votes: number }>>
  positionsByUser: Record<string, PositionRow>
  lang: string
  // lang kept for team name translations
  leagueId: string
}) {
  const { t } = useTranslation()
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    setStatsData(null)
    setStatsLoading(true)
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId: leagueId === 'global' ? null : leagueId }),
    }).then(r => r.json()).then(data => {
      setStatsData(data)
      setStatsLoading(false)
    }).catch(() => setStatsLoading(false))
  }, [leagueId])

  // Champion distribution
  const champCounts = new Map<string, { team: TeamRef & {}; count: number }>()
  for (const [, positions] of Object.entries(positionsByUser)) {
    const champ = positions?.[0]
    if (champ) {
      const key = champ.fifa_code
      if (!champCounts.has(key)) champCounts.set(key, { team: champ, count: 0 })
      champCounts.get(key)!.count++
    }
  }
  const champList = [...champCounts.values()].sort((a, b) => b.count - a.count)
  const totalWithChamp = champList.reduce((s, c) => s + c.count, 0)
  const hasTop4 = top4.some(arr => arr.length > 0)

  return (
    <div className="space-y-5">
      {/* Predicted Top 4 */}
      {hasTop4 && (
        <div className="bg-gradient-to-br from-[#0B1F3A]/5 to-yellow-50/50 rounded-xl p-4 border border-[#0B1F3A]/10">
          <h3 className="text-sm font-bold text-[#0B1F3A] mb-3 flex items-center gap-1.5">🏆 {t('lb_stats_top4')} <span className="text-xs font-normal text-gray-400">{t('lb_stats_top4_sub')}</span></h3>
          {(['🥇', '🥈', '🥉', '4️⃣'] as const).map((medal, pos) => (
            top4[pos]?.length > 0 ? (
              <div key={pos} className="flex items-center gap-2 py-1.5 border-t border-[#0B1F3A]/5 first:border-t-0">
                <span className="text-base shrink-0 w-6 text-center">{medal}</span>
                <div className="flex flex-wrap gap-1.5">
                  {top4[pos].map(({ team, votes }: any, j: number) => team && (
                    <span key={(team as any).fifa_code} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${j === 0 ? 'bg-[#0B1F3A] text-white font-semibold' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      <img src={flagUrl((team as any).fifa_code, 40)} alt="" className="w-3.5 h-auto rounded-sm" />
                      {getTeamName((team as any).fifa_code, lang) ?? (team as any).fifa_code}
                      <span className="opacity-60 text-[10px]">×{votes}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null
          ))}
        </div>
      )}

      {/* Champion consensus */}
      {champList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-[#0B1F3A] mb-3 flex items-center gap-1.5">
            🏅 {t('lb_stats_champ_picks')}
            <span className="text-xs font-normal text-gray-400 ml-1">{t('lb_stats_champ_count').replace('{count}', String(totalWithChamp))}</span>
          </h3>
          <div className="space-y-2">
            {champList.slice(0, 8).map(({ team, count }) => {
              const pct = Math.round((count / totalWithChamp) * 100)
              return (
                <div key={(team as any).fifa_code} className="flex items-center gap-2">
                  <img src={flagUrl((team as any).fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm shrink-0" />
                  <span className="text-xs font-medium text-[#0B1F3A] w-20 shrink-0 truncate">
                    {getTeamName((team as any).fifa_code, lang) ?? (team as any).fifa_code}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B1F3A] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right shrink-0">{count}×</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {statsLoading && (
        <div className="flex items-center gap-2 py-6 justify-center text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-[#0B1F3A] rounded-full animate-spin" />
          Loading prediction stats…
        </div>
      )}

      {statsData && (
        <>
          {/* Round exits */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-bold text-[#0B1F3A] mb-3">🔮 {t('lb_stats_exits')}</h3>
            <p className="text-[11px] text-gray-400 mb-3">{t('lb_stats_exits_desc')}</p>
            <div className="space-y-3">
              {(['group', 'r32', 'r16', 'qf', 'sf', 'fourth', 'third', 'second', 'champion'] as const).map(round => {
                const teams = statsData.roundExits[round] ?? []
                if (teams.length === 0) return null
                const maxCount = teams[0].count
                return (
                  <div key={round}>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">{t(ROUND_LABEL_KEYS[round] ?? round)}</div>
                    <div className="space-y-1">
                      {teams.map(({ fifaCode, name, count }) => (
                        <div key={fifaCode} className="flex items-center gap-2">
                          <img src={flagUrl(fifaCode, 40)} alt="" className="w-4 h-auto rounded-sm shrink-0" />
                          <span className="text-xs text-[#0B1F3A] w-20 truncate shrink-0">{getTeamName(fifaCode, lang) ?? name}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0B1F3A]/70 rounded-full" style={{ width: `${Math.round((count / maxCount) * 100)}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 w-8 text-right shrink-0">{count}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Goal stats */}
          {statsData.goalStats.mostGoals && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-bold text-[#0B1F3A] mb-3">⚽ {t('lb_stats_goals')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {statsData.goalStats.mostGoals && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                    <div className="text-[10px] text-green-600 font-bold uppercase tracking-wide mb-1">{t('lb_stats_most_goals')}</div>
                    <div className="text-sm font-bold text-[#0B1F3A]">{statsData.goalStats.mostGoals.name}</div>
                    <div className="text-xs text-gray-500">{statsData.goalStats.mostGoals.total} {t('lb_stats_total_goals') || 'total goals'}</div>
                  </div>
                )}
                {statsData.goalStats.leastGoals && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wide mb-1">{t('lb_stats_fewest_goals')}</div>
                    <div className="text-sm font-bold text-[#0B1F3A]">{statsData.goalStats.leastGoals.name}</div>
                    <div className="text-xs text-gray-500">{statsData.goalStats.leastGoals.total} {t('lb_stats_total_goals') || 'total goals'}</div>
                  </div>
                )}
                {statsData.goalStats.highestAvg && (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                    <div className="text-[10px] text-orange-600 font-bold uppercase tracking-wide mb-1">{t('lb_stats_highest_avg')}</div>
                    <div className="text-sm font-bold text-[#0B1F3A]">{statsData.goalStats.highestAvg.name}</div>
                    <div className="text-xs text-gray-500">{statsData.goalStats.highestAvg.avg.toFixed(2)} {t('lb_stats_goals_per_match') || 'goals/match'}</div>
                  </div>
                )}
                {statsData.goalStats.boldestDiff && (
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <div className="text-[10px] text-purple-600 font-bold uppercase tracking-wide mb-1">{t('lb_stats_boldest_diff')}</div>
                    <div className="text-sm font-bold text-[#0B1F3A]">{statsData.goalStats.boldestDiff.name}</div>
                    <div className="text-xs text-gray-500">{statsData.goalStats.boldestDiff.maxDiffScore} ({statsData.goalStats.boldestDiff.maxDiff} {t('lb_stats_goal_diff') || 'goal diff'})</div>
                  </div>
                )}
                {statsData.goalStats.mostMatchGoals && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 col-span-2">
                    <div className="text-[10px] text-yellow-700 font-bold uppercase tracking-wide mb-1">{t('lb_stats_match_goals')}</div>
                    <div className="text-sm font-bold text-[#0B1F3A]">{statsData.goalStats.mostMatchGoals.name}</div>
                    <div className="text-xs text-gray-500">{statsData.goalStats.mostMatchGoals.maxGoalScore} ({statsData.goalStats.mostMatchGoals.maxMatch} goals)</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top predicted scores */}
          {statsData.topScores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-bold text-[#0B1F3A] mb-3">🎯 {t('lb_stats_top_scores')}</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {statsData.topScores.map(({ score, count }, i) => (
                  <div key={score} className={`flex items-center justify-between rounded-lg px-3 py-2 ${i === 0 ? 'bg-[#0B1F3A] text-white' : 'bg-gray-50 border border-gray-100'}`}>
                    <span className={`font-mono font-bold text-sm ${i === 0 ? 'text-white' : 'text-[#0B1F3A]'}`}>{score}</span>
                    <span className={`text-xs ${i === 0 ? 'text-white/70' : 'text-gray-400'}`}>{count}×</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Scoring helpers ───────────────────────────────────────────────────────────

function calcBreakdown(
  groupPreds: { pred_home: number; pred_away: number; actual_home: number; actual_away: number }[],
  koPreds: { pred_home: number; pred_away: number; actual_home: number; actual_away: number }[],
  advTotal: number
): ScoreBreakdown {
  let groupExact = 0, groupGD = 0, groupOutcome = 0
  for (const p of groupPreds) {
    if (p.pred_home === p.actual_home && p.pred_away === p.actual_away) { groupExact++; continue }
    const predGD = p.pred_home - p.pred_away, actualGD = p.actual_home - p.actual_away
    if (predGD === actualGD) { groupGD++; continue }
    if (Math.sign(predGD) === Math.sign(actualGD)) groupOutcome++
  }
  let koExact = 0, koGD = 0, koOutcome = 0
  for (const p of koPreds) {
    if (p.pred_home === p.actual_home && p.pred_away === p.actual_away) { koExact++; continue }
    const predGD = p.pred_home - p.pred_away, actualGD = p.actual_home - p.actual_away
    if (predGD === actualGD) { koGD++; continue }
    if (Math.sign(predGD) === Math.sign(actualGD)) koOutcome++
  }
  return {
    groupExact, groupGD, groupOutcome, groupTotal: groupExact * 3 + groupGD * 2 + groupOutcome,
    advTotal, koExact, koGD, koOutcome, koTotal: koExact * 3 + koGD * 2 + koOutcome,
  }
}

// ── Overview Recap ────────────────────────────────────────────────────────────

function OverviewRecap({ leagueId, leagueName, lang, entries }: {
  leagueId: string; leagueName: string; lang: string; entries: LeaderboardEntry[]
}) {
  const { t } = useTranslation()
  const [recap, setRecap] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastDay, setLastDay] = useState('')
  const [dayLabel, setDayLabel] = useState('')
  const supabase = createClient()
  const locale = LANG_TO_LOCALE[lang] ?? 'en-GB'

  useEffect(() => {
    setRecap(null)
    setLastDay('')
  }, [lang, leagueId])

  useEffect(() => {
    supabase.from('matches').select('kickoff_at').eq('stage', 'group').order('kickoff_at').then(({ data }) => {
      if (!data) return
      const days = [...new Set(data.map((m: any) => toCDTDate(m.kickoff_at)))]
      const todayCDT = toCDTDate(new Date().toISOString())
      const pastDays = days.filter(d => d <= todayCDT)
      const day = pastDays[pastDays.length - 1] ?? ''
      setLastDay(day)
      if (day) setDayLabel(new Date(day + 'T12:00:00Z').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }))
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecap = async () => {
    if (recap || loading || !lastDay) return
    setLoading(true)
    try {
      const res = await fetch('/api/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: lastDay, leagueId: leagueId === 'global' ? null : leagueId, leagueName, playerNames: entries.map(e => e.displayName), lang }),
      })
      const data = await res.json()
      setRecap(data.recap || 'No recap available yet.')
    } catch { setRecap('Failed to load recap.') }
    setLoading(false)
  }

  if (!lastDay) return null

  return (
    <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-sm font-bold text-[#0B1F3A] flex items-center gap-1.5">📰 Last Day Recap</div>
          <div className="text-xs text-gray-400 mt-0.5">{dayLabel} · {leagueName}</div>
        </div>
        {!recap && (
          <button onClick={loadRecap} disabled={loading}
            className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 transition-all shadow active:scale-95">
            {loading ? 'Loading…' : 'Load Recap'}
          </button>
        )}
      </div>
      {loading && (
        <div className="flex items-center gap-2 px-4 pb-4">
          <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500">{t('dv_generating_recap')}</span>
        </div>
      )}
      {recap && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1.5 mb-3 text-[10px] text-purple-500 bg-purple-50 border border-purple-100 rounded-lg px-2.5 py-1.5 w-fit">
            <span>🤖</span><span>Generated by AI · may contain errors</span>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            {recap.split('\n').map((line, i) =>
              line.trim() === '' ? <div key={i} className="h-3" /> : <p key={i} className="mb-1.5">{line}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { lang, t } = useTranslation()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [breakdowns, setBreakdowns] = useState<Record<string, ScoreBreakdown>>({})
  const [loadingBreakdown, setLoadingBreakdown] = useState<string | null>(null)
  const [userLeagues, setUserLeagues] = useState<UserLeague[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'global'
    return localStorage.getItem('spoton_league') ?? 'global'
  })
  const [leagueMembers, setLeagueMembers] = useState<Set<string>>(new Set())
  const [leagueCounts, setLeagueCounts] = useState<Record<string, number>>({})
  const [showLeaguePanel, setShowLeaguePanel] = useState(false)
  const [newLeagueName, setNewLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [leagueActionLoading, setLeagueActionLoading] = useState(false)
  const [leagueError, setLeagueError] = useState<string | null>(null)
  const [inviteLeague, setInviteLeague] = useState<UserLeague | null>(null)
  const [copiedLeagueId, setCopiedLeagueId] = useState<string | null>(null)
  const [lbTab, setLbTab] = useState<'overview' | 'dayview' | 'stats'>('dayview')
  const [top4, setTop4] = useState<Array<Array<{ team: TeamRef & {}; votes: number }>>>([[], [], [], []])
  const [positionsByUser, setPositionsByUser] = useState<Record<string, PositionRow>>({})
  const [finishMode, setFinishMode] = useState<'champ' | 'top4'>('champ')
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const [userRes, scoreRes, authRes] = await Promise.all([
      supabase.from('users').select('id, display_name'),
      supabase.from('scores').select('*'),
      supabase.auth.getUser(),
    ])
    const uid = authRes.data.user?.id ?? null
    setCurrentUserId(uid)

    if (uid) {
      const { data: memberships } = await (supabase as any).from('league_members').select('league_id').eq('user_id', uid)
      if (memberships?.length) {
        const ids = memberships.map((m: any) => m.league_id)
        const { data: leagues } = await (supabase as any).from('leagues').select('id, name, join_code').in('id', ids)
        setUserLeagues(leagues ?? [])
        const { data: allMembers } = await (supabase as any).from('league_members').select('league_id').in('league_id', ids)
        const counts: Record<string, number> = {}
        for (const m of (allMembers ?? [])) counts[m.league_id] = (counts[m.league_id] ?? 0) + 1
        setLeagueCounts(counts)
      }
    }

    const users: { id: string; display_name: string | null }[] = userRes.data ?? []
    const scores = new Map((scoreRes.data ?? []).map((s: any) => [s.user_id, s]))

    const predCounts = new Map<string, number>()
    try {
      const pcRes = await fetch('/api/predcounts')
      if (pcRes.ok) {
        const obj: Record<string, number> = await pcRes.json()
        for (const [uid, cnt] of Object.entries(obj)) predCounts.set(uid, cnt)
      }
    } catch { }

    const built: Omit<LeaderboardEntry, 'rank'>[] = users.map(u => {
      const s = scores.get(u.id)
      return {
        userId: u.id,
        displayName: transliterateName(u.display_name ?? 'Anonymous'),
        groupPts: s?.group_pts ?? 0,
        advancementPts: s?.advancement_pts ?? 0,
        knockoutPts: s?.knockout_match_pts ?? 0,
        totalPts: s?.total_pts ?? 0,
        predictionCount: predCounts.get(u.id) ?? 0,
        updatedAt: s ? new Date(s.updated_at) : null,
      }
    })
    built.sort((a, b) => b.totalPts - a.totalPts || a.displayName.localeCompare(b.displayName))

    const ranked: LeaderboardEntry[] = []
    let rank = 1
    for (let i = 0; i < built.length; i++) {
      if (i > 0 && built[i].totalPts < built[i - 1].totalPts) rank = i + 1
      ranked.push({ rank, ...built[i] })
    }
    setEntries(ranked)
    setLastUpdated(new Date())
    setLoading(false)
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData()
    const channel = supabase.channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedLeagueId === 'global') { setLeagueMembers(new Set()); return }
    ;(supabase as any).from('league_members').select('user_id').eq('league_id', selectedLeagueId)
      .then(({ data }: any) => setLeagueMembers(new Set((data ?? []).map((r: any) => r.user_id))))
  }, [selectedLeagueId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch bracket simulation results (champion + positions per user)
  useEffect(() => {
    fetch('/api/top4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueId: selectedLeagueId === 'global' ? null : selectedLeagueId }),
    }).then(r => r.json()).then(data => {
      if (data.top4) setTop4(data.top4)
      if (data.positionsByUser) setPositionsByUser(data.positionsByUser)
    }).catch(() => {})
  }, [selectedLeagueId])

  const loadBreakdown = async (userId: string, advTotal: number, meId: string | null) => {
    if (breakdowns[userId]) return
    setLoadingBreakdown(userId)

    const fetchesForRival = [
      (supabase as any).from('predictions_group').select('match_id, pred_home_score, pred_away_score').eq('user_id', userId),
      (supabase as any).from('matches').select('id, actual_home_score, actual_away_score').eq('stage', 'group').not('actual_home_score', 'is', null),
      (supabase as any).from('predictions_knockout').select('bracket_slot, pred_home_score, pred_away_score').eq('user_id', userId),
      (supabase as any).from('matches').select('id, bracket_slot, actual_home_score, actual_away_score').eq('stage', 'knockout').not('actual_home_score', 'is', null),
    ]
    const isRival = meId && meId !== userId
    let myGroupPredsPromise: Promise<any> | null = null
    let myKoPredsPromise: Promise<any> | null = null
    if (isRival) {
      myGroupPredsPromise = (supabase as any).from('predictions_group').select('match_id, pred_home_score, pred_away_score').eq('user_id', meId)
      myKoPredsPromise = (supabase as any).from('predictions_knockout').select('bracket_slot, pred_home_score, pred_away_score').eq('user_id', meId)
    }

    const [gpRes, matchRes, kpRes, koMatchRes] = await Promise.all(fetchesForRival)
    const actualGroupMap = new Map((matchRes.data ?? []).map((m: any) => [m.id, m]))
    const groupPreds = (gpRes.data ?? []).filter((p: any) => actualGroupMap.has(p.match_id)).map((p: any) => {
      const m = actualGroupMap.get(p.match_id) as any
      return { match_id: p.match_id, pred_home: p.pred_home_score, pred_away: p.pred_away_score, actual_home: m.actual_home_score, actual_away: m.actual_away_score }
    })
    const actualKoMap = new Map((koMatchRes.data ?? []).map((m: any) => [m.bracket_slot, m]))
    const koPreds = (kpRes.data ?? []).filter((p: any) => actualKoMap.has(p.bracket_slot)).map((p: any) => {
      const m = actualKoMap.get(p.bracket_slot) as any
      return { bracket_slot: p.bracket_slot, pred_home: p.pred_home_score, pred_away: p.pred_away_score, actual_home: m.actual_home_score, actual_away: m.actual_away_score }
    })

    const bd = calcBreakdown(groupPreds, koPreds, advTotal)

    if (isRival && myGroupPredsPromise && myKoPredsPromise) {
      const [myGpRes, myKpRes] = await Promise.all([myGroupPredsPromise, myKoPredsPromise])
      const myGroupMap = new Map((myGpRes.data ?? []).map((p: any) => [p.match_id, p]))
      const myKoMap = new Map((myKpRes.data ?? []).map((p: any) => [p.bracket_slot, p]))
      let bothRight = 0, rivalOnly = 0, youOnly = 0, neither = 0, rivalPts = 0, myPts = 0
      for (const rp of groupPreds) {
        const mp = myGroupMap.get(rp.match_id) as any
        const rivalCorrect = getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away) > 0
        const myCorrect = mp ? getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away) > 0 : false
        if (rivalCorrect && myCorrect) bothRight++
        else if (rivalCorrect) rivalOnly++
        else if (myCorrect) youOnly++
        else neither++
        rivalPts += getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away)
        if (mp) myPts += getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away)
      }
      for (const rp of koPreds) {
        const mp = myKoMap.get(rp.bracket_slot) as any
        const rivalCorrect = getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away) > 0
        const myCorrect = mp ? getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away) > 0 : false
        if (rivalCorrect && myCorrect) bothRight++
        else if (rivalCorrect) rivalOnly++
        else if (myCorrect) youOnly++
        else neither++
        rivalPts += getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away)
        if (mp) myPts += getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away)
      }
      bd.h2h = { bothRight, rivalOnly, youOnly, neither, rivalPtsLead: rivalPts - myPts }
    }

    setBreakdowns(prev => ({ ...prev, [userId]: bd }))
    setLoadingBreakdown(null)
  }

  const handleRowClick = async (entry: LeaderboardEntry) => {
    const isOpen = expandedId === entry.userId
    setExpandedId(isOpen ? null : entry.userId)
    if (!isOpen) await loadBreakdown(entry.userId, entry.advancementPts, currentUserId)
  }

  const handleLeagueChange = async (leagueId: string) => {
    setSelectedLeagueId(leagueId)
    localStorage.setItem('spoton_league', leagueId)
    setExpandedId(null)
    if (leagueId === 'global') { setLeagueMembers(new Set()); return }
    const { data } = await (supabase as any).from('league_members').select('user_id').eq('league_id', leagueId)
    const members = (data ?? []).map((r: any) => r.user_id)
    setLeagueMembers(new Set(members))
    setLeagueCounts(prev => ({ ...prev, [leagueId]: members.length }))
  }

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    setLeagueActionLoading(true); setLeagueError(null)
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { data: league, error } = await (supabase as any).from('leagues').insert({ name: newLeagueName.trim(), join_code: code, created_by: currentUserId }).select().single()
    if (error) { setLeagueError(error.message); setLeagueActionLoading(false); return }
    await (supabase as any).from('league_members').insert({ league_id: league.id, user_id: currentUserId })
    setNewLeagueName('')
    setLeagueActionLoading(false)
    setInviteLeague({ id: league.id, name: league.name, join_code: league.join_code })
    await loadData()
  }

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    setLeagueActionLoading(true); setLeagueError(null)
    const { data: league, error } = await (supabase as any).from('leagues').select('*').eq('join_code', joinCode.trim().toUpperCase()).single()
    if (error || !league) { setLeagueError(t('lb_not_found')); setLeagueActionLoading(false); return }
    await (supabase as any).from('league_members').upsert({ league_id: league.id, user_id: currentUserId }, { onConflict: 'league_id,user_id' })
    setJoinCode('')
    setLeagueActionLoading(false)
    await loadData()
    handleLeagueChange(league.id)
  }

  const handleCopyInvite = async (league: UserLeague) => {
    const origin = window.location.origin
    const msg = `Join my SpotOn WC26 league "${league.name}"!\nSign up: ${origin}/auth/login?league=${league.join_code}\nOr enter code: ${league.join_code}`
    await navigator.clipboard.writeText(msg)
    setCopiedLeagueId(league.id)
    setTimeout(() => setCopiedLeagueId(null), 2000)
  }

  const visibleEntries = (() => {
    const filtered = selectedLeagueId === 'global'
      ? entries
      : entries.filter(e => leagueMembers.has(e.userId))
    let rank = 1
    return filtered.map((e, i) => {
      if (i > 0 && e.totalPts < filtered[i - 1].totalPts) rank = i + 1
      return { ...e, rank }
    })
  })()

  const leagueName = selectedLeagueId === 'global' ? 'Global' : (userLeagues.find(l => l.id === selectedLeagueId)?.name ?? 'League')

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('lb_loading')}</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">{t('leaderboard_title')}</h1>
        {lastUpdated && <div className="text-xs text-gray-400">{t('lb_updated', { time: formatDistanceToNow(lastUpdated, { addSuffix: true }) })}</div>}
      </div>

      {/* League selector */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select value={selectedLeagueId} onChange={e => handleLeagueChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] bg-white min-w-0 flex-1 max-w-[200px]">
          <option value="global">{t('lb_global')}</option>
          {userLeagues.map(l => <option key={l.id} value={l.id}>🏅 {l.name}</option>)}
        </select>
        <span className="text-sm font-bold text-[#0B1F3A] tabular-nums shrink-0">
          {visibleEntries.length} <span className="text-gray-400 font-normal text-xs">{visibleEntries.length === 1 ? t('leaderboard_player') : t('lb_players')}</span>
        </span>
        <button onClick={() => setShowLeaguePanel(o => !o)}
          className="ml-auto text-xs bg-[#0B1F3A] text-white px-3 py-2 rounded-lg hover:bg-blue-900 transition-colors shrink-0">
          {showLeaguePanel ? '✕ Close' : t('lb_manage')}
        </button>
      </div>

      {/* League management panel */}
      {showLeaguePanel && (
        <div className="mb-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">{t('lb_create_title')}</p>
              <form onSubmit={handleCreateLeague} className="flex gap-2">
                <input type="text" required maxLength={50} placeholder={t('leaderboard_league_name')} value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]" />
                <button type="submit" disabled={leagueActionLoading} className="bg-[#0B1F3A] text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-blue-900 disabled:opacity-50 transition-colors">{t('leaderboard_create_btn')}</button>
              </form>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">{t('lb_join_title')}</p>
              <form onSubmit={handleJoinLeague} className="flex gap-2">
                <input type="text" required maxLength={8} placeholder={t('lb_6letter')} value={joinCode} onChange={e => setJoinCode(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]" />
                <button type="submit" disabled={leagueActionLoading} className="bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors">{t('leaderboard_join_btn')}</button>
              </form>
            </div>
          </div>
          {leagueError && <p className="text-red-600 text-sm mb-3">{leagueError}</p>}
          {userLeagues.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{t('lb_your_leagues')}</p>
              {userLeagues.map(l => (
                <div key={l.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2">
                  <div>
                    <span className="font-semibold text-sm text-[#0B1F3A]">{l.name}</span>
                    <span className="text-xs text-gray-400 font-mono ml-2">· {l.join_code}</span>
                  </div>
                  <button onClick={() => handleCopyInvite(l)} className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${copiedLeagueId === l.id ? 'bg-green-600 text-white border border-green-600' : 'text-green-700 border border-green-200 hover:bg-green-50'}`}>
                    {copiedLeagueId === l.id ? t('leaderboard_copied') : t('leaderboard_copy_invite')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite popup */}
      {inviteLeague && !showLeaguePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-[#0B1F3A] mb-2">{t('lb_league_created')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('lb_share_code')} <span className="font-mono font-bold text-green-700">{inviteLeague.join_code}</span></p>
            <button onClick={() => handleCopyInvite(inviteLeague)} className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg text-sm mb-2 hover:bg-green-500 transition-colors">
              {copiedLeagueId === inviteLeague?.id ? t('leaderboard_copied') : t('lb_copy_msg')}
            </button>
            <button onClick={() => setInviteLeague(null)} className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">{t('lb_close')}</button>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {(['overview', 'dayview', 'stats'] as const).map(tab => (
          <button key={tab} onClick={() => setLbTab(tab)}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${lbTab === tab ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab === 'overview' ? t('lb_tab_overview') : tab === 'dayview' ? t('lb_tab_dayview') : '📊 Stats'}
          </button>
        ))}
      </div>

      {/* Day View tab */}
      {lbTab === 'dayview' && (
        <DayView entries={visibleEntries} currentUserId={currentUserId} leagueId={selectedLeagueId} leagueName={leagueName} positionsByUser={positionsByUser} finishMode={finishMode} setFinishMode={setFinishMode} />
      )}

      {/* Stats tab */}
      {lbTab === 'stats' && (
        <StatsView top4={top4 as any} positionsByUser={positionsByUser} lang={lang} leagueId={selectedLeagueId} />
      )}

      {/* Overview tab */}
      {lbTab === 'overview' && <>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-900 flex flex-wrap gap-x-5 gap-y-1.5">
          <span className="font-bold text-amber-800">{t('lb_how_points')}</span>
          <span>⚽ <strong>{t('lb_group_col')}</strong> — {t('lb_group_pts_desc')}</span>
          <span>🏅 <strong>{t('lb_advancement')}</strong> — {t('lb_adv_short')}</span>
          <span>🏆 <strong>{t('lb_playoff_col')}</strong> — {t('lb_playoff_short')}</span>
          <span className="text-amber-700 italic">{t('lb_click_breakdown')}</span>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            {selectedLeagueId === 'global' ? t('lb_no_players') : t('lb_no_members')}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0B1F3A] text-white">
                  <th className="py-3 px-3 text-left w-10">#</th>
                  <th className="py-3 px-3 text-left">{t('leaderboard_player')}</th>
                  <th className="py-3 px-3 text-center" title="Predictions completed">{t('lb_preds')}</th>
                  <th className="py-3 px-3 text-right hidden sm:table-cell">{t('lb_group_col')}</th>
                  <th className="py-3 px-3 text-right hidden sm:table-cell">{t('lb_advance_col')}</th>
                  <th className="py-3 px-3 text-right hidden sm:table-cell">{t('lb_playoff_col')}</th>
                  <th className="py-3 px-3 text-right font-bold">{t('lb_total')}</th>
                  <th className="py-3 px-3 text-left text-yellow-300 text-xs hidden md:table-cell min-w-[110px]">
                    <div className="flex flex-col gap-1">
                      <span>🏆 Predicted</span>
                      <FinishToggle mode={finishMode} onChange={setFinishMode} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry, idx) => {
                  const isMe = entry.userId === currentUserId
                  const isComplete = entry.predictionCount >= PREDICTIONS_TOTAL
                  const pctDone = Math.min(100, Math.round((entry.predictionCount / PREDICTIONS_TOTAL) * 100))
                  const isExpanded = expandedId === entry.userId
                  const bd = breakdowns[entry.userId]
                  const positions = positionsByUser[entry.userId] as PositionRow | undefined

                  return (
                    <>
                      <tr key={entry.userId} onClick={() => handleRowClick(entry)}
                        className={`border-t border-gray-100 cursor-pointer transition-colors hover:bg-blue-50/50 active:bg-blue-100 select-none ${isMe ? 'bg-blue-50 font-semibold' : entry.rank === 1 ? 'bg-yellow-50' : idx % 2 === 0 ? '' : 'bg-gray-50/50'} ${isExpanded ? 'border-b-0' : ''}`}>
                        <td className="py-3 px-3 font-bold text-gray-500 text-base">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                        </td>
                        <td className="py-3 px-3 text-[#0B1F3A] max-w-[120px] sm:max-w-none">
                          <div className="truncate flex items-center gap-1.5">
                            {entry.displayName}
                            <span className="text-gray-300 text-xs">▾</span>
                            <Link href={`/predictions/view/${entry.userId}`} onClick={e => e.stopPropagation()} className="ml-auto shrink-0 text-gray-300 hover:text-[#0B1F3A] transition-colors text-xs" title="View all predictions">👁</Link>
                          </div>
                          {isMe && <div className="text-xs text-blue-500 font-normal">{t('you')}</div>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isComplete ? <span className="text-green-600 font-semibold text-xs">✅</span>
                            : entry.predictionCount === 0 ? <span className="text-gray-300 text-xs">—</span>
                            : <span className="text-orange-500 text-xs font-medium">{pctDone}%</span>}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.groupPts}</td>
                        <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.advancementPts}</td>
                        <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.knockoutPts}</td>
                        <td className="py-3 px-3 text-right font-bold text-green-600 text-base">{entry.totalPts}</td>
                        <td className="py-3 px-2 hidden md:table-cell">
                          <PredictedFinishCell positions={positions} lang={lang} mode={finishMode} />
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${entry.userId}-breakdown`} className={`border-t-0 ${isMe ? 'bg-blue-50' : entry.rank === 1 ? 'bg-yellow-50' : ''}`}>
                          <td colSpan={8} className="px-4 pb-4 pt-1">
                            {loadingBreakdown === entry.userId ? (
                              <div className="text-xs text-gray-400 py-2">Loading breakdown…</div>
                            ) : bd ? (
                              <>
                                <div className="grid sm:grid-cols-3 gap-3 mt-1">
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                    <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">{t('lb_group_pts')} <span className="text-gray-400 font-normal ml-auto">{bd.groupTotal} {t('pts')}</span></div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                      <div className="flex justify-between"><span>{t('lb_exact_x3')}</span><span className="font-semibold text-green-600">{bd.groupExact} × 3 = {bd.groupExact * 3}</span></div>
                                      <div className="flex justify-between"><span>{t('lb_gd_x2')}</span><span className="font-semibold text-blue-600">{bd.groupGD} × 2 = {bd.groupGD * 2}</span></div>
                                      <div className="flex justify-between"><span>{t('lb_outcome_x1')}</span><span className="font-semibold text-gray-600">{bd.groupOutcome} × 1 = {bd.groupOutcome}</span></div>
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                    <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">{t('lb_advancement')} <span className="text-gray-400 font-normal ml-auto">{bd.advTotal} {t('pts')}</span></div>
                                    <p className="text-xs text-gray-500 leading-relaxed">{t('lb_adv_desc')}</p>
                                  </div>
                                  <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                    <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">{t('lb_playoff_pts')} <span className="text-gray-400 font-normal ml-auto">{bd.koTotal} {t('pts')}</span></div>
                                    {bd.koExact + bd.koGD + bd.koOutcome === 0 ? (
                                      <p className="text-xs text-gray-400 italic">{t('lb_no_playoff')}</p>
                                    ) : (
                                      <div className="space-y-1 text-xs text-gray-600">
                                        <div className="flex justify-between"><span>{t('lb_exact_x3')}</span><span className="font-semibold text-green-600">{bd.koExact} × 3 = {bd.koExact * 3}</span></div>
                                        <div className="flex justify-between"><span>{t('lb_gd_x2')}</span><span className="font-semibold text-blue-600">{bd.koGD} × 2 = {bd.koGD * 2}</span></div>
                                        <div className="flex justify-between"><span>{t('lb_outcome_x1')}</span><span className="font-semibold text-gray-600">{bd.koOutcome} × 1 = {bd.koOutcome}</span></div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Predicted finish in expanded row */}
                                {positions?.some(Boolean) && (
                                  <div className="mt-3 bg-white rounded-xl border border-yellow-100 p-3 shadow-sm">
                                    <div className="text-xs font-bold text-[#0B1F3A] mb-2">🏆 Predicted Tournament Finish</div>
                                    <div className="flex flex-wrap gap-3">
                                      {(['🥇', '🥈', '🥉', '4️⃣'] as const).map((medal, i) => positions[i] ? (
                                        <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                                          <span className="text-sm">{medal}</span>
                                          <img src={flagUrl((positions[i] as any).fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />
                                          <span className="text-xs font-medium text-[#0B1F3A]">{getTeamName((positions[i] as any).fifa_code, lang) ?? (positions[i] as any).name}</span>
                                        </div>
                                      ) : null)}
                                    </div>
                                  </div>
                                )}

                                {/* H2H section */}
                                {!isMe && currentUserId && bd.h2h && (
                                  <div className="mt-3 bg-white rounded-xl border border-[#0B1F3A]/20 p-3 shadow-sm">
                                    <div className="text-xs font-bold text-[#0B1F3A] mb-3 flex items-center gap-1">
                                      {t('lb_vs_you')}
                                      <span className="text-gray-400 font-normal ml-auto text-[11px]">{t('lb_on_scored')}</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                      <div className="rounded-lg bg-green-50 border border-green-100 p-2 text-center">
                                        <div className="text-lg font-bold text-green-600">{bd.h2h.bothRight}</div>
                                        <div className="text-[10px] text-green-700 font-medium">{t('lb_both_correct')}</div>
                                      </div>
                                      <div className="rounded-lg bg-red-50 border border-red-100 p-2 text-center">
                                        <div className="text-lg font-bold text-red-500">{bd.h2h.rivalOnly}</div>
                                        <div className="text-[10px] text-red-600 font-medium">{t('lb_rival_only')}</div>
                                      </div>
                                      <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 text-center">
                                        <div className="text-lg font-bold text-blue-500">{bd.h2h.youOnly}</div>
                                        <div className="text-[10px] text-blue-600 font-medium">{t('lb_you_only')}</div>
                                      </div>
                                      <div className="rounded-lg bg-gray-50 border border-gray-100 p-2 text-center">
                                        <div className="text-lg font-bold text-gray-400">{bd.h2h.neither}</div>
                                        <div className="text-[10px] text-gray-500 font-medium">{t('lb_neither')}</div>
                                      </div>
                                    </div>
                                    <div className={`text-xs font-semibold text-center py-1 px-3 rounded-full inline-block ${bd.h2h.rivalPtsLead > 0 ? 'bg-red-50 text-red-600' : bd.h2h.rivalPtsLead < 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                                      {bd.h2h.rivalPtsLead === 0 ? t('lb_tied') : bd.h2h.rivalPtsLead > 0 ? t('lb_rival_leads', { pts: String(bd.h2h.rivalPtsLead) }) : t('lb_you_lead', { pts: String(Math.abs(bd.h2h.rivalPtsLead)) })}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-3 text-right">
                                  <Link href={`/predictions/view/${entry.userId}`} className="text-xs text-[#0B1F3A] font-semibold hover:underline inline-flex items-center gap-1">
                                    👁 View all predictions →
                                  </Link>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400 py-2">{t('lb_no_scored')}</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
              {t('lb_footer', { n: String(PREDICTIONS_TOTAL) })}
            </p>
          </div>
        )}

        {/* Last day recap in Overview */}
        <OverviewRecap leagueId={selectedLeagueId} leagueName={leagueName} lang={lang} entries={visibleEntries} />
      </>}
    </div>
  )
}
