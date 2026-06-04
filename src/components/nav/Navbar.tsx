'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, isBefore } from 'date-fns'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')

const NAV_LINKS = [
  { href: '/predictions/groups', label: 'Predictions' },
  { href: '/predictions/knockout', label: 'My Bracket' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/teams', label: 'Teams' },
  { href: '/stadiums', label: 'Stadiums' },
  { href: '/rules', label: 'Rules' },
  { href: '/chat', label: 'Chat' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [timeToLock, setTimeToLock] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', user.id)
          .single()
        const name = (data as any)?.display_name
        setDisplayName(name || user.email?.split('@')[0] || 'Player')
      }
    }
    getUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      if (isBefore(now, LOCK_AT)) {
        const hours = (LOCK_AT.getTime() - now.getTime()) / 3_600_000
        if (hours < 48) setTimeToLock(formatDistanceToNow(LOCK_AT, { addSuffix: true }))
      } else {
        setTimeToLock(null)
      }
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-[#0B1F3A] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/Logo 192x192.png" alt="SpotOn WC26" width={36} height={36} className="rounded" />
            <span className="font-bold text-lg hidden sm:block">SpotOn WC26</span>
          </Link>

          {timeToLock && (
            <div className="hidden md:block text-xs text-yellow-300 bg-yellow-300/10 rounded px-2 py-1">
              Predictions close {timeToLock}
            </div>
          )}

          <div className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm hover:text-green-400 transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {displayName ? (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-white/70">{displayName}</span>
                <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300">Sign out</button>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:block text-sm bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded font-medium transition-colors">
                Sign in
              </Link>
            )}
            <button className="md:hidden p-2 rounded hover:bg-white/10" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 mt-2 pt-4 flex flex-col gap-2">
            {timeToLock && <div className="text-xs text-yellow-300 mb-2">Predictions close {timeToLock}</div>}
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm py-2 hover:text-green-400" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            {displayName ? (
              <>
                <span className="text-sm text-white/60 pt-2 border-t border-white/10">{displayName}</span>
                <button onClick={handleSignOut} className="text-sm text-red-400 text-left">Sign out</button>
              </>
            ) : (
              <Link href="/auth/login" className="text-sm text-green-400 font-medium pt-2" onClick={() => setMenuOpen(false)}>Sign in</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
