'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, User } from '@/lib/supabase/types'
import { formatDistanceToNow } from 'date-fns'

interface MessageWithUser extends ChatMessage {
  user: { display_name: string | null } | null
}

const DEFAULT_LEAGUE_ID_PLACEHOLDER = 'SPOTON26'

export default function ChatPage() {
  const [messages, setMessages] = useState<MessageWithUser[]>([])
  const [body, setBody] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [leagueId, setLeagueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Get user admin status
      const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      setIsAdmin(profile?.is_admin ?? false)

      // Get default league
      const { data: league } = await supabase
        .from('leagues')
        .select('id')
        .eq('join_code', DEFAULT_LEAGUE_ID_PLACEHOLDER)
        .single()

      if (!league) {
        setLoading(false)
        return
      }
      setLeagueId(league.id)

      // Load messages
      await loadMessages(league.id)
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

  useEffect(() => {
    if (!leagueId) return

    const channel = supabase
      .channel(`chat-${leagueId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `league_id=eq.${leagueId}` },
        () => {
          loadMessages(leagueId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [leagueId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = body.trim()
    if (!text || !userId || !leagueId) return
    if (text.length > 500) return

    setSending(true)
    await supabase.from('chat_messages').insert({
      league_id: leagueId,
      user_id: userId,
      body: text,
    })
    setBody('')
    setSending(false)
  }

  const handleDelete = async (msgId: string) => {
    await supabase
      .from('chat_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', msgId)
    if (leagueId) loadMessages(leagueId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading chat…</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-5rem)]">
      <h1 className="text-2xl font-bold text-navy dark:text-white mb-4">League Chat</h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col gap-3 mb-4">
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
                  <span className="text-xs text-gray-300 dark:text-gray-600">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                  {(isOwn || isAdmin) && (
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-2 text-sm break-words ${
                    isOwn
                      ? 'bg-navy text-white rounded-tr-none'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {userId ? (
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            placeholder="Say something…"
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bg-navy hover:bg-blue-900 text-white font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors text-sm"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="text-center text-sm text-gray-500 py-3">
          <a href="/auth/login" className="text-navy dark:text-blue-400 underline">Sign in</a> to chat
        </div>
      )}
      {body.length > 450 && (
        <div className="text-xs text-gray-400 mt-1 text-right">{body.length}/500</div>
      )}
    </div>
  )
}
