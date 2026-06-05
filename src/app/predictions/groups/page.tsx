'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import type { Team, Match } from '@/lib/supabase/types'
import { useTranslation } from '@/lib/i18n/LanguageContext'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

function isMatchLocked(kickoffAt: string | null | undefined): boolean {
  if (!kickoffAt) return false
  return Date.now() >= new Date(kickoffAt).getTime() - TWO_HOURS_MS
}
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// R32 opponent position key per qualifier position (bidirectional)
const R32_OPP_KEYS: Record<string, string> = {
  '1A': '3rd3', '1B': '3rd7', '1C': '2F',  '1D': '3rd5',
  '1E': '3rd1', '1F': '2C',  '1G': '3rd6', '1H': '2J',
  '1I': '3rd2', '1J': '2H',  '1K': '3rd8', '1L': '3rd4',
  '2A': '2B',   '2B': '2A',  '2C': '1F',  '2D': '2G',
  '2E': '2I',   '2F': '1C',  '2G': '2D',  '2H': '1J',
  '2I': '2E',   '2J': '1H',  '2K': '2L',  '2L': '2K',
  // Reverse: 3rdX → their group-winner opponent
  '3rd1': '1E', '3rd2': '1I', '3rd3': '1A', '3rd4': '1L',
  '3rd5': '1D', '3rd6': '1G', '3rd7': '1B', '3rd8': '1K',
}

// Fallback label for 1st-place teams whose 3rd-place opponent rank is uncertain
const R32_OPP_LABEL: Record<string, string> = {
  '1A': '3rd C/E/F/H/I', '1B': '3rd E/F/G/I/J', '1D': '3rd B/E/F/I/J',
  '1E': '3rd A/B/C/D/F', '1G': '3rd A/E/H/I/J', '1I': '3rd C/D/F/G/H',
  '1K': '3rd D/E/I/J/L', '1L': '3rd E/H/I/J/K',
}

// R16: the two R32 slots whose winners will meet in this R16 match
// keyed by R32 slot → the other R32 slot in the same R16 match
const R16_PARTNER: Record<number, number> = {
  1: 3, 3: 1,    // R16 slot 18: W1 vs W3
  2: 5, 5: 2,    // R16 slot 17: W2 vs W5
  4: 6, 6: 4,    // R16 slot 19: W4 vs W6
  7: 8, 8: 7,    // R16 slot 20: W7 vs W8
  9: 10, 10: 9,  // R16 slot 22: W9 vs W10
  11: 12, 12: 11,// R16 slot 21: W11 vs W12
  13: 15, 15: 13,// R16 slot 24: W13 vs W15
  14: 16, 16: 14,// R16 slot 23: W14 vs W16
}

// R32 slot each position occupies
const POS_TO_R32_SLOT: Record<string, number> = {
  '2A': 1, '2B': 1, '1E': 2, '3rd1': 2, '1F': 3, '2C': 3, '1C': 4, '2F': 4,
  '1I': 5, '3rd2': 5, '2E': 6, '2I': 6, '1A': 7, '3rd3': 7, '1L': 8, '3rd4': 8,
  '1D': 9, '3rd5': 9, '1G': 10, '3rd6': 10, '2K': 11, '2L': 11, '1H': 12, '2J': 12,
  '1B': 13, '3rd7': 13, '1J': 14, '2H': 14, '1K': 15, '3rd8': 15, '2D': 16, '2G': 16,
}

interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
}

type PredMap = Record<string, { home: string; away: string }>

interface TeamStat {
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  gf: number
  ga: number
  pts: number
  gd: number
}

function calcStandings(groupMatches: MatchWithTeams[], groupTeams: Team[], preds: PredMap): TeamStat[] {
  const stats = new Map<string, TeamStat>()
  for (const t of groupTeams) {
    stats.set(t.id, { team: t, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0, gd: 0 })
  }
  for (const m of groupMatches) {
    const pred = preds[m.id]
    if (!pred || pred.home === '' || pred.away === '') continue
    const h = parseInt(pred.home), a = parseInt(pred.away)
    if (isNaN(h) || isNaN(a) || !m.home_team_id || !m.away_team_id) continue
    const home = stats.get(m.home_team_id)
    const away = stats.get(m.away_team_id)
    if (!home || !away) continue
    home.played++; away.played++
    home.gf += h; home.ga += a; away.gf += a; away.ga += h
    if (h > a) { home.wins++; away.losses++ }
    else if (h < a) { away.wins++; home.losses++ }
    else { home.draws++; away.draws++ }
  }
  const rows = Array.from(stats.values()).map(s => ({ ...s, pts: s.wins * 3 + s.draws, gd: s.gf - s.ga }))
  return rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name))
}

function calcQualifiedGroups(allMatches: MatchWithTeams[], allTeams: Team[], preds: PredMap): Map<string, Team> {
  const qualified = new Map<string, Team>()
  const thirds: Array<{ group: string; team: Team; pts: number; gd: number; gf: number }> = []
  const GROUPS_ALL = ['A','B','C','D','E','F','G','H','I','J','K','L']
  for (const g of GROUPS_ALL) {
    const gMatches = allMatches.filter(m => m.group_letter === g)
    const gTeams = allTeams.filter(t => t.group_letter === g)
    const s = calcStandings(gMatches, gTeams, preds)
    if (s[0]) qualified.set('1' + g, s[0].team)
    if (s[1]) qualified.set('2' + g, s[1].team)
    if (s[2]) thirds.push({ group: g, team: s[2].team, pts: s[2].pts, gd: s[2].gd, gf: s[2].gf })
  }
  thirds
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
    .forEach((t, i) => qualified.set(`3rd${i + 1}`, t.team))
  return qualified
}

function getR32OppPosKey(posKey: string): string | null {
  return R32_OPP_KEYS[posKey] ?? null
}

export default function GroupPredictionsPage({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const [activeGroup, setActiveGroup] = useState('A')
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [preds, setPreds] = useState<PredMap>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set())
  const [dbError, setDbError] = useState<string | null>(null)
  const isGloballyLocked = new Date() >= LOCK_AT
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const { t } = useTranslation()
  const supabase = createClient()

  const handleClearAll = useCallback(async () => {
    if (!userId || isGloballyLocked) return
    setClearing(true)
    setConfirmClear(false)
    await supabase.from('predictions_group').delete().eq('user_id', userId)
    setPreds({})
    predsRef.current = {}
    setSavedIds(new Set())
    savedIdsRef.current = new Set()
    setSavedCount(0)
    onCountChange?.(0)
    setClearing(false)
  }, [userId, isGloballyLocked, supabase, onCountChange])

  // Refs mirror state so handleBlur always reads current values (avoids stale closure)
  const predsRef = useRef<PredMap>({})
  const savedIdsRef = useRef<Set<string>>(new Set())
  const userIdRef = useRef<string | null>(null)

  useEffect(() => { predsRef.current = preds }, [preds])
  useEffect(() => { savedIdsRef.current = savedIds }, [savedIds])
  useEffect(() => { userIdRef.current = userId }, [userId])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      userIdRef.current = user.id

      const [matchRes, teamRes, predRes] = await Promise.all([
        supabase.from('matches').select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)').eq('stage', 'group').order('kickoff_at'),
        supabase.from('teams').select('*'),
        supabase.from('predictions_group').select('*').eq('user_id', user.id),
      ])

      if (matchRes.error) { setDbError(matchRes.error.message); setLoading(false); return }

      setMatches((matchRes.data ?? []) as MatchWithTeams[])
      setTeams(teamRes.data ?? [])

      const predMap: PredMap = {}
      const ids = new Set<string>()
      let count = 0
      for (const p of predRes.data ?? []) {
        if (p.pred_home_score !== null && p.pred_away_score !== null) {
          predMap[p.match_id] = { home: String(p.pred_home_score), away: String(p.pred_away_score) }
          ids.add(p.match_id)
          count++
        }
      }
      setPreds(predMap)
      predsRef.current = predMap
      setSavedIds(ids)
      savedIdsRef.current = ids
      setSavedCount(count)
      onCountChange?.(count)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(async (matchId: string) => {
    const uid = userIdRef.current
    const match = matches.find(m => m.id === matchId)
    if (!uid || isGloballyLocked || isMatchLocked(match?.kickoff_at)) return

    // Read from ref — always has current value regardless of render cycle
    const pred = predsRef.current[matchId]
    if (!pred) return
    const { home, away } = pred

    // Both cleared → delete prediction from DB
    if (home === '' && away === '') {
      setErrorIds(s => { const n = new Set(s); n.delete(matchId); return n })
      const hadPred = savedIdsRef.current.has(matchId)
      if (hadPred) {
        await supabase.from('predictions_group').delete().eq('user_id', uid).eq('match_id', matchId)
        setSavedIds(s => { const n = new Set(s); n.delete(matchId); return n })
        setSavedCount(c => { const next = c - 1; onCountChange?.(next); return next })
      }
      return
    }

    // Only one filled → flag error
    if ((home === '') !== (away === '')) {
      setErrorIds(s => new Set([...s, matchId]))
      return
    }
    setErrorIds(s => { const n = new Set(s); n.delete(matchId); return n })

    const homeScore = parseInt(home), awayScore = parseInt(away)
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) return

    const isNew = !savedIdsRef.current.has(matchId)
    setSavingIds(s => new Set([...s, matchId]))
    const { error } = await supabase.from('predictions_group').upsert(
      { user_id: uid, match_id: matchId, pred_home_score: homeScore, pred_away_score: awayScore, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,match_id' }
    )
    setSavingIds(s => { const n = new Set(s); n.delete(matchId); return n })
    if (!error && isNew) {
      setSavedIds(s => new Set([...s, matchId]))
      setSavedCount(c => { const next = c + 1; onCountChange?.(next); return next })
    }
  }, [isGloballyLocked, matches, supabase, onCountChange])

  const groupMatches = matches.filter(m => m.group_letter === activeGroup)
  const groupTeams = teams.filter(t => t.group_letter === activeGroup)

  // Live standings for active group
  const standings = useMemo(() => calcStandings(groupMatches, groupTeams, preds), [groupMatches, groupTeams, preds])

  const qualifiedTeams = useMemo(
    () => calcQualifiedGroups(matches, teams, preds),
    [matches, teams, preds]
  )

  // Best 3rd places: take 3rd from every group, sort
  const best3rds = useMemo(() => {
    return GROUPS.map(g => {
      const gMatches = matches.filter(m => m.group_letter === g)
      const gTeams = teams.filter(t => t.group_letter === g)
      const s = calcStandings(gMatches, gTeams, preds)
      return s[2] ? { group: g, ...s[2] } : null
    })
      .filter(Boolean)
      .sort((a, b) => b!.pts - a!.pts || b!.gd - a!.gd || b!.gf - a!.gf)
      .map((r, i) => ({ ...r!, qualifies: i < 8 }))
  }, [matches, teams, preds])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('grp_loading')}</div>

  if (!userId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">{t('grp_sign_in')}</h2>
      <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">{t('stats_sign_in_btn')}</a>
    </div>
  )

  if (matches.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
      <div className="text-4xl">🏗️</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">No matches found</h2>
      {dbError
        ? <p className="text-red-500 max-w-sm text-sm font-mono bg-red-50 px-3 py-2 rounded">{dbError}</p>
        : <p className="text-gray-500 max-w-sm text-sm">Run the migrations in <code className="bg-gray-100 px-1 rounded">supabase/migrations/</code> to get started.</p>
      }
    </div>
  )

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${savedCount >= 72 ? 'pb-28' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">{t('pred_group_stage')}</h1>
        <div className="flex items-center gap-2">
          {isGloballyLocked && <span className="text-red-600 font-semibold text-sm">🔒 {t('grp_locked')}</span>}
          {!isGloballyLocked && savedCount > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-red-700 font-medium">{t('grp_clear_confirm', { n: savedCount })}</span>
                <button onClick={handleClearAll} disabled={clearing} className="text-xs bg-red-600 text-white px-2 py-1 rounded font-semibold hover:bg-red-700 disabled:opacity-50">
                  {clearing ? t('grp_clearing') : t('grp_yes_clear')}
                </button>
                <button onClick={() => setConfirmClear(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1">{t('grp_cancel')}</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
                {t('grp_clear_all')}
              </button>
            )
          )}
        </div>
      </div>

      {isGloballyLocked && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 font-semibold text-center">{t('grp_locked_banner')}</div>}

      {/* Group tabs */}
      <div className="flex flex-wrap gap-1 mb-6">
        {GROUPS.map(g => {
          const gCount = matches.filter(m => m.group_letter === g && savedIds.has(m.id) && preds[m.id]?.home !== '' && preds[m.id]?.away !== '').length
          return (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${activeGroup === g ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {g}
              {gCount === 6 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
            </button>
          )
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* LEFT: matches */}
        <div className="flex flex-col gap-3">
          {groupMatches.map(match => {
            const pred = preds[match.id] ?? { home: '', away: '' }
            const saving = savingIds.has(match.id)
            const hasError = errorIds.has(match.id)
            const matchLocked = isGloballyLocked || isMatchLocked(match.kickoff_at)
            const kickoff = match.kickoff_at
              ? new Date(match.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
              : ''
            const homeCode = (match.home_team as any)?.fifa_code
            const awayCode = (match.away_team as any)?.fifa_code

            return (
              <div key={match.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${hasError ? 'border-red-400' : matchLocked ? 'border-gray-300' : 'border-transparent'}`}>
                <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                  <span>{kickoff}{match.venue ? ` · ${match.venue}` : ''}</span>
                  {matchLocked && !isGloballyLocked && <span className="text-orange-500 font-medium">🔒 locked</span>}
                </div>
                <div className="flex items-center gap-2">
                  {/* Home */}
                  <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 overflow-hidden">
                    {homeCode ? (
                      <a href={`/teams/${homeCode}`} className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate hover:underline">{match.home_team?.name ?? '?'}</a>
                    ) : (
                      <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{match.home_team?.name ?? '?'}</span>
                    )}
                    {homeCode && <a href={`/teams/${homeCode}`}><img src={flagUrl(homeCode, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0 hover:opacity-80" /></a>}
                  </div>
                  {/* Inputs */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="number" min={0} max={99} inputMode="numeric" disabled={matchLocked} value={pred.home}
                      onChange={e => {
                        const val = e.target.value
                        const updated = { ...predsRef.current[match.id] ?? { home: '', away: '' }, home: val }
                        predsRef.current = { ...predsRef.current, [match.id]: updated }
                        setPreds(p => ({ ...p, [match.id]: updated }))
                        setErrorIds(s => { const n = new Set(s); n.delete(match.id); return n })
                      }}
                      onBlur={() => handleBlur(match.id)}
                      className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${hasError && pred.home === '' ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                    <span className="text-gray-400 font-bold text-xs">–</span>
                    <input type="number" min={0} max={99} inputMode="numeric" disabled={matchLocked} value={pred.away}
                      onChange={e => {
                        const val = e.target.value
                        const updated = { ...predsRef.current[match.id] ?? { home: '', away: '' }, away: val }
                        predsRef.current = { ...predsRef.current, [match.id]: updated }
                        setPreds(p => ({ ...p, [match.id]: updated }))
                        setErrorIds(s => { const n = new Set(s); n.delete(match.id); return n })
                      }}
                      onBlur={() => handleBlur(match.id)}
                      className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${hasError && pred.away === '' ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                  </div>
                  {/* Away */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                    {awayCode && <a href={`/teams/${awayCode}`}><img src={flagUrl(awayCode, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0 hover:opacity-80" /></a>}
                    {awayCode ? (
                      <a href={`/teams/${awayCode}`} className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate hover:underline">{match.away_team?.name ?? '?'}</a>
                    ) : (
                      <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{match.away_team?.name ?? '?'}</span>
                    )}
                  </div>
                  {/* Save indicator */}
                  <div className="w-4 text-center flex-shrink-0">
                    {saving ? <span className="text-xs text-yellow-500">…</span>
                      : hasError ? <span className="text-xs text-red-500">!</span>
                      : savedIds.has(match.id) && pred.home !== '' && pred.away !== '' ? <span className="text-xs text-green-600">✓</span>
                      : null}
                  </div>
                </div>
                {hasError && <p className="text-red-500 text-xs mt-1.5 text-center">Enter both scores</p>}
              </div>
            )
          })}

          {/* Knockout path preview */}
          {standings.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-2">
              <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-sm font-bold flex items-center gap-2">
                🏆 Knockout Path Preview
                <span className="text-white/60 font-normal text-xs">based on your predictions</span>
              </div>
              <div className="divide-y divide-gray-50">
                {standings.slice(0, 3).map((s, i) => {
                  const posKey = i < 2 ? `${i + 1}${activeGroup}` : null
                  const teamCode = (s.team as any).fifa_code

                  // --- 3rd place row ---
                  if (i === 2) {
                    const rank3rd = best3rds.findIndex(r => r?.team.id === s.team.id)
                    const qualifies = rank3rd >= 0 && rank3rd < 8
                    const r3rdRankLabel = rank3rd >= 0 ? `#${rank3rd + 1} of 12 thirds` : ''
                    const slotKey = rank3rd >= 0 && rank3rd < 8 ? `3rd${rank3rd + 1}` : null
                    // R32 opponent
                    const oppPosKey = slotKey ? R32_OPP_KEYS[slotKey] : null
                    const r32Opp = oppPosKey ? qualifiedTeams.get(oppPosKey) : null
                    const r32OppCode = r32Opp ? (r32Opp as any).fifa_code : null
                    // R16: find partner R32 slot, resolve both teams
                    const myR32Slot = slotKey ? POS_TO_R32_SLOT[slotKey] : null
                    const r16PartnerSlot = myR32Slot ? R16_PARTNER[myR32Slot] : null
                    const r16PosList = r16PartnerSlot
                      ? Object.entries(POS_TO_R32_SLOT).filter(([, v]) => v === r16PartnerSlot).map(([k]) => k)
                      : []
                    const r16Teams = r16PosList.map(k => qualifiedTeams.get(k)).filter(Boolean) as Team[]

                    return (
                      <div key={s.team.id} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                          {teamCode && <img src={flagUrl(teamCode, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
                          <a href={`/teams/${teamCode}`} className="font-semibold text-[#0B1F3A] text-sm hover:underline">{s.team.name}</a>
                          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${qualifies ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                            {qualifies ? `Qualifies (${r3rdRankLabel})` : `Out (${r3rdRankLabel})`}
                          </span>
                        </div>
                        {qualifies && (
                          <div className="ml-7 space-y-1">
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                              <span className="text-gray-400 w-7">R32:</span>
                              {r32OppCode && <img src={flagUrl(r32OppCode, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                              <span className="font-medium text-[#0B1F3A]">{r32Opp ? r32Opp.name : (oppPosKey ?? '?')}</span>
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                              <span className="w-7">R16:</span>
                              {r16Teams.length >= 2 ? (
                                <>
                                  <span>vs winner of</span>
                                  {(r16Teams[0] as any).fifa_code && <img src={flagUrl((r16Teams[0] as any).fifa_code, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                                  <span className="font-medium text-gray-600">{r16Teams[0].name}</span>
                                  <span>or</span>
                                  {(r16Teams[1] as any).fifa_code && <img src={flagUrl((r16Teams[1] as any).fifa_code, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                                  <span className="font-medium text-gray-600">{r16Teams[1].name}</span>
                                </>
                              ) : r16Teams.length === 1 ? (
                                <>
                                  <span>vs winner of</span>
                                  {(r16Teams[0] as any).fifa_code && <img src={flagUrl((r16Teams[0] as any).fifa_code, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                                  <span className="font-medium text-gray-600">{r16Teams[0].name}</span>
                                  <span className="text-gray-300">or TBD</span>
                                </>
                              ) : (
                                <span>{r16PosList.join(' / ') || '?'}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  // --- 1st / 2nd place rows ---
                  const oppKey = posKey ? getR32OppPosKey(posKey) : null
                  const r32Opp = oppKey ? qualifiedTeams.get(oppKey) : null
                  const r32OppLabel = r32Opp ? r32Opp.name : (posKey ? (R32_OPP_LABEL[posKey] ?? oppKey ?? '?') : '?')
                  const r32OppCode = r32Opp ? (r32Opp as any).fifa_code : null

                  // R16: find our R32 slot, then find partner slot, then resolve both teams in partner
                  const mySlot = posKey ? POS_TO_R32_SLOT[posKey] : null
                  const r16PartnerSlot = mySlot ? R16_PARTNER[mySlot] : null
                  const r16PosList = r16PartnerSlot
                    ? Object.entries(POS_TO_R32_SLOT).filter(([, v]) => v === r16PartnerSlot).map(([k]) => k)
                    : []
                  // Try to resolve both sides of the partner R32 match to actual teams
                  const r16Teams = r16PosList.map(k => qualifiedTeams.get(k)).filter(Boolean) as Team[]

                  return (
                    <div key={s.team.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-[#0B1F3A]' : 'bg-gray-300 text-[#0B1F3A]'}`}>{i + 1}</span>
                        {teamCode && <img src={flagUrl(teamCode, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
                        <a href={`/teams/${teamCode}`} className="font-semibold text-[#0B1F3A] text-sm hover:underline">{s.team.name}</a>
                      </div>
                      <div className="ml-7 space-y-1">
                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                          <span className="text-gray-400 w-7">R32:</span>
                          {r32OppCode && <img src={flagUrl(r32OppCode, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                          <span className="font-medium text-[#0B1F3A]">{r32OppLabel}</span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                          <span className="w-7">R16:</span>
                          {r16Teams.length >= 2 ? (
                            <>
                              <span>vs winner of</span>
                              {(r16Teams[0] as any).fifa_code && <img src={flagUrl((r16Teams[0] as any).fifa_code, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                              <span className="font-medium text-gray-600">{r16Teams[0].name}</span>
                              <span>or</span>
                              {(r16Teams[1] as any).fifa_code && <img src={flagUrl((r16Teams[1] as any).fifa_code, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                              <span className="font-medium text-gray-600">{r16Teams[1].name}</span>
                            </>
                          ) : r16Teams.length === 1 ? (
                            <>
                              <span>vs winner of</span>
                              {(r16Teams[0] as any).fifa_code && <img src={flagUrl((r16Teams[0] as any).fifa_code, 40)} alt="" className="w-4 h-auto rounded-sm" />}
                              <span className="font-medium text-gray-600">{r16Teams[0].name}</span>
                              <span className="text-gray-300">or TBD</span>
                            </>
                          ) : (
                            <span>{r16PosList.join(' / ') || '?'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: live standings */}
        <div className="lg:sticky lg:top-24 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-sm font-bold">Group {activeGroup} Standings</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400">
                  <th className="px-3 py-2 text-left">Team</th>
                  <th className="px-2 py-2 text-center">P</th>
                  <th className="px-2 py-2 text-center">W</th>
                  <th className="px-2 py-2 text-center">D</th>
                  <th className="px-2 py-2 text-center">L</th>
                  <th className="px-2 py-2 text-center">GD</th>
                  <th className="px-2 py-2 text-center font-bold text-[#0B1F3A]">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.team.id} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50' : i === 2 ? 'bg-yellow-50' : ''}`}>
                    <td className="px-3 py-2 flex items-center gap-1.5">
                      <span className="text-gray-300 text-[10px] w-3">{i + 1}</span>
                      {(s.team as any).fifa_code && (
                        <img src={flagUrl((s.team as any).fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />
                      )}
                      <span className="font-medium text-[#0B1F3A] truncate max-w-[80px]">{s.team.name}</span>
                    </td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.played}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.wins}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.draws}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.losses}</td>
                    <td className="px-2 py-2 text-center text-gray-500">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                    <td className="px-2 py-2 text-center font-bold text-[#0B1F3A]">{s.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-1.5 border-t border-gray-100 flex gap-3 text-[10px] text-gray-400">
              <span><span className="inline-block w-2 h-2 bg-green-200 rounded-sm mr-1" />Advance</span>
              <span><span className="inline-block w-2 h-2 bg-yellow-200 rounded-sm mr-1" />Best 3rd?</span>
            </div>
          </div>

          {/* Best 3rd places */}
          {best3rds.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-sm font-bold">Best 3rd Places <span className="text-white/60 font-normal text-xs">(top 8 qualify)</span></div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400">
                    <th className="px-3 py-2 text-left">Team</th>
                    <th className="px-2 py-2 text-center">Grp</th>
                    <th className="px-2 py-2 text-center">GD</th>
                    <th className="px-2 py-2 text-center font-bold text-[#0B1F3A]">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {best3rds.map((r, i) => (
                    <tr key={r.team.id} className={`border-t border-gray-50 ${r.qualifies ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 flex items-center gap-1.5">
                        <span className="text-gray-300 text-[10px] w-3">{i + 1}</span>
                        {(r.team as any).fifa_code && (
                          <img src={flagUrl((r.team as any).fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />
                        )}
                        <span className={`font-medium truncate max-w-[80px] ${r.qualifies ? 'text-[#0B1F3A]' : 'text-gray-400'}`}>{r.team.name}</span>
                      </td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.group}</td>
                      <td className="px-2 py-2 text-center text-gray-500">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      <td className={`px-2 py-2 text-center font-bold ${r.qualifies ? 'text-green-600' : 'text-gray-400'}`}>{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-gray-400 px-3 py-1.5 border-t border-gray-100">Based on your predictions so far</p>
            </div>
          )}
        </div>
      </div>

      {savedCount >= 72 && (
        <div className="mt-8 flex justify-center">
          <a href="/predictions?tab=knockout"
            className="bg-[#0B1F3A] text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-[#162d52] transition-all hover:scale-105 flex items-center gap-3 text-base animate-pulse">
            🏆 Group Stage Complete — Predict the Playoff Bracket →
          </a>
        </div>
      )}
    </div>
  )
}
