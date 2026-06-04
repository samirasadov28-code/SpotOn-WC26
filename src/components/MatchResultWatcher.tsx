'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ToastProvider'

interface PredRow {
  match_id: string
  pred_home_score: number | null
  pred_away_score: number | null
}

interface MatchPayload {
  id: string
  actual_home_score: number | null
  actual_away_score: number | null
  home_team_id: string | null
  away_team_id: string | null
}

function classifyResult(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): 'exact' | 'outcome' | 'gd' | 'wrong' {
  if (predHome === actualHome && predAway === actualAway) return 'exact'
  const predOutcome = Math.sign(predHome - predAway)
  const actualOutcome = Math.sign(actualHome - actualAway)
  if (predOutcome !== actualOutcome) return 'wrong'
  const predGD = predHome - predAway
  const actualGD = actualHome - actualAway
  if (predGD === actualGD) return 'gd'
  return 'outcome'
}

export default function MatchResultWatcher() {
  const { push } = useToast()
  const predictionsRef = useRef<PredRow[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function loadPredictions() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('predictions_group')
        .select('match_id, pred_home_score, pred_away_score')
        .eq('user_id', user.id)

      if (data) predictionsRef.current = data
    }

    loadPredictions()

    const channel = supabase
      .channel('match-result-watcher')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        async (payload) => {
          const newRow = payload.new as MatchPayload
          if (newRow.actual_home_score === null || newRow.actual_away_score === null) return

          const pred = predictionsRef.current.find(p => p.match_id === newRow.id)
          if (!pred || pred.pred_home_score === null || pred.pred_away_score === null) return

          // Fetch team names for the toast message
          const { data: matchData } = await supabase
            .from('matches')
            .select('*, home_team:teams!matches_home_team_id_fkey(name,flag_emoji), away_team:teams!matches_away_team_id_fkey(name,flag_emoji)')
            .eq('id', newRow.id)
            .single()

          const homeTeam = (matchData as any)?.home_team
          const awayTeam = (matchData as any)?.away_team
          const hFlag = homeTeam?.flag_emoji ?? ''
          const aFlag = awayTeam?.flag_emoji ?? ''
          const hName = homeTeam?.name ?? 'Home'
          const aName = awayTeam?.name ?? 'Away'

          const result = classifyResult(
            pred.pred_home_score,
            pred.pred_away_score,
            newRow.actual_home_score,
            newRow.actual_away_score
          )

          const scoreStr = `${hFlag} ${hName} ${newRow.actual_home_score}–${newRow.actual_away_score} ${aName} ${aFlag}`
          const predStr = `${pred.pred_home_score}–${pred.pred_away_score}`

          if (result === 'exact') {
            push({
              type: 'success',
              message: `🎯 ${scoreStr} · You predicted ${predStr} · Exact score! +3 pts`,
            })
          } else if (result === 'gd') {
            push({
              type: 'warning',
              message: `📐 Result in: ${scoreStr} · You predicted ${predStr} · Correct goal difference! +2 pts`,
            })
          } else if (result === 'outcome') {
            push({
              type: 'info',
              message: `✅ Result in: ${scoreStr} · You predicted ${predStr} · Correct outcome! +1 pt`,
            })
          } else {
            push({
              type: 'error',
              message: `❌ Result in: ${scoreStr} · You predicted ${predStr}`,
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return null
}
