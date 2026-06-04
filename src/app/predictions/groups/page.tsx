'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Team, Match, PredictionGroup } from '@/lib/supabase/types'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
}

type PredMap = Record<string, { home: string; away: string }>

export default function GroupPredictionsPage() {
  const [activeGroup, setActiveGroup] = useState('A')
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [preds, setPreds] = useState<PredMap>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [dbError, setDbError] = useState<string | null>(null)
  const isLocked = new Date() >= LOCK_AT

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [matchRes, teamRes, predRes] = await Promise.all([
        supabase.from('matches').select('*').eq('stage', 'group').order('kickoff_at'),
        supabase.from('teams').select('*'),
        supabase.from('predictions_group').select('*').eq('user_id', user.id),
      ])

      if (matchRes.error) { console.error('matches error:', matchRes.error); setDbError(matchRes.error.message) }
      if (teamRes.error) console.error('teams error:', teamRes.error)

      const teamMap = new Map<string, Team>((teamRes.data ?? []).map((t) => [t.id, t]))
      const enriched: MatchWithTeams[] = (matchRes.data ?? []).map((m) => ({
        ...m,
        home_team: m.home_team_id ? (teamMap.get(m.home_team_id) ?? null) : null,
        away_team: m.away_team_id ? (teamMap.get(m.away_team_id) ?? null) : null,
      }))

      setMatches(enriched)
      setTeams(teamRes.data ?? [])

      const predMap: PredMap = {}
      let count = 0
      for (const p of predRes.data ?? []) {
        if (p.pred_home_score !== null && p.pred_away_score !== null) {
          predMap[p.match_id] = {
            home: String(p.pred_home_score),
            away: String(p.pred_away_score),
          }
          count++
        }
      }
      setPreds(predMap)
      setSavedCount(count)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(
    async (matchId: string) => {
      if (!userId || isLocked) return
      const pred = preds[matchId]
      if (!pred || pred.home === '' || pred.away === '') return

      const homeScore = parseInt(pred.home)
      const awayScore = parseInt(pred.away)
      if (isNaN(homeScore) || isNaN(awayScore)) return
      if (homeScore < 0 || awayScore < 0) return

      setSavingIds((s) => new Set([...s, matchId]))

      const { error } = await supabase.from('predictions_group').upsert(
        {
          user_id: userId,
          match_id: matchId,
          pred_home_score: homeScore,
          pred_away_score: awayScore,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,match_id' }
      )

      setSavingIds((s) => {
        const next = new Set(s)
        next.delete(matchId)
        return next
      })

      if (!error) {
        setSavedCount((c) => {
          const alreadySaved = preds[matchId]
          return alreadySaved ? c : c + 1
        })
      }
    },
    [userId, isLocked, preds, supabase]
  )

  const groupMatches = matches.filter((m) => m.group_letter === activeGroup)
  const groupTeams = teams.filter((t) => t.group_letter === activeGroup)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading predictions…</div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="text-4xl">🔒</div>
        <h2 className="text-xl font-bold text-[#0B1F3A]">Sign in to make predictions</h2>
        <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">Sign in</a>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <div className="text-4xl">🏗️</div>
        <h2 className="text-xl font-bold text-[#0B1F3A]">No matches found</h2>
        {dbError ? (
          <p className="text-red-500 max-w-sm text-sm font-mono bg-red-50 px-3 py-2 rounded">{dbError}</p>
        ) : (
          <p className="text-gray-500 max-w-sm text-sm">The match schedule hasn&apos;t been loaded into Supabase yet. Run the migrations in <code className="bg-gray-100 px-1 rounded">supabase/migrations/</code> to get started.</p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Group Predictions</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-bold text-navy dark:text-white">{savedCount}</span> / 72 predicted
          {isLocked && (
            <span className="ml-3 text-brand-red font-semibold">Predictions locked</span>
          )}
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeGroup === g
                ? 'bg-navy text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Group {g}
          </button>
        ))}
      </div>

      {/* Team blurbs */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {groupTeams.map((team) => (
          <div
            key={team.id}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm"
          >
            <div className="font-semibold flex items-center gap-2">
              <span>{team.flag_emoji}</span>
              <span className="text-navy dark:text-white">{team.name}</span>
              <span className="text-xs text-gray-400">{team.confederation}</span>
            </div>
            {team.blurb && (
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-snug">
                {team.blurb}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Matches */}
      <div className="flex flex-col gap-3">
        {groupMatches.map((match) => {
          const pred = preds[match.id] ?? { home: '', away: '' }
          const saving = savingIds.has(match.id)
          const kickoff = match.kickoff_at
            ? new Date(match.kickoff_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                timeZoneName: 'short',
              })
            : ''

          return (
            <div
              key={match.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
            >
              <div className="text-xs text-gray-400 mb-2">
                {kickoff} {match.venue && `· ${match.venue}`}
              </div>
              <div className="flex items-center justify-between gap-2">
                {/* Home team */}
                <div className="flex-1 text-right">
                  <span className="font-semibold text-sm">
                    {match.home_team?.flag_emoji} {match.home_team?.name ?? '?'}
                  </span>
                </div>

                {/* Score inputs */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    disabled={isLocked}
                    value={pred.home}
                    onChange={(e) =>
                      setPreds((p) => ({
                        ...p,
                        [match.id]: { ...pred, home: e.target.value },
                      }))
                    }
                    onBlur={() => handleBlur(match.id)}
                    className="w-12 text-center border border-gray-300 dark:border-gray-600 rounded-lg py-1.5 text-sm bg-white dark:bg-gray-900 disabled:opacity-50 focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                  <span className="text-gray-400 font-bold">:</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    disabled={isLocked}
                    value={pred.away}
                    onChange={(e) =>
                      setPreds((p) => ({
                        ...p,
                        [match.id]: { ...pred, away: e.target.value },
                      }))
                    }
                    onBlur={() => handleBlur(match.id)}
                    className="w-12 text-center border border-gray-300 dark:border-gray-600 rounded-lg py-1.5 text-sm bg-white dark:bg-gray-900 disabled:opacity-50 focus:ring-2 focus:ring-brand-green focus:outline-none"
                  />
                </div>

                {/* Away team */}
                <div className="flex-1">
                  <span className="font-semibold text-sm">
                    {match.away_team?.flag_emoji} {match.away_team?.name ?? '?'}
                  </span>
                </div>

                {/* Status */}
                <div className="w-6 text-center">
                  {saving ? (
                    <span className="text-xs text-yellow-500">…</span>
                  ) : preds[match.id]?.home !== undefined ? (
                    <span className="text-xs text-brand-green">✓</span>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
