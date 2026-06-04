'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import type { Team } from '@/lib/supabase/types'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const KO_STAGES = [
  { key: 'r32', label: 'Round of 32' },
  { key: 'r16', label: 'Round of 16' },
  { key: 'qf',  label: 'Quarterfinals' },
  { key: 'sf',  label: 'Semifinals' },
  { key: 'third', label: 'Third Place' },
  { key: 'final', label: 'Final' },
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

type PageTab = 'results' | 'standings' | 'bracket'

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
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState('A')
  const [activeKoStage, setActiveKoStage] = useState('r32')
  const [tab, setTab] = useState<PageTab>('results')

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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading results…</div>

  if (matches.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
      <div className="text-4xl">🏗️</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">No match data yet</h2>
      <p className="text-gray-500 text-sm max-w-sm">Results will appear here once matches are played and the database is seeded.</p>
    </div>
  )

  const groupMatches = matches.filter(m => m.stage === 'group' && m.group_letter === activeGroup)
  const koMatches = matches.filter(m => m.stage === activeKoStage)
  const played = matches.filter(m => m.actual_home_score !== null).length
  const total = matches.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Match Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">{played} of {total} matches played</p>
        </div>
        <div className="w-40">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${total > 0 ? Math.round((played / total) * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{total > 0 ? Math.round((played / total) * 100) : 0}% complete</p>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(['results', 'standings', 'bracket'] as PageTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
              tab === t ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'results' ? 'Match Results' : t === 'standings' ? 'Group Standings' : 'Bracket'}
          </button>
        ))}
      </div>

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
  const [section, setSection] = useState<'group' | 'knockout'>('group')

  return (
    <>
      <div className="flex gap-4 border-b border-gray-200 mb-5">
        {(['group', 'knockout'] as const).map(t => (
          <button key={t} onClick={() => setSection(t)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              section === t ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'group' ? 'Group Stage' : 'Knockout Stage'}
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
                <span className="hidden sm:inline">Group {g}</span>
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
                {s.label}
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
  if (matches.length === 0) return <p className="text-gray-400 text-sm text-center py-10">No matches in this selection yet.</p>
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
                <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{m.home_team?.name ?? '?'}</span>
                {m.home_team?.fifa_code && <img src={flagUrl(m.home_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
              </div>
              <div className="text-center flex-shrink-0 min-w-[56px]">
                {played
                  ? <span className="font-black text-xl text-[#0B1F3A]">{m.actual_home_score} – {m.actual_away_score}</span>
                  : <span className="text-sm text-gray-400 font-medium">vs</span>}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                {m.away_team?.fifa_code && <img src={flagUrl(m.away_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
                <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{m.away_team?.name ?? '?'}</span>
              </div>
            </div>
            {!played && <div className="text-center mt-2"><span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not played yet</span></div>}
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
                    <span className="font-medium text-[#0B1F3A] truncate max-w-[100px]">{s.team.name}</span>
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
                      <span className={`font-medium truncate max-w-[80px] ${r.qualifies ? 'text-[#0B1F3A]' : 'text-gray-400'}`}>{r.team.name}</span>
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

function BracketTab({ matches }: { matches: MatchRow[] }) {
  const koStages = ['r32', 'r16', 'qf', 'sf', 'final', 'third']
  const stageMatches = (stage: string) => matches.filter(m => m.stage === stage).sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0))
  const hasKO = koStages.some(s => stageMatches(s).length > 0)

  if (!hasKO) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-4xl">🏆</div>
      <p className="text-gray-500 text-sm">Knockout bracket will appear once the group stage concludes.</p>
    </div>
  )

  const stageDefs = [
    { key: 'r32', label: 'Round of 32' },
    { key: 'r16', label: 'Round of 16' },
    { key: 'qf', label: 'Quarterfinals' },
    { key: 'sf', label: 'Semifinals' },
    { key: 'final', label: 'Final' },
    { key: 'third', label: '3rd Place' },
  ]

  return (
    <div className="space-y-6">
      {stageDefs.map(({ key, label }) => {
        const ms = stageMatches(key)
        if (ms.length === 0) return null
        return (
          <div key={key}>
            <h2 className="text-base font-bold text-[#0B1F3A] mb-3">{label}</h2>
            <div className={`grid gap-3 ${ms.length > 2 ? 'sm:grid-cols-2' : ''}`}>
              {ms.map(m => {
                const played = m.actual_home_score !== null && m.actual_away_score !== null
                return (
                  <div key={m.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${played ? 'border-green-500' : 'border-gray-200'}`}>
                    <div className="flex flex-col gap-2">
                      {[{ team: m.home_team, score: m.actual_home_score }, { team: m.away_team, score: m.actual_away_score }].map(({ team, score }, idx) => {
                        const isWinner = played && (
                          idx === 0 ? m.actual_home_score! > m.actual_away_score! : m.actual_away_score! > m.actual_home_score!
                        )
                        return (
                          <div key={idx} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${isWinner ? 'bg-green-50' : ''}`}>
                            {team?.fifa_code
                              ? <img src={flagUrl(team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />
                              : <span className="w-6 h-4 bg-gray-100 rounded-sm flex-shrink-0" />}
                            <span className={`flex-1 min-w-0 text-sm font-semibold truncate ${isWinner ? 'text-green-700' : 'text-[#0B1F3A]'}`}>
                              {team?.name ?? 'TBD'}
                            </span>
                            <span className={`text-lg font-black flex-shrink-0 w-6 text-right ${isWinner ? 'text-green-700' : 'text-[#0B1F3A]'}`}>
                              {score !== null ? score : '–'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
