'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { ASADOV_STACK } from '@/lib/asadov-stack'
import { STATIC_TEAMS, GROUPS_ORDER } from '@/lib/teams-data'
import { GROUP_STADIUMS } from '@/lib/schedule-data'

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'
const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA || 'dev'
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME
  ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  : ''

const STADIUMS = [
  { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', iso2: 'mx', capacity: '87,500', note: 'Opening Match', slug: 'azteca' },
  { name: 'MetLife Stadium', city: 'New York / NJ', country: 'USA', iso2: 'us', capacity: '82,500', note: 'The Final', slug: 'metlife' },
  { name: 'AT&T Stadium', city: 'Dallas', country: 'USA', iso2: 'us', capacity: '80,000', note: 'Most Matches (9)', slug: 'att' },
  { name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', iso2: 'us', capacity: '70,240', note: 'Western Hub', slug: 'sofi' },
  { name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', iso2: 'us', capacity: '65,000', note: 'Eastern Hub', slug: 'hardrock' },
  { name: 'BC Place', city: 'Vancouver', country: 'Canada', iso2: 'ca', capacity: '54,500', note: 'Canadian Host', slug: 'bcplace' },
]

const KEY_DATES = [
  { date: 'Jun 11', label: 'Tournament Kicks Off', sub: 'Mexico vs South Africa, Azteca' },
  { date: 'Jun 27', label: 'Group Stage Ends', sub: '72 matches complete' },
  { date: 'Jul 9–11', label: 'Quarterfinals', sub: 'USA hosts all QFs' },
  { date: 'Jul 14–15', label: 'Semifinals', sub: 'Two legends clash' },
  { date: 'Jul 19', label: 'THE FINAL', sub: 'MetLife Stadium, New York', highlight: true },
]

const HOW_IT_WORKS = [
  { emoji: '🎯', title: 'Predict', desc: 'Enter exact scores for all 72 group matches. Your predictions automatically build your knockout bracket.' },
  { emoji: '⚡', title: 'Compete', desc: 'Earn points for exact scores, goal differences, outcomes, and bracket advancement — live as results come in.' },
  { emoji: '🏆', title: 'Win', desc: 'Climb the live leaderboard and claim the prize as the tournament unfolds. Prizes to be announced.' },
]

// Group data derived from static teams
const GROUPS = GROUPS_ORDER.map(letter => ({
  letter,
  teams: STATIC_TEAMS.filter(t => t.groupLetter === letter),
}))

export default function HomePage() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [fbName, setFbName] = useState('')
  const [fbEmail, setFbEmail] = useState('')
  const [fbMsg, setFbMsg] = useState('')
  const [fbStatus, setFbStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const fbFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => setUpdateAvailable(true))
        if (reg.waiting) setUpdateAvailable(true)
      })
    }
  }, [])

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!fbMsg.trim()) return
    setFbStatus('sending')
    try {
      const subject = encodeURIComponent(`SpotOn WC26 Feedback${fbName ? ` from ${fbName}` : ''}`)
      const body = encodeURIComponent(`Name: ${fbName || 'Anonymous'}\nEmail: ${fbEmail || 'Not provided'}\n\n${fbMsg}`)
      const mailto = `mailto:FinModeloop@gmail.com?subject=${subject}&body=${body}`
      window.open(mailto, '_blank')
      setFbStatus('sent')
      setFbName(''); setFbEmail(''); setFbMsg('')
    } catch {
      setFbStatus('error')
    }
  }

  async function forceUpdate() {
    setUpdating(true)
    try {
      // Clear all caches
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
      }
      // Tell any waiting SW to activate immediately
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
    } finally {
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0B1F3A] text-white">
        {/* Stadium silhouette background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none flex items-end justify-center overflow-hidden">
          <svg viewBox="0 0 1200 400" className="w-full min-w-[800px]" fill="white">
            {/* simplified stadium silhouette */}
            <ellipse cx="600" cy="420" rx="580" ry="200" />
            <rect x="120" y="240" width="960" height="180" rx="8" />
            <rect x="80" y="160" width="1040" height="90" rx="60" />
            <rect x="0" y="200" width="100" height="200" />
            <rect x="1100" y="200" width="100" height="200" />
          </svg>
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-green/30 rounded-3xl blur-2xl scale-110" />
              <Image
                src="/Logo 512x512.png"
                alt="SpotOn WC26"
                width={140}
                height={140}
                className="relative rounded-2xl shadow-2xl"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-white/70 mb-6">
            ⚽ FIFA World Cup 2026 · 48 Nations · 3 Host Countries
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4 leading-none">
            <span className="text-white">PREDICT.</span>{' '}
            <span className="text-brand-green">COMPETE.</span>{' '}
            <span className="text-[#DC2626]">WIN.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto mb-10">
            The ultimate World Cup 2026 prediction game. Pick every score, build your bracket, and battle your friends on the live leaderboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/auth/login"
              className="bg-brand-green hover:bg-green-400 text-white font-black py-4 px-10 rounded-2xl text-lg transition-all shadow-lg shadow-green-900/40 hover:scale-105 active:scale-95"
            >
              Join Free — Enter Predictions
            </Link>
            <Link
              href="/rules"
              className="border border-white/25 hover:bg-white/10 text-white font-semibold py-4 px-8 rounded-2xl text-base transition-all"
            >
              How Scoring Works →
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { n: '48', label: 'Nations' },
              { n: '72', label: 'Group Matches' },
              { n: '16', label: 'Stadiums' },
            ].map((s) => (
              <div key={s.label} className="bg-white/8 border border-white/12 rounded-xl py-3">
                <div className="text-2xl font-black text-brand-green">{s.n}</div>
                <div className="text-xs text-white/50 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE BANNER ── */}
      <section className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="text-4xl">🏆</span>
          <div>
            <p className="text-[#0B1F3A] font-black text-xl sm:text-2xl leading-tight">
              Prizes to Be Announced
            </p>
            <p className="text-[#0B1F3A]/70 text-sm font-medium mt-0.5">
              Exciting prizes are coming — details will be revealed after kickoff. Stay tuned!
            </p>
          </div>
          <span className="text-4xl">🎁</span>
        </div>
      </section>

      {/* ── KEY DATES ── */}
      <section className="py-14 px-4 bg-[#0B1F3A]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-10">
            Tournament Timeline
          </h2>
          <div className="flex flex-col sm:flex-row gap-0 relative">
            <div className="hidden sm:block absolute top-6 left-0 right-0 h-0.5 bg-white/10" />
            {KEY_DATES.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center text-center px-3 relative">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs mb-3 z-10 border-2 ${
                  d.highlight
                    ? 'bg-yellow-400 border-yellow-300 text-[#0B1F3A]'
                    : 'bg-[#0B1F3A] border-brand-green text-brand-green'
                }`}>
                  {d.highlight ? '🏆' : d.date.split(' ')[1]}
                </div>
                <p className="text-white/40 text-xs mb-1">{d.date}</p>
                <p className={`font-bold text-sm ${d.highlight ? 'text-yellow-400' : 'text-white'}`}>{d.label}</p>
                <p className="text-white/50 text-xs mt-1">{d.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-[#0B1F3A] mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <h3 className="text-xl font-black text-[#0B1F3A] mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STADIUMS ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-green font-bold text-sm uppercase tracking-widest mb-2">16 Venues · 3 Countries</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">
              World-Class Stadiums
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STADIUMS.map((s) => (
              <Link
                key={s.name}
                href={`/stadiums/${s.slug}`}
                className="group relative bg-[#0B1F3A] rounded-2xl p-6 overflow-hidden hover:scale-[1.02] transition-transform"
              >
                {/* pitch lines decoration */}
                <div className="absolute right-0 top-0 bottom-0 w-24 opacity-10">
                  <div className="absolute inset-0 border-l-2 border-white rounded-l-full mx-4 my-4" />
                  <div className="absolute inset-0 border-l border-white/50 rounded-l-full mx-8 my-8" />
                </div>
                <div className="relative">
                  {s.note && (
                    <span className="inline-block bg-brand-green text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3">
                      {s.note}
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://flagcdn.com/w40/${s.iso2}.png`} alt={s.country} className="w-8 h-auto mb-2 rounded-sm opacity-80" />
                  <h3 className="text-white font-black text-lg leading-tight group-hover:text-green-300 transition-colors">{s.name}</h3>
                  <p className="text-white/50 text-sm mt-1">{s.city} · {s.country}</p>
                  <p className="text-white/30 text-xs mt-2">Capacity: {s.capacity}</p>
                  <p className="text-white/40 text-xs mt-3 font-semibold group-hover:text-white/60 transition-colors">View details →</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/stadiums" className="inline-block text-sm font-bold text-[#0B1F3A] border border-[#0B1F3A] px-5 py-2 rounded-full hover:bg-[#0B1F3A] hover:text-white transition-colors">
              View all 16 stadiums →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ALL 12 GROUPS ── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#DC2626] font-bold text-sm uppercase tracking-widest mb-2">48 Teams · 12 Groups</p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B1F3A]">The Field</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {GROUPS.map((g) => {
              const stadiums = GROUP_STADIUMS[g.letter] ?? []
              return (
                <div
                  key={g.letter}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-[#0B1F3A] text-white rounded-lg flex items-center justify-center font-black text-sm">
                      {g.letter}
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Group {g.letter}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {g.teams.map((t) => (
                      <li key={t.fifaCode}>
                        <Link
                          href={`/teams/${t.fifaCode}`}
                          className="flex items-center gap-2 hover:bg-gray-50 rounded-md px-1 py-0.5 -mx-1 transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://flagcdn.com/w40/${t.iso2}.png`}
                            alt={t.name}
                            width={20}
                            height={14}
                            className="rounded-sm object-cover flex-shrink-0"
                            style={{ width: 20, height: 14 }}
                          />
                          <span className="text-sm text-gray-700 truncate hover:text-[#0B1F3A] hover:font-medium">{t.shortName}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {stadiums.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">🏟 Venues</p>
                      <div className="flex flex-col gap-1">
                        {stadiums.map((s) => (
                          <Link
                            key={s.slug}
                            href={`/stadiums/${s.slug}`}
                            className="flex items-center gap-1.5 text-[10px] text-[#0B1F3A] hover:underline"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://flagcdn.com/w20/${s.iso2}.png`} alt="" className="w-3.5 h-auto rounded-sm" />
                            <span className="truncate">{s.city}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="text-center mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/teams" className="inline-flex items-center gap-2 text-[#0B1F3A] font-bold border-2 border-[#0B1F3A] rounded-xl px-6 py-3 hover:bg-[#0B1F3A] hover:text-white transition-all text-sm">
              Explore All Teams →
            </Link>
            <Link href="/stadiums" className="inline-flex items-center gap-2 text-[#0B1F3A] font-bold border-2 border-[#0B1F3A] rounded-xl px-6 py-3 hover:bg-[#0B1F3A] hover:text-white transition-all text-sm">
              View All Stadiums →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SCORING QUICK REF ── */}
      <section className="py-14 px-4 bg-[#0B1F3A]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-8">Scoring at a Glance</h2>
          <div className="rounded-2xl overflow-hidden border border-white/10">
            {[
              { label: 'Exact score', pts: '3 pts', color: 'text-brand-green' },
              { label: 'Correct goal difference', pts: '2 pts', color: 'text-blue-400' },
              { label: 'Correct outcome', pts: '1 pt', color: 'text-white/60' },
              { label: 'Knockout advancement', pts: 'up to 16 pts / team', color: 'text-yellow-400' },
            ].map((row, i) => (
              <div key={row.label} className={`flex justify-between items-center px-6 py-4 text-sm ${i !== 0 ? 'border-t border-white/8' : ''} bg-white/5`}>
                <span className="text-white/70">{row.label}</span>
                <span className={`font-black ${row.color}`}>{row.pts}</span>
              </div>
            ))}
          </div>
          <Link href="/rules" className="inline-block mt-5 text-sm text-white/50 hover:text-white underline underline-offset-4 transition-colors">
            Full rules with worked examples →
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-green-50 to-white text-center">
        <div className="max-w-lg mx-auto">
          <p className="text-5xl mb-6">⚽</p>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0B1F3A] mb-4">
            Ready to play?
          </h2>
          <p className="text-gray-500 mb-8">
            Predictions lock <strong className="text-[#0B1F3A]">2 hours before kick-off</strong> on June 11. Don&apos;t miss it.
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-[#0B1F3A] hover:bg-[#162d52] text-white font-black py-4 px-12 rounded-2xl text-lg transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            Join with Email — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── FEEDBACK ── */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">💬</div>
            <h2 className="text-2xl font-black text-[#0B1F3A]">Send Us Feedback</h2>
            <p className="text-gray-500 text-sm mt-2">Questions, suggestions, or bug reports — we'd love to hear from you.</p>
          </div>
          <form ref={fbFormRef} onSubmit={submitFeedback} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name <span className="text-gray-300">(optional)</span></label>
                <input value={fbName} onChange={e => setFbName(e.target.value)} placeholder="Your name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email <span className="text-gray-300">(optional)</span></label>
                <input type="email" value={fbEmail} onChange={e => setFbEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Message <span className="text-red-400">*</span></label>
              <textarea value={fbMsg} onChange={e => setFbMsg(e.target.value)} required rows={4} placeholder="Tell us what you think…"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] resize-none" />
            </div>
            {fbStatus === 'sent' && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 text-center font-medium">
                ✓ Your email client has opened — just hit send!
              </div>
            )}
            {fbStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
                Something went wrong. Email us directly at <a href="mailto:FinModeloop@gmail.com" className="font-bold underline">FinModeloop@gmail.com</a>
              </div>
            )}
            <button type="submit" disabled={fbStatus === 'sending' || !fbMsg.trim()}
              className="bg-[#0B1F3A] hover:bg-[#162d52] disabled:opacity-50 text-white font-black py-3 px-8 rounded-2xl transition-colors text-sm">
              {fbStatus === 'sending' ? 'Opening email…' : '✉ Send Feedback'}
            </button>
            <p className="text-xs text-gray-400 text-center">Clicking send will open your email client with the message pre-filled.</p>
          </form>
        </div>
      </section>

      {/* ── ASADOV-STACK ── */}
      <section className="bg-[#0B1F3A] border-t border-white/10 py-10 px-4">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2">SpotOn WC26 is part of</p>
          <p className="text-2xl font-black text-white mb-1">{ASADOV_STACK.name}</p>
          <p className="text-white/50 text-sm mb-6">{ASADOV_STACK.tagline}</p>
          <a
            href={ASADOV_STACK.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#0B1F3A] font-black px-8 py-3 rounded-2xl text-sm hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>🚀</span>
            Explore Asadov-stack
            <span className="text-gray-400">↗</span>
          </a>
        </div>
      </section>

      {/* ── FOOTER / VERSION ── */}
      <footer className="bg-gray-50 border-t border-gray-200 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>
            SpotOn WC26 ·{' '}
            <code className="font-mono text-[#0B1F3A] font-bold">v{APP_VERSION}</code>
            {' '}·{' '}
            <code className="font-mono">{BUILD_SHA}</code>
            {BUILD_TIME && <> · deployed {BUILD_TIME}</>}
          </span>
          <div className="flex items-center gap-3">
            {updateAvailable && (
              <span className="text-green-600 font-semibold">Update available!</span>
            )}
            <button
              onClick={forceUpdate}
              disabled={updating}
              className="bg-[#0B1F3A] hover:bg-[#162d52] text-white font-semibold px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 text-xs"
            >
              {updating ? 'Updating…' : '↺ Force Update'}
            </button>
          </div>
          <span>© 2026 Asadov-stack</span>
        </div>
      </footer>

    </div>
  )
}
