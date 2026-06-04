'use client'

import { useState } from 'react'
import type { Match } from '@/lib/supabase/types'

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

export default function AdminClient({ matches }: { matches: MatchWithTeams[] }) {
  const [results, setResults] = useState<Record<string, ResultState>>({})
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    setErrors((e) => {
      const next = { ...e }
      delete next[match.id]
      return next
    })

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

    setSaving((s) => {
      const next = new Set(s)
      next.delete(match.id)
      return next
    })

    if (resp.ok) {
      setSaved((s) => new Set([...s, match.id]))
    } else {
      const data = await resp.json()
      setErrors((e) => ({ ...e, [match.id]: data.error ?? 'Failed to save' }))
    }
  }

  const groupMatches = matches.filter((m) => m.stage === 'group')
  const knockoutMatches = matches.filter((m) => m.stage !== 'group')

  const renderMatch = (match: MatchWithTeams) => {
    const res = getResult(match.id)
    const isSaving = saving.has(match.id)
    const isSaved = saved.has(match.id)
    const err = errors[match.id]

    return (
      <div
        key={match.id}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
      >
        <div className="text-xs text-gray-400 mb-2">
          {match.stage.toUpperCase()} ·{' '}
          {match.kickoff_at
            ? new Date(match.kickoff_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              })
            : 'TBD'}
          {match.venue && ` · ${match.venue}`}
        </div>

        <div className="font-semibold text-sm mb-3 text-navy dark:text-white">
          {match.home_team?.flag_emoji} {match.home_team?.name ?? 'TBD'} vs{' '}
          {match.away_team?.flag_emoji} {match.away_team?.name ?? 'TBD'}
        </div>

        {match.is_final && (
          <div className="text-xs text-brand-green mb-2 font-semibold">
            ✓ Result entered: {match.actual_home_score}–{match.actual_away_score}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={0}
            max={99}
            placeholder="H"
            value={res.homeScore}
            onChange={(e) =>
              setResults((r) => ({ ...r, [match.id]: { ...getResult(match.id), homeScore: e.target.value } }))
            }
            className="w-14 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-center bg-white dark:bg-gray-900"
          />
          <span className="text-gray-400">–</span>
          <input
            type="number"
            min={0}
            max={99}
            placeholder="A"
            value={res.awayScore}
            onChange={(e) =>
              setResults((r) => ({ ...r, [match.id]: { ...getResult(match.id), awayScore: e.target.value } }))
            }
            className="w-14 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-center bg-white dark:bg-gray-900"
          />

          {match.stage !== 'group' && (
            <>
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

              {match.home_team_id && match.away_team_id && (
                <select
                  value={res.winnerId}
                  onChange={(e) =>
                    setResults((r) => ({ ...r, [match.id]: { ...getResult(match.id), winnerId: e.target.value } }))
                  }
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900"
                >
                  <option value="">Winner…</option>
                  <option value={match.home_team_id}>{match.home_team?.name}</option>
                  <option value={match.away_team_id}>{match.away_team?.name}</option>
                </select>
              )}
            </>
          )}

          <button
            onClick={() => handleSave(match)}
            disabled={isSaving}
            className="bg-brand-green hover:bg-green-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isSaving ? '…' : isSaved ? '✓ Saved' : 'Save'}
          </button>
        </div>

        {err && <p className="text-brand-red text-xs mt-2">{err}</p>}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-navy dark:text-white mb-6">Admin — Enter Results</h1>

      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">Group Stage</h2>
        <div className="flex flex-col gap-3">
          {groupMatches.map(renderMatch)}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">Knockout</h2>
        <div className="flex flex-col gap-3">
          {knockoutMatches.map(renderMatch)}
        </div>
      </div>
    </div>
  )
}
