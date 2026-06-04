'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Team, Match, PredictionKnockout } from '@/lib/supabase/types'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')

const STAGES = [
  { key: 'r32', label: 'Round of 32', slots: 16 },
  { key: 'r16', label: 'Round of 16', slots: 8 },
  { key: 'qf', label: 'Quarterfinals', slots: 4 },
  { key: 'sf', label: 'Semifinals', slots: 2 },
  { key: 'final', label: 'Final', slots: 1 },
  { key: 'third', label: 'Third Place', slots: 1 },
]

interface KnockoutMatchPred {
  slot: number
  homeScore: string
  awayScore: string
  winnerId: string
}

type PredMap = Record<number, KnockoutMatchPred>

export default function KnockoutPredictionsPage() {
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Map<string, Team>>(new Map())
  const [preds, setPreds] = useState<PredMap>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSlots, setSavingSlots] = useState<Set<number>>(new Set())
  const isLocked = new Date() >= LOCK_AT

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [matchRes, teamRes, predRes] = await Promise.all([
        supabase.from('matches').select('*').neq('stage', 'group').order('bracket_slot'),
        supabase.from('teams').select('*'),
        supabase.from('predictions_knockout').select('*').eq('user_id', user.id),
      ])

      const teamMap = new Map<string, Team>((teamRes.data ?? []).map((t) => [t.id, t]))
      setTeams(teamMap)
      setKnockoutMatches(matchRes.data ?? [])

      const predMap: PredMap = {}
      for (const p of predRes.data ?? []) {
        predMap[p.bracket_slot] = {
          slot: p.bracket_slot,
          homeScore: p.pred_home_score !== null ? String(p.pred_home_score) : '',
          awayScore: p.pred_away_score !== null ? String(p.pred_away_score) : '',
          winnerId: p.pred_home_team_id ?? '',
        }
      }
      setPreds(predMap)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (slot: number) => {
    if (!userId || isLocked) return
    const pred = preds[slot]
    if (!pred) return

    const homeScore = parseInt(pred.homeScore)
    const awayScore = parseInt(pred.awayScore)
    if (isNaN(homeScore) || isNaN(awayScore)) return
    if (homeScore === awayScore) return // no draws allowed in knockout

    setSavingSlots((s) => new Set([...s, slot]))

    await supabase.from('predictions_knockout').upsert(
      {
        user_id: userId,
        bracket_slot: slot,
        pred_home_score: homeScore,
        pred_away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,bracket_slot' }
    )

    setSavingSlots((s) => {
      const next = new Set(s)
      next.delete(slot)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading bracket…</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-navy dark:text-white">Knockout Bracket</h1>
        {isLocked && (
          <span className="text-brand-red font-semibold text-sm">Predictions locked</span>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6 text-sm text-yellow-800 dark:text-yellow-300">
        <strong>Note:</strong> Knockout matches are determined by the actual group stage results.
        Your bracket will be fully activated once the group stage concludes.
        No draws are allowed — the team with more goals advances.
      </div>

      {STAGES.map((stage) => {
        const stageMatches = knockoutMatches.filter((m) => m.stage === stage.key)

        return (
          <div key={stage.key} className="mb-8">
            <h2 className="text-lg font-bold text-navy dark:text-white mb-3">{stage.label}</h2>

            {stageMatches.length === 0 ? (
              <div className="text-sm text-gray-400 italic">
                Matches will be available once the previous round completes.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stageMatches.map((match) => {
                  const slot = match.bracket_slot ?? 0
                  const pred = preds[slot] ?? { slot, homeScore: '', awayScore: '', winnerId: '' }
                  const homeTeam = match.home_team_id ? teams.get(match.home_team_id) : null
                  const awayTeam = match.away_team_id ? teams.get(match.away_team_id) : null
                  const saving = savingSlots.has(slot)

                  const drawError =
                    pred.homeScore !== '' &&
                    pred.awayScore !== '' &&
                    pred.homeScore === pred.awayScore

                  return (
                    <div
                      key={match.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                    >
                      <div className="text-xs text-gray-400 mb-2">
                        Slot {slot}
                        {match.venue && ` · ${match.venue}`}
                      </div>

                      <div className="flex flex-col gap-2">
                        {/* Home */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex-1">
                            {homeTeam
                              ? `${homeTeam.flag_emoji} ${homeTeam.name}`
                              : 'TBD'}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            disabled={isLocked || !homeTeam}
                            value={pred.homeScore}
                            onChange={(e) =>
                              setPreds((p) => ({
                                ...p,
                                [slot]: { ...pred, homeScore: e.target.value },
                              }))
                            }
                            onBlur={() => handleSave(slot)}
                            className="w-12 text-center border border-gray-300 dark:border-gray-600 rounded-lg py-1 text-sm bg-white dark:bg-gray-900 disabled:opacity-50 focus:ring-2 focus:ring-brand-green focus:outline-none"
                          />
                        </div>

                        {/* Away */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium flex-1">
                            {awayTeam
                              ? `${awayTeam.flag_emoji} ${awayTeam.name}`
                              : 'TBD'}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            disabled={isLocked || !awayTeam}
                            value={pred.awayScore}
                            onChange={(e) =>
                              setPreds((p) => ({
                                ...p,
                                [slot]: { ...pred, awayScore: e.target.value },
                              }))
                            }
                            onBlur={() => handleSave(slot)}
                            className="w-12 text-center border border-gray-300 dark:border-gray-600 rounded-lg py-1 text-sm bg-white dark:bg-gray-900 disabled:opacity-50 focus:ring-2 focus:ring-brand-green focus:outline-none"
                          />
                        </div>
                      </div>

                      {drawError && (
                        <p className="text-brand-red text-xs mt-2">
                          Draws not allowed — pick a winner
                        </p>
                      )}

                      {saving && (
                        <p className="text-yellow-500 text-xs mt-1">Saving…</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
