'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match, Team, PredictionGroup, Score } from '@/lib/supabase/types'

type MatchStatus = 'correct' | 'partial' | 'wrong' | 'pending'

interface MatchWithStatus extends Match {
  home_team: Team | null
  away_team: Team | null
  status: MatchStatus
  pts: number
  pred_home: number | null
  pred_away: number | null
}

function getMatchStatus(
  pred_home: number | null,
  pred_away: number | null,
  actual_home: number | null,
  actual_away: number | null,
): { status: MatchStatus; pts: number } {
  if (actual_home === null || actual_away === null)
    return { status: 'pending', pts: 0 }
  if (pred_home === null || pred_away === null)
    return { status: 'pending', pts: 0 }

  if (pred_home === actual_home && pred_away === actual_away)
    return { status: 'correct', pts: 3 }

  const predGD = pred_home - pred_away
  const actualGD = actual_home - actual_away
  if (predGD === actualGD) return { status: 'partial', pts: 2 }

  const predOut = Math.sign(predGD)
  const actualOut = Math.sign(actualGD)
  if (predOut === actualOut) return { status: 'partial', pts: 1 }

  return { status: 'wrong', pts: 0 }
}

const STATUS_CLASSES: Record<MatchStatus, string> = {
  correct: 'border-brand-green bg-green-50 dark:bg-green-900/20',
  partial: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  wrong: 'border-brand-red bg-red-50 dark:bg-red-900/20',
  pending: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
}

export default function BracketPage() {
  const [matches, setMatches] = useState<MatchWithStatus[]>([])
  const [score, setScore] = useState<Score | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [matchRes, teamRes, predRes, scoreRes] = await Promise.all([
        supabase.from('matches').select('*').eq('stage', 'group').order('kickoff_at'),
        supabase.from('teams').select('*'),
        supabase.from('predictions_group').select('*').eq('user_id', user.id),
        supabase.from('scores').select('*').eq('user_id', user.id).single(),
      ])

      const teamMap = new Map<string, Team>((teamRes.data ?? []).map((t) => [t.id, t]))
      const predMap = new Map<string, PredictionGroup>(
        (predRes.data ?? []).map((p) => [p.match_id, p])
      )

      const enriched: MatchWithStatus[] = (matchRes.data ?? []).map((m) => {
        const pred = predMap.get(m.id)
        const { status, pts } = getMatchStatus(
          pred?.pred_home_score ?? null,
          pred?.pred_away_score ?? null,
          m.actual_home_score,
          m.actual_away_score,
        )
        return {
          ...m,
          home_team: m.home_team_id ? (teamMap.get(m.home_team_id) ?? null) : null,
          away_team: m.away_team_id ? (teamMap.get(m.away_team_id) ?? null) : null,
          status,
          pts,
          pred_home: pred?.pred_home_score ?? null,
          pred_away: pred?.pred_away_score ?? null,
        }
      })

      setMatches(enriched)
      setScore(scoreRes.data ?? null)
      setLoading(false)
    }
    init()

    // Realtime subscription
    const channel = supabase
      .channel('bracket-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, () => {
        init()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading bracket…</div>
      </div>
    )
  }

  const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy dark:text-white">My Bracket</h1>
        {score && (
          <div className="flex gap-4 text-sm">
            <span className="text-gray-500">Group: <strong className="text-navy dark:text-white">{score.group_pts}</strong></span>
            <span className="text-gray-500">Total: <strong className="text-brand-green text-lg">{score.total_pts}</strong></span>
          </div>
        )}
      </div>

      <div className="flex gap-2 text-xs mb-6 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-green inline-block"></span> Exact (3pt)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 inline-block"></span> Partial (1-2pt)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-brand-red inline-block"></span> Wrong (0pt)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-300 inline-block"></span> Pending</span>
      </div>

      {GROUPS.map((grp) => {
        const grpMatches = matches.filter((m) => m.group_letter === grp)
        return (
          <div key={grp} className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
              Group {grp}
            </h2>
            <div className="flex flex-col gap-2">
              {grpMatches.map((match) => (
                <div
                  key={match.id}
                  className={`rounded-xl border-2 p-3 ${STATUS_CLASSES[match.status]}`}
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex-1 text-right font-medium">
                      {match.home_team?.flag_emoji} {match.home_team?.name ?? '?'}
                    </span>

                    <div className="text-center">
                      {match.pred_home !== null && match.pred_away !== null ? (
                        <div className="font-bold text-gray-700 dark:text-gray-200">
                          {match.pred_home}–{match.pred_away}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs">—</div>
                      )}

                      {match.actual_home_score !== null && (
                        <div className="text-xs text-gray-500">
                          {match.actual_home_score}–{match.actual_away_score}
                        </div>
                      )}

                      {match.pts > 0 && (
                        <div className="text-xs font-bold text-brand-green">+{match.pts}pt</div>
                      )}
                    </div>

                    <span className="flex-1 font-medium">
                      {match.away_team?.flag_emoji} {match.away_team?.name ?? '?'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
