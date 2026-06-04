'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import type { Team, Match } from '@/lib/supabase/types'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')
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

// R32 match definitions — avoids same-group matchups in R32
const R32_DEFS = [
  { slot: 1,  homePos: '1A', awayPos: '2B' },
  { slot: 2,  homePos: '1B', awayPos: '2A' },
  { slot: 3,  homePos: '1C', awayPos: '2D' },
  { slot: 4,  homePos: '1D', awayPos: '2C' },
  { slot: 5,  homePos: '1E', awayPos: '2F' },
  { slot: 6,  homePos: '1F', awayPos: '2E' },
  { slot: 7,  homePos: '1G', awayPos: '2H' },
  { slot: 8,  homePos: '1H', awayPos: '2G' },
  { slot: 9,  homePos: '1I', awayPos: '2J' },
  { slot: 10, homePos: '1J', awayPos: '2I' },
  { slot: 11, homePos: '1K', awayPos: '2L' },
  { slot: 12, homePos: '1L', awayPos: '2K' },
  { slot: 13, homePos: '3rd1', awayPos: '3rd2' },
  { slot: 14, homePos: '3rd3', awayPos: '3rd4' },
  { slot: 15, homePos: '3rd5', awayPos: '3rd6' },
  { slot: 16, homePos: '3rd7', awayPos: '3rd8' },
] as const

// Round-of-16 through Final progression
const LATER_DEFS = [
  { slot: 17, homeParent: 1,  awayParent: 2,  stage: 'r16' as const },
  { slot: 18, homeParent: 3,  awayParent: 4,  stage: 'r16' as const },
  { slot: 19, homeParent: 5,  awayParent: 6,  stage: 'r16' as const },
  { slot: 20, homeParent: 7,  awayParent: 8,  stage: 'r16' as const },
  { slot: 21, homeParent: 9,  awayParent: 10, stage: 'r16' as const },
  { slot: 22, homeParent: 11, awayParent: 12, stage: 'r16' as const },
  { slot: 23, homeParent: 13, awayParent: 14, stage: 'r16' as const },
  { slot: 24, homeParent: 15, awayParent: 16, stage: 'r16' as const },
  { slot: 25, homeParent: 17, awayParent: 18, stage: 'qf' as const },
  { slot: 26, homeParent: 19, awayParent: 20, stage: 'qf' as const },
  { slot: 27, homeParent: 21, awayParent: 22, stage: 'qf' as const },
  { slot: 28, homeParent: 23, awayParent: 24, stage: 'qf' as const },
  { slot: 29, homeParent: 25, awayParent: 26, stage: 'sf' as const },
  { slot: 30, homeParent: 27, awayParent: 28, stage: 'sf' as const },
  { slot: 31, homeParent: 29, awayParent: 30, stage: 'third' as const }, // loser of each SF
  { slot: 32, homeParent: 29, awayParent: 30, stage: 'final' as const },
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
  thirds
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
    .forEach((t, i) => qualified.set(`3rd${i + 1}`, t.team))
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
  onChange: (p: { homeScore: string; awayScore: string }) => void
  onBlur: () => void
  hasError: boolean
  isSaving: boolean
  isSaved: boolean
  isLocked: boolean
  compact?: boolean
}

function MatchCard({ slot, label, homeTeam, awayTeam, pred, onChange, onBlur, hasError, isSaving, isSaved, isLocked, compact }: MatchCardProps) {
  const drawError = pred.homeScore !== '' && pred.awayScore !== '' && pred.homeScore === pred.awayScore
  const partialError = hasError && !drawError
  const showError = drawError || partialError
  const disabled = isLocked || (!homeTeam && !awayTeam)

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border-l-4 p-2 shadow-sm ${showError ? 'border-red-400' : 'border-gray-200'}`}>
        <div className="text-[10px] text-gray-400 mb-1 truncate">{label}</div>
        <div className="flex flex-col gap-1">
          {[{ team: homeTeam, side: 'homeScore' as const }, { team: awayTeam, side: 'awayScore' as const }].map(({ team, side }) => (
            <div key={side} className="flex items-center gap-1.5">
              {team?.fifa_code
                ? <img src={flagUrl(team.fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm flex-shrink-0" />
                : <span className="w-5 h-3.5 bg-gray-100 rounded-sm flex-shrink-0" />}
              <span className="flex-1 min-w-0 text-[11px] font-medium text-[#0B1F3A] truncate">{team?.name ?? 'TBD'}</span>
              <input
                type="number" min={0} max={99} inputMode="numeric"
                disabled={disabled || !team}
                value={pred[side]}
                onChange={e => onChange({ ...pred, [side]: e.target.value })}
                onBlur={onBlur}
                className={`w-9 text-center border rounded py-1 text-xs font-bold focus:ring-1 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-40 ${showError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
            </div>
          ))}
        </div>
        {showError && <p className="text-red-500 text-[10px] mt-1">{drawError ? 'No draws' : 'Both scores needed'}</p>}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${showError ? 'border-red-400' : 'border-gray-200'}`}>
      <div className="text-xs text-gray-400 mb-2">{label}</div>
      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 overflow-hidden">
          <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{homeTeam?.name ?? 'TBD'}</span>
          {homeTeam?.fifa_code
            ? <img src={flagUrl(homeTeam.fifa_code, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0" />
            : <span className="w-6 h-4 bg-gray-100 rounded-sm flex-shrink-0" />}
        </div>
        {/* Inputs */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <input type="number" min={0} max={99} inputMode="numeric"
            disabled={disabled}
            value={pred.homeScore}
            onChange={e => onChange({ ...pred, homeScore: e.target.value })}
            onBlur={onBlur}
            className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-40 ${showError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
          <span className="text-gray-400 font-bold text-xs">–</span>
          <input type="number" min={0} max={99} inputMode="numeric"
            disabled={disabled}
            value={pred.awayScore}
            onChange={e => onChange({ ...pred, awayScore: e.target.value })}
            onBlur={onBlur}
            className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-40 ${showError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
        </div>
        {/* Away */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
          {awayTeam?.fifa_code
            ? <img src={flagUrl(awayTeam.fifa_code, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0" />
            : <span className="w-6 h-4 bg-gray-100 rounded-sm flex-shrink-0" />}
          <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{awayTeam?.name ?? 'TBD'}</span>
        </div>
        {/* Status */}
        <div className="w-4 flex-shrink-0 text-center">
          {isSaving ? <span className="text-xs text-yellow-500">…</span>
            : isSaved ? <span className="text-xs text-green-600">✓</span>
            : null}
        </div>
      </div>
      {showError && (
        <p className="text-red-500 text-xs mt-1.5 text-center">
          {drawError ? 'No draws allowed — pick a winner' : 'Enter both scores'}
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function KnockoutPredictionsPage() {
  const [groupMatches, setGroupMatches] = useState<MatchWithTeams[]>([])
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [groupPreds, setGroupPreds] = useState<GroupPredMap>({})
  const [koPreds, setKoPreds] = useState<KOPredMap>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [savingSlots, setSavingSlots] = useState<Set<number>>(new Set())
  const [errorSlots, setErrorSlots] = useState<Set<number>>(new Set())
  const isLocked = new Date() >= LOCK_AT
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

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
      for (const p of kpRes.data ?? []) {
        kpMap[p.bracket_slot] = {
          homeScore: p.pred_home_score !== null ? String(p.pred_home_score) : '',
          awayScore: p.pred_away_score !== null ? String(p.pred_away_score) : '',
        }
      }
      setKoPreds(kpMap)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const qualified = useMemo(
    () => calcQualified(groupMatches, allTeams, groupPreds),
    [groupMatches, allTeams, groupPreds]
  )

  const handleBlur = useCallback(async (slot: number) => {
    if (!userId || isLocked) return
    const pred = koPreds[slot]
    if (!pred) return
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
    setSavingSlots(s => new Set([...s, slot]))
    await supabase.from('predictions_knockout').upsert(
      { user_id: userId, bracket_slot: slot, pred_home_score: h, pred_away_score: a, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,bracket_slot' }
    )
    setSavingSlots(s => { const n = new Set(s); n.delete(slot); return n })
  }, [userId, isLocked, koPreds, supabase])

  const setPred = useCallback((slot: number, p: { homeScore: string; awayScore: string }) => {
    setKoPreds(prev => ({ ...prev, [slot]: p }))
    // Clear error as soon as user starts typing
    setErrorSlots(s => { const n = new Set(s); n.delete(slot); return n })
  }, [])

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
      onChange: (p: { homeScore: string; awayScore: string }) => setPred(slot, p),
      onBlur: () => handleBlur(slot),
      hasError: errorSlots.has(slot),
      isSaving: savingSlots.has(slot),
      isSaved,
      isLocked,
    }
  }, [koPreds, qualified, errorSlots, savingSlots, isLocked, setPred, handleBlur])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading bracket…</div>
  )

  if (!userId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">Sign in to make predictions</h2>
      <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">Sign in</a>
    </div>
  )

  const groupsDone = Object.keys(groupPreds).length >= 72
  const qualifiedCount = qualified.size

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Playoff Bracket</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {qualifiedCount < 32
              ? `${qualifiedCount}/32 teams determined from your group predictions`
              : '32 teams qualified — bracket fully set from your group predictions'}
          </p>
        </div>
        {isLocked && <span className="text-red-600 font-semibold text-sm">🔒 Predictions locked</span>}
      </div>

      {/* Info banner if group predictions incomplete */}
      {!groupsDone && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 text-sm text-amber-800">
          <strong>Tip:</strong> Complete your Group Stage predictions to auto-fill the bracket teams.{' '}
          <a href="/predictions?tab=groups" className="font-bold underline">Go to Group Stage →</a>
        </div>
      )}

      {/* View toggle */}
      <div className="flex gap-2 mb-6">
        {(['list', 'bracket'] as ViewMode[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === v ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {v === 'list' ? '☰ List' : '🏆 Bracket'}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        <ListView slotProps={slotProps} />
      ) : (
        <BracketView slotProps={slotProps} />
      )}
    </div>
  )
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({ slotProps }: { slotProps: (slot: number) => Omit<MatchCardProps, 'label' | 'compact'> }) {
  const stages = [
    { key: 'r32', label: 'Round of 32', slots: R32_DEFS.map(d => d.slot) },
    { key: 'r16', label: 'Round of 16', slots: [17,18,19,20,21,22,23,24] },
    { key: 'qf',  label: 'Quarterfinals', slots: [25,26,27,28] },
    { key: 'sf',  label: 'Semifinals', slots: [29,30] },
    { key: 'third', label: '3rd Place', slots: [31] },
    { key: 'final', label: 'Final', slots: [32] },
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
            <span className="text-xs font-normal text-gray-400">no draws allowed</span>
          </h2>
          <div className={`grid gap-3 ${stage.slots.length > 4 ? 'sm:grid-cols-2' : stage.slots.length > 2 ? 'sm:grid-cols-2' : ''}`}>
            {stage.slots.map(slot => (
              <MatchCard key={slot} label={slotLabel(slot)} {...slotProps(slot)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Bracket View ──────────────────────────────────────────────────────────────

function BracketView({ slotProps }: { slotProps: (slot: number) => Omit<MatchCardProps, 'label' | 'compact'> }) {
  // Left half: slots 1-8 → R16 17-20 → QF 25-26 → SF 29
  // Right half: slots 9-16 → R16 21-24 → QF 27-28 → SF 30
  // Center: Final 32 + 3rd Place 31

  const leftR32  = [1,2,3,4,5,6,7,8]
  const leftR16  = [17,18,19,20]
  const leftQF   = [25,26]
  const leftSF   = [29]

  const rightR32 = [9,10,11,12,13,14,15,16]
  const rightR16 = [21,22,23,24]
  const rightQF  = [27,28]
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
      <div className="min-w-[720px] flex gap-2 items-stretch">
        {/* Left half — reads left to right: R32 → R16 → QF → SF */}
        <BracketColumn title="R32" slots={leftR32} className="w-44" />
        <BracketColumn title="R16" slots={leftR16} className="w-44" />
        <BracketColumn title="QF" slots={leftQF} className="w-44" />
        <BracketColumn title="SF" slots={leftSF} className="w-44" />

        {/* Center: Final + 3rd */}
        <div className="flex flex-col justify-center gap-3 w-44 mx-1">
          <div className="text-[10px] font-bold text-center text-[#0B1F3A] uppercase tracking-widest pb-1 border-b border-[#0B1F3A]/20">Final</div>
          <MatchCard compact label="🏆 Final" {...slotProps(32)} />
          <div className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100 mt-2">3rd Place</div>
          <MatchCard compact label="3rd Place" {...slotProps(31)} />
        </div>

        {/* Right half — reads right to left: SF → QF → R16 → R32 */}
        <BracketColumn title="SF" slots={rightSF} className="w-44" />
        <BracketColumn title="QF" slots={rightQF} className="w-44" />
        <BracketColumn title="R16" slots={rightR16} className="w-44" />
        <BracketColumn title="R32" slots={rightR32} className="w-44" />
      </div>
    </div>
  )
}
