'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import type { Team, Match } from '@/lib/supabase/types'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
}

type PredMap = Record<string, { home: string; away: string }>

interface TeamStat {
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  pts: number
  gd: number
}

function calcStandings(groupMatches: MatchWithTeams[], groupTeams: Team[], preds: PredMap): TeamStat[] {
  const stats = new Map<string, TeamStat>()
  for (const t of groupTeams) {
    stats.set(t.id, { team: t, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0, gd: 0 })
  }
  for (const m of groupMatches) {
    const pred = preds[m.id]
    if (!pred || pred.home === '' || pred.away === '') continue
    const h = parseInt(pred.home), a = parseInt(pred.away)
    if (isNaN(h) || isNaN(a) || !m.home_team_id || !m.away_team_id) continue
    const home = stats.get(m.home_team_id)
    const away = stats.get(m.away_team_id)
    if (!home || !away) continue
    home.played++; away.played++
    home.gf += h; home.ga += a; away.gf += a; away.ga += h
    if (h > a) { home.wins++; away.losses++ }
    else if (h < a) { away.wins++; home.losses++ }
    else { home.draws++; away.draws++ }
  }
  const rows = Array.from(stats.values()).map(s => ({ ...s, pts: s.wins * 3 + s.draws, gd: s.gf - s.ga }))
  return rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name))
}

export default function GroupPredictionsPage() {
  const [activeGroup, setActiveGroup] = useState('A')
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [preds, setPreds] = useState<PredMap>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [dbError, setDbError] = useState<string | null>(null)
  const isLocked = new Date() >= LOCK_AT

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const [matchRes, teamRes, predRes] = await Promise.all([
        supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)').eq('stage', 'group').order('kickoff_at'),
        supabase.from('teams').select('*'),
        supabase.from('predictions_group').select('*').eq('user_id', user.id),
      ])

      if (matchRes.error) { setDbError(matchRes.error.message); setLoading(false); return }

      setMatches((matchRes.data ?? []) as MatchWithTeams[])
      setTeams(teamRes.data ?? [])

      const predMap: PredMap = {}
      let count = 0
      for (const p of predRes.data ?? []) {
        if (p.pred_home_score !== null && p.pred_away_score !== null) {
          predMap[p.match_id] = { home: String(p.pred_home_score), away: String(p.pred_away_score) }
          count++
        }
      }
      setPreds(predMap)
      setSavedCount(count)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(async (matchId: string) => {
    if (!userId || isLocked) return
    const pred = preds[matchId]
    if (!pred || pred.home === '' || pred.away === '') return
    const homeScore = parseInt(pred.home), awayScore = parseInt(pred.away)
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) return

    setSavingIds(s => new Set([...s, matchId]))
    const { error } = await supabase.from('predictions_group').upsert(
      { user_id: userId, match_id: matchId, pred_home_score: homeScore, pred_away_score: awayScore, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,match_id' }
    )
    setSavingIds(s => { const n = new Set(s); n.delete(matchId); return n })
    if (!error) setSavedCount(c => preds[matchId] ? c : c + 1)
  }, [userId, isLocked, preds, supabase])

  const groupMatches = matches.filter(m => m.group_letter === activeGroup)
  const groupTeams = teams.filter(t => t.group_letter === activeGroup)

  // Live standings for active group
  const standings = useMemo(() => calcStandings(groupMatches, groupTeams, preds), [groupMatches, groupTeams, preds])

  // Best 3rd places: take 3rd from every group, sort
  const best3rds = useMemo(() => {
    return GROUPS.map(g => {
      const gMatches = matches.filter(m => m.group_letter === g)
      const gTeams = teams.filter(t => t.group_letter === g)
      const s = calcStandings(gMatches, gTeams, preds)
      return s[2] ? { group: g, ...s[2] } : null
    })
      .filter(Boolean)
      .sort((a, b) => b!.pts - a!.pts || b!.gd - a!.gd || b!.gf - a!.gf)
      .map((r, i) => ({ ...r!, qualifies: i < 8 }))
  }, [matches, teams, preds])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading predictions…</div>

  if (!userId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">Sign in to make predictions</h2>
      <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">Sign in</a>
    </div>
  )

  if (matches.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
      <div className="text-4xl">🏗️</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">No matches found</h2>
      {dbError
        ? <p className="text-red-500 max-w-sm text-sm font-mono bg-red-50 px-3 py-2 rounded">{dbError}</p>
        : <p className="text-gray-500 max-w-sm text-sm">Run the migrations in <code className="bg-gray-100 px-1 rounded">supabase/migrations/</code> to get started.</p>
      }
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Group Predictions</h1>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-[#0B1F3A]">{savedCount}</span> / 72 saved
          {isLocked && <span className="ml-3 text-red-600 font-semibold">Predictions locked</span>}
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        {GROUPS.map(g => {
          const gCount = matches.filter(m => m.group_letter === g && preds[m.id]?.home !== undefined).length
          return (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${activeGroup === g ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {g}
              {gCount === 6 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
            </button>
          )
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* LEFT: matches */}
        <div className="flex flex-col gap-3">
          {groupMatches.map(match => {
            const pred = preds[match.id] ?? { home: '', away: '' }
            const saving = savingIds.has(match.id)
            const kickoff = match.kickoff_at
              ? new Date(match.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
              : ''
            const homeCode = (match.home_team as any)?.fifa_code
            const awayCode = (match.away_team as any)?.fifa_code

            return (
              <div key={match.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="text-xs text-gray-400 mb-2">{kickoff}{match.venue ? ` · ${match.venue}` : ''}</div>
                <div className="flex items-center gap-2">
                  {/* Home */}
                  <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 overflow-hidden">
                    <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{match.home_team?.name ?? '?'}</span>
                    {homeCode && <img src={flagUrl(homeCode, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0" />}
                  </div>
                  {/* Inputs */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="number" min={0} max={99} inputMode="numeric" disabled={isLocked} value={pred.home}
                      onChange={e => setPreds(p => ({ ...p, [match.id]: { ...pred, home: e.target.value } }))}
                      onBlur={() => handleBlur(match.id)}
                      className="w-11 text-center border border-gray-300 rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-50" />
                    <span className="text-gray-400 font-bold text-xs">–</span>
                    <input type="number" min={0} max={99} inputMode="numeric" disabled={isLocked} value={pred.away}
                      onChange={e => setPreds(p => ({ ...p, [match.id]: { ...pred, away: e.target.value } }))}
                      onBlur={() => handleBlur(match.id)}
                      className="w-11 text-center border border-gray-300 rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-50" />
                  </div>
                  {/* Away */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                    {awayCode && <img src={flagUrl(awayCode, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0" />}
                    <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{match.away_team?.name ?? '?'}</span>
                  </div>
                  {/* Save indicator */}
                  <div className="w-4 text-center flex-shrink-0">
                    {saving ? <span className="text-xs text-yellow-500">…</span>
                      : preds[match.id]?.home !== undefined ? <span className="text-xs text-green-600">✓</span>
                      : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* RIGHT: live standings */}
        <div className="lg:sticky lg:top-24 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-sm font-bold">Group {activeGroup} Standings</div>
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
                    <td className="px-3 py-2 flex items-center gap-1.5">
                      <span className="text-gray-300 text-[10px] w-3">{i + 1}</span>
                      {(s.team as any).fifa_code && (
                        <img src={flagUrl((s.team as any).fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />
                      )}
                      <span className="font-medium text-[#0B1F3A] truncate max-w-[80px]">{s.team.name}</span>
                    </td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.played}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.wins}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.draws}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.losses}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                    <td className="px-2 py-2 text-center font-bold text-[#0B1F3A]">{s.pts}</td>
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
                        {(r.team as any).fifa_code && (
                          <img src={flagUrl((r.team as any).fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />
                        )}
                        <span className={`font-medium truncate max-w-[80px] ${r.qualifies ? 'text-[#0B1F3A]' : 'text-gray-400'}`}>{r.team.name}</span>
                      </td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.group}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      <td className={`px-2 py-2 text-center font-bold ${r.qualifies ? 'text-green-600' : 'text-gray-400'}`}>{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 px-3 py-1.5 border-t border-gray-100">Based on your predictions so far</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
