'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface MatchResult {
  id: string
  group_id: string | null
  actual_home_score: number
  actual_away_score: number
}

interface GroupPred {
  match_id: string
  pred_home_score: number
  pred_away_score: number
}

interface PredCategory {
  exact: number
  correctGD: number
  correctOutcome: number
  wrong: number
  total: number
}

interface GroupAccuracy {
  groupId: string
  correct: number
  total: number
}

interface StatsData {
  accuracy: PredCategory
  groupAccuracies: GroupAccuracy[]
  currentStreak: number
  longestStreak: number
  predictedChampion: string | null
  myTotalPts: number
  avgTotalPts: number
  userCount: number
}

function getPredScore(predHome: number, predAway: number, actualHome: number, actualAway: number): 'exact' | 'gd' | 'outcome' | 'wrong' {
  if (predHome === actualHome && predAway === actualAway) return 'exact'
  const predGD = predHome - predAway, actualGD = actualHome - actualAway
  if (predGD === actualGD) return 'gd'
  if (Math.sign(predGD) === Math.sign(actualGD)) return 'outcome'
  return 'wrong'
}

export default function StatsPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notLoggedIn, setNotLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setNotLoggedIn(true); setLoading(false); return }
      const uid = user.id

      const [predRes, matchRes, scoreRes, allScoresRes, koPredRes] = await Promise.all([
        (supabase as any).from('predictions_group').select('match_id, pred_home_score, pred_away_score').eq('user_id', uid),
        (supabase as any).from('matches').select('id, group_id, actual_home_score, actual_away_score').eq('stage', 'group').not('actual_home_score', 'is', null),
        (supabase as any).from('scores').select('total_pts').eq('user_id', uid).single(),
        (supabase as any).from('scores').select('total_pts'),
        (supabase as any).from('predictions_knockout').select('bracket_slot, home_team, away_team, pred_home_score, pred_away_score').eq('user_id', uid).eq('bracket_slot', 32).limit(1),
      ])

      const actualMap = new Map<string, MatchResult>((matchRes.data ?? []).map((m: any) => [m.id, m]))
      const preds: GroupPred[] = predRes.data ?? []

      // Build match-by-match results in order (sorted by match_id to keep streak consistent)
      const scoredPreds = preds
        .filter(p => actualMap.has(p.match_id))
        .map(p => {
          const m = actualMap.get(p.match_id)!
          return {
            match_id: p.match_id,
            group_id: m.group_id,
            score: getPredScore(p.pred_home_score, p.pred_away_score, m.actual_home_score, m.actual_away_score),
          }
        })
        .sort((a, b) => a.match_id.localeCompare(b.match_id))

      // Accuracy breakdown
      const accuracy: PredCategory = { exact: 0, correctGD: 0, correctOutcome: 0, wrong: 0, total: scoredPreds.length }
      for (const sp of scoredPreds) {
        if (sp.score === 'exact') accuracy.exact++
        else if (sp.score === 'gd') accuracy.correctGD++
        else if (sp.score === 'outcome') accuracy.correctOutcome++
        else accuracy.wrong++
      }

      // Per-group accuracy
      const groupMap = new Map<string, { correct: number; total: number }>()
      for (const sp of scoredPreds) {
        const gid = sp.group_id ?? 'unknown'
        if (!groupMap.has(gid)) groupMap.set(gid, { correct: 0, total: 0 })
        const g = groupMap.get(gid)!
        g.total++
        if (sp.score !== 'wrong') g.correct++
      }
      const groupAccuracies: GroupAccuracy[] = Array.from(groupMap.entries())
        .map(([groupId, v]) => ({ groupId, ...v }))
        .sort((a, b) => b.correct / b.total - a.correct / a.total)

      // Streaks (correct = any non-wrong)
      let currentStreak = 0, longestStreak = 0, streak = 0
      for (const sp of scoredPreds) {
        if (sp.score !== 'wrong') {
          streak++
          longestStreak = Math.max(longestStreak, streak)
        } else {
          streak = 0
        }
      }
      // Current streak = streak from end
      currentStreak = 0
      for (let i = scoredPreds.length - 1; i >= 0; i--) {
        if (scoredPreds[i].score !== 'wrong') currentStreak++
        else break
      }

      // Predicted champion (slot 32)
      let predictedChampion: string | null = null
      const finalPred = koPredRes.data?.[0]
      if (finalPred) {
        // The team predicted to win in the final: whoever scored more in prediction
        if (finalPred.pred_home_score > finalPred.pred_away_score) {
          predictedChampion = finalPred.home_team
        } else if (finalPred.pred_away_score > finalPred.pred_home_score) {
          predictedChampion = finalPred.away_team
        } else {
          predictedChampion = finalPred.home_team // draw - default to home
        }
      }

      // Scores
      const myTotalPts = scoreRes.data?.total_pts ?? 0
      const allPts: number[] = (allScoresRes.data ?? []).map((s: any) => s.total_pts ?? 0)
      const avgTotalPts = allPts.length > 0 ? Math.round(allPts.reduce((a: number, b: number) => a + b, 0) / allPts.length) : 0

      setStats({
        accuracy,
        groupAccuracies,
        currentStreak,
        longestStreak,
        predictedChampion,
        myTotalPts,
        avgTotalPts,
        userCount: allPts.length,
      })
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('stats_loading')}</div>
  }

  if (notLoggedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">{t('stats_title')}</h1>
        <p className="text-gray-500 mb-6">{t('stats_sign_in')}</p>
        <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0B1F3A]/80 transition-colors">
          {t('stats_sign_in_btn')}
        </a>
      </div>
    )
  }

  if (!stats) return null

  const { accuracy, groupAccuracies, currentStreak, longestStreak, predictedChampion, myTotalPts, avgTotalPts, userCount } = stats
  const correctCount = accuracy.exact + accuracy.correctGD + accuracy.correctOutcome
  const overallPct = accuracy.total > 0 ? Math.round((correctCount / accuracy.total) * 100) : 0

  // Stacked bar widths
  const total = accuracy.total || 1
  const exactW = Math.round((accuracy.exact / total) * 100)
  const gdW = Math.round((accuracy.correctGD / total) * 100)
  const outcomeW = Math.round((accuracy.correctOutcome / total) * 100)
  const wrongW = 100 - exactW - gdW - outcomeW

  const ptsDiff = myTotalPts - avgTotalPts

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-6">📊 {t('stats_title')}</h1>

      {/* Overall accuracy */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wide mb-4">{t('stats_accuracy')}</h2>
        <div className="flex items-center gap-6">
          {/* Circle indicator */}
          <div className="relative shrink-0 w-24 h-24">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="#0B1F3A"
                strokeWidth="3"
                strokeDasharray={`${overallPct} ${100 - overallPct}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#0B1F3A]">{overallPct}%</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0B1F3A]">{correctCount} <span className="text-base font-normal text-gray-400">of {accuracy.total}</span></p>
            <p className="text-sm text-gray-500 mt-1">scored matches predicted correctly (outcome or better)</p>
          </div>
        </div>
      </div>

      {/* By category */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wide mb-4">{t('stats_breakdown')}</h2>
        {/* Stacked bar */}
        <div className="flex rounded-full overflow-hidden h-4 mb-4 bg-gray-100">
          {exactW > 0 && <div className="bg-green-500 h-full transition-all" style={{ width: `${exactW}%` }} title={`Exact: ${accuracy.exact}`} />}
          {gdW > 0 && <div className="bg-blue-400 h-full transition-all" style={{ width: `${gdW}%` }} title={`Correct GD: ${accuracy.correctGD}`} />}
          {outcomeW > 0 && <div className="bg-indigo-300 h-full transition-all" style={{ width: `${outcomeW}%` }} title={`Correct outcome: ${accuracy.correctOutcome}`} />}
          {wrongW > 0 && <div className="bg-gray-200 h-full transition-all" style={{ width: `${wrongW}%` }} title={`Wrong: ${accuracy.wrong}`} />}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-green-500 shrink-0" />
            <span className="text-gray-600">🎯 {t('stats_exact')}</span>
            <span className="ml-auto font-bold text-green-600">{accuracy.exact}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-blue-400 shrink-0" />
            <span className="text-gray-600">📐 {t('stats_correct_gd')}</span>
            <span className="ml-auto font-bold text-blue-500">{accuracy.correctGD}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-indigo-300 shrink-0" />
            <span className="text-gray-600">✅ {t('stats_outcome')}</span>
            <span className="ml-auto font-bold text-indigo-500">{accuracy.correctOutcome}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gray-200 shrink-0" />
            <span className="text-gray-600">❌ {t('stats_wrong')}</span>
            <span className="ml-auto font-bold text-gray-400">{accuracy.wrong}</span>
          </div>
        </div>
      </div>

      {/* Best groups */}
      {groupAccuracies.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wide mb-4">Accuracy by Group</h2>
          <div className="space-y-2">
            {groupAccuracies.map(g => {
              const pct = g.total > 0 ? Math.round((g.correct / g.total) * 100) : 0
              return (
                <div key={g.groupId} className="flex items-center gap-3 text-xs">
                  <span className="w-16 text-gray-500 font-medium shrink-0">Group {g.groupId}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0B1F3A] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-semibold text-[#0B1F3A]">{pct}%</span>
                  <span className="text-gray-400 w-14 text-right">{g.correct}/{g.total}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Streaks + champion + vs avg */}
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {/* Streaks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wide mb-3">{t('stats_streaks')}</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Current streak</span>
              <span className="text-lg font-bold text-orange-500">{currentStreak} 🔥</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Longest streak</span>
              <span className="text-lg font-bold text-[#0B1F3A]">{longestStreak} ⭐</span>
            </div>
          </div>
        </div>

        {/* Predicted champion */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wide mb-3">{t('stats_champion')}</h2>
          {predictedChampion ? (
            <div className="text-center">
              <div className="text-3xl mb-1">🏆</div>
              <div className="font-bold text-[#0B1F3A] text-sm">{predictedChampion}</div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No final prediction yet</p>
          )}
        </div>

        {/* vs Average */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-[#0B1F3A] uppercase tracking-wide mb-3">vs Average</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Your pts</span>
              <span className="text-lg font-bold text-green-600">{myTotalPts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Avg of {userCount} players</span>
              <span className="text-base font-semibold text-gray-400">{avgTotalPts}</span>
            </div>
            <div className={`text-xs font-semibold text-center py-1 rounded-full ${
              ptsDiff > 0 ? 'bg-green-50 text-green-600' : ptsDiff < 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
            }`}>
              {ptsDiff === 0 ? 'At average' : ptsDiff > 0 ? `+${ptsDiff} above average` : `${ptsDiff} below average`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
