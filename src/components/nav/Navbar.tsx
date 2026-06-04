'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, isBefore } from 'date-fns'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')

const NAV_LINKS = [
  { href: '/today', label: 'Today' },
  { href: '/predictions', label: 'Predictions' },
  { href: '/results', label: 'Results' },
  { href: '/simulate', label: 'Simulate' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/league', label: 'Leagues' },
  { href: '/teams', label: 'Teams' },
  { href: '/stadiums', label: 'Stadiums' },
  { href: '/rules', label: 'Rules' },
  { href: '/chat', label: 'Chat' },
]

const BOTTOM_TABS = [
  { href: '/predictions', label: 'Predictions', icon: '🎯' },
  { href: '/results', label: 'Results', icon: '📊' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/chat', label: 'Chat', icon: '💬' },
]

const MORE_LINKS = [
  { href: '/simulate', label: 'Simulate' },
  { href: '/league', label: 'Leagues' },
  { href: '/teams', label: 'Teams' },
  { href: '/stadiums', label: 'Stadiums' },
  { href: '/rules', label: 'Rules' },
]

export default function Navbar() {
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [timeToLock, setTimeToLock] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = usePathname()
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
    window.location.href = '/'
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
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
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0B1F3A] border-t border-white/10 flex">
        {BOTTOM_TABS.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors text-[10px] ${isActive(tab.href) ? 'text-green-400' : 'text-white/60 hover:text-white'}`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
        {/* More tab */}
        <button
          onClick={() => setMoreOpen(o => !o)}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors text-[10px] ${moreOpen ? 'text-green-400' : 'text-white/60 hover:text-white'}`}
        >
          <span className="text-xl leading-none">☰</span>
          <span>More</span>
        </button>
      </div>

      {/* More slide-up drawer */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-[#0B1F3A] rounded-t-2xl border-t border-white/10 p-4 flex flex-col gap-1">
            {MORE_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMoreOpen(false)}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${isActive(link.href) ? 'text-green-400 bg-white/5' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-3">
              {displayName ? (
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-white/60">{displayName}</span>
                  <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300">Sign out</button>
                </div>
              ) : (
                <Link href="/auth/login" onClick={() => setMoreOpen(false)} className="block py-3 px-4 text-sm font-medium text-green-400 hover:text-green-300">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
