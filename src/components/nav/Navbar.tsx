'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, isBefore } from 'date-fns'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { transliterateName } from '@/lib/transliterate'

const LOCK_AT = new Date('2026-06-11T19:00:00Z')

const MORE_LINKS: { href: string; label: string }[] = []

export default function Navbar() {
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [timeToLock, setTimeToLock] = useState<string | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const { lang, setLang, t, languages } = useTranslation()

  const NAV_LINKS = [
    { href: '/predictions', label: t('nav_predictions') },
    { href: '/results', label: t('nav_results') },
    { href: '/leaderboard', label: t('nav_leaderboard') },
    { href: '/teams', label: t('nav_teams') },
    { href: '/rules', label: t('nav_rules') },
    { href: '/chat', label: 'AI Chat' },
  ]

  const BOTTOM_TABS = [
    { href: '/predictions', label: t('nav_predictions'), icon: '🎯' },
    { href: '/results', label: t('nav_results'), icon: '📊' },
    { href: '/leaderboard', label: t('nav_leaderboard'), icon: '🏆' },
    { href: '/teams', label: t('nav_teams'), icon: '👥' },
    { href: '/chat', label: 'AI Chat', icon: '🤖' },
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('display_name, is_admin')
          .eq('id', user.id)
          .single()
        const name = (data as any)?.display_name
        setDisplayName(transliterateName(name || user.email?.split('@')[0] || 'Player'))
        setIsAdmin(!!(data as any)?.is_admin)
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
    localStorage.removeItem('spoton_remember')
    sessionStorage.removeItem('spoton_session')
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
              {/* Mobile More button — top right */}
              <button
                onClick={() => setMoreOpen(o => !o)}
                className={`md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${moreOpen ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                aria-label="More"
              >
                <span className="text-xl leading-none">☰</span>
              </button>

              {/* Language selector */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setLangOpen(o => !o)}
                  className="text-sm text-white/70 hover:text-white px-2 py-1 rounded transition-colors"
                >
                  {languages.find(l => l.code === lang)?.name ?? 'English'}
                </button>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#0B1F3A] border border-white/10 rounded-lg shadow-lg py-1 min-w-[160px] max-h-80 overflow-y-auto">
                      {languages.map(l => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code); setLangOpen(false) }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${lang === l.code ? 'text-green-400' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {displayName ? (
                <div className="hidden md:flex items-center gap-2">
                  {isAdmin && (
                    <Link href="/admin" className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-2 py-1 rounded transition-colors">
                      ⚙ Admin
                    </Link>
                  )}
                  <Link href="/profile" className="text-sm text-white/70 hover:text-white transition-colors">{displayName}</Link>
                  <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300">{t('nav_signout')}</button>
                </div>
              ) : (
                <Link href="/auth/login" className="hidden md:block text-sm bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded font-medium transition-colors">
                  {t('nav_signin')}
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
      </div>

      {/* More dropdown (mobile top-right) */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)} />
          <div className="fixed top-16 right-0 w-72 z-50 md:hidden bg-[#0B1F3A] rounded-bl-2xl border-l border-b border-white/10 p-4 flex flex-col gap-1 shadow-xl">
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
              {/* Mobile language selector */}
              <div className="px-4 pb-2">
                <p className="text-xs text-white/40 mb-1">{t('nav_language')}</p>
                <div className="grid grid-cols-3 gap-1">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setMoreOpen(false) }}
                      className={`text-xs py-1.5 px-2 rounded transition-colors text-left ${lang === l.code ? 'text-green-400 bg-white/5' : 'text-white/60 hover:text-white'}`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-white/10 mt-2 pt-3">
                {displayName ? (
                  <div className="flex flex-col gap-2 px-4">
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setMoreOpen(false)} className="text-sm font-bold text-yellow-400 hover:text-yellow-300">
                        ⚙ Admin — Enter Results
                      </Link>
                    )}
                    <div className="flex items-center justify-between">
                      <Link href="/profile" onClick={() => setMoreOpen(false)} className="text-sm text-white/60 hover:text-white transition-colors">{displayName}</Link>
                      <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300">{t('nav_signout')}</button>
                    </div>
                  </div>
                ) : (
                  <Link href="/auth/login" onClick={() => setMoreOpen(false)} className="block py-3 px-4 text-sm font-medium text-green-400 hover:text-green-300">
                    {t('nav_signin')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
