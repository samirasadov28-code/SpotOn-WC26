'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage } from '@/lib/supabase/types'
import { formatDistanceToNow } from 'date-fns'

interface MessageWithUser extends ChatMessage {
  user: { display_name: string | null } | null
}

interface UserLeague {
  id: string
  name: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<MessageWithUser[]>([])
  const [body, setBody] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [leagues, setLeagues] = useState<UserLeague[]>([])
  const [leagueId, setLeagueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      // Get user admin status
      const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      setIsAdmin(profile?.is_admin ?? false)

      // Load user's leagues
      const { data: memberships } = await supabase
        .from('league_members')
        .select('league_id')
        .eq('user_id', user.id) as any

      if (!memberships || memberships.length === 0) {
        setLoading(false)
        return
      }

      const ids = memberships.map((m: any) => m.league_id)
      const { data: leagueRows } = await supabase
        .from('leagues')
        .select('id, name')
        .in('id', ids) as any

      if (!leagueRows || leagueRows.length === 0) {
        setLoading(false)
        return
      }

      setLeagues(leagueRows)
      const firstId = leagueRows[0].id
      setLeagueId(firstId)
      await loadMessages(firstId)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = async (lgId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*, user:users(display_name)')
      .eq('league_id', lgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(200)

    setMessages((data as MessageWithUser[]) ?? [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleLeagueChange = async (id: string) => {
    setLeagueId(id)
    setMessages([])
    await loadMessages(id)
  }

  useEffect(() => {
    if (!leagueId) return

    const channel = supabase
      .channel(`chat-${leagueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `league_id=eq.${leagueId}` },
        () => { loadMessages(leagueId) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [leagueId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = body.trim()
    if (!text || !userId || !leagueId) return
    if (text.length > 500) return

    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({ league_id: leagueId, user_id: userId, body: text })
    if (!error) {
      setBody('')
      // Reload immediately in case Realtime is delayed
      await loadMessages(leagueId)
    }
    setSending(false)
  }

  const handleDelete = async (msgId: string) => {
    await supabase.from('chat_messages').update({ deleted_at: new Date().toISOString() }).eq('id', msgId)
    if (leagueId) loadMessages(leagueId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading chat…</div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="text-4xl">💬</div>
        <h2 className="text-xl font-bold text-[#0B1F3A]">Sign in to chat</h2>
        <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">Sign in</a>
      </div>
    )
  }

  if (leagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="text-4xl">💬</div>
        <h2 className="text-xl font-bold text-[#0B1F3A]">No leagues yet</h2>
        <p className="text-gray-500 text-sm">Join or create a league to start chatting.</p>
        <a href="/league" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">Go to Leagues</a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">League Chat</h1>
        {leagues.length > 1 && (
          <select
            value={leagueId ?? ''}
            onChange={e => handleLeagueChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] bg-white"
          >
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}
        {leagues.length === 1 && (
          <span className="text-sm text-gray-500 font-medium">{leagues[0].name}</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-10">
            No messages yet. Be the first to say something!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === userId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400">
                    {msg.user?.display_name ?? 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-300">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                  {(isOwn || isAdmin) && (
                    <button onClick={() => handleDelete(msg.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-2 text-sm break-words ${
                  isOwn
                    ? 'bg-[#0B1F3A] text-white rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.body}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          placeholder="Say something…"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="bg-[#0B1F3A] hover:bg-blue-900 text-white font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors text-sm"
        >
          Send
        </button>
      </form>
      {body.length > 450 && (
        <div className="text-xs text-gray-400 mt-1 text-right">{body.length}/500</div>
      )}
    </div>
  )
}
