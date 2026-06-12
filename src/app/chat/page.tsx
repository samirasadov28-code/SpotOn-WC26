'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { transliterateName } from '@/lib/transliterate'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTERS = [
  'Who are the favourites for WC2026? ⚽',
  'Explain the scoring system',
  'Any prediction tips for Group A?',
  'Which teams should I watch out for?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: u } = await createClient().from('users').select('display_name').eq('id', data.user.id).single()
      setUserName(transliterateName((u as any)?.display_name ?? data.user.email?.split('@')[0] ?? 'You'))
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    // Re-focus input after sending
    setTimeout(() => inputRef.current?.focus(), 50)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong — try again.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — please retry.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-4 pt-5 pb-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0B1F3A] to-blue-600 flex items-center justify-center text-xl shrink-0">
            ⚽
          </div>
          <div>
            <h1 className="font-bold text-[#0B1F3A] text-lg leading-tight">Spot AI</h1>
            <p className="text-xs text-gray-400">Your WC2026 prediction assistant</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg transition-colors"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-4">
            <div>
              <div className="text-4xl mb-2">🏆</div>
              <p className="font-semibold text-[#0B1F3A]">Ask me anything about WC2026</p>
              <p className="text-xs text-gray-400 mt-1">Teams, scores, predictions, strategy…</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-sm text-left bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl px-4 py-2.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0B1F3A] to-blue-600 flex items-center justify-center text-sm shrink-0 mt-0.5">
                ⚽
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#0B1F3A] text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[#0B1F3A] shrink-0 mt-0.5 uppercase">
                {(userName ?? 'Y').charAt(0)}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0B1F3A] to-blue-600 flex items-center justify-center text-sm shrink-0 mt-0.5">
              ⚽
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 pb-safe">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about teams, predictions, strategy…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-2xl border border-gray-300 focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/20 px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50 leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 128) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center shrink-0 hover:bg-blue-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Send"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 translate-x-0.5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-2">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
