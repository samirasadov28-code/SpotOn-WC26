'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface League {
  id: string
  name: string
  join_code: string
  created_by: string
  created_at: string
  memberCount?: number
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

export default function LeaguePage() {
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [myLeagues, setMyLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Join form
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  // Invite popup
  const [inviteLeague, setInviteLeague] = useState<League | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth/login')
        return
      }
      setUserId(user.id)
      await loadLeagues(user.id)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLeagues = async (uid: string) => {
    const { data: memberships } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', uid) as any

    if (!memberships || memberships.length === 0) {
      setMyLeagues([])
      return
    }

    const ids = memberships.map((m: any) => m.league_id)
    const { data: leagues } = await supabase
      .from('leagues')
      .select('*')
      .in('id', ids) as any

    if (!leagues) { setMyLeagues([]); return }

    // Get member counts
    const leaguesWithCounts = await Promise.all(
      leagues.map(async (league: any) => {
        const { count } = await supabase
          .from('league_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('league_id', league.id) as any
        return { ...league, memberCount: count ?? 0 }
      })
    )

    setMyLeagues(leaguesWithCounts)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setCreating(true)
    setCreateError(null)

    const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase()

    const { data: league, error } = await (supabase as any)
      .from('leagues')
      .insert({ name: newName.trim(), join_code: joinCode, created_by: userId })
      .select()
      .single()

    if (error) {
      setCreating(false)
      setCreateError(error.message)
      return
    }

    await (supabase as any).from('league_members').insert({ league_id: league.id, user_id: userId })

    setNewName('')
    setCreating(false)
    await loadLeagues(userId)
    setInviteLeague(league)
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setJoining(true)
    setJoinError(null)

    const { data: league, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('join_code', joinCode.trim().toUpperCase())
      .single() as any

    if (error || !league) {
      setJoining(false)
      setJoinError('League not found. Check the code and try again.')
      return
    }

    const { error: joinErr } = await (supabase as any)
      .from('league_members')
      .upsert({ league_id: league.id, user_id: userId }, { onConflict: 'league_id,user_id' })

    if (joinErr && !joinErr.message.includes('duplicate')) {
      setJoining(false)
      setJoinError(joinErr.message)
      return
    }

    setJoining(false)
    router.push(`/league/${league.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading…</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#0B1F3A] mb-6">My Leagues</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Create League */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#0B1F3A] mb-4">Create a League</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="League name"
              required
              maxLength={50}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
            />
            {createError && <p className="text-red-600 text-sm">{createError}</p>}
            <button
              type="submit"
              disabled={creating}
              className="bg-[#0B1F3A] hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create League'}
            </button>
          </form>
        </div>

        {/* Join League */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#0B1F3A] mb-4">Join a League</h2>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Enter 6-character code"
              required
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
            />
            {joinError && <p className="text-red-600 text-sm">{joinError}</p>}
            <button
              type="submit"
              disabled={joining}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {joining ? 'Joining…' : 'Join League'}
            </button>
          </form>
        </div>
      </div>

      {/* My leagues list */}
      {myLeagues.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🏆</div>
          <p>You haven't joined any leagues yet.</p>
          <p className="text-sm mt-1">Create one or enter a friend's code above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myLeagues.map((league) => (
            <div
              key={league.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between gap-4"
            >
              <div>
                <h3 className="font-bold text-[#0B1F3A] text-lg">{league.name}</h3>
                <p className="text-sm text-gray-400 font-mono mt-0.5">
                  Code: <span className="font-semibold text-gray-600">{league.join_code}</span>
                  {' · '}
                  <span>{league.memberCount} member{league.memberCount !== 1 ? 's' : ''}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setInviteLeague(league)}
                  className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Invite
                </button>
                <Link
                  href={`/league/${league.id}`}
                  className="bg-[#0B1F3A] hover:bg-blue-900 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {inviteLeague && (
        <InvitePopup league={inviteLeague} onClose={() => setInviteLeague(null)} />
      )}
    </div>
  )
}
