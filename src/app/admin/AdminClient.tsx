'use client'

import { useState } from 'react'
import type { Match } from '@/lib/supabase/types'
import { flagUrl } from '@/lib/flag-map'

interface MatchWithTeams extends Match {
  home_team: { name: string; flag_emoji: string | null; fifa_code: string } | null
  away_team: { name: string; flag_emoji: string | null; fifa_code: string } | null
}

interface ResultState {
  homeScore: string
  awayScore: string
  decidedBy: 'ft' | 'et' | 'pens'
  winnerId: string
}

interface FeedbackRow {
  id: string
  name: string | null
  email: string | null
  message: string
  created_at: string
}

type FilterTab = 'all' | 'unscored' | 'scored' | 'today'

export default function AdminClient({ matches, feedback }: { matches: MatchWithTeams[]; feedback: FeedbackRow[] }) {
  const [results, setResults] = useState<Record<string, ResultState>>(() => {
    const r: Record<string, ResultState> = {}
    for (const m of matches) {
      if (m.actual_home_score !== null && m.actual_away_score !== null) {
        r[m.id] = {
          homeScore: String(m.actual_home_score),
          awayScore: String(m.actual_away_score),
          decidedBy: m.decided_by ?? 'ft',
          winnerId: m.actual_winner_id ?? '',
        }
      }
    }
    return r
  })
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<FilterTab>('unscored')
  const [toast, setToast] = useState<string | null>(null)
  const [lateEmail, setLateEmail] = useState('')
  const [lateLoading, setLateLoading] = useState(false)
  const [lateResult, setLateResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const todayCDT = new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 10)
  const [recapDay, setRecapDay] = useState(todayCDT)
  const [recapText, setRecapText] = useState<string | null>(null)
  const [recapSentAt, setRecapSentAt] = useState<string | null>(null)
  const [recapLoading, setRecapLoading] = useState(false)
  const [recapStatus, setRecapStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const fetchRecap = async (day: string) => {
    setRecapLoading(true)
    setRecapStatus(null)
    try {
      const res = await fetch(`/api/admin/recap?day=${day}`)
      const data = await res.json()
      setRecapText(data.recapText ?? null)
      setRecapSentAt(data.sentAt ?? null)
    } catch {
      setRecapText(null)
    } finally {
      setRecapLoading(false)
    }
  }

  const handleRecapAction = async (action: 'regenerate' | 'send') => {
    setRecapLoading(true)
    setRecapStatus(null)
    try {
      const res = await fetch('/api/admin/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: recapDay, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRecapStatus({ ok: false, msg: `❌ ${data.error}` })
      } else if (action === 'regenerate') {
        setRecapText(data.recapText)
        setRecapStatus({ ok: true, msg: '✅ Recap regenerated' })
      } else {
        setRecapSentAt(new Date().toISOString())
        setRecapStatus({ ok: true, msg: `✅ Sent to ${data.sent} participants` })
      }
    } catch (err) {
      setRecapStatus({ ok: false, msg: `❌ Network error: ${String(err)}` })
    } finally {
      setRecapLoading(false)
    }
  }

  const handleLateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setLateLoading(true)
    setLateResult(null)
    try {
      const res = await fetch('/api/admin/late-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lateEmail }),
      })
      const data = await res.json()
      setLateResult({ ok: res.ok, msg: res.ok ? `✅ ${data.message} · ${data.inserted} predictions inserted, ${data.skipped ?? 0} already existed` : `❌ ${data.error}` })
    } catch (err) {
      setLateResult({ ok: false, msg: `❌ Network error: ${String(err)}` })
    } finally {
      setLateLoading(false)
    }
  }

  const getResult = (matchId: string): ResultState =>
    results[matchId] ?? { homeScore: '', awayScore: '', decidedBy: 'ft', winnerId: '' }

  const handleSave = async (match: MatchWithTeams) => {
    const res = getResult(match.id)
    const home = parseInt(res.homeScore)
    const away = parseInt(res.awayScore)

    if (isNaN(home) || isNaN(away)) {
      setErrors((e) => ({ ...e, [match.id]: 'Enter valid scores' }))
      return
    }

    setSaving((s) => new Set([...s, match.id]))
    setErrors((e) => { const next = { ...e }; delete next[match.id]; return next })

    // Safety timer — clears saving state if fetch never resolves (e.g. network hang)
    const safetyTimer = setTimeout(() => {
      setSaving((s) => { const next = new Set(s); next.delete(match.id); return next })
    }, 60000)

    try {
      const resp = await fetch('/api/admin/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: home,
          awayScore: away,
          decidedBy: res.decidedBy,
          winnerId: res.winnerId || null,
        }),
      })

      if (resp.ok) {
        setSaved((s) => new Set([...s, match.id]))
        setToast('✅ Saved!')
        setTimeout(() => setToast(null), 2500)
        setTimeout(() => setSaved((s) => { const next = new Set(s); next.delete(match.id); return next }), 4000)
      } else {
        let msg = 'Failed to save'
        try { const data = await resp.json(); msg = data.error ?? msg } catch {}
        setErrors((e) => ({ ...e, [match.id]: `Error ${resp.status}: ${msg}` }))
      }
    } catch (err) {
      setErrors((e) => ({ ...e, [match.id]: `Network error: ${err instanceof Error ? err.message : String(err)}` }))
    } finally {
      clearTimeout(safetyTimer)
      setSaving((s) => { const next = new Set(s); next.delete(match.id); return next })
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true
    if (filter === 'scored') return m.is_final
    if (filter === 'unscored') return !m.is_final
    if (filter === 'today') {
      if (!m.kickoff_at) return false
      return m.kickoff_at.slice(0, 10) === todayStr
    }
    return true
  })

  // Group by date
  const grouped = new Map<string, MatchWithTeams[]>()
  for (const m of filteredMatches) {
    const dateKey = m.kickoff_at ? m.kickoff_at.slice(0, 10) : 'TBD'
    if (!grouped.has(dateKey)) grouped.set(dateKey, [])
    grouped.get(dateKey)!.push(m)
  }
  const sortedDates = Array.from(grouped.keys()).sort()

  const formatDateHeader = (dateKey: string, matchCount: number): string => {
    if (dateKey === 'TBD') return `TBD · ${matchCount} match${matchCount !== 1 ? 'es' : ''}`
    const d = new Date(dateKey + 'T12:00:00Z')
    const label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })
    return `${label} · ${matchCount} match${matchCount !== 1 ? 'es' : ''}`
  }

  const renderMatch = (match: MatchWithTeams) => {
    const res = getResult(match.id)
    const isSaving = saving.has(match.id)
    const isSaved = saved.has(match.id)
    const err = errors[match.id]
    const isKnockout = match.stage !== 'group'

    const homeFlagSrc = match.home_team?.fifa_code ? flagUrl(match.home_team.fifa_code, 40) : null
    const awayFlagSrc = match.away_team?.fifa_code ? flagUrl(match.away_team.fifa_code, 40) : null

    return (
      <div
        key={match.id}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        {/* Header row: stage + time */}
        <div className="text-xs text-gray-400 mb-3 flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wide text-gray-500">
            {match.stage.toUpperCase()}{match.group_letter ? ` · Group ${match.group_letter}` : ''}
          </span>
          <span>
            {match.kickoff_at
              ? new Date(match.kickoff_at).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC',
                })
              : 'TBD'}
            {match.venue ? ` · ${match.venue}` : ''}
          </span>
        </div>

        {/* Score row: [TeamA Flag] [input] – [input] [Flag TeamB] */}
        <div className="flex items-center gap-2 mb-3">
          {/* Home team */}
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <span className="font-bold text-sm text-[#0B1F3A] dark:text-white truncate text-right">
              {match.home_team?.name ?? 'TBD'}
            </span>
            {homeFlagSrc
              ? <span className="inline-block w-7 h-5 overflow-hidden rounded-sm flex-shrink-0"><img src={homeFlagSrc} alt="" className="w-full h-full object-cover" /></span>
              : <span className="w-7 h-5 bg-gray-100 rounded-sm flex-shrink-0" />}
          </div>

          {/* Score inputs */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <input
              type="number"
              min={0}
              max={99}
              placeholder="0"
              value={res.homeScore}
              onChange={(e) =>
                setResults((r) => ({ ...r, [match.id]: { ...getResult(match.id), homeScore: e.target.value } }))
              }
              className="w-12 border border-gray-300 dark:border-gray-600 rounded-lg px-1 py-1.5 text-sm text-center font-bold bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none"
            />
            <span className="text-gray-400 font-bold">–</span>
            <input
              type="number"
              min={0}
              max={99}
              placeholder="0"
              value={res.awayScore}
              onChange={(e) =>
                setResults((r) => ({ ...r, [match.id]: { ...getResult(match.id), awayScore: e.target.value } }))
              }
              className="w-12 border border-gray-300 dark:border-gray-600 rounded-lg px-1 py-1.5 text-sm text-center font-bold bg-white dark:bg-gray-900 focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none"
            />
          </div>

          {/* Away team */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {awayFlagSrc
              ? <span className="inline-block w-7 h-5 overflow-hidden rounded-sm flex-shrink-0"><img src={awayFlagSrc} alt="" className="w-full h-full object-cover" /></span>
              : <span className="w-7 h-5 bg-gray-100 rounded-sm flex-shrink-0" />}
            <span className="font-bold text-sm text-[#0B1F3A] dark:text-white truncate">
              {match.away_team?.name ?? 'TBD'}
            </span>
          </div>
        </div>

        {/* Already entered badge */}
        {match.is_final && (
          <div className="text-xs text-green-600 mb-2 font-semibold">
            ✓ Result entered: {match.actual_home_score}–{match.actual_away_score}
          </div>
        )}

        {/* Bottom controls: decidedBy + winner radio + save */}
        <div className="flex flex-wrap gap-2 items-center">
          {isKnockout && (
            <select
              value={res.decidedBy}
              onChange={(e) =>
                setResults((r) => ({
                  ...r,
                  [match.id]: { ...getResult(match.id), decidedBy: e.target.value as 'ft' | 'et' | 'pens' },
                }))
              }
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
            >
              <option value="ft">FT</option>
              <option value="et">ET</option>
              <option value="pens">Pens</option>
            </select>
          )}

          {/* Winner radio for knockout matches */}
          {isKnockout && match.home_team_id && match.away_team_id && (
            <div className="flex items-center gap-3 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`winner-${match.id}`}
                  value={match.home_team_id}
                  checked={res.winnerId === match.home_team_id}
                  onChange={(e) =>
                    setResults((r) => ({ ...r, [match.id]: { ...getResult(match.id), winnerId: e.target.value } }))
                  }
                  className="accent-[#0B1F3A]"
                />
                {homeFlagSrc && <span className="inline-block w-5 h-3.5 overflow-hidden rounded-sm"><img src={homeFlagSrc} alt="" className="w-full h-full object-cover" /></span>}
                <span className="font-medium text-[#0B1F3A] dark:text-white">{match.home_team?.name}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`winner-${match.id}`}
                  value={match.away_team_id}
                  checked={res.winnerId === match.away_team_id}
                  onChange={(e) =>
                    setResults((r) => ({ ...r, [match.id]: { ...getResult(match.id), winnerId: e.target.value } }))
                  }
                  className="accent-[#0B1F3A]"
                />
                {awayFlagSrc && <span className="inline-block w-5 h-3.5 overflow-hidden rounded-sm"><img src={awayFlagSrc} alt="" className="w-full h-full object-cover" /></span>}
                <span className="font-medium text-[#0B1F3A] dark:text-white">{match.away_team?.name}</span>
              </label>
            </div>
          )}

          <button
            onClick={() => handleSave(match)}
            disabled={isSaving}
            className="ml-auto bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isSaving ? '…' : isSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        {err && <p className="text-red-600 text-xs mt-2">{err}</p>}
      </div>
    )
  }

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unscored', label: 'Unscored' },
    { key: 'scored', label: 'Scored' },
    { key: 'today', label: 'Today' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white mb-6">Admin — Enter Results</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === key
                ? 'bg-[#0B1F3A] text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grouped matches */}
      <div className="mb-10 space-y-8">
        {sortedDates.length === 0 ? (
          <p className="text-gray-400 text-sm">No matches for this filter.</p>
        ) : (
          sortedDates.map((dateKey) => {
            const dayMatches = grouped.get(dateKey)!
            return (
              <div key={dateKey}>
                <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 py-2 mb-3 rounded-t-lg">
                  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {formatDateHeader(dateKey, dayMatches.length)}
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  {dayMatches.map(renderMatch)}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Day Recap section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">📨 Day Recap</h2>
        <p className="text-xs text-gray-400 mb-3">
          Generate an AI recap for any completed matchday and send it to all participants by email.
        </p>
        <div className="flex gap-2 items-center mb-3 flex-wrap">
          <input
            type="date"
            value={recapDay}
            onChange={e => { setRecapDay(e.target.value); setRecapText(null); setRecapStatus(null); setRecapSentAt(null) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
          <button
            onClick={() => fetchRecap(recapDay)}
            disabled={recapLoading}
            className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {recapLoading ? '…' : 'Load'}
          </button>
          <button
            onClick={() => handleRecapAction('regenerate')}
            disabled={recapLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {recapLoading ? '…' : '🔄 Regenerate'}
          </button>
          <button
            onClick={() => handleRecapAction('send')}
            disabled={recapLoading || !recapText}
            className="bg-[#0B1F3A] hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {recapLoading ? '…' : '📧 Send to All'}
          </button>
        </div>
        {recapSentAt && (
          <p className="text-xs text-green-600 mb-2">
            ✓ Last sent: {new Date(recapSentAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
        {recapText && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {recapText}
          </div>
        )}
        {recapText === null && !recapLoading && (
          <p className="text-xs text-gray-400">No recap loaded — pick a day and click Load, or Regenerate to create a fresh one.</p>
        )}
        {recapStatus && (
          <p className={`mt-2 text-sm font-medium ${recapStatus.ok ? 'text-green-700' : 'text-red-600'}`}>
            {recapStatus.msg}
          </p>
        )}
      </div>

      {/* Late Entry section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">🕐 Late Entry</h2>
        <p className="text-xs text-gray-400 mb-3">
          Grants a late-joining player 0–0 predictions for all already-played group matches so they don't earn points for games they missed.
          They can predict normally for all future (unlocked) matches.
        </p>
        <form onSubmit={handleLateEntry} className="flex gap-2 items-start flex-wrap">
          <input
            type="email"
            required
            placeholder="player@email.com"
            value={lateEmail}
            onChange={e => setLateEmail(e.target.value)}
            className="flex-1 min-w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] bg-white"
          />
          <button
            type="submit"
            disabled={lateLoading}
            className="bg-[#0B1F3A] hover:bg-blue-900 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {lateLoading ? '…' : 'Grant Late Entry'}
          </button>
        </form>
        {lateResult && (
          <p className={`mt-2 text-sm font-medium ${lateResult.ok ? 'text-green-700' : 'text-red-600'}`}>
            {lateResult.msg}
          </p>
        )}
      </div>

      {/* Feedback section */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">
          💬 Feedback ({feedback.length})
        </h2>
        {feedback.length === 0 ? (
          <p className="text-gray-400 text-sm">No feedback yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {feedback.map(f => (
              <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-[#0B1F3A]">
                    {f.name || 'Anonymous'}{f.email ? ` — ${f.email}` : ''}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(f.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg animate-fade-slide">
          {toast}
        </div>
      )}
    </div>
  )
}
