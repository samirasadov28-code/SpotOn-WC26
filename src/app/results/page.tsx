'use client'

import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import { getTeamName } from '@/lib/team-name'
import SimulatePage from '../simulate/page'
import type { Team } from '@/lib/supabase/types'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const KO_STAGES = [
  { key: 'r32', tKey: 'ko_r32' },
  { key: 'r16', tKey: 'ko_r16' },
  { key: 'qf',  tKey: 'ko_qf' },
  { key: 'sf',  tKey: 'ko_sf' },
  { key: 'third', tKey: 'ko_third' },
  { key: 'final', tKey: 'ko_final' },
]

interface MatchRow {
  id: string
  stage: string
  group_letter: string | null
  ko_stage: string | null
  bracket_slot: number | null
  kickoff_at: string | null
  venue: string | null
  actual_home_score: number | null
  actual_away_score: number | null
  home_team: Team | null
  away_team: Team | null
}

type PageTab = 'byday' | 'results' | 'standings' | 'bracket' | 'simulate'

interface TeamStat {
  team: Team
  played: number; wins: number; draws: number; losses: number
  gf: number; ga: number; pts: number; gd: number
}

function calcGroupStandings(matches: MatchRow[], teams: Team[]): TeamStat[] {
  const stats = new Map<string, TeamStat>()
  for (const t of teams) stats.set(t.id, { team: t, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0, gd: 0 })
  for (const m of matches) {
    if (m.actual_home_score === null || m.actual_away_score === null) continue
    if (!m.home_team?.id || !m.away_team?.id) continue
    const home = stats.get(m.home_team.id), away = stats.get(m.away_team.id)
    if (!home || !away) continue
    const h = m.actual_home_score, a = m.actual_away_score
    home.played++; away.played++
    home.gf += h; home.ga += a; away.gf += a; away.ga += h
    if (h > a) { home.wins++; away.losses++ } else if (h < a) { away.wins++; home.losses++ } else { home.draws++; away.draws++ }
  }
  const rows = Array.from(stats.values()).map(s => ({ ...s, pts: s.wins * 3 + s.draws, gd: s.gf - s.ga }))
  return rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name))
}

export default function ResultsPage() {
  const { t } = useTranslation()
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState('A')
  const [activeKoStage, setActiveKoStage] = useState('r32')
  const [tab, setTab] = useState<PageTab>('byday')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('matches')
        .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
        .order('kickoff_at'),
      supabase.from('teams').select('*'),
    ]).then(([mRes, tRes]) => {
      setMatches((mRes.data as MatchRow[]) ?? [])
      setTeams(tRes.data ?? [])
      setLoading(false)
    })
  }, [])

  const groupStandingsMap = useMemo(() => {
    const map = new Map<string, TeamStat[]>()
    for (const g of GROUPS) {
      const gMatches = matches.filter(m => m.stage === 'group' && m.group_letter === g)
      const gTeams = teams.filter(t => t.group_letter === g)
      map.set(g, calcGroupStandings(gMatches, gTeams))
    }
    return map
  }, [matches, teams])

  const best3rds = useMemo(() => {
    return GROUPS.map(g => {
      const s = groupStandingsMap.get(g) ?? []
      return s[2] ? { group: g, ...s[2] } : null
    })
      .filter(Boolean)
      .sort((a, b) => b!.pts - a!.pts || b!.gd - a!.gd || b!.gf - a!.gf)
      .map((r, i) => ({ ...r!, qualifies: i < 8 }))
  }, [groupStandingsMap])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('loading')}</div>

  if (matches.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
      <div className="text-4xl">🏗️</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">{t('res_no_data')}</h2>
      <p className="text-gray-500 text-sm max-w-sm">{t('res_no_data_desc')}</p>
    </div>
  )

  const groupMatches = matches.filter(m => m.stage === 'group' && m.group_letter === activeGroup)
  const koMatches = matches.filter(m => m.ko_stage === activeKoStage)
  const played = matches.filter(m => m.actual_home_score !== null).length
  const total = matches.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">{t('res_match_results')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('res_of_matches', { played: String(played), total: String(total) })}</p>
        </div>
        <div className="w-40">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${total > 0 ? Math.round((played / total) * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{t('res_pct', { pct: String(total > 0 ? Math.round((played / total) * 100) : 0) })}</p>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 overflow-x-auto">
        {(['byday', 'results', 'standings', 'bracket', 'simulate'] as PageTab[]).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              tab === tabKey ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {tabKey === 'byday' ? '📅 By Day' : tabKey === 'results' ? t('res_match_results') : tabKey === 'standings' ? t('res_group_standings') : tabKey === 'bracket' ? t('res_bracket') : t('res_simulate')}
          </button>
        ))}
      </div>

      {tab === 'byday' && (
        <ByDayTab matches={matches} />
      )}

      {tab === 'results' && (
        <>
          <div className="flex gap-4 border-b border-gray-200 mb-4">
            {(['group', 'knockout'] as const).map(t => (
              <button key={t} onClick={() => { if (t === 'group') setTab('results'); }}
                className="pb-2 text-sm font-medium text-[#0B1F3A]">
              </button>
            ))}
          </div>
          {/* Sub-tabs: group vs knockout */}
          <MatchResultsTabs
            matches={matches}
            groupMatches={groupMatches}
            koMatches={koMatches}
            activeGroup={activeGroup}
            setActiveGroup={setActiveGroup}
            activeKoStage={activeKoStage}
            setActiveKoStage={setActiveKoStage}
          />
        </>
      )}

      {tab === 'standings' && (
        <StandingsTab
          groups={GROUPS}
          groupStandingsMap={groupStandingsMap}
          best3rds={best3rds as Array<{ group: string; qualifies: boolean } & TeamStat>}
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
        />
      )}

      {tab === 'bracket' && (
        <BracketTab matches={matches} />
      )}

      {tab === 'simulate' && (
        <SimulatePage />
      )}
    </div>
  )
}

function toCDTDate(isoStr: string): string {
  const d = new Date(new Date(isoStr).getTime() - 6 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
}

// ── By Day tab ───────────────────────────────────────────────────────────────

function ByDayTab({ matches }: { matches: MatchRow[] }) {
  const { t, lang } = useTranslation()

  const byDay = new Map<string, MatchRow[]>()
  for (const m of matches) {
    const day = m.kickoff_at ? toCDTDate(m.kickoff_at) : 'unknown'
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(m)
  }
  const days = Array.from(byDay.keys()).sort()

  // Auto-scroll: find today (CDT) or nearest upcoming day
  const todayCDT = toCDTDate(new Date().toISOString())
  const activeDayDefault = days.find(d => d >= todayCDT) ?? days[days.length - 1] ?? ''
  const [activeDay, setActiveDay] = useState(activeDayDefault)

  const dayMatches = byDay.get(activeDay) ?? []
  const playedCount = dayMatches.filter(m => m.actual_home_score !== null).length

  return (
    <div>
      {/* Day selector */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {days.map(day => {
          const dayMatches = byDay.get(day)!
          const allPlayed = dayMatches.every(m => m.actual_home_score !== null)
          const someToday = day === todayCDT
          const label = new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
          return (
            <button key={day} onClick={() => setActiveDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative ${
                activeDay === day ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {label}
              {allPlayed && <span className="ml-1 text-[9px] opacity-70">✓</span>}
              {someToday && activeDay !== day && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />}
            </button>
          )
        })}
      </div>

      {/* Day header */}
      {activeDay && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0B1F3A]">
            {new Date(activeDay + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <span className="text-xs text-gray-400">{playedCount}/{dayMatches.length} played</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {dayMatches.map(m => {
          const played = m.actual_home_score !== null && m.actual_away_score !== null
          const kickoff = m.kickoff_at
            ? new Date(m.kickoff_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
            : ''
          const stageLabel = m.stage === 'group' ? `Group ${m.group_letter}` : m.ko_stage?.toUpperCase() ?? 'KO'
          return (
            <div key={m.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${played ? 'border-green-500' : 'border-gray-200'}`}>
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium">{stageLabel}</span>
                <span>{kickoff}{m.venue ? ` · ${m.venue}` : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{m.home_team ? (getTeamName(m.home_team.fifa_code, lang) ?? m.home_team.name) : '?'}</span>
                  {m.home_team?.fifa_code && <img src={flagUrl(m.home_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
                </div>
                <div className="text-center flex-shrink-0 min-w-[56px]">
                  {played
                    ? <span className="font-black text-xl text-[#0B1F3A]">{m.actual_home_score} – {m.actual_away_score}</span>
                    : <span className="text-sm text-gray-400 font-medium">vs</span>}
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  {m.away_team?.fifa_code && <img src={flagUrl(m.away_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
                  <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{m.away_team ? (getTeamName(m.away_team.fifa_code, lang) ?? m.away_team.name) : '?'}</span>
                </div>
              </div>
              {!played && <div className="text-center mt-2"><span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t('res_not_played')}</span></div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Match Results tab ────────────────────────────────────────────────────────

function MatchResultsTabs({
  matches, groupMatches, koMatches,
  activeGroup, setActiveGroup, activeKoStage, setActiveKoStage,
}: {
  matches: MatchRow[]
  groupMatches: MatchRow[]
  koMatches: MatchRow[]
  activeGroup: string
  setActiveGroup: (g: string) => void
  activeKoStage: string
  setActiveKoStage: (s: string) => void
}) {
  const { t } = useTranslation()
  const [section, setSection] = useState<'group' | 'knockout'>('group')

  return (
    <>
      <div className="flex gap-4 border-b border-gray-200 mb-5">
        {(['group', 'knockout'] as const).map(sec => (
          <button key={sec} onClick={() => setSection(sec)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              section === sec ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {sec === 'group' ? t('res_group_stage') : t('res_knockout_stage')}
          </button>
        ))}
      </div>

      {section === 'group' && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {GROUPS.map(g => (
              <button key={g} onClick={() => setActiveGroup(g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeGroup === g ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                <span className="sm:hidden">{g}</span>
                <span className="hidden sm:inline">{t('group', { g })}</span>
              </button>
            ))}
          </div>
          <MatchList matches={groupMatches} />
        </>
      )}

      {section === 'knockout' && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {KO_STAGES.map(s => (
              <button key={s.key} onClick={() => setActiveKoStage(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeKoStage === s.key ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                {t(s.tKey)}
              </button>
            ))}
          </div>
          <MatchList matches={koMatches} />
        </>
      )}
    </>
  )
}

function MatchList({ matches }: { matches: MatchRow[] }) {
  const { t, lang } = useTranslation()
  if (matches.length === 0) return <p className="text-gray-400 text-sm text-center py-10">{t('res_no_selection')}</p>
  return (
    <div className="flex flex-col gap-3">
      {matches.map(m => {
        const played = m.actual_home_score !== null && m.actual_away_score !== null
        const kickoff = m.kickoff_at
          ? new Date(m.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
          : ''
        return (
          <div key={m.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${played ? 'border-green-500' : 'border-gray-200'}`}>
            <div className="text-xs text-gray-400 mb-2 truncate">{kickoff}{m.venue ? ` · ${m.venue}` : ''}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5">
                <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{m.home_team ? (getTeamName(m.home_team.fifa_code, lang) ?? m.home_team.name) : '?'}</span>
                {m.home_team?.fifa_code && <img src={flagUrl(m.home_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
              </div>
              <div className="text-center flex-shrink-0 min-w-[56px]">
                {played
                  ? <span className="font-black text-xl text-[#0B1F3A]">{m.actual_home_score} – {m.actual_away_score}</span>
                  : <span className="text-sm text-gray-400 font-medium">vs</span>}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                {m.away_team?.fifa_code && <img src={flagUrl(m.away_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
                <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{m.away_team ? (getTeamName(m.away_team.fifa_code, lang) ?? m.away_team.name) : '?'}</span>
              </div>
            </div>
            {!played && <div className="text-center mt-2"><span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t('res_not_played')}</span></div>}
          </div>
        )
      })}
    </div>
  )
}

// ── Standings tab ─────────────────────────────────────────────────────────────

function StandingsTab({
  groups, groupStandingsMap, best3rds, activeGroup, setActiveGroup,
}: {
  groups: string[]
  groupStandingsMap: Map<string, TeamStat[]>
  best3rds: Array<{ group: string; qualifies: boolean } & TeamStat>
  activeGroup: string
  setActiveGroup: (g: string) => void
}) {
  const { lang } = useTranslation()
  const standings = groupStandingsMap.get(activeGroup) ?? []

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {groups.map(g => (
          <button key={g} onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeGroup === g ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            <span className="sm:hidden">{g}</span>
            <span className="hidden sm:inline">Group {g}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-sm font-bold">Group {activeGroup}</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-2 py-2 text-center">P</th>
                <th className="px-2 py-2 text-center">W</th>
                <th className="px-2 py-2 text-center">D</th>
                <th className="px-2 py-2 text-center">L</th>
                <th className="px-2 py-2 text-center">GD</th>
                <th className="px-2 py-2 text-center font-bold text-[#0B1F3A]">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.team.id} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50' : i === 2 ? 'bg-yellow-50' : ''}`}>
                  <td className="px-3 py-2.5 flex items-center gap-2">
                    <span className="text-gray-300 text-[10px] w-3">{i + 1}</span>
                    {s.team.fifa_code && <img src={flagUrl(s.team.fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />}
                    <span className="font-medium text-[#0B1F3A] truncate max-w-[100px]">{getTeamName(s.team.fifa_code, lang) ?? s.team.name}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center text-gray-500">{s.played}</td>
                  <td className="px-2 py-2.5 text-center text-gray-500">{s.wins}</td>
                  <td className="px-2 py-2.5 text-center text-gray-500">{s.draws}</td>
                  <td className="px-2 py-2.5 text-center text-gray-500">{s.losses}</td>
                  <td className="px-2 py-2.5 text-center text-gray-500">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                  <td className="px-2 py-2.5 text-center font-bold text-[#0B1F3A]">{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-1.5 border-t border-gray-100 flex gap-3 text-[10px] text-gray-400">
            <span><span className="inline-block w-2 h-2 bg-green-200 rounded-sm mr-1" />Advance</span>
            <span><span className="inline-block w-2 h-2 bg-yellow-200 rounded-sm mr-1" />Best 3rd?</span>
          </div>
        </div>

        {/* Best 3rd places */}
        {best3rds.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-sm font-bold">Best 3rd Places <span className="text-white/60 font-normal text-xs">(top 8 qualify)</span></div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="px-3 py-2 text-left">Team</th>
                  <th className="px-2 py-2 text-center">Grp</th>
                  <th className="px-2 py-2 text-center">GD</th>
                  <th className="px-2 py-2 text-center font-bold text-[#0B1F3A]">Pts</th>
                </tr>
              </thead>
              <tbody>
                {best3rds.map((r, i) => (
                  <tr key={r.team.id} className={`border-t border-gray-50 ${r.qualifies ? 'bg-green-50' : ''}`}>
                    <td className="px-3 py-2 flex items-center gap-1.5">
                      <span className="text-gray-300 text-[10px] w-3">{i + 1}</span>
                      {r.team.fifa_code && <img src={flagUrl(r.team.fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />}
                      <span className={`font-medium truncate max-w-[80px] ${r.qualifies ? 'text-[#0B1F3A]' : 'text-gray-400'}`}>{getTeamName(r.team.fifa_code, lang) ?? r.team.name}</span>
                    </td>
                    <td className="px-2 py-2 text-center text-gray-500">{r.group}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                    <td className={`px-2 py-2 text-center font-bold ${r.qualifies ? 'text-green-600' : 'text-gray-400'}`}>{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 px-3 py-1.5 border-t border-gray-100">Based on actual results so far</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Bracket tab ───────────────────────────────────────────────────────────────

// Slot ordering mirrors the predictions bracket (left→center→right)
const BRACKET_LEFT_R32  = [2, 5, 1, 3, 11, 12, 9, 10]
const BRACKET_LEFT_R16  = [17, 18, 21, 22]
const BRACKET_LEFT_QF   = [25, 26]
const BRACKET_LEFT_SF   = [29]
const BRACKET_RIGHT_SF  = [30]
const BRACKET_RIGHT_QF  = [27, 28]
const BRACKET_RIGHT_R16 = [19, 20, 23, 24]
const BRACKET_RIGHT_R32 = [4, 6, 7, 8, 14, 16, 13, 15]

function BracketMatchCard({ match }: { match: MatchRow | undefined }) {
  const { lang } = useTranslation()
  if (!match) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 p-2 shadow-sm opacity-40">
        <div className="flex flex-col gap-1">
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-5 h-3.5 bg-gray-100 rounded-sm flex-shrink-0" />
              <span className="flex-1 text-[11px] text-gray-300">TBD</span>
              <span className="w-5 text-right text-xs text-gray-200">–</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const played = match.actual_home_score !== null && match.actual_away_score !== null
  const homeWins = played && match.actual_home_score! > match.actual_away_score!
  const awayWins = played && match.actual_away_score! > match.actual_home_score!

  return (
    <div className={`bg-white rounded-lg border-l-4 p-2 shadow-sm ${played ? 'border-green-500' : 'border-gray-200'}`}>
      <div className="flex flex-col gap-1">
        {([
          { team: match.home_team, score: match.actual_home_score, wins: homeWins },
          { team: match.away_team, score: match.actual_away_score, wins: awayWins },
        ] as const).map(({ team, score, wins }, idx) => (
          <div key={idx} className={`flex items-center gap-1.5 rounded px-0.5 ${wins ? 'bg-green-50' : ''}`}>
            {team?.fifa_code
              ? <img src={flagUrl(team.fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm flex-shrink-0" />
              : <span className="w-5 h-3.5 bg-gray-100 rounded-sm flex-shrink-0" />}
            <span className={`flex-1 min-w-0 text-[11px] font-medium truncate ${team ? (wins ? 'text-green-700' : 'text-[#0B1F3A]') : 'text-gray-300'}`}>
              {team ? (getTeamName(team.fifa_code, lang) ?? team.name) : 'TBD'}
            </span>
            <span className={`text-xs font-bold flex-shrink-0 w-4 text-right ${wins ? 'text-green-700' : 'text-[#0B1F3A]'}`}>
              {score !== null ? score : (team ? '–' : '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketTab({ matches }: { matches: MatchRow[] }) {
  const { t, lang } = useTranslation()
  const bySlot = new Map<number, MatchRow>()
  for (const m of matches) {
    if (m.bracket_slot !== null) bySlot.set(m.bracket_slot, m)
  }

  const hasKO = bySlot.size > 0

  if (!hasKO) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-4xl">🏆</div>
      <p className="text-gray-500 text-sm">{t('res_no_bracket')}</p>
    </div>
  )

  const BracketColumn = ({ title, slots, className = '' }: { title: string; slots: number[]; className?: string }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100">{title}</div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {slots.map(slot => <BracketMatchCard key={slot} match={bySlot.get(slot)} />)}
      </div>
    </div>
  )

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[1100px] flex gap-1.5 items-stretch">
        <BracketColumn title={t('ko_r32')} slots={BRACKET_LEFT_R32}  className="flex-1 min-w-[120px]" />
        <BracketColumn title={t('ko_r16')} slots={BRACKET_LEFT_R16}  className="flex-1 min-w-[120px]" />
        <BracketColumn title={t('ko_qf')}  slots={BRACKET_LEFT_QF}   className="flex-1 min-w-[120px]" />
        <BracketColumn title={t('ko_sf')}  slots={BRACKET_LEFT_SF}   className="flex-1 min-w-[120px]" />

        {/* Center: Final + 3rd */}
        <div className="flex flex-col justify-center gap-3 flex-1 min-w-[120px] mx-0.5">
          <div className="text-[10px] font-bold text-center text-[#0B1F3A] uppercase tracking-widest pb-1 border-b border-[#0B1F3A]/20">{t('ko_final')}</div>
          <BracketMatchCard match={bySlot.get(32)} />
          <div className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100 mt-2">{t('ko_third')}</div>
          <BracketMatchCard match={bySlot.get(31)} />
        </div>

        <BracketColumn title={t('ko_sf')}  slots={BRACKET_RIGHT_SF}  className="flex-1 min-w-[120px]" />
        <BracketColumn title={t('ko_qf')}  slots={BRACKET_RIGHT_QF}  className="flex-1 min-w-[120px]" />
        <BracketColumn title={t('ko_r16')} slots={BRACKET_RIGHT_R16} className="flex-1 min-w-[120px]" />
        <BracketColumn title={t('ko_r32')} slots={BRACKET_RIGHT_R32} className="flex-1 min-w-[120px]" />
      </div>
    </div>
  )
}
