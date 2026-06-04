'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

interface TeamRow { id: string; name: string; flag_emoji: string; fifa_code: string }
interface MatchRow {
  id: string
  group_letter: string | null
  kickoff_at: string | null
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  home_team: TeamRow | null
  away_team: TeamRow | null
}
interface PredRow { user_id: string; match_id: string; pred_home_score: number; pred_away_score: number }
interface UserRow { id: string; display_name: string | null }

interface SimScore { userId: string; name: string; pts: number; breakdown: number[] }

function calcPts(predH: number, predA: number, realH: number, realA: number): number {
  if (predH === realH && predA === realA) return 3
  const predGD = predH - predA
  const realGD = realH - realA
  if (predGD === realGD) return 2
  const predOutcome = Math.sign(predGD)
  const realOutcome = Math.sign(realGD)
  if (predOutcome === realOutcome) return 1
  return 0
}

export default function SimulatePage() {
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [preds, setPreds] = useState<PredRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState('A')
  // Hypothetical scores: matchId → {h, a}
  const [hypo, setHypo] = useState<Record<string, { h: string; a: string }>>({})

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(id,name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(id,name,flag_emoji,fifa_code)').eq('stage', 'group').order('kickoff_at'),
      supabase.from('predictions_group').select('user_id, match_id, pred_home_score, pred_away_score'),
      supabase.from('users').select('id, display_name'),
    ]).then(([mRes, pRes, uRes]) => {
      const ms = (mRes.data ?? []) as MatchRow[]
      setMatches(ms)
      setPreds((pRes.data ?? []) as PredRow[])
      setUsers((uRes.data ?? []) as UserRow[])
      // Pre-fill hypo with actual results where known
      const init: Record<string, { h: string; a: string }> = {}
      for (const m of ms) {
        if (m.home_score !== null && m.away_score !== null) {
          init[m.id] = { h: String(m.home_score), a: String(m.away_score) }
        }
      }
      setHypo(init)
      setLoading(false)
    })
  }, [])

  const setScore = (matchId: string, side: 'h' | 'a', val: string) => {
    setHypo(prev => ({ ...prev, [matchId]: { ...(prev[matchId] ?? { h: '', a: '' }), [side]: val } }))
  }

  // Compute simulated leaderboard
  const simLeaderboard = useMemo<SimScore[]>(() => {
    const predMap = new Map<string, Map<string, { h: number; a: number }>>()
    for (const p of preds) {
      if (!predMap.has(p.user_id)) predMap.set(p.user_id, new Map())
      predMap.get(p.user_id)!.set(p.match_id, { h: p.pred_home_score, a: p.pred_away_score })
    }

    const scores = users.map(u => {
      let pts = 0
      const breakdown: number[] = []
      for (const m of matches) {
        const result = hypo[m.id]
        if (!result || result.h === '' || result.a === '') continue
        const rH = parseInt(result.h)
        const rA = parseInt(result.a)
        if (isNaN(rH) || isNaN(rA)) continue
        const userPred = predMap.get(u.id)?.get(m.id)
        if (!userPred) continue
        const p = calcPts(userPred.h, userPred.a, rH, rA)
        pts += p
        breakdown.push(p)
      }
      return {
        userId: u.id,
        name: u.display_name ?? u.id.slice(0, 8),
        pts,
        breakdown,
      }
    })

    return scores.sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name))
  }, [hypo, preds, users, matches])

  const groupMatches = matches.filter(m => m.group_letter === activeGroup)

  const filledCount = matches.filter(m => {
    const s = hypo[m.id]
    return s && s.h !== '' && s.a !== ''
  }).length

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading…</div>
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <div className="text-4xl">🏗️</div>
        <h2 className="text-xl font-bold text-[#0B1F3A]">No match data yet</h2>
        <p className="text-gray-500 text-sm">Run database migrations to load the match schedule.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Hypothetical Results</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter any scores below to see how the leaderboard would change. Nothing is saved.{' '}
          <span className="font-medium text-[#0B1F3A]">{filledCount} / {matches.length} scores entered</span>
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: match score entry */}
        <div>
          {/* Group tabs */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {GROUPS.map(g => {
              const gMatches = matches.filter(m => m.group_letter === g)
              const gFilled = gMatches.filter(m => { const s = hypo[m.id]; return s && s.h !== '' && s.a !== '' }).length
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${
                    activeGroup === g ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {g}
                  {gFilled === gMatches.length && gMatches.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2">
            {groupMatches.map(m => {
              const score = hypo[m.id] ?? { h: '', a: '' }
              const isActual = m.home_score !== null
              const kickoff = m.kickoff_at
                ? new Date(m.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
                : ''
              return (
                <div key={m.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${isActual ? 'border-green-400' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] text-gray-400">{kickoff}</span>
                    {isActual && <span className="text-[10px] text-green-600 font-semibold">Official result</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 text-right text-xs sm:text-sm font-semibold text-[#0B1F3A] truncate">
                      {m.home_team?.flag_emoji} {m.home_team?.name}
                    </span>
                    <input
                      type="number" min={0} max={99} inputMode="numeric"
                      value={score.h}
                      onChange={e => setScore(m.id, 'h', e.target.value)}
                      className="w-11 flex-shrink-0 text-center border border-gray-300 rounded-lg py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                    />
                    <span className="text-gray-400 font-bold text-xs flex-shrink-0">–</span>
                    <input
                      type="number" min={0} max={99} inputMode="numeric"
                      value={score.a}
                      onChange={e => setScore(m.id, 'a', e.target.value)}
                      className="w-11 flex-shrink-0 text-center border border-gray-300 rounded-lg py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
                    />
                    <span className="flex-1 min-w-0 text-xs sm:text-sm font-semibold text-[#0B1F3A] truncate">
                      {m.away_team?.name} {m.away_team?.flag_emoji}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: live leaderboard */}
        <div className="lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-[#0B1F3A] mb-3">Simulated Leaderboard</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {simLeaderboard.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No predictions to score yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0B1F3A] text-white">
                    <th className="py-2.5 px-3 text-left w-8">#</th>
                    <th className="py-2.5 px-3 text-left">Player</th>
                    <th className="py-2.5 px-3 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {simLeaderboard.map((entry, idx) => {
                    const rank = idx === 0 ? 1 : entry.pts < simLeaderboard[idx - 1].pts ? idx + 1 : simLeaderboard[idx - 1].pts === entry.pts ? (idx === 0 ? 1 : simLeaderboard.findIndex(e => e.pts === entry.pts) + 1) : idx + 1
                    return (
                      <tr key={entry.userId} className={`border-t border-gray-100 ${idx === 0 ? 'bg-yellow-50' : idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="py-2.5 px-3 font-bold text-gray-500 text-xs">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-[#0B1F3A] truncate max-w-[120px]">{entry.name}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-green-600">{entry.pts}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <p className="text-[10px] text-gray-400 px-3 py-2 border-t border-gray-100">
              Based on {filledCount} entered scores · not saved
            </p>
          </div>
          <button
            onClick={() => {
              const reset: Record<string, { h: string; a: string }> = {}
              for (const m of matches) {
                if (m.home_score !== null && m.away_score !== null) {
                  reset[m.id] = { h: String(m.home_score), a: String(m.away_score) }
                }
              }
              setHypo(reset)
            }}
            className="mt-3 w-full text-sm text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
          >
            ↺ Reset to actual results
          </button>
        </div>
      </div>
    </div>
  )
}
