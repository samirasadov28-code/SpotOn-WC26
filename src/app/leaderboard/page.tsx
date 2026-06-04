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

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = async () => {
    const [userRes, scoreRes, predRes, authRes] = await Promise.all([
      supabase.from('users').select('id, display_name'),
      supabase.from('scores').select('*'),
      supabase.from('predictions_group').select('user_id'),
      supabase.auth.getUser(),
    ])

    const users: { id: string; display_name: string | null }[] = userRes.data ?? []
    const scores = new Map((scoreRes.data ?? []).map((s: any) => [s.user_id, s]))
    const predCounts = new Map<string, number>()
    for (const p of (predRes.data ?? []) as { user_id: string }[]) {
      predCounts.set(p.user_id, (predCounts.get(p.user_id) ?? 0) + 1)
    }

    setCurrentUserId(authRes.data.user?.id ?? null)

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

    // Sort by total pts desc, then name asc
    built.sort((a, b) => b.totalPts - a.totalPts || a.displayName.localeCompare(b.displayName))

    // Assign ranks (shared for ties)
    const ranked: LeaderboardEntry[] = []
    let rank = 1
    for (let i = 0; i < built.length; i++) {
      if (i > 0 && built[i].totalPts < built[i - 1].totalPts) rank = i + 1
      ranked.push({ rank, ...built[i] })
    }

    setEntries(ranked)
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading leaderboard…</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Leaderboard</h1>
        {lastUpdated && (
          <div className="text-xs text-gray-400">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          No players yet. Be the first to join!
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B1F3A] text-white">
                <th className="py-3 px-4 text-left w-10">#</th>
                <th className="py-3 px-4 text-left">Player</th>
                <th className="py-3 px-4 text-center" title="Predictions submitted">Preds</th>
                <th className="py-3 px-4 text-right">Group</th>
                <th className="py-3 px-4 text-right">Adv.</th>
                <th className="py-3 px-4 text-right">KO</th>
                <th className="py-3 px-4 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
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
                    <td className="py-3 px-4 font-bold text-gray-500">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </td>
                    <td className="py-3 px-4 text-[#0B1F3A]">
                      <span>{entry.displayName}</span>
                      {isMe && <span className="ml-1.5 text-xs text-blue-500 font-normal">(you)</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-xs">
                          ✅ Full
                        </span>
                      ) : entry.predictionCount === 0 ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className="text-orange-500 text-xs font-medium">{pctDone}%</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{entry.groupPts}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{entry.advancementPts}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{entry.knockoutPts}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{entry.totalPts}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
            ✅ Full = all {GROUP_MATCHES_TOTAL} group predictions submitted
          </p>
        </div>
      )}
    </div>
  )
}
