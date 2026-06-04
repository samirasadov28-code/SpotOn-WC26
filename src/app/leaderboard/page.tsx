'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Score, User } from '@/lib/supabase/types'
import { formatDistanceToNow } from 'date-fns'

interface LeaderboardEntry {
  rank: number
  displayName: string
  groupPts: number
  advancementPts: number
  knockoutPts: number
  totalPts: number
  updatedAt: Date
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadData = async () => {
    const [scoreRes, userRes] = await Promise.all([
      supabase.from('scores').select('*').order('total_pts', { ascending: false }),
      supabase.from('users').select('id, display_name'),
    ])

    const scores: Score[] = scoreRes.data ?? []
    const users = new Map<string, User>((userRes.data ?? []).map((u) => [u.id, u as User]))

    // Build ranked list with shared rank for ties
    const ranked: LeaderboardEntry[] = []
    let rank = 1
    for (let i = 0; i < scores.length; i++) {
      const s = scores[i]
      if (i > 0 && s.total_pts < scores[i - 1].total_pts) {
        rank = i + 1
      }
      ranked.push({
        rank,
        displayName: users.get(s.user_id)?.display_name ?? 'Anonymous',
        groupPts: s.group_pts,
        advancementPts: s.advancement_pts,
        knockoutPts: s.knockout_match_pts,
        totalPts: s.total_pts,
        updatedAt: new Date(s.updated_at),
      })
    }

    // Secondary sort: alphabetical for ties
    ranked.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank
      return a.displayName.localeCompare(b.displayName)
    })

    setEntries(ranked)
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    // Realtime subscription
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
        <h1 className="text-2xl font-bold text-navy dark:text-white">Leaderboard</h1>
        {lastUpdated && (
          <div className="text-xs text-gray-400">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          No predictions yet. Be the first to predict!
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-white">
                <th className="py-3 px-4 text-left">#</th>
                <th className="py-3 px-4 text-left">Player</th>
                <th className="py-3 px-4 text-right">Group</th>
                <th className="py-3 px-4 text-right">Adv.</th>
                <th className="py-3 px-4 text-right">KO</th>
                <th className="py-3 px-4 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    entry.rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-gray-500 dark:text-gray-400">
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                  </td>
                  <td className="py-3 px-4 font-medium text-navy dark:text-white">
                    {entry.displayName}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {entry.groupPts}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {entry.advancementPts}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {entry.knockoutPts}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-brand-green">
                    {entry.totalPts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
