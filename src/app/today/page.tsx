'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { format, addDays, subDays, parseISO, isSameDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'

interface Team {
  id: string
  name: string
  flag_emoji: string
  fifa_code: string
}

interface Match {
  id: string
  stage: 'group' | 'knockout'
  group_letter: string | null
  ko_stage: string | null
  kickoff_at: string
  venue: string
  bracket_slot: string | null
  home_score: number | null
  away_score: number | null
  home_team: Team
  away_team: Team
}

interface Prediction {
  match_id?: string
  bracket_slot?: string
  user_id: string
  pred_home_score: number
  pred_away_score: number
}

interface TopPlayer {
  userId: string
  displayName: string
  predHome: number | null
  predAway: number | null
}

interface MatchWithPredictions extends Match {
  myPred: Prediction | null
  topPlayers: TopPlayer[]
}

function stageLabel(match: Match): string {
  if (match.stage === 'group') return `Group ${match.group_letter ?? ''}`
  if (match.ko_stage) {
    const labels: Record<string, string> = {
      r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-final',
      sf: 'Semi-final', final: 'Final', '3rd': '3rd Place'
    }
    return labels[match.ko_stage] ?? match.ko_stage.toUpperCase()
  }
  return 'Knockout'
}

function outcomeClass(match: Match, pred: Prediction | null): string {
  if (!pred || match.home_score == null || match.away_score == null) return ''
  const predGD = pred.pred_home_score - pred.pred_away_score
  const actualGD = match.home_score - match.away_score
  if (pred.pred_home_score === match.home_score && pred.pred_away_score === match.away_score) {
    return 'ring-2 ring-green-400 bg-green-50'
  }
  if (Math.sign(predGD) === Math.sign(actualGD)) {
    return 'ring-2 ring-yellow-300 bg-yellow-50'
  }
  return 'ring-2 ring-red-200 bg-red-50'
}

function FlagImg({ fifaCode, emoji, size = 32 }: { fifaCode: string; emoji: string; size?: number }) {
  const url = flagUrl(fifaCode, 80)
  if (!url) return <span className="text-2xl">{emoji}</span>
  return (
    <Image
      src={url}
      alt={fifaCode}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded-sm object-cover shadow-sm"
      unoptimized
    />
  )
}

export default function TodayPage() {
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [displayDate, setDisplayDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<MatchWithPredictions[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [noMatchesMsg, setNoMatchesMsg] = useState<string | null>(null)

  useEffect(() => {
    loadMatches(new Date())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMatches(date: Date) {
    setLoading(true)
    setMatches([])
    setNoMatchesMsg(null)

    const authRes = await supabase.auth.getUser()
    const uid = authRes.data.user?.id ?? null
    setUserId(uid)

    // Find matches for the selected date; if none, find next day with matches
    let targetDate = date
    let rawMatches: Match[] | null = null

    for (let offset = 0; offset <= 90; offset++) {
      const d = addDays(date, offset)
      const dayStart = format(d, 'yyyy-MM-dd') + 'T00:00:00.000Z'
      const dayEnd = format(d, 'yyyy-MM-dd') + 'T23:59:59.999Z'

      const { data } = await supabase
        .from('matches')
        .select(`
          id, stage, group_letter, ko_stage, kickoff_at, venue, bracket_slot,
          home_score, away_score,
          home_team:teams!matches_home_team_id_fkey(id,name,flag_emoji,fifa_code),
          away_team:teams!matches_away_team_id_fkey(id,name,flag_emoji,fifa_code)
        `)
        .gte('kickoff_at', dayStart)
        .lte('kickoff_at', dayEnd)
        .order('kickoff_at')

      if (data && data.length > 0) {
        rawMatches = data as unknown as Match[]
        targetDate = d
        if (offset > 0) {
          if (isSameDay(date, new Date())) {
            setNoMatchesMsg('No matches today. Showing next match day:')
          } else {
            setNoMatchesMsg(`No matches on ${format(date, 'MMM d')}. Showing next match day:`)
          }
        }
        break
      }
    }

    setSelectedDate(targetDate)
    setDisplayDate(targetDate)

    if (!rawMatches || rawMatches.length === 0) {
      setNoMatchesMsg('No matches scheduled')
      setLoading(false)
      return
    }

    // Fetch user's predictions
    let myGroupPreds: Prediction[] = []
    let myKoPreds: Prediction[] = []
    if (uid) {
      const groupIds = rawMatches.filter(m => m.stage === 'group').map(m => m.id)
      const koSlots = rawMatches.filter(m => m.stage === 'knockout' && m.bracket_slot).map(m => m.bracket_slot!)

      const [gRes, kRes] = await Promise.all([
        groupIds.length
          ? supabase.from('predictions_group').select('match_id,user_id,pred_home_score,pred_away_score').eq('user_id', uid).in('match_id', groupIds)
          : Promise.resolve({ data: [] }),
        koSlots.length
          ? supabase.from('predictions_knockout').select('bracket_slot,user_id,pred_home_score,pred_away_score').eq('user_id', uid).in('bracket_slot', koSlots)
          : Promise.resolve({ data: [] }),
      ])
      myGroupPreds = (gRes.data ?? []) as unknown as Prediction[]
      myKoPreds = (kRes.data ?? []) as unknown as Prediction[]
    }

    // Find top 3 players (from league if available, else global)
    let top3UserIds: string[] = []
    const usersMap: Record<string, string> = {}

    if (uid) {
      const { data: memberships } = await (supabase as any).from('league_members').select('league_id').eq('user_id', uid)
      const firstLeagueId = (memberships as any)?.[0]?.league_id ?? null

      if (firstLeagueId) {
        const { data: leagueMembersData } = await (supabase as any).from('league_members').select('user_id').eq('league_id', firstLeagueId)
        const memberIds = ((leagueMembersData as any) ?? []).map((r: any) => r.user_id)
        const { data: scores } = await supabase.from('scores').select('user_id,total_pts').in('user_id', memberIds).order('total_pts', { ascending: false }).limit(3)
        top3UserIds = (scores ?? []).map((s: any) => s.user_id)
      } else {
        const { data: scores } = await supabase.from('scores').select('user_id,total_pts').order('total_pts', { ascending: false }).limit(3)
        top3UserIds = (scores ?? []).map((s: any) => s.user_id)
      }
    } else {
      const { data: scores } = await supabase.from('scores').select('user_id,total_pts').order('total_pts', { ascending: false }).limit(3)
      top3UserIds = (scores ?? []).map((s: any) => s.user_id)
    }

    if (top3UserIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('id,display_name').in('id', top3UserIds)
      for (const u of (usersData ?? []) as any[]) {
        usersMap[u.id] = u.display_name ?? `User ${u.id.slice(0, 6)}`
      }
    }

    // Fetch top 3 predictions for all matches at once
    const groupIds = rawMatches.filter(m => m.stage === 'group').map(m => m.id)
    const koSlots = rawMatches.filter(m => m.stage === 'knockout' && m.bracket_slot).map(m => m.bracket_slot!)

    const [top3GroupRes, top3KoRes] = await Promise.all([
      groupIds.length && top3UserIds.length
        ? supabase.from('predictions_group').select('match_id,user_id,pred_home_score,pred_away_score').in('match_id', groupIds).in('user_id', top3UserIds)
        : Promise.resolve({ data: [] }),
      koSlots.length && top3UserIds.length
        ? supabase.from('predictions_knockout').select('bracket_slot,user_id,pred_home_score,pred_away_score').in('bracket_slot', koSlots).in('user_id', top3UserIds)
        : Promise.resolve({ data: [] }),
    ])

    const top3GroupPreds: Prediction[] = (top3GroupRes.data ?? []) as unknown as Prediction[]
    const top3KoPreds: Prediction[] = (top3KoRes.data ?? []) as unknown as Prediction[]

    const enriched: MatchWithPredictions[] = rawMatches.map(match => {
      const myPred = match.stage === 'group'
        ? myGroupPreds.find(p => p.match_id === match.id) ?? null
        : myKoPreds.find(p => p.bracket_slot === match.bracket_slot) ?? null

      const topPlayers: TopPlayer[] = top3UserIds.map(uid2 => {
        const pred = match.stage === 'group'
          ? top3GroupPreds.find(p => p.match_id === match.id && p.user_id === uid2)
          : top3KoPreds.find(p => p.bracket_slot === match.bracket_slot && p.user_id === uid2)
        return {
          userId: uid2,
          displayName: usersMap[uid2] ?? uid2.slice(0, 6),
          predHome: pred?.pred_home_score ?? null,
          predAway: pred?.pred_away_score ?? null,
        }
      })

      return { ...match, myPred, topPlayers }
    })

    setMatches(enriched)
    setLoading(false)
  }

  const navigateDay = (dir: 1 | -1) => {
    const newDate = dir === 1 ? addDays(selectedDate, 1) : subDays(selectedDate, 1)
    setSelectedDate(newDate)
    loadMatches(newDate)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">
          {noMatchesMsg && noMatchesMsg !== 'No matches scheduled' ? 'Next Match Day' : "Today's Matches"}
        </h1>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigateDay(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors text-xl leading-none"
          aria-label="Previous day"
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <div className="font-semibold text-[#0B1F3A]">
            {format(displayDate, 'EEEE, MMMM d')}
          </div>
          {noMatchesMsg && noMatchesMsg !== 'No matches scheduled' && (
            <div className="text-xs text-amber-600 mt-0.5">{noMatchesMsg}</div>
          )}
        </div>
        <button
          onClick={() => navigateDay(1)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors text-xl leading-none"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[40vh] text-gray-400">
          Loading matches…
        </div>
      )}

      {!loading && noMatchesMsg === 'No matches scheduled' && (
        <div className="text-center text-gray-400 py-20 text-lg">No matches scheduled</div>
      )}

      {!loading && matches.length > 0 && (
        <div className="flex flex-col gap-5">
          {matches.map(match => {
            const hasResult = match.home_score != null && match.away_score != null
            const cardClass = `rounded-2xl shadow bg-white p-4 transition-all ${outcomeClass(match, match.myPred)}`
            const kickoffTime = format(parseISO(match.kickoff_at), 'HH:mm')

            return (
              <div key={match.id} className={cardClass}>
                {/* Top: badge + time + venue */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wide bg-[#0B1F3A] text-white rounded-full px-3 py-0.5">
                    {stageLabel(match)}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>⏰ {kickoffTime}</span>
                    <span>📍 {match.venue}</span>
                  </div>
                </div>

                {/* Middle: teams + score */}
                <div className="flex items-center justify-center gap-4 py-3">
                  {/* Home team */}
                  <div className="flex flex-col items-center gap-1.5 w-24 sm:w-32">
                    <FlagImg fifaCode={match.home_team.fifa_code} emoji={match.home_team.flag_emoji} size={40} />
                    <span className="text-sm font-semibold text-center text-[#0B1F3A] leading-tight">{match.home_team.name}</span>
                  </div>

                  {/* Score or vs */}
                  <div className="flex flex-col items-center min-w-[80px]">
                    {hasResult ? (
                      <>
                        <div className="text-3xl font-black text-[#0B1F3A] tracking-tight">
                          {match.home_score} – {match.away_score}
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5">Final</span>
                      </>
                    ) : (
                      <div className="text-xl font-bold text-gray-400">vs</div>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex flex-col items-center gap-1.5 w-24 sm:w-32">
                    <FlagImg fifaCode={match.away_team.fifa_code} emoji={match.away_team.flag_emoji} size={40} />
                    <span className="text-sm font-semibold text-center text-[#0B1F3A] leading-tight">{match.away_team.name}</span>
                  </div>
                </div>

                {/* Prediction comparison */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  {!userId ? (
                    <p className="text-xs text-center text-gray-400 py-1">
                      <a href="/auth/login" className="text-[#0B1F3A] underline underline-offset-2 font-medium">Sign in</a> to see predictions
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left pb-1.5 font-medium">Player</th>
                            <th className="text-center pb-1.5 font-medium">Prediction</th>
                            {hasResult && <th className="text-center pb-1.5 font-medium">Result</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Current user row */}
                          <tr className="bg-blue-50/60">
                            <td className="py-1.5 px-1.5 font-semibold text-blue-700 rounded-l">You</td>
                            <td className="py-1.5 px-1.5 text-center font-mono font-bold text-[#0B1F3A]">
                              {match.myPred != null
                                ? `${match.myPred.pred_home_score} – ${match.myPred.pred_away_score}`
                                : <span className="text-gray-300 font-normal">—</span>}
                            </td>
                            {hasResult && (
                              <td className="py-1.5 px-1.5 text-center rounded-r">
                                {match.myPred != null ? (() => {
                                  const predGD = match.myPred.pred_home_score - match.myPred.pred_away_score
                                  const actualGD = match.home_score! - match.away_score!
                                  if (match.myPred.pred_home_score === match.home_score && match.myPred.pred_away_score === match.away_score)
                                    return <span className="text-green-600 font-bold">🎯 Exact</span>
                                  if (predGD === actualGD)
                                    return <span className="text-blue-500 font-semibold">📐 GD</span>
                                  if (Math.sign(predGD) === Math.sign(actualGD))
                                    return <span className="text-yellow-600 font-semibold">✅ Win</span>
                                  return <span className="text-red-500">❌ Miss</span>
                                })() : <span className="text-gray-300">—</span>}
                              </td>
                            )}
                          </tr>

                          {/* Top 3 players */}
                          {match.topPlayers.filter(p => p.userId !== userId).map((player, i) => (
                            <tr key={player.userId} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                              <td className="py-1.5 px-1.5 text-gray-600 truncate max-w-[100px]">
                                {['🥇', '🥈', '🥉'][i] ?? `#${i + 2}`} {player.displayName}
                              </td>
                              <td className="py-1.5 px-1.5 text-center font-mono text-gray-700">
                                {player.predHome != null
                                  ? `${player.predHome} – ${player.predAway}`
                                  : <span className="text-gray-300">—</span>}
                              </td>
                              {hasResult && (
                                <td className="py-1.5 px-1.5 text-center">
                                  {player.predHome != null ? (() => {
                                    const predGD = player.predHome - player.predAway!
                                    const actualGD = match.home_score! - match.away_score!
                                    if (player.predHome === match.home_score && player.predAway === match.away_score)
                                      return <span className="text-green-600">🎯</span>
                                    if (predGD === actualGD)
                                      return <span className="text-blue-500">📐</span>
                                    if (Math.sign(predGD) === Math.sign(actualGD))
                                      return <span className="text-yellow-600">✅</span>
                                    return <span className="text-red-400">❌</span>
                                  })() : <span className="text-gray-300">—</span>}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
