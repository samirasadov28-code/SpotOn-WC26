'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from '@/lib/i18n/LanguageContext'

const PREDICTIONS_TOTAL = 104 // 72 group + 32 knockout

interface UserLeague {
  id: string
  name: string
  join_code: string
}

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  groupPts: number
  advancementPts: number
  knockoutPts: number
  totalPts: number
  predictionCount: number
  updatedAt: Date | null
}

interface H2HStats {
  bothRight: number
  rivalOnly: number
  youOnly: number
  neither: number
  rivalPtsLead: number
}

interface ScoreBreakdown {
  groupExact: number    // 3-pt hits
  groupGD: number       // 2-pt hits
  groupOutcome: number  // 1-pt hits
  groupTotal: number
  advTotal: number
  koExact: number
  koGD: number
  koOutcome: number
  koTotal: number
  h2h?: H2HStats
}

function getMatchPts(pred_home: number, pred_away: number, actual_home: number, actual_away: number): number {
  if (pred_home === actual_home && pred_away === actual_away) return 3
  const predGD = pred_home - pred_away, actualGD = actual_home - actual_away
  if (predGD === actualGD) return 2
  if (Math.sign(predGD) === Math.sign(actualGD)) return 1
  return 0
}

function calcBreakdown(
  groupPreds: { pred_home: number; pred_away: number; actual_home: number; actual_away: number }[],
  koPreds: { pred_home: number; pred_away: number; actual_home: number; actual_away: number }[],
  advTotal: number
): ScoreBreakdown {
  let groupExact = 0, groupGD = 0, groupOutcome = 0
  for (const p of groupPreds) {
    if (p.pred_home === p.actual_home && p.pred_away === p.actual_away) { groupExact++; continue }
    const predGD = p.pred_home - p.pred_away, actualGD = p.actual_home - p.actual_away
    if (predGD === actualGD) { groupGD++; continue }
    const predOutcome = Math.sign(predGD), actualOutcome = Math.sign(actualGD)
    if (predOutcome === actualOutcome) groupOutcome++
  }
  let koExact = 0, koGD = 0, koOutcome = 0
  for (const p of koPreds) {
    if (p.pred_home === p.actual_home && p.pred_away === p.actual_away) { koExact++; continue }
    const predGD = p.pred_home - p.pred_away, actualGD = p.actual_home - p.actual_away
    if (predGD === actualGD) { koGD++; continue }
    const predOutcome = Math.sign(predGD), actualOutcome = Math.sign(actualGD)
    if (predOutcome === actualOutcome) koOutcome++
  }
  return {
    groupExact, groupGD, groupOutcome,
    groupTotal: groupExact * 3 + groupGD * 2 + groupOutcome,
    advTotal,
    koExact, koGD, koOutcome,
    koTotal: koExact * 3 + koGD * 2 + koOutcome,
  }
}

export default function LeaderboardPage() {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [breakdowns, setBreakdowns] = useState<Record<string, ScoreBreakdown>>({})
  const [loadingBreakdown, setLoadingBreakdown] = useState<string | null>(null)
  const [userLeagues, setUserLeagues] = useState<UserLeague[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('global')
  const [leagueMembers, setLeagueMembers] = useState<Set<string>>(new Set())
  const [leagueCounts, setLeagueCounts] = useState<Record<string, number>>({})
  const [showLeaguePanel, setShowLeaguePanel] = useState(false)
  const [newLeagueName, setNewLeagueName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [leagueActionLoading, setLeagueActionLoading] = useState(false)
  const [leagueError, setLeagueError] = useState<string | null>(null)
  const [inviteLeague, setInviteLeague] = useState<UserLeague | null>(null)
  const [copiedLeagueId, setCopiedLeagueId] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const [userRes, scoreRes, authRes] = await Promise.all([
      supabase.from('users').select('id, display_name'),
      supabase.from('scores').select('*'),
      supabase.auth.getUser(),
    ])

    const uid = authRes.data.user?.id ?? null
    setCurrentUserId(uid)

    // Load user's leagues
    if (uid) {
      const { data: memberships } = await (supabase as any)
        .from('league_members').select('league_id').eq('user_id', uid)
      if (memberships?.length) {
        const ids = memberships.map((m: any) => m.league_id)
        const { data: leagues } = await (supabase as any)
          .from('leagues').select('id, name, join_code').in('id', ids)
        setUserLeagues(leagues ?? [])
        // Fetch member counts for all user leagues
        const { data: allMembers } = await (supabase as any)
          .from('league_members').select('league_id').in('league_id', ids)
        const counts: Record<string, number> = {}
        for (const m of (allMembers ?? [])) counts[m.league_id] = (counts[m.league_id] ?? 0) + 1
        setLeagueCounts(counts)
      }
    }

    const users: { id: string; display_name: string | null }[] = userRes.data ?? []
    const scores = new Map((scoreRes.data ?? []).map((s: any) => [s.user_id, s]))

    // Count predictions per user via individual queries — avoids row-limit issues entirely
    const predCounts = new Map<string, number>()
    await Promise.all(users.map(async (u) => {
      const [gRes, kRes] = await Promise.all([
        supabase.from('predictions_group').select('match_id', { count: 'exact', head: true }).eq('user_id', u.id),
        supabase.from('predictions_knockout').select('bracket_slot', { count: 'exact', head: true }).eq('user_id', u.id),
      ])
      predCounts.set(u.id, (gRes.count ?? 0) + (kRes.count ?? 0))
    }))


    const built: Omit<LeaderboardEntry, 'rank'>[] = users.map((u) => {
      const s = scores.get(u.id)
      return {
        userId: u.id,
        displayName: u.display_name ?? `User ${u.id.slice(0, 6)}`,
        groupPts: s?.group_pts ?? 0,
        advancementPts: s?.advancement_pts ?? 0,
        knockoutPts: s?.knockout_match_pts ?? 0,
        totalPts: s?.total_pts ?? 0,
        predictionCount: predCounts.get(u.id) ?? 0,
        updatedAt: s ? new Date(s.updated_at) : null,
      }
    })

    built.sort((a, b) => b.totalPts - a.totalPts || a.displayName.localeCompare(b.displayName))

    const ranked: LeaderboardEntry[] = []
    let rank = 1
    for (let i = 0; i < built.length; i++) {
      if (i > 0 && built[i].totalPts < built[i - 1].totalPts) rank = i + 1
      ranked.push({ rank, ...built[i] })
    }

    setEntries(ranked)
    setLastUpdated(new Date())
    setLoading(false)
  }, [supabase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBreakdown = async (userId: string, advTotal: number, meId: string | null) => {
    if (breakdowns[userId]) return
    setLoadingBreakdown(userId)

    const fetchesForRival = [
      (supabase as any).from('predictions_group').select('match_id, pred_home_score, pred_away_score').eq('user_id', userId),
      (supabase as any).from('matches').select('id, actual_home_score, actual_away_score').eq('stage', 'group').not('actual_home_score', 'is', null),
      (supabase as any).from('predictions_knockout').select('bracket_slot, pred_home_score, pred_away_score').eq('user_id', userId),
      (supabase as any).from('matches').select('id, bracket_slot, actual_home_score, actual_away_score').eq('stage', 'knockout').not('actual_home_score', 'is', null),
    ]

    // If viewing a rival (not self) and we're logged in, also fetch current user's predictions for H2H
    const isRival = meId && meId !== userId
    let myGroupPredsPromise: Promise<any> | null = null
    let myKoPredsPromise: Promise<any> | null = null
    if (isRival) {
      myGroupPredsPromise = (supabase as any).from('predictions_group').select('match_id, pred_home_score, pred_away_score').eq('user_id', meId)
      myKoPredsPromise = (supabase as any).from('predictions_knockout').select('bracket_slot, pred_home_score, pred_away_score').eq('user_id', meId)
    }

    const [gpRes, matchRes, kpRes, koMatchRes] = await Promise.all(fetchesForRival)

    const actualGroupMap = new Map((matchRes.data ?? []).map((m: any) => [m.id, m]))
    const groupPreds = (gpRes.data ?? []).filter((p: any) => actualGroupMap.has(p.match_id)).map((p: any) => {
      const m = actualGroupMap.get(p.match_id)
      return { match_id: p.match_id, pred_home: p.pred_home_score, pred_away: p.pred_away_score, actual_home: m.actual_home_score, actual_away: m.actual_away_score }
    })

    const actualKoMap = new Map((koMatchRes.data ?? []).map((m: any) => [m.bracket_slot, m]))
    const koPreds = (kpRes.data ?? []).filter((p: any) => actualKoMap.has(p.bracket_slot)).map((p: any) => {
      const m = actualKoMap.get(p.bracket_slot)
      return { bracket_slot: p.bracket_slot, pred_home: p.pred_home_score, pred_away: p.pred_away_score, actual_home: m.actual_home_score, actual_away: m.actual_away_score }
    })

    const bd = calcBreakdown(groupPreds, koPreds, advTotal)

    // Compute H2H if viewing a rival
    if (isRival && myGroupPredsPromise && myKoPredsPromise) {
      const [myGpRes, myKpRes] = await Promise.all([myGroupPredsPromise, myKoPredsPromise])

      const myGroupMap = new Map((myGpRes.data ?? []).map((p: any) => [p.match_id, p]))
      const myKoMap = new Map((myKpRes.data ?? []).map((p: any) => [p.bracket_slot, p]))

      let bothRight = 0, rivalOnly = 0, youOnly = 0, neither = 0
      let rivalPts = 0, myPts = 0

      for (const rp of groupPreds) {
        const mp = myGroupMap.get(rp.match_id)
        const rivalCorrect = getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away) > 0
        const myCorrect = mp ? getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away) > 0 : false

        if (rivalCorrect && myCorrect) bothRight++
        else if (rivalCorrect && !myCorrect) rivalOnly++
        else if (!rivalCorrect && myCorrect) youOnly++
        else neither++

        rivalPts += getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away)
        if (mp) myPts += getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away)
      }

      for (const rp of koPreds) {
        const mp = myKoMap.get(rp.bracket_slot)
        const rivalCorrect = getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away) > 0
        const myCorrect = mp ? getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away) > 0 : false

        if (rivalCorrect && myCorrect) bothRight++
        else if (rivalCorrect && !myCorrect) rivalOnly++
        else if (!rivalCorrect && myCorrect) youOnly++
        else neither++

        rivalPts += getMatchPts(rp.pred_home, rp.pred_away, rp.actual_home, rp.actual_away)
        if (mp) myPts += getMatchPts(mp.pred_home_score, mp.pred_away_score, rp.actual_home, rp.actual_away)
      }

      bd.h2h = { bothRight, rivalOnly, youOnly, neither, rivalPtsLead: rivalPts - myPts }
    }

    setBreakdowns(prev => ({ ...prev, [userId]: bd }))
    setLoadingBreakdown(null)
  }

  const handleRowClick = async (entry: LeaderboardEntry) => {
    const isOpen = expandedId === entry.userId
    setExpandedId(isOpen ? null : entry.userId)
    if (!isOpen) await loadBreakdown(entry.userId, entry.advancementPts, currentUserId)
  }

  const handleLeagueChange = async (leagueId: string) => {
    setSelectedLeagueId(leagueId)
    setExpandedId(null)
    if (leagueId === 'global') { setLeagueMembers(new Set()); return }
    const { data } = await (supabase as any)
      .from('league_members').select('user_id').eq('league_id', leagueId)
    const members = (data ?? []).map((r: any) => r.user_id)
    setLeagueMembers(new Set(members))
    setLeagueCounts(prev => ({ ...prev, [leagueId]: members.length }))
  }

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    setLeagueActionLoading(true); setLeagueError(null)
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { data: league, error } = await (supabase as any).from('leagues').insert({ name: newLeagueName.trim(), join_code: code, created_by: currentUserId }).select().single()
    if (error) { setLeagueError(error.message); setLeagueActionLoading(false); return }
    await (supabase as any).from('league_members').insert({ league_id: league.id, user_id: currentUserId })
    setNewLeagueName('')
    setLeagueActionLoading(false)
    setInviteLeague({ id: league.id, name: league.name, join_code: league.join_code })
    await loadData()
  }

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId) return
    setLeagueActionLoading(true); setLeagueError(null)
    const { data: league, error } = await (supabase as any).from('leagues').select('*').eq('join_code', joinCode.trim().toUpperCase()).single()
    if (error || !league) { setLeagueError(t('lb_not_found')); setLeagueActionLoading(false); return }
    await (supabase as any).from('league_members').upsert({ league_id: league.id, user_id: currentUserId }, { onConflict: 'league_id,user_id' })
    setJoinCode('')
    setLeagueActionLoading(false)
    await loadData()
    handleLeagueChange(league.id)
  }

  const handleCopyInvite = async (league: UserLeague) => {
    const origin = window.location.origin
    const msg = `Join my SpotOn WC26 league "${league.name}"!\nSign up: ${origin}/auth/login?league=${league.join_code}\nOr enter code: ${league.join_code}`
    await navigator.clipboard.writeText(msg)
    setCopiedLeagueId(league.id)
    setTimeout(() => setCopiedLeagueId(null), 2000)
  }

  const visibleEntries = selectedLeagueId === 'global'
    ? entries
    : entries.filter(e => leagueMembers.has(e.userId)).map((e, i, arr) => {
        // Re-rank within the league
        let rank = 1
        if (i > 0 && e.totalPts < arr[i - 1].totalPts) rank = i + 1
        else if (i > 0) rank = arr[i - 1].rank ?? i + 1
        return { ...e, rank: i === 0 ? 1 : (e.totalPts < arr[i-1].totalPts ? i + 1 : (arr[i-1] as any).rank) }
      })

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('lb_loading')}</div>
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">{t('leaderboard_title')}</h1>
        {lastUpdated && <div className="text-xs text-gray-400">{t('lb_updated', { time: formatDistanceToNow(lastUpdated, { addSuffix: true }) })}</div>}
      </div>

      {/* League selector */}
      <div className="flex items-center gap-3 mb-5">
        <label className="text-sm font-semibold text-gray-600 shrink-0">{t('lb_view')}</label>
        <select
          value={selectedLeagueId}
          onChange={e => handleLeagueChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] bg-white"
        >
          <option value="global">{t('lb_global')}</option>
          {userLeagues.map(l => (
            <option key={l.id} value={l.id}>🏅 {l.name}</option>
          ))}
        </select>
        <span className="text-sm font-bold text-[#0B1F3A] tabular-nums">
          {visibleEntries.length} <span className="text-gray-400 font-normal text-xs">{visibleEntries.length === 1 ? t('leaderboard_player') : t('lb_players')}</span>
        </span>
        <button
          onClick={() => setShowLeaguePanel(o => !o)}
          className="ml-auto text-xs bg-[#0B1F3A] text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-colors shrink-0"
        >
          {showLeaguePanel ? t('lb_close') : t('lb_manage')}
        </button>
      </div>

      {/* League management panel */}
      {showLeaguePanel && (
        <div className="mb-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">{t('lb_create_title')}</p>
              <form onSubmit={handleCreateLeague} className="flex gap-2">
                <input type="text" required maxLength={50} placeholder={t('leaderboard_league_name')} value={newLeagueName} onChange={e => setNewLeagueName(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]" />
                <button type="submit" disabled={leagueActionLoading} className="bg-[#0B1F3A] text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-blue-900 disabled:opacity-50 transition-colors">{t('leaderboard_create_btn')}</button>
              </form>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">{t('lb_join_title')}</p>
              <form onSubmit={handleJoinLeague} className="flex gap-2">
                <input type="text" required maxLength={8} placeholder={t('lb_6letter')} value={joinCode} onChange={e => setJoinCode(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]" />
                <button type="submit" disabled={leagueActionLoading} className="bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors">{t('leaderboard_join_btn')}</button>
              </form>
            </div>
          </div>
          {leagueError && <p className="text-red-600 text-sm mb-3">{leagueError}</p>}
          {userLeagues.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{t('lb_your_leagues')}</p>
              {userLeagues.map(l => (
                <div key={l.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2">
                  <div>
                    <span className="font-semibold text-sm text-[#0B1F3A]">{l.name}</span>
                    <span className="text-xs text-gray-400 font-mono ml-2">· {l.join_code}</span>
                  </div>
                  <button onClick={() => handleCopyInvite(l)} className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${copiedLeagueId === l.id ? 'bg-green-600 text-white border border-green-600' : 'text-green-700 border border-green-200 hover:bg-green-50'}`}>
                    {copiedLeagueId === l.id ? t('leaderboard_copied') : t('leaderboard_copy_invite')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite popup after create */}
      {inviteLeague && !showLeaguePanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-[#0B1F3A] mb-2">{t('lb_league_created')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('lb_share_code')} <span className="font-mono font-bold text-green-700">{inviteLeague.join_code}</span></p>
            <button onClick={() => { handleCopyInvite(inviteLeague); }} className="w-full bg-green-600 text-white font-semibold py-2.5 rounded-lg text-sm mb-2 hover:bg-green-500 transition-colors">{copiedLeagueId === inviteLeague?.id ? t('leaderboard_copied') : t('lb_copy_msg')}</button>
            <button onClick={() => setInviteLeague(null)} className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">{t('lb_close')}</button>
          </div>
        </div>
      )}

      {/* Scoring legend */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-900 flex flex-wrap gap-x-5 gap-y-1.5">
        <span className="font-bold text-amber-800">{t('lb_how_points')}</span>
        <span>⚽ <strong>{t('lb_group_col')}</strong> — {t('lb_group_pts_desc')}</span>
        <span>🏅 <strong>{t('lb_advancement')}</strong> — {t('lb_adv_short')}</span>
        <span>🏆 <strong>{t('lb_playoff_col')}</strong> — {t('lb_playoff_short')}</span>
        <span className="text-amber-700 italic">{t('lb_click_breakdown')}</span>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          {selectedLeagueId === 'global' ? t('lb_no_players') : t('lb_no_members')}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B1F3A] text-white">
                <th className="py-3 px-3 text-left w-10">#</th>
                <th className="py-3 px-3 text-left">{t('leaderboard_player')}</th>
                <th className="py-3 px-3 text-center" title="Predictions completed out of 104">{t('lb_preds')}</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">{t('lb_group_col')}</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">{t('lb_advance_col')}</th>
                <th className="py-3 px-3 text-right hidden sm:table-cell">{t('lb_playoff_col')}</th>
                <th className="py-3 px-3 text-right font-bold">{t('lb_total')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry, idx) => {
                const isMe = entry.userId === currentUserId
                const isComplete = entry.predictionCount >= PREDICTIONS_TOTAL
                const pctDone = Math.min(100, Math.round((entry.predictionCount / PREDICTIONS_TOTAL) * 100))
                const isExpanded = expandedId === entry.userId
                const bd = breakdowns[entry.userId]

                return (
                  <>
                    <tr
                      key={entry.userId}
                      onClick={() => handleRowClick(entry)}
                      className={`border-t border-gray-100 cursor-pointer transition-colors hover:bg-blue-50/50 ${
                        isMe ? 'bg-blue-50 font-semibold' : entry.rank === 1 ? 'bg-yellow-50' : idx % 2 === 0 ? '' : 'bg-gray-50/50'
                      } ${isExpanded ? 'border-b-0' : ''}`}
                    >
                      <td className="py-3 px-3 font-bold text-gray-500 text-base">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </td>
                      <td className="py-3 px-3 text-[#0B1F3A] max-w-[120px] sm:max-w-none">
                        <div className="truncate flex items-center gap-1.5">
                          {entry.displayName}
                          <span className="text-gray-300 text-xs">▾</span>
                        </div>
                        {isMe && <div className="text-xs text-blue-500 font-normal">{t('you')}</div>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isComplete
                          ? <span className="text-green-600 font-semibold text-xs">✅</span>
                          : entry.predictionCount === 0
                          ? <span className="text-gray-300 text-xs">—</span>
                          : <span className="text-orange-500 text-xs font-medium">{pctDone}%</span>}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.groupPts}</td>
                      <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.advancementPts}</td>
                      <td className="py-3 px-3 text-right text-gray-600 hidden sm:table-cell">{entry.knockoutPts}</td>
                      <td className="py-3 px-3 text-right font-bold text-green-600 text-base">{entry.totalPts}</td>
                    </tr>

                    {/* Expanded breakdown row */}
                    {isExpanded && (
                      <tr key={`${entry.userId}-breakdown`} className={`border-t-0 ${isMe ? 'bg-blue-50' : entry.rank === 1 ? 'bg-yellow-50' : ''}`}>
                        <td colSpan={7} className="px-4 pb-4 pt-1">
                          {loadingBreakdown === entry.userId ? (
                            <div className="text-xs text-gray-400 py-2">Loading breakdown…</div>
                          ) : bd ? (
                            <>
                              <div className="grid sm:grid-cols-3 gap-3 mt-1">
                                {/* Group stage */}
                                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                  <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">{t('lb_group_pts')} <span className="text-gray-400 font-normal ml-auto">{bd.groupTotal} {t('pts')}</span></div>
                                  <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex justify-between"><span>{t('lb_exact_x3')}</span><span className="font-semibold text-green-600">{bd.groupExact} × 3 = {bd.groupExact * 3}</span></div>
                                    <div className="flex justify-between"><span>{t('lb_gd_x2')}</span><span className="font-semibold text-blue-600">{bd.groupGD} × 2 = {bd.groupGD * 2}</span></div>
                                    <div className="flex justify-between"><span>{t('lb_outcome_x1')}</span><span className="font-semibold text-gray-600">{bd.groupOutcome} × 1 = {bd.groupOutcome}</span></div>
                                  </div>
                                </div>
                                {/* Advancement */}
                                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                  <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">{t('lb_advancement')} <span className="text-gray-400 font-normal ml-auto">{bd.advTotal} {t('pts')}</span></div>
                                  <p className="text-xs text-gray-500 leading-relaxed">{t('lb_adv_desc')}</p>
                                </div>
                                {/* Knockout */}
                                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                  <div className="text-xs font-bold text-[#0B1F3A] mb-2 flex items-center gap-1">{t('lb_playoff_pts')} <span className="text-gray-400 font-normal ml-auto">{bd.koTotal} {t('pts')}</span></div>
                                  {bd.koExact + bd.koGD + bd.koOutcome === 0 ? (
                                    <p className="text-xs text-gray-400 italic">{t('lb_no_playoff')}</p>
                                  ) : (
                                    <div className="space-y-1 text-xs text-gray-600">
                                      <div className="flex justify-between"><span>{t('lb_exact_x3')}</span><span className="font-semibold text-green-600">{bd.koExact} × 3 = {bd.koExact * 3}</span></div>
                                      <div className="flex justify-between"><span>{t('lb_gd_x2')}</span><span className="font-semibold text-blue-600">{bd.koGD} × 2 = {bd.koGD * 2}</span></div>
                                      <div className="flex justify-between"><span>{t('lb_outcome_x1')}</span><span className="font-semibold text-gray-600">{bd.koOutcome} × 1 = {bd.koOutcome}</span></div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* H2H section — only shown when viewing a rival and current user is logged in */}
                              {!isMe && currentUserId && bd.h2h && (
                                <div className="mt-3 bg-white rounded-xl border border-[#0B1F3A]/20 p-3 shadow-sm">
                                  <div className="text-xs font-bold text-[#0B1F3A] mb-3 flex items-center gap-1">
                                    {t('lb_vs_you')}
                                    <span className="text-gray-400 font-normal ml-auto text-[11px]">{t('lb_on_scored')}</span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                    <div className="rounded-lg bg-green-50 border border-green-100 p-2 text-center">
                                      <div className="text-lg font-bold text-green-600">{bd.h2h.bothRight}</div>
                                      <div className="text-[10px] text-green-700 font-medium">{t('lb_both_correct')}</div>
                                    </div>
                                    <div className="rounded-lg bg-red-50 border border-red-100 p-2 text-center">
                                      <div className="text-lg font-bold text-red-500">{bd.h2h.rivalOnly}</div>
                                      <div className="text-[10px] text-red-600 font-medium">{t('lb_rival_only')}</div>
                                    </div>
                                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-2 text-center">
                                      <div className="text-lg font-bold text-blue-500">{bd.h2h.youOnly}</div>
                                      <div className="text-[10px] text-blue-600 font-medium">{t('lb_you_only')}</div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 border border-gray-100 p-2 text-center">
                                      <div className="text-lg font-bold text-gray-400">{bd.h2h.neither}</div>
                                      <div className="text-[10px] text-gray-500 font-medium">{t('lb_neither')}</div>
                                    </div>
                                  </div>
                                  <div className={`text-xs font-semibold text-center py-1 px-3 rounded-full inline-block ${
                                    bd.h2h.rivalPtsLead > 0
                                      ? 'bg-red-50 text-red-600'
                                      : bd.h2h.rivalPtsLead < 0
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-gray-50 text-gray-500'
                                  }`}>
                                    {bd.h2h.rivalPtsLead === 0
                                      ? t('lb_tied')
                                      : bd.h2h.rivalPtsLead > 0
                                      ? t('lb_rival_leads', { pts: String(bd.h2h.rivalPtsLead) })
                                      : t('lb_you_lead', { pts: String(Math.abs(bd.h2h.rivalPtsLead)) })}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-gray-400 py-2">{t('lb_no_scored')}</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">
            {t('lb_footer', { n: String(PREDICTIONS_TOTAL) })}
          </p>
        </div>
      )}
    </div>
  )
}
