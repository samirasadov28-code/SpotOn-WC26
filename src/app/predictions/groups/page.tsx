'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import type { Team, Match } from '@/lib/supabase/types'
import { GROUP_STADIUMS } from '@/lib/schedule-data'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')
const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// Official R32 path per group position
const BRACKET_PATHS: Record<string, { r32Opp: string; r32OppShort: string; r16Desc: string }> = {
  '1A': { r32Opp: 'Best 3rd (C/E/F/H/I)', r32OppShort: '3rd C/E/F/H/I', r16Desc: 'W(1L vs 3rd E/H/I/J/K)' },
  '1B': { r32Opp: 'Best 3rd (E/F/G/I/J)', r32OppShort: '3rd E/F/G/I/J', r16Desc: 'W(1K vs 3rd D/E/I/J/L)' },
  '1C': { r32Opp: 'Runner-up Grp F',      r32OppShort: '2nd F',           r16Desc: 'W(2E vs 2I)' },
  '1D': { r32Opp: 'Best 3rd (B/E/F/I/J)', r32OppShort: '3rd B/E/F/I/J', r16Desc: 'W(1G vs 3rd A/E/H/I/J)' },
  '1E': { r32Opp: 'Best 3rd (A/B/C/D/F)', r32OppShort: '3rd A/B/C/D/F', r16Desc: 'W(1I vs 3rd C/D/F/G/H)' },
  '1F': { r32Opp: 'Runner-up Grp C',      r32OppShort: '2nd C',           r16Desc: 'W(2A vs 2B)' },
  '1G': { r32Opp: 'Best 3rd (A/E/H/I/J)', r32OppShort: '3rd A/E/H/I/J', r16Desc: 'W(1D vs 3rd B/E/F/I/J)' },
  '1H': { r32Opp: 'Runner-up Grp J',      r32OppShort: '2nd J',           r16Desc: 'W(2K vs 2L)' },
  '1I': { r32Opp: 'Best 3rd (C/D/F/G/H)', r32OppShort: '3rd C/D/F/G/H', r16Desc: 'W(1E vs 3rd A/B/C/D/F)' },
  '1J': { r32Opp: 'Runner-up Grp H',      r32OppShort: '2nd H',           r16Desc: 'W(2D vs 2G)' },
  '1K': { r32Opp: 'Best 3rd (D/E/I/J/L)', r32OppShort: '3rd D/E/I/J/L', r16Desc: 'W(1B vs 3rd E/F/G/I/J)' },
  '1L': { r32Opp: 'Best 3rd (E/H/I/J/K)', r32OppShort: '3rd E/H/I/J/K', r16Desc: 'W(1A vs 3rd C/E/F/H/I)' },
  '2A': { r32Opp: 'Runner-up Grp B',      r32OppShort: '2nd B',           r16Desc: 'W(1F vs 2nd C)' },
  '2B': { r32Opp: 'Runner-up Grp A',      r32OppShort: '2nd A',           r16Desc: 'W(1F vs 2nd C)' },
  '2C': { r32Opp: 'Winner Grp F',         r32OppShort: '1st F',           r16Desc: 'W(2A vs 2B)' },
  '2D': { r32Opp: 'Runner-up Grp G',      r32OppShort: '2nd G',           r16Desc: 'W(1J vs 2nd H)' },
  '2E': { r32Opp: 'Runner-up Grp I',      r32OppShort: '2nd I',           r16Desc: 'W(1C vs 2nd F)' },
  '2F': { r32Opp: 'Winner Grp C',         r32OppShort: '1st C',           r16Desc: 'W(2E vs 2I)' },
  '2G': { r32Opp: 'Runner-up Grp D',      r32OppShort: '2nd D',           r16Desc: 'W(1J vs 2nd H)' },
  '2H': { r32Opp: 'Winner Grp J',         r32OppShort: '1st J',           r16Desc: 'W(2D vs 2G)' },
  '2I': { r32Opp: 'Runner-up Grp E',      r32OppShort: '2nd E',           r16Desc: 'W(1C vs 2nd F)' },
  '2J': { r32Opp: 'Winner Grp H',         r32OppShort: '1st H',           r16Desc: 'W(2K vs 2L)' },
  '2K': { r32Opp: 'Runner-up Grp L',      r32OppShort: '2nd L',           r16Desc: 'W(1H vs 2nd J)' },
  '2L': { r32Opp: 'Runner-up Grp K',      r32OppShort: '2nd K',           r16Desc: 'W(1H vs 2nd J)' },
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
  const R32_OPP_KEYS: Record<string, string> = {
    '1A': '3rd3', '1B': '3rd7', '1C': '2F', '1D': '3rd5',
    '1E': '3rd1', '1F': '2C', '1G': '3rd6', '1H': '2J',
    '1I': '3rd2', '1J': '2H', '1K': '3rd8', '1L': '3rd4',
    '2A': '2B',   '2B': '2A',  '2C': '1F',  '2D': '2G',
    '2E': '2I',   '2F': '1C',  '2G': '2D',  '2H': '1J',
    '2I': '2E',   '2J': '1H',  '2K': '2L',  '2L': '2K',
    // 3rd-place slots face 1st-place teams
    '3rd1': '1E', '3rd2': '1I', '3rd3': '1A', '3rd4': '1L',
    '3rd5': '1D', '3rd6': '1G', '3rd7': '1B', '3rd8': '1K',
  }
  return R32_OPP_KEYS[posKey] ?? null
}

// R32 slot → [homePosKey, awayPosKey]
const R32_SLOT_DEFS: Record<number, [string, string]> = {
  1: ['2A','2B'],  2: ['1E','3rd1'], 3: ['1F','2C'],   4: ['1C','2F'],
  5: ['1I','3rd2'],6: ['2E','2I'],   7: ['1A','3rd3'],  8: ['1L','3rd4'],
  9: ['1D','3rd5'],10:['1G','3rd6'], 11:['2K','2L'],   12:['1H','2J'],
  13:['1B','3rd7'],14:['1J','2H'],  15:['1K','3rd8'],  16:['2D','2G'],
}

// R16 slot → [r32SlotA, r32SlotB]
const R16_SLOT_DEFS: Record<number, [number, number]> = {
  17:[2,5], 18:[1,3], 19:[4,6], 20:[7,8],
  21:[11,12], 22:[9,10], 23:[14,16], 24:[13,15],
}

// For a given posKey, return R16 info: the two pos-keys from the OTHER R32 match in their R16
function getR16OtherKeys(posKey: string): [string, string] | null {
  // Find the R32 slot this posKey is in
  let myR32Slot: number | null = null
  for (const [slot, [h, a]] of Object.entries(R32_SLOT_DEFS)) {
    if (h === posKey || a === posKey) { myR32Slot = parseInt(slot); break }
  }
  if (!myR32Slot) return null
  // Find the R16 slot and the other R32 slot
  for (const [, [slotA, slotB]] of Object.entries(R16_SLOT_DEFS)) {
    if (slotA === myR32Slot) return R32_SLOT_DEFS[slotB] ?? null
    if (slotB === myR32Slot) return R32_SLOT_DEFS[slotA] ?? null
  }
  return null
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
  const isLocked = new Date() >= LOCK_AT

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

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
      setSavedIds(ids)
      setSavedCount(count)
      onCountChange?.(count)
      setLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBlur = useCallback(async (matchId: string) => {
    if (!userId || isLocked) return
    const pred = preds[matchId]
    if (!pred) return
    const { home, away } = pred

    // Both cleared → delete prediction from DB
    if (home === '' && away === '') {
      setErrorIds(s => { const n = new Set(s); n.delete(matchId); return n })
      const hadPred = savedIds.has(matchId)
      if (hadPred) {
        await supabase.from('predictions_group').delete().eq('user_id', userId).eq('match_id', matchId)
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

    setSavingIds(s => new Set([...s, matchId]))
    const isNew = !savedIds.has(matchId)
    const { error } = await supabase.from('predictions_group').upsert(
      { user_id: userId, match_id: matchId, pred_home_score: homeScore, pred_away_score: awayScore, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,match_id' }
    )
    setSavingIds(s => { const n = new Set(s); n.delete(matchId); return n })
    if (!error && isNew) {
      setSavedIds(s => new Set([...s, matchId]))
      setSavedCount(c => { const next = c + 1; onCountChange?.(next); return next })
    }
  }, [userId, isLocked, preds, savedIds, supabase])

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

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading predictions…</div>

  if (!userId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="text-4xl">🔒</div>
      <h2 className="text-xl font-bold text-[#0B1F3A]">Sign in to make predictions</h2>
      <a href="/auth/login" className="bg-[#0B1F3A] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 transition-colors">Sign in</a>
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
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Group Stage Predictions</h1>
        {isLocked && <span className="text-red-600 font-semibold text-sm">🔒 Predictions locked</span>}
      </div>

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
            const kickoff = match.kickoff_at
              ? new Date(match.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
              : ''
            const homeCode = (match.home_team as any)?.fifa_code
            const awayCode = (match.away_team as any)?.fifa_code

            return (
              <div key={match.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${hasError ? 'border-red-400' : 'border-transparent'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{kickoff}</span>
                  {match.venue && (
                    <span className="text-[10px] font-medium text-[#0B1F3A]/60 bg-gray-50 border border-gray-100 rounded px-2 py-0.5 flex items-center gap-1">
                      🏟 {match.venue}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Home */}
                  <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5 overflow-hidden">
                    <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] text-right truncate">{match.home_team?.name ?? '?'}</span>
                    {homeCode && <img src={flagUrl(homeCode, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0" />}
                  </div>
                  {/* Inputs */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="number" min={0} max={99} inputMode="numeric" disabled={isLocked} value={pred.home}
                      onChange={e => { setPreds(p => ({ ...p, [match.id]: { ...pred, home: e.target.value } })); setErrorIds(s => { const n = new Set(s); n.delete(match.id); return n }) }}
                      onBlur={() => handleBlur(match.id)}
                      className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-50 ${hasError && pred.home === '' ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                    <span className="text-gray-400 font-bold text-xs">–</span>
                    <input type="number" min={0} max={99} inputMode="numeric" disabled={isLocked} value={pred.away}
                      onChange={e => { setPreds(p => ({ ...p, [match.id]: { ...pred, away: e.target.value } })); setErrorIds(s => { const n = new Set(s); n.delete(match.id); return n }) }}
                      onBlur={() => handleBlur(match.id)}
                      className={`w-11 text-center border rounded-lg py-2 text-sm font-bold focus:ring-2 focus:ring-[#0B1F3A] focus:outline-none disabled:opacity-50 ${hasError && pred.away === '' ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} />
                  </div>
                  {/* Away */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
                    {awayCode && <img src={flagUrl(awayCode, 40)} alt="" className="w-6 sm:w-7 h-auto rounded-sm flex-shrink-0" />}
                    <span className="font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">{match.away_team?.name ?? '?'}</span>
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
                  const teamCode = (s.team as any).fifa_code

                  // For 3rd place: find their rank in best3rds
                  let thirdRank: number | null = null
                  let thirdPosKey: string | null = null
                  if (i === 2) {
                    const idx = best3rds.findIndex(r => r.team.id === s.team.id)
                    if (idx >= 0 && idx < 8) {
                      thirdRank = idx + 1
                      thirdPosKey = `3rd${thirdRank}`
                    }
                  }

                  const posKey = i < 2 ? `${i + 1}${activeGroup}` : thirdPosKey
                  const r32OppKey = posKey ? getR32OppPosKey(posKey) : null
                  const r32OppTeam = r32OppKey ? qualifiedTeams.get(r32OppKey) : null
                  const r16OtherKeys = posKey ? getR16OtherKeys(posKey) : null
                  const r16TeamA = r16OtherKeys ? qualifiedTeams.get(r16OtherKeys[0]) : null
                  const r16TeamB = r16OtherKeys ? qualifiedTeams.get(r16OtherKeys[1]) : null

                  const TeamChip = ({ posK, team }: { posK: string; team: Team | undefined }) => {
                    if (team) {
                      const code = (team as any).fifa_code
                      return (
                        <span className="inline-flex items-center gap-0.5 font-medium text-[#0B1F3A]">
                          {code && <img src={flagUrl(code, 40)} alt="" className="w-3.5 h-auto rounded-sm" />}
                          {team.name}
                        </span>
                      )
                    }
                    return <span className="text-gray-400">{posK}</span>
                  }

                  return (
                    <div key={s.team.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-yellow-400 text-[#0B1F3A]' : i === 1 ? 'bg-gray-300 text-[#0B1F3A]' : thirdRank ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-500'}`}>{i + 1}</span>
                        {teamCode && <img src={flagUrl(teamCode, 40)} alt="" className="w-5 h-auto rounded-sm flex-shrink-0" />}
                        <a href={`/teams/${teamCode}`} className="font-semibold text-[#0B1F3A] text-xs hover:underline">{s.team.name}</a>
                        {i === 2 && (
                          <span className="ml-auto text-[10px] font-semibold">
                            {thirdRank
                              ? <span className="text-amber-600">#{thirdRank} best 3rd ✓</span>
                              : <span className="text-red-400">Out of top 8</span>}
                          </span>
                        )}
                      </div>

                      {(i < 2 || thirdRank) && posKey ? (
                        <div className="ml-7 flex flex-col gap-1">
                          {/* R32 */}
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 flex-wrap">
                            <span className="bg-[#0B1F3A] text-white text-[9px] font-black px-1.5 py-0.5 rounded">R32</span>
                            <span>vs</span>
                            {r32OppTeam
                              ? <TeamChip posK={r32OppKey!} team={r32OppTeam} />
                              : <span className="text-gray-400 italic">{BRACKET_PATHS[posKey]?.r32OppShort ?? r32OppKey}</span>
                            }
                          </div>
                          {/* R16 */}
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 flex-wrap">
                            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">R16</span>
                            <span>vs winner of</span>
                            {r16OtherKeys ? (
                              <span className="inline-flex items-center gap-1 flex-wrap">
                                <TeamChip posK={r16OtherKeys[0]} team={r16TeamA ?? undefined} />
                                <span className="text-gray-400">vs</span>
                                <TeamChip posK={r16OtherKeys[1]} team={r16TeamB ?? undefined} />
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">{BRACKET_PATHS[posKey]?.r16Desc ?? '—'}</span>
                            )}
                          </div>
                        </div>
                      ) : i === 2 && !thirdRank ? (
                        <div className="ml-7 text-[11px] text-red-400 italic">Doesn&apos;t qualify based on current predictions</div>
                      ) : null}
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

          {/* Venues for this group */}
          {(GROUP_STADIUMS[activeGroup] ?? []).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-[#0B1F3A] text-white px-4 py-2.5 text-sm font-bold">🏟 Group {activeGroup} Venues</div>
              <div className="divide-y divide-gray-50">
                {(GROUP_STADIUMS[activeGroup] ?? []).map(s => (
                  <a key={s.slug} href={`/stadiums/${s.slug}`} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <img src={`https://flagcdn.com/w20/${s.iso2}.png`} alt="" className="w-5 h-auto rounded-sm flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0B1F3A] truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.city}</p>
                    </div>
                    <span className="ml-auto text-[10px] text-gray-400">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

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
