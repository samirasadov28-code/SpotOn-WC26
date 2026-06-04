'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

const GROUP_MATCHES_TOTAL = 72

interface UserLeague {
  id: string
  name: string
  join_code: string
}

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

interface ScoreBreakdown {
  groupExact: number    // 3-pt hits
  groupGD: number       // 2-pt hits
  groupOutcome: number  // 1-pt hits
  groupTotal: number
  advTotal: number
  koExact: number
  koGD: number
  koOutcome: number
  koTotal: number
}

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
    const predOutcome = Math.sign(predGD), actualOutcome = Math.sign(actualGD)
    if (predOutcome === actualOutcome) groupOutcome++
  }
  let koExact = 0, koGD = 0, koOutcome = 0
  for (const p of koPreds) {
    if (p.pred_home === p.actual_home && p.pred_away === p.actual_away) { koExact++; continue }
    const predGD = p.pred_home - p.pred_away, actualGD = p.actual_home - p.actual_away
    if (predGD === actualGD) { koGD++; continue }
    const predOutcome = Math.sign(predGD), actualOutcome = Math.sign(actualGD)
    if (predOutcome === actualOutcome) koOutcome++
  }
  return {
    groupExact, groupGD, groupOutcome,
    groupTotal: groupExact * 3 + groupGD * 2 + groupOutcome,
    advTotal,
    koExact, koGD, koOutcome,
    koTotal: koExact * 3 + koGD * 2 + koOutcome,
  }
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [breakdowns, setBreakdowns] = useState<Record<string, ScoreBreakdown>>({})
  const [loadingBreakdown, setLoadingBreakdown] = useState<string | null>(null)
  const [userLeagues, setUserLeagues] = useState<UserLeague[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('global')
  const [leagueMembers, setLeagueMembers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const [userRes, scoreRes, predRes, koPredRes, authRes] = await Promise.all([
      supabase.from('users').select('id, display_name'),
      supabase.from('scores').select('*'),
      supabase.from('predictions_group').select('user_id'),
      supabase.from('predictions_knockout').select('user_id'),
      supabase.auth.getUser(),
    ])

    const uid = authRes.data.user?.id ?? null
    setCurrentUserId(uid)

    // Load user's leagues
    if (uid) {
      const { data: memberships } = await (supabase as any)
        .from('league_members').select('league_id').eq('user_id', uid)
      if (memberships?.length) {
        const ids = memberships.map((m: any) => m.league_id)
        const { data: leagues } = await (supabase as any)
          .from('leagues').select('id, name, join_code').in('id', ids)
        setUserLeagues(leagues ?? [])
      }
    }

    const users: { id: string; display_name: string | null }[] = userRes.data ?? []
    const scores = new Map((scoreRes.data ?? []).map((s: any) => [s.user_id, s]))
    const predCounts = new Map<string, number>()
    for (const p of (predRes.data ?? []) as { user_id: string }[]) {
      predCounts.set(p.user_id, (predCounts.get(p.user_id) ?? 0) + 1)
    }

    // Include any user who has predictions but no users row (upsert may have failed at signup)
    const knownUserIds = new Set(users.map(u => u.id))
    const allPredUserIds = new Set([
      ...(predRes.data ?? []).map((p: any) => p.user_id),
      ...(koPredRes.data ?? []).map((p: any) => p.user_id),
    ])
    for (const id of allPredUserIds) {
      if (!knownUserIds.has(id)) {
        users.push({ id, display_name: null })
      }
    }

    const built: Omit<LeaderboardEntry, 'rank'>[] = users.map((u) => {
      const s = scores.get(u.id)
      return {
        userId: u.id,
        displayName: u.display_name ?? `User ${u.id.slice(0, 6)}`,
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
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBreakdown = async (userId: string, advTotal: number) => {
    if (breakdowns[userId]) return
    setLoadingBreakdown(userId)
    const [gpRes, matchRes, kpRes, koMatchRes] = await Promise.all([
      (supabase as any).from('predictions_group').select('match_id, pred_home_score, pred_away_score').eq('user_id', userId),
      (supabase as any).from('matches').select('id, actual_home_score, actual_away_score').eq('stage', 'group').not('actual_home_score', 'is', null),
      (supabase as any).from('predictions_knockout').select('bracket_slot, pred_home_score, pred_away_score').eq('user_id', userId),
      (supabase as any).from('matches').select('id, bracket_slot, actual_home_score, actual_away_score').eq('stage', 'knockout').not('actual_home_score', 'is', null),
    ])

    const actualGroupMap = new Map((matchRes.data ?? []).map((m: any) => [m.id, m]))
    const groupPreds = (gpRes.data ?? []).filter((p: any) => actualGroupMap.has(p.match_id)).map((p: any) => {
      const m = actualGroupMap.get(p.match_id)
      return { pred_home: p.pred_home_score, pred_away: p.pred_away_score, actual_home: m.actual_home_score, actual_away: m.actual_away_score }
    })

    const actualKoMap = new Map((koMatchRes.data ?? []).map((m: any) => [m.bracket_slot, m]))
    const koPreds = (kpRes.data ?? []).filter((p: any) => actualKoMap.has(p.bracket_slot)).map((p: any) => {
      const m = actualKoMap.get(p.bracket_slot)
      return { pred_home: p.pred_home_score, pred_away: p.pred_away_score, actual_home: m.actual_home_score, actual_away: m.actual_away_score }
    })

    const bd = calcBreakdown(groupPreds, koPreds, advTotal)
    setBreakdowns(prev => ({ ...prev, [userId]: bd }))
    setLoadingBreakdown(null)
  }

  const handleRowClick = async (entry: LeaderboardEntry) => {
    const isOpen = expandedId === entry.userId
    setExpandedId(isOpen ? null : entry.userId)
    if (!isOpen) await loadBreakdown(entry.userId, entry.advancementPts)
  }

  const handleLeagueChange = async (leagueId: string) => {
    setSelectedLeagueId(leagueId)
    setExpandedId(null)
    if (leagueId === 'global') { setLeagueMembers(new Set()); return }
    const { data } = await (supabase as any)
      .from('league_members').select('user_id').eq('league_id', leagueId)
    setLeagueMembers(new Set((data ?? []).map((r: any) => r.user_id)))
  }

  const visibleEntries = selectedLeagueId === 'global'
    ? entries
    : entries.filter(e => leagueMembers.has(e.userId)).map((e, i, arr) => {
        // Re-rank within the league
        let rank = 1
        if (i > 0 && e.totalPts < arr[i - 1].totalPts) rank = i + 1
        else if (i > 0) rank = arr[i - 1].rank ?? i + 1
        return { ...e, rank: i === 0 ? 1 : (e.totalPts < arr[i-1].totalPts ? i + 1 : (arr[i-1] as any).rank) }
      })

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading leaderboard…</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Leaderboard</h1>
        {lastUpdated && <div className="text-xs text-gray-400">Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</div>}
      </div>

      {/* League selector */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-semibold text-gray-600 shrink-0">View:</label>
        <select
          value={selectedLeagueId}
          onChange={e => handleLeagueChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] bg-white"
        >
          <option value="global">🌍 Global (all players)</option>
          {userLeagues.map(l => (
            <option key={l.id} value={l.id}>🏅 {l.name}</option>
          ))}
        </select>
        {userLeagues.length === 0 && (
          <a href="/league" className="text-xs text-[#0B1F3A] underline underline-offset-2 hover:opacity-70">
            Create or join a league →
          </a>
        )}
      </div>

      {/* Scoring legend */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-900 flex flex-wrap gap-x-5 gap-y-1.5">
        <span className="font-bold text-amber-800">How points work:</span>
        <span>⚽ <strong>Group Pts</strong> — 3 exact score · 2 correct GD · 1 correct outcome</span>
        <span>🏅 <strong>Advancement</strong> — bonus pts for each team you correctly advance past group stage</span>
        <span>🏆 <strong>Playoff Pts</strong> — same 1/2/3 scoring for R32→Final matches</span>
        <span className="text-amber-700 italic">Click any row for full breakdown ↓</span>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          {selectedLeagueId === 'global' ? 'No players yet. Be the first to join!' : 'No members in this league yet.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B1F3A] text-white">
                <th className="py-3 px-3 text-left w-10">#</th>
                <th className="py-3 px-3 text-left">Player</th>
                <th className="py-3 px-3 text-center" title="Group predictions submitted">Preds</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell" title="Points from group stage match results (1/2/3 pts each)">Group ⚽</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell" title="Bonus points for correctly predicting group stage advancement">Advance 🏅</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell" title="Points from playoff round match results (1/2/3 pts each)">Playoff 🏆</th>
                <th className="py-3 px-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry, idx) => {
                const isMe = entry.userId === currentUserId
                const isComplete = entry.predictionCount >= GROUP_MATCHES_TOTAL
                const pctDone = Math.min(100, Math.round((entry.predictionCount / GROUP_MATCHES_TOTAL) * 100))
                const isExpanded = expandedId === entry.userId
                const bd = breakdowns[entry.userId]

                return (
                  <>
                    <tr
                      key={entry.userId}
                      onClick={() => handleRowClick(entry)}
                      className={`border-t border-gray-100 cursor-pointer transition-colors hover:bg-blue-50/50 ${
                        isMe ? 'bg-blue-50 font-semibold' : entry.rank === 1 ? 'bg-yellow-50' : idx % 2 === 0 ? '' : 'bg-gray-50/50'
                      } ${isExpanded ? 'border-b-0' : ''}`}
                    >
                      <td className="py-3 px-3 font-bold text-gray-500 text-base">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </td>
                      <td className="py-3 px-3 text-[#0B1F3A] max-w-[120px] sm:max-w-none">
                        <div className="truncate flex items-center gap-1.5">
                          {entry.displayName}
                          <span className="text-gray-300 text-xs">▾</span>
                        </div>
                        {isMe && <div className="text-xs text-blue-500 font-normal">(you)</div>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isComplete
                          ? <span className="text-green-600 font-semibold text-xs">✅</span>
                          : entry.predictionCount === 0
                          ? <span className="text-gray-300 text-xs">—</span>
                          : <span className="text-orange-500 text-xs font-medium">{pctDone}%</span>}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.groupPts}</td>
                      <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.advancementPts}</td>
                      <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.knockoutPts}</td>
                      <td className="py-3 px-3 text-right font-bold text-green-600 text-base">{entry.totalPts}</td>
                    </tr>

                    {/* Expanded breakdown row */}
                    {isExpanded && (
                      <tr key={`${entry.userId}-breakdown`} className={`border-t-0 ${isMe ? 'bg-blue-50' : entry.rank === 1 ? 'bg-yellow-50' : ''}`}>
                        <td colSpan={7} className="px-4 pb-4 pt-1">
                          {loadingBreakdown === entry.userId ? (
                            <div className="text-xs text-gray-400 py-2">Loading breakdown…</div>
                          ) : bd ? (
                            <div className="grid sm:grid-cols-3 gap-3 mt-1">
                              {/* Group stage */}
                              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">⚽ Group Stage <span className="text-gray-400 font-normal ml-auto">{bd.groupTotal} pts</span></div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <div className="flex justify-between"><span>🎯 Exact score <span className="text-gray-400">(×3)</span></span><span className="font-semibold text-green-600">{bd.groupExact} × 3 = {bd.groupExact * 3}</span></div>
                                  <div className="flex justify-between"><span>📐 Correct GD <span className="text-gray-400">(×2)</span></span><span className="font-semibold text-blue-600">{bd.groupGD} × 2 = {bd.groupGD * 2}</span></div>
                                  <div className="flex justify-between"><span>✅ Correct outcome <span className="text-gray-400">(×1)</span></span><span className="font-semibold text-gray-600">{bd.groupOutcome} × 1 = {bd.groupOutcome}</span></div>
                                </div>
                              </div>
                              {/* Advancement */}
                              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">🏅 Group Advancement <span className="text-gray-400 font-normal ml-auto">{bd.advTotal} pts</span></div>
                                <p className="text-xs text-gray-500 leading-relaxed">Bonus points awarded for each team you correctly predicted to advance from the group stage. Points scale per round — see Rules for full table.</p>
                              </div>
                              {/* Knockout */}
                              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">🏆 Playoff Matches <span className="text-gray-400 font-normal ml-auto">{bd.koTotal} pts</span></div>
                                {bd.koExact + bd.koGD + bd.koOutcome === 0 ? (
                                  <p className="text-xs text-gray-400 italic">No playoff matches played yet.</p>
                                ) : (
                                  <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex justify-between"><span>🎯 Exact score <span className="text-gray-400">(×3)</span></span><span className="font-semibold text-green-600">{bd.koExact} × 3 = {bd.koExact * 3}</span></div>
                                    <div className="flex justify-between"><span>📐 Correct GD <span className="text-gray-400">(×2)</span></span><span className="font-semibold text-blue-600">{bd.koGD} × 2 = {bd.koGD * 2}</span></div>
                                    <div className="flex justify-between"><span>✅ Correct outcome <span className="text-gray-400">(×1)</span></span><span className="font-semibold text-gray-600">{bd.koOutcome} × 1 = {bd.koOutcome}</span></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 py-2">No scored predictions yet.</div>
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
            ✅ = all {GROUP_MATCHES_TOTAL} group predictions submitted · Click any row to see detailed breakdown
          </p>
        </div>
      )}
    </div>
  )
}
