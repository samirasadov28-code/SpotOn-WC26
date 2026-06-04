'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface League {
  id: string
  name: string
  join_code: string
  created_by: string
}

interface LeaderboardRow {
  userId: string
  displayName: string
  predCount: number
  groupPts: number
  advancementPts: number
  knockoutPts: number
  totalPts: number
}

interface InvitePopupProps {
  league: League
  onClose: () => void
}

function InvitePopup({ league, onClose }: InvitePopupProps) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const message = `Join my SpotOn WC26 prediction league "${league.name}"!\n\nSign up at: ${origin}/auth/login?league=${league.join_code}\n— or sign in and go to Leagues, then enter code: ${league.join_code}\n\nMay the best predictor win! ⚽🏆`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0B1F3A]">Invite Friends</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
        </div>
        <p className="text-sm text-gray-500 mb-1">
          League: <span className="font-semibold text-[#0B1F3A]">{league.name}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Code: <span className="font-mono font-bold text-green-700">{league.join_code}</span>
        </p>
        <textarea
          readOnly
          value={message}
          rows={7}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 resize-none bg-gray-50 focus:outline-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Message'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LeagueDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [league, setLeague] = useState<League | null>(null)
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [notMember, setNotMember] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/login')
        return
      }
      setCurrentUserId(user.id)

      const { data: leagueData, error: leagueErr } = await supabase
        .from('leagues')
        .select('*')
        .eq('id', id)
        .single() as any

      if (leagueErr || !leagueData) {
        setLoading(false)
        return
      }
      setLeague(leagueData)

      const { data: members } = await supabase
        .from('league_members')
        .select('user_id')
        .eq('league_id', id) as any

      if (!members || members.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      const isMember = members.some((m: any) => m.user_id === user.id)
      if (!isMember) {
        setNotMember(true)
        setLoading(false)
        return
      }

      const memberIds = members.map((m: any) => m.user_id)

      const [usersRes, scoresRes, predsRes] = await Promise.all([
        supabase.from('users').select('id, display_name').in('id', memberIds) as any,
        supabase.from('scores').select('*').in('user_id', memberIds) as any,
        supabase.from('predictions_group').select('user_id').in('user_id', memberIds) as any,
      ])

      const usersData: any[] = usersRes.data ?? []
      const scoresData: any[] = scoresRes.data ?? []
      const predsData: any[] = predsRes.data ?? []

      // Count predictions per user
      const predCounts: Record<string, number> = {}
      for (const p of predsData) {
        predCounts[p.user_id] = (predCounts[p.user_id] ?? 0) + 1
      }

      const leaderboard: LeaderboardRow[] = memberIds.map((uid: string) => {
        const u = usersData.find((x: any) => x.id === uid)
        const s = scoresData.find((x: any) => x.user_id === uid)
        return {
          userId: uid,
          displayName: u?.display_name ?? 'Unknown',
          predCount: predCounts[uid] ?? 0,
          groupPts: s?.group_pts ?? 0,
          advancementPts: s?.advancement_pts ?? 0,
          knockoutPts: s?.knockout_match_pts ?? 0,
          totalPts: s?.total_pts ?? 0,
        }
      })

      leaderboard.sort((a, b) => b.totalPts - a.totalPts)
      setRows(leaderboard)
      setLoading(false)
    }
    init()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading…</div>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        League not found.
      </div>
    )
  }

  if (notMember) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        You are not a member of this league.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#0B1F3A]">{league.name}</h1>
          <p className="text-sm text-gray-400 font-mono mt-1">
            Code: <span className="font-semibold">{league.join_code}</span>
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Invite Friends
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No members yet.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0B1F3A] text-white">
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Player</th>
                  <th className="text-center px-3 py-3 font-semibold">Preds</th>
                  <th className="text-center px-3 py-3 font-semibold">Group</th>
                  <th className="text-center px-3 py-3 font-semibold">Adv.</th>
                  <th className="text-center px-3 py-3 font-semibold">KO</th>
                  <th className="text-center px-3 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isMe = row.userId === currentUserId
                  return (
                    <tr
                      key={row.userId}
                      className={`border-t border-gray-100 ${isMe ? 'bg-green-50 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-4 py-3 text-gray-500 font-bold">{i + 1}</td>
                      <td className="px-4 py-3 text-[#0B1F3A]">
                        {row.displayName}
                        {isMe && <span className="ml-1 text-green-600 text-xs">(you)</span>}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.predCount}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.groupPts}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.advancementPts}</td>
                      <td className="px-3 py-3 text-center text-gray-600">{row.knockoutPts}</td>
                      <td className="px-3 py-3 text-center font-bold text-[#0B1F3A]">{row.totalPts}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInvite && (
        <InvitePopup league={league} onClose={() => setShowInvite(false)} />
      )}
    </div>
  )
}
