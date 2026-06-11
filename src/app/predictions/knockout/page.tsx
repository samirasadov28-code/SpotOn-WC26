'use client'

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import type { Team, Match } from '@/lib/supabase/types'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { getTeamName } from '@/lib/team-name'
import { getAnnexC, THIRD_SLOT_OPPONENT } from '@/lib/annex-c'

const LOCK_AT = new Date('2026-06-11T18:00:00Z')
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

type ViewMode = 'list' | 'bracket'

interface MatchWithTeams extends Match {
  home_team: Team | null
  away_team: Team | null
}

type GroupPredMap = Record<string, { home: string; away: string }>
type KOPredMap = Record<number, { homeScore: string; awayScore: string }>

interface TeamStat {
  team: Team
  played: number; wins: number; draws: number; losses: number
  gf: number; ga: number; pts: number; gd: number
}

// R32 match definitions — official FIFA WC 2026 bracket
const R32_DEFS = [
  { slot: 1,  homePos: '2A',   awayPos: '2B' },   // M73: 2A vs 2B
  { slot: 2,  homePos: '1E',   awayPos: '3rd1' },  // M74: 1E vs best 3rd (A/B/C/D/F)
  { slot: 3,  homePos: '1F',   awayPos: '2C' },    // M75: 1F vs 2C
  { slot: 4,  homePos: '1C',   awayPos: '2F' },    // M76: 1C vs 2F
  { slot: 5,  homePos: '1I',   awayPos: '3rd2' },  // M77: 1I vs best 3rd (C/D/F/G/H)
  { slot: 6,  homePos: '2E',   awayPos: '2I' },    // M78: 2E vs 2I
  { slot: 7,  homePos: '1A',   awayPos: '3rd3' },  // M79: 1A vs best 3rd (C/E/F/H/I)
  { slot: 8,  homePos: '1L',   awayPos: '3rd4' },  // M80: 1L vs best 3rd (E/H/I/J/K)
  { slot: 9,  homePos: '1D',   awayPos: '3rd5' },  // M81: 1D vs best 3rd (B/E/F/I/J)
  { slot: 10, homePos: '1G',   awayPos: '3rd6' },  // M82: 1G vs best 3rd (A/E/H/I/J)
  { slot: 11, homePos: '2K',   awayPos: '2L' },    // M83: 2K vs 2L
  { slot: 12, homePos: '1H',   awayPos: '2J' },    // M84: 1H vs 2J
  { slot: 13, homePos: '1B',   awayPos: '3rd7' },  // M85: 1B vs best 3rd (E/F/G/I/J)
  { slot: 14, homePos: '1J',   awayPos: '2H' },    // M86: 1J vs 2H
  { slot: 15, homePos: '1K',   awayPos: '3rd8' },  // M87: 1K vs best 3rd (D/E/I/J/L)
  { slot: 16, homePos: '2D',   awayPos: '2G' },    // M88: 2D vs 2G
] as const

// Round-of-16 through Final progression — official FIFA WC 2026 bracket
const LATER_DEFS = [
  // R16
  { slot: 17, homeParent: 2,  awayParent: 5,  stage: 'r16' as const }, // M89: W74 vs W77
  { slot: 18, homeParent: 1,  awayParent: 3,  stage: 'r16' as const }, // M90: W73 vs W75
  { slot: 19, homeParent: 4,  awayParent: 6,  stage: 'r16' as const }, // M91: W76 vs W78
  { slot: 20, homeParent: 7,  awayParent: 8,  stage: 'r16' as const }, // M92: W79 vs W80
  { slot: 21, homeParent: 11, awayParent: 12, stage: 'r16' as const }, // M93: W83 vs W84
  { slot: 22, homeParent: 9,  awayParent: 10, stage: 'r16' as const }, // M94: W81 vs W82
  { slot: 23, homeParent: 14, awayParent: 16, stage: 'r16' as const }, // M95: W86 vs W88
  { slot: 24, homeParent: 13, awayParent: 15, stage: 'r16' as const }, // M96: W85 vs W87
  // QF
  { slot: 25, homeParent: 17, awayParent: 18, stage: 'qf' as const }, // M97: W89 vs W90
  { slot: 26, homeParent: 21, awayParent: 22, stage: 'qf' as const }, // M98: W93 vs W94
  { slot: 27, homeParent: 19, awayParent: 20, stage: 'qf' as const }, // M99: W91 vs W92
  { slot: 28, homeParent: 23, awayParent: 24, stage: 'qf' as const }, // M100: W95 vs W96
  // SF
  { slot: 29, homeParent: 25, awayParent: 26, stage: 'sf' as const }, // M101: W97 vs W98
  { slot: 30, homeParent: 27, awayParent: 28, stage: 'sf' as const }, // M102: W99 vs W100
  // 3rd Place & Final
  { slot: 31, homeParent: 29, awayParent: 30, stage: 'third' as const }, // M104: L101 vs L102
  { slot: 32, homeParent: 29, awayParent: 30, stage: 'final' as const }, // M103: W101 vs W102
]

const STAGE_LABELS: Record<string, string> = {
  r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarterfinals',
  sf: 'Semifinals', third: '3rd Place', final: 'Final',
}

function calcStandings(gMatches: MatchWithTeams[], gTeams: Team[], preds: GroupPredMap): TeamStat[] {
  const stats = new Map<string, TeamStat>()
  for (const t of gTeams) stats.set(t.id, { team: t, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, pts: 0, gd: 0 })
  for (const m of gMatches) {
    const pred = preds[m.id]
    if (!pred || pred.home === '' || pred.away === '') continue
    const h = parseInt(pred.home), a = parseInt(pred.away)
    if (isNaN(h) || isNaN(a) || !m.home_team_id || !m.away_team_id) continue
    const home = stats.get(m.home_team_id), away = stats.get(m.away_team_id)
    if (!home || !away) continue
    home.played++; away.played++
    home.gf += h; home.ga += a; away.gf += a; away.ga += h
    if (h > a) { home.wins++; away.losses++ } else if (h < a) { away.wins++; home.losses++ } else { home.draws++; away.draws++ }
  }
  const rows = Array.from(stats.values()).map(s => ({ ...s, pts: s.wins * 3 + s.draws, gd: s.gf - s.ga }))
  return rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name))
}

function calcQualified(allMatches: MatchWithTeams[], allTeams: Team[], preds: GroupPredMap): Map<string, Team> {
  const qualified = new Map<string, Team>()
  const thirds: Array<{ group: string } & TeamStat> = []
  for (const g of GROUPS) {
    const gMatches = allMatches.filter(m => m.group_letter === g)
    const gTeams = allTeams.filter(t => t.group_letter === g)
    const s = calcStandings(gMatches, gTeams, preds)
    if (s[0]) qualified.set('1' + g, s[0].team)
    if (s[1]) qualified.set('2' + g, s[1].team)
    if (s[2]) thirds.push({ group: g, ...s[2] })
  }
  const top8 = thirds
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
  const thirdsMap = new Map(top8.map(t => [t.group, t.team]))

  // Each placeholder slot faces a fixed group winner; derive the opponent's group letter
  const slotOpponents = Object.entries(THIRD_SLOT_OPPONENT).map(
    ([placeholder, opponent]) => ({ placeholder, opponentGroup: opponent[1] }) // "1A" → "A"
  )

  // Try Annex C; validate it produces no same-group pairings
  let assigned = false
  const annexMapping = getAnnexC(top8.map(t => t.group))
  if (annexMapping) {
    const temp = new Map<string, Team>()
    let valid = true
    for (const { placeholder, opponentGroup } of slotOpponents) {
      const groupCode = annexMapping['1' + opponentGroup]
      const groupLetter = groupCode?.slice(1)
      const team = groupLetter ? thirdsMap.get(groupLetter) : undefined
      if (!team || team.group_letter === opponentGroup) { valid = false; break }
      temp.set(placeholder, team)
    }
    if (valid && temp.size === slotOpponents.length) {
      for (const [k, v] of temp) qualified.set(k, v)
      assigned = true
    }
  }

  // Fallback: assign by rank, skipping any team whose group matches the slot's group winner
  if (!assigned) {
    const remaining = [...top8]
    for (const { placeholder, opponentGroup } of slotOpponents) {
      const idx = remaining.findIndex(t => t.group !== opponentGroup)
      if (idx >= 0) {
        qualified.set(placeholder, remaining[idx].team)
        remaining.splice(idx, 1)
      } else if (remaining.length > 0) {
        qualified.set(placeholder, remaining[0].team)
        remaining.splice(0, 1)
      }
    }
  }

  return qualified
}

function getSlotTeams(
  slot: number,
  koPreds: KOPredMap,
  qualified: Map<string, Team>
): { home: Team | null; away: Team | null } {
  if (slot <= 16) {
    const def = R32_DEFS.find(d => d.slot === slot)!
    return { home: qualified.get(def.homePos) ?? null, away: qualified.get(def.awayPos) ?? null }
  }
  const def = LATER_DEFS.find(d => d.slot === slot)!
  if (def.stage === 'third') {
    return {
      home: getLoserOfSlot(29, koPreds, qualified),
      away: getLoserOfSlot(30, koPreds, qualified),
    }
  }
  return {
    home: getWinnerOfSlot(def.homeParent, koPreds, qualified),
    away: getWinnerOfSlot(def.awayParent, koPreds, qualified),
  }
}

function getWinnerOfSlot(slot: number, koPreds: KOPredMap, qualified: Map<string, Team>): Team | null {
  const { home, away } = getSlotTeams(slot, koPreds, qualified)
  const pred = koPreds[slot]
  if (!pred || pred.homeScore === '' || pred.awayScore === '') return null
  const h = parseInt(pred.homeScore), a = parseInt(pred.awayScore)
  if (isNaN(h) || isNaN(a) || h === a) return null
  return h > a ? home : away
}

function getLoserOfSlot(slot: number, koPreds: KOPredMap, qualified: Map<string, Team>): Team | null {
  const { home, away } = getSlotTeams(slot, koPreds, qualified)
  const pred = koPreds[slot]
  if (!pred || pred.homeScore === '' || pred.awayScore === '') return null
  const h = parseInt(pred.homeScore), a = parseInt(pred.awayScore)
  if (isNaN(h) || isNaN(a) || h === a) return null
  return h < a ? home : away
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface MatchCardProps {
  slot: number
  label: string
  homeTeam: Team | null
  awayTeam: Team | null
  pred: { homeScore: string; awayScore: string }
  onSave: (p: { homeScore: string; awayScore: string }) => void
  hasError: boolean
  isSaving: boolean
  isSaved: boolean
  isLocked: boolean
  compact?: boolean
  isLastFilled?: boolean
}

function MatchCard({ slot, label, homeTeam, awayTeam, pred, onSave, hasError, isSaving, isSaved, isLocked, compact, isLastFilled }: MatchCardProps) {
  const { t, lang } = useTranslation()
  const [localPred, setLocalPred] = useState(pred)
  const isFocusedRef = useRef(false)

  // Sync from parent only when not focused (e.g., initial load or external update)
  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalPred(pred)
    }
  }, [pred.homeScore, pred.awayScore]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (side: 'homeScore' | 'awayScore', val: string) => {
    setLocalPred(p => ({ ...p, [side]: val }))
  }

  const handleFocus = () => { isFocusedRef.current = true }

  const handleBlur = () => {
    isFocusedRef.current = false
    // Delay so a sibling input's onFocus fires first when tabbing between score fields
    setTimeout(() => {
      if (!isFocusedRef.current) {
        // Pass localPred directly — avoids stale closure on parent koPreds state
        onSave(localPred)
      }
    }, 0)
  }

  const drawError = localPred.homeScore !== '' && localPred.awayScore !== '' && localPred.homeScore === localPred.awayScore
  const partialError = hasError && !drawError
  const showError = drawError || partialError
  const disabled = isLocked || (!homeTeam && !awayTeam)

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border-l-4 p-2 shadow-sm transition-all duration-300 ease-in-out ${showError ? 'border-red-400' : isLastFilled ? 'border-green-400 ring-2 ring-green-400 animate-pulse' : 'border-gray-200'}`}>
        <div className="text-[10px] text-gray-400 mb-1 truncate">{label}</div>
        <div className="flex flex-col gap-1">
          {([['homeScore', homeTeam], ['awayScore', awayTeam]] as const).map(([side, team]) => (
            <div key={side} className="flex items-center gap-1.5">
              {team?.fifa_code
                ? <img src={flagUrl(team.fifa_code, 40)} alt="" className="w-5 h-3.5 object-cover rounded-sm flex-shrink-0" />
                : <span className="w-5 h-3.5 bg-gray-100 rounded-sm flex-shrink-0" />}
              <span className={`flex-1 min-w-0 text-[11px] font-medium text-[#0B1F3A] truncate`}>{team ? team.fifa_code : 'TBD'}</span>
              <input
                type="number" min={0} max={99} inputMode="numeric"
                disabled={disabled || !team}
                value={localPred[side]}
                onChange={e => handleChange(side, e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`w-9 text-center border rounded py-1 text-xs font-bold focus:ring-1 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${showError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
            </div>
          ))}
        </div>
        {showError && <p className="text-red-500 text-[10px] mt-1">{drawError ? t('ko_no_draws') : t('ko_both_scores')}</p>}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${showError ? 'border-red-400' : 'border-gray-200'}`}>
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 overflow-hidden">
          <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{homeTeam ? (getTeamName(homeTeam.fifa_code, lang) ?? homeTeam.name) : 'TBD'}</span>
          {homeTeam?.fifa_code
            ? <img src={flagUrl(homeTeam.fifa_code, 40)} alt="" className="w-7 h-5 object-cover rounded-sm flex-shrink-0" />
            : <span className="w-6 h-4 bg-gray-100 rounded-sm flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <input type="number" min={0} max={99} inputMode="numeric"
            disabled={disabled}
            value={localPred.homeScore}
            onChange={e => handleChange('homeScore', e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${showError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
          <span className="text-gray-400 font-bold text-xs">–</span>
          <input type="number" min={0} max={99} inputMode="numeric"
            disabled={disabled}
            value={localPred.awayScore}
            onChange={e => handleChange('awayScore', e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${showError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          {awayTeam?.fifa_code
            ? <img src={flagUrl(awayTeam.fifa_code, 40)} alt="" className="w-7 h-5 object-cover rounded-sm flex-shrink-0" />
            : <span className="w-6 h-4 bg-gray-100 rounded-sm flex-shrink-0" />}
          <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{awayTeam ? (getTeamName(awayTeam.fifa_code, lang) ?? awayTeam.name) : 'TBD'}</span>
        </div>
        <div className="w-4 flex-shrink-0 text-center">
          {isSaving ? <span className="text-xs text-yellow-500">…</span>
            : isSaved ? <span className="text-xs text-green-600">✓</span>
            : null}
        </div>
      </div>
      {showError && (
        <p className="text-red-500 text-xs mt-1.5 text-center">
          {drawError ? t('ko_no_draws') : t('ko_both_scores')}
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function KnockoutPredictionsPage({ onCountChange }: { onCountChange?: (n: number) => void }) {
  const { t, lang } = useTranslation()
  const [groupMatches, setGroupMatches] = useState<MatchWithTeams[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [groupPreds, setGroupPreds] = useState<GroupPredMap>({})
  const [koPreds, setKoPreds] = useState<KOPredMap>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [savingSlots, setSavingSlots] = useState<Set<number>>(new Set())
  const [errorSlots, setErrorSlots] = useState<Set<number>>(new Set())
  const [savedSlotCount, setSavedSlotCount] = useState(0)
  const [showWinner, setShowWinner] = useState(false)
  const [lastFilledSlot, setLastFilledSlot] = useState<number | null>(null)
  const isLocked = new Date() >= LOCK_AT
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const supabase = createClient()

  const handleClearAll = useCallback(async () => {
    if (!userId || isLocked) return
    setClearing(true)
    setConfirmClear(false)
    await supabase.from('predictions_knockout').delete().eq('user_id', userId)
    setKoPreds({})
    koPredsRef.current = {}
    setSavedSlotCount(0)
    onCountChange?.(0)
    setClearing(false)
  }, [userId, isLocked, supabase, onCountChange])

  // Ref mirrors koPreds for use in callbacks without stale closure issues
  const koPredsRef = useRef<KOPredMap>({})
  useEffect(() => { koPredsRef.current = koPreds }, [koPreds])

  const userIdRef = useRef<string | null>(null)
  useEffect(() => { userIdRef.current = userId }, [userId])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      userIdRef.current = user.id

      const [matchRes, teamRes, gpRes, kpRes] = await Promise.all([
        supabase.from('matches')
          .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
          .eq('stage', 'group').order('kickoff_at'),
        supabase.from('teams').select('*'),
        supabase.from('predictions_group').select('*').eq('user_id', user.id),
        supabase.from('predictions_knockout').select('*').eq('user_id', user.id),
      ])

      setGroupMatches((matchRes.data ?? []) as MatchWithTeams[])
      setAllTeams(teamRes.data ?? [])

      const gpMap: GroupPredMap = {}
      for (const p of gpRes.data ?? []) {
        if (p.pred_home_score !== null && p.pred_away_score !== null)
          gpMap[p.match_id] = { home: String(p.pred_home_score), away: String(p.pred_away_score) }
      }
      setGroupPreds(gpMap)

      const kpMap: KOPredMap = {}
      let count = 0
      for (const p of kpRes.data ?? []) {
        kpMap[p.bracket_slot] = {
          homeScore: p.pred_home_score !== null ? String(p.pred_home_score) : '',
          awayScore: p.pred_away_score !== null ? String(p.pred_away_score) : '',
        }
        if (p.pred_home_score !== null && p.pred_away_score !== null) count++
      }
      setKoPreds(kpMap)
      koPredsRef.current = kpMap
      setSavedSlotCount(count)
      onCountChange?.(count)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const qualified = useMemo(
    () => calcQualified(groupMatches, allTeams, groupPreds),
    [groupMatches, allTeams, groupPreds]
  )

  const predictedWinner = useMemo(
    () => getWinnerOfSlot(32, koPreds, qualified),
    [koPreds, qualified]
  )

  const prevWinnerRef = React.useRef<Team | null>(null)
  const winnerShownRef = React.useRef(false)
  useEffect(() => {
    // Only auto-show once ever — when the final slot is first completed this session
    // Use localStorage to avoid showing again on every page load
    if (predictedWinner !== null && prevWinnerRef.current === null) {
      const key = `winner-shown-${predictedWinner.id}`
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, '1')
        if (!winnerShownRef.current) {
          winnerShownRef.current = true
          setShowWinner(true)
        }
      }
    }
    prevWinnerRef.current = predictedWinner
  }, [predictedWinner])

  // handleSave receives pred directly from MatchCard — no stale closure on koPreds
  const handleSave = useCallback(async (slot: number, pred: { homeScore: string; awayScore: string }) => {
    const uid = userIdRef.current
    if (!uid || isLocked) return
    const { homeScore, awayScore } = pred

    if (homeScore === '' && awayScore === '') return

    if (homeScore === '' || awayScore === '') {
      setErrorSlots(s => new Set([...s, slot]))
      return
    }

    const h = parseInt(homeScore), a = parseInt(awayScore)
    if (isNaN(h) || isNaN(a) || h === a) {
      setErrorSlots(s => new Set([...s, slot]))
      return
    }

    setErrorSlots(s => { const n = new Set(s); n.delete(slot); return n })

    // Use ref to read previous saved state without stale closure
    const prev = koPredsRef.current[slot]
    const wasAlreadySaved = prev?.homeScore !== '' && prev?.awayScore !== '' &&
      prev?.homeScore !== undefined && prev?.awayScore !== undefined

    // Update ref immediately so parallel saves see current state
    koPredsRef.current = { ...koPredsRef.current, [slot]: pred }
    setKoPreds(p => ({ ...p, [slot]: pred }))

    setSavingSlots(s => new Set([...s, slot]))
    await supabase.from('predictions_knockout').upsert(
      { user_id: uid, bracket_slot: slot, pred_home_score: h, pred_away_score: a, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,bracket_slot' }
    )
    setSavingSlots(s => { const n = new Set(s); n.delete(slot); return n })

    if (!wasAlreadySaved) {
      setSavedSlotCount(c => { const next = c + 1; onCountChange?.(next); return next })
      setLastFilledSlot(slot)
      setTimeout(() => setLastFilledSlot(null), 1500)
    }
  }, [isLocked, supabase, onCountChange])

  const slotProps = useCallback((slot: number) => {
    const { home, away } = getSlotTeams(slot, koPreds, qualified)
    const pred = koPreds[slot] ?? { homeScore: '', awayScore: '' }
    const isSaved = pred.homeScore !== '' && pred.awayScore !== '' &&
      !errorSlots.has(slot) && pred.homeScore !== pred.awayScore
    return {
      slot,
      homeTeam: home,
      awayTeam: away,
      pred,
      onSave: (p: { homeScore: string; awayScore: string }) => handleSave(slot, p),
      hasError: errorSlots.has(slot),
      isSaving: savingSlots.has(slot),
      isSaved,
      isLocked,
      isLastFilled: lastFilledSlot === slot,
    }
  }, [koPreds, qualified, errorSlots, savingSlots, isLocked, handleSave, lastFilledSlot])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-500">{t('ko_loading')}</div>
  )

  if (!userId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">{t('ko_sign_in')}</h2>
      <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">{t('ko_sign_in')}</a>
    </div>
  )

  const groupsDone = Object.keys(groupPreds).length >= 72
  const qualifiedCount = qualified.size

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {isLocked && <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 font-semibold text-center">🔒 Predictions are locked. The tournament has started!</div>}
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">{t('ko_title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {qualifiedCount < 32
              ? t('ko_teams_tbd')
              : t('ko_bracket_set')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isLocked && <span className="text-red-600 font-semibold text-sm">🔒 Predictions locked</span>}
          {!isLocked && savedSlotCount > 0 && (
            confirmClear ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-red-700 font-medium">{t('ko_clear_confirm')}</span>
                <button onClick={handleClearAll} disabled={clearing} className="text-xs bg-red-600 text-white px-2 py-1 rounded font-semibold hover:bg-red-700 disabled:opacity-50">
                  {clearing ? t('ko_clearing') : t('ko_yes_clear')}
                </button>
                <button onClick={() => setConfirmClear(false)} className="text-xs text-gray-500 hover:text-gray-700 px-1">{t('ko_cancel')}</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
                {t('ko_clear_bracket')}
              </button>
            )
          )}
          {predictedWinner && (
            <button onClick={() => setShowWinner(true)} className="bg-amber-400 text-[#0B1F3A] font-black px-4 py-2 rounded-xl text-sm hover:bg-amber-300 transition-colors">
              {t('ko_your_winner_btn')}
            </button>
          )}
        </div>
      </div>

      {/* Info banner if group predictions incomplete */}
      {!groupsDone && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-sm text-amber-800">
          <strong>Tip:</strong> {t('ko_tip_group')}{' '}
          <a href="/predictions?tab=groups" className="font-bold underline">{t('ko_go_group')}</a>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        {(['list', 'bracket'] as ViewMode[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === v ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {v === 'list' ? t('ko_list_view') : t('ko_bracket_view')}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        <ListView slotProps={slotProps} koPreds={koPreds} onShowWinner={() => setShowWinner(true)} />
      ) : (
        <BracketView slotProps={slotProps} />
      )}

      {/* Winner modal */}
      {showWinner && predictedWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWinner(false)}>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Gold gradient header */}
            <div className="bg-gradient-to-b from-yellow-400 to-amber-500 pt-10 pb-6 px-6 text-center relative overflow-hidden">
              {/* Animated stars */}
              {['top-2 left-4', 'top-3 right-6', 'top-8 left-12', 'top-1 right-16', 'top-6 left-2'].map((pos, i) => (
                <span key={i} className={`absolute ${pos} text-white/60 text-lg animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}>✦</span>
              ))}
              {/* Bouncing trophy */}
              <div className="text-7xl mb-3 animate-bounce">🏆</div>
              <p className="text-[#0B1F3A] font-black text-sm uppercase tracking-widest">{t('ko_winner_title')}</p>
            </div>
            {/* Team section */}
            <div className="px-6 py-8 text-center">
              {predictedWinner.fifa_code && (
                <img
                  src={flagUrl(predictedWinner.fifa_code, 160)}
                  alt={predictedWinner.name}
                  className="h-24 w-auto mx-auto rounded-xl shadow-lg mb-4 object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <h2 className="text-3xl font-black text-[#0B1F3A] mb-1">{getTeamName(predictedWinner.fifa_code, lang) ?? predictedWinner.name}</h2>
              <p className="text-gray-500 text-sm">Congratulations on completing your bracket!</p>
              <div className="flex gap-3 mt-6 justify-center">
                <button onClick={() => setShowWinner(false)}
                  className="bg-[#0B1F3A] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#162d52] transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({ slotProps, koPreds, onShowWinner }: { slotProps: (slot: number) => Omit<MatchCardProps, 'label' | 'compact'>; koPreds: KOPredMap; onShowWinner: () => void }) {
  const { t, lang } = useTranslation()
  const bracketComplete = Array.from({ length: 32 }, (_, i) => i + 1).every(slot => {
    const pred = koPreds[slot]
    if (!pred || pred.homeScore === '' || pred.awayScore === '') return false
    const h = parseInt(pred.homeScore), a = parseInt(pred.awayScore)
    return !isNaN(h) && !isNaN(a) && h !== a
  })

  const stages = [
    { key: 'r32', label: t('ko_r32'), slots: R32_DEFS.map(d => d.slot) },
    { key: 'r16', label: t('ko_r16'), slots: [17,18,19,20,21,22,23,24] },
    { key: 'qf',  label: t('ko_qf'), slots: [25,26,27,28] },
    { key: 'sf',  label: t('ko_sf'), slots: [29,30] },
    { key: 'third', label: t('ko_third'), slots: [31] },
    { key: 'final', label: t('ko_final'), slots: [32] },
  ]

  const slotLabel = (slot: number): string => {
    if (slot <= 16) {
      const def = R32_DEFS.find(d => d.slot === slot)!
      return `${def.homePos} vs ${def.awayPos}`
    }
    const def = LATER_DEFS.find(d => d.slot === slot)!
    if (def.stage === 'third') return '3rd Place Match'
    if (def.stage === 'final') return '🏆 Final'
    return `Match ${slot}`
  }

  return (
    <div className="space-y-8">
      {stages.map(stage => (
        <div key={stage.key}>
          <h2 className="text-base font-bold text-[#0B1F3A] mb-3 flex items-center gap-2">
            {stage.label}
            <span className="text-xs font-normal text-gray-400">{t('ko_no_draws')}</span>
          </h2>
          <div className={`grid gap-3 ${stage.slots.length > 4 ? 'sm:grid-cols-2' : stage.slots.length > 2 ? 'sm:grid-cols-2' : ''}`}>
            {stage.slots.map(slot => (
              <MatchCard key={slot} label={slotLabel(slot)} {...slotProps(slot)} />
            ))}
          </div>
        </div>
      ))}

      {bracketComplete && (
        <div className="mt-10 flex flex-col items-center gap-4 p-8 bg-gradient-to-b from-white to-amber-50 rounded-2xl border border-amber-200">
          <div className="text-6xl">🏆</div>
          <h3 className="text-xl font-black text-[#0B1F3A]">{t('ko_complete')}</h3>
          <p className="text-gray-600 text-sm text-center">You&apos;ve predicted all the way to the Final.</p>
          <button onClick={onShowWinner} className="bg-[#0B1F3A] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#162d52] transition-colors">
            🏆 See Your Winner
          </button>
        </div>
      )}
    </div>
  )
}

// ── Bracket View ──────────────────────────────────────────────────────────────

function BracketView({ slotProps }: { slotProps: (slot: number) => Omit<MatchCardProps, 'label' | 'compact'> }) {
  const { t, lang } = useTranslation()
  const leftR32  = [2, 5, 1, 3, 11, 12, 9, 10]
  const leftR16  = [17, 18, 21, 22]
  const leftQF   = [25, 26]
  const leftSF   = [29]

  const rightR32 = [4, 6, 7, 8, 14, 16, 13, 15]
  const rightR16 = [19, 20, 23, 24]
  const rightQF  = [27, 28]
  const rightSF  = [30]

  const posLabel = (slot: number): string => {
    if (slot <= 16) {
      const def = R32_DEFS.find(d => d.slot === slot)!
      return `${def.homePos} vs ${def.awayPos}`
    }
    const def = LATER_DEFS.find(d => d.slot === slot)!
    if (def.stage === 'third') return '3rd Place'
    if (def.stage === 'final') return '🏆 Final'
    return `W${def.homeParent} vs W${def.awayParent}`
  }

  const BracketColumn = ({ title, slots, className = '' }: { title: string; slots: number[]; className?: string }) => (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100">{title}</div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {slots.map(slot => (
          <MatchCard key={slot} compact label={posLabel(slot)} {...slotProps(slot)} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="min-w-[1100px] flex gap-1.5 items-stretch">
        {/* Left half — R32 → R16 → QF → SF */}
        <BracketColumn title="R32" slots={leftR32} className="flex-1 min-w-[120px]" />
        <BracketColumn title="R16" slots={leftR16} className="flex-1 min-w-[120px]" />
        <BracketColumn title="QF"  slots={leftQF}  className="flex-1 min-w-[120px]" />
        <BracketColumn title="SF"  slots={leftSF}  className="flex-1 min-w-[120px]" />

        {/* Center: Final + 3rd */}
        <div className="flex flex-col justify-center gap-3 flex-1 min-w-[120px] mx-0.5">
          <div className="text-[10px] font-bold text-center text-[#0B1F3A] uppercase tracking-widest pb-1 border-b border-[#0B1F3A]/20">{t('ko_final')}</div>
          <MatchCard compact label={t('ko_final')} {...slotProps(32)} />
          <div className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100 mt-2">{t('ko_third')}</div>
          <MatchCard compact label={t('ko_third')} {...slotProps(31)} />
        </div>

        {/* Right half — SF → QF → R16 → R32 */}
        <BracketColumn title="SF"  slots={rightSF}  className="flex-1 min-w-[120px]" />
        <BracketColumn title="QF"  slots={rightQF}  className="flex-1 min-w-[120px]" />
        <BracketColumn title="R16" slots={rightR16} className="flex-1 min-w-[120px]" />
        <BracketColumn title="R32" slots={rightR32} className="flex-1 min-w-[120px]" />
      </div>
    </div>
  )
}
