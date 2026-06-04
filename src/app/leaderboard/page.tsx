'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'

const GROUP_MATCHES_TOTAL = 72

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

interface UserLeague {
  id: string
  name: string
}

export default function LeaderboardPage() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [leagues, setLeagues] = useState<UserLeague[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('global')
  const [leagueMemberIds, setLeagueMemberIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const loadData = async () => {
    const [userRes, scoreRes, predRes, authRes] = await Promise.all([
      supabase.from('users').select('id, display_name'),
      supabase.from('scores').select('*'),
      supabase.from('predictions_group').select('user_id'),
      supabase.auth.getUser(),
    ])

    const currentUser = authRes.data.user
    setCurrentUserId(currentUser?.id ?? null)

    const users: { id: string; display_name: string | null }[] = userRes.data ?? []
    const scores = new Map((scoreRes.data ?? []).map((s: any) => [s.user_id, s]))
    const predCounts = new Map<string, number>()
    for (const p of (predRes.data ?? []) as { user_id: string }[]) {
      predCounts.set(p.user_id, (predCounts.get(p.user_id) ?? 0) + 1)
    }

    const built: Omit<LeaderboardEntry, 'rank'>[] = users.map((u) => {
      const s = scores.get(u.id)
      return {
        userId: u.id,
        displayName: u.display_name ?? u.id.slice(0, 8),
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

    setAllEntries(ranked)
    setLastUpdated(new Date())
    setLoading(false)

    // Load current user's leagues
    if (currentUser) {
      const { data: memberships } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', currentUser.id) as any

      if (memberships?.length) {
        const ids = memberships.map((m: any) => m.league_id)
        const { data: leagueRows } = await supabase
          .from('leagues')
          .select('id, name')
          .in('id', ids) as any
        setLeagues(leagueRows ?? [])
      }
    }
  }

  const handleLeagueChange = async (leagueId: string) => {
    setSelectedLeagueId(leagueId)
    if (leagueId === 'global') {
      setLeagueMemberIds(new Set())
      return
    }
    const { data } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId) as any
    setLeagueMemberIds(new Set((data ?? []).map((m: any) => m.user_id)))
  }

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const visibleEntries = (() => {
    if (selectedLeagueId === 'global') return allEntries
    const filtered = allEntries.filter(e => leagueMemberIds.has(e.userId))
    // Re-rank within league
    const reranked: LeaderboardEntry[] = []
    let rank = 1
    for (let i = 0; i < filtered.length; i++) {
      if (i > 0 && filtered[i].totalPts < filtered[i - 1].totalPts) rank = i + 1
      reranked.push({ ...filtered[i], rank })
    }
    return reranked
  })()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading leaderboard…</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Leaderboard</h1>
        {lastUpdated && (
          <div className="text-xs text-gray-400">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
        )}
      </div>

      {/* League filter */}
      {leagues.length > 0 && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-sm text-gray-500">View:</span>
          <select
            value={selectedLeagueId}
            onChange={e => handleLeagueChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] bg-white"
          >
            <option value="global">🌍 Global</option>
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      )}

      {visibleEntries.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          {selectedLeagueId === 'global'
            ? 'No players yet. Be the first to join!'
            : 'No members in this league yet.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B1F3A] text-white">
                <th className="py-3 px-3 text-left w-10">#</th>
                <th className="py-3 px-3 text-left">Player</th>
                <th className="py-3 px-3 text-center" title="Predictions submitted">Preds</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">Group</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">Adv.</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">KO</th>
                <th className="py-3 px-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry, idx) => {
                const isMe = entry.userId === currentUserId
                const isComplete = entry.predictionCount >= GROUP_MATCHES_TOTAL
                const pctDone = Math.min(100, Math.round((entry.predictionCount / GROUP_MATCHES_TOTAL) * 100))
                return (
                  <tr
                    key={entry.userId}
                    className={`border-t border-gray-100 ${
                      isMe ? 'bg-blue-50 font-semibold' : entry.rank === 1 ? 'bg-yellow-50' : idx % 2 === 0 ? '' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-gray-500 text-base">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </td>
                    <td className="py-3 px-3 text-[#0B1F3A] max-w-[120px] sm:max-w-none">
                      <div className="truncate">{entry.displayName}</div>
                      {isMe && <div className="text-xs text-blue-500 font-normal">(you)</div>}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs">✅</span>
                      ) : entry.predictionCount === 0 ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className="text-orange-500 text-xs font-medium">{pctDone}%</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.groupPts}</td>
                    <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.advancementPts}</td>
                    <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.knockoutPts}</td>
                    <td className="py-3 px-3 text-right font-bold text-green-600 text-base">{entry.totalPts}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
            ✅ = all {GROUP_MATCHES_TOTAL} group predictions submitted
          </p>
        </div>
      )}
    </div>
  )
}
