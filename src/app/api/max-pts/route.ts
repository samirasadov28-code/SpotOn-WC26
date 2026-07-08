import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { STAGE_POINTS } from '@/lib/scoring/advancement'
import { simulateAllMatchups } from '@/lib/bracket-sim'
import type { MatchInfo, TeamInfo } from '@/lib/bracket-sim'

function slotStage(slot: number): string {
  if (slot <= 16) return 'r32'
  if (slot <= 24) return 'r16'
  if (slot <= 28) return 'qf'
  if (slot <= 30) return 'sf'
  if (slot === 31) return 'third_match'
  return 'final'
}

export async function POST(req: Request) {
  await req.json().catch(() => ({}))

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({}, { status: 500 })
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Fetch all matches and teams (needed for simulateAllMatchups)
  const [matchRes, teamRes] = await Promise.all([
    supabase.from('matches').select('id, stage, group_letter, bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score, actual_winner_id'),
    supabase.from('teams').select('id, name, fifa_code, group_letter, flag_emoji'),
  ])

  const allMatchRows = (matchRes.data ?? []) as any[]
  const allTeams: TeamInfo[] = (teamRes.data ?? []).map((t: any) => ({
    id: t.id, name: t.name, fifa_code: t.fifa_code, group_letter: t.group_letter, flag_emoji: t.flag_emoji,
  }))
  const allMatches: MatchInfo[] = allMatchRows.map((m: any) => ({
    id: m.id,
    group_letter: m.group_letter,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
  }))

  // Stage → slots mapping (mirrors rescoreKOPts)
  const STAGE_SLOTS: Record<string, number[]> = {
    r16:         [17,18,19,20,21,22,23,24],
    qf:          [25,26,27,28],
    sf:          [29,30],
    third_match: [31],
    final:       [32],
  }

  // Bracket parent map: slot → which two prev-round slots feed it
  const SLOT_PARENTS: Record<number, { hp: number; ap: number }> = {
    17:{hp:2,ap:5},  18:{hp:1,ap:3},  19:{hp:4,ap:6},  20:{hp:7,ap:8},
    21:{hp:11,ap:12},22:{hp:9,ap:10}, 23:{hp:14,ap:16},24:{hp:13,ap:15},
    25:{hp:17,ap:18},26:{hp:21,ap:22},27:{hp:19,ap:20},28:{hp:23,ap:24},
    29:{hp:25,ap:26},30:{hp:27,ap:28},31:{hp:29,ap:30},32:{hp:29,ap:30},
  }

  // Actual KO match state
  const eliminatedTeams = new Set<string>()
  const playedSlots = new Set<number>()
  const actualSlot = new Map<number, { home: string | null; away: string | null }>()

  // Whether a team can possibly reach a given slot via the actual bracket structure.
  // R32 slots (1-16): team must be in that slot's actual matchup.
  // R16+ slots: team must be able to win one of the two parent slots.
  function teamCanReach(teamId: string, slot: number): boolean {
    if (eliminatedTeams.has(teamId)) return false
    if (slot <= 16) {
      const a = actualSlot.get(slot)
      if (!a) return false
      return a.home === teamId || a.away === teamId
    }
    const p = SLOT_PARENTS[slot]
    if (!p) return false
    return teamCanReachAndWin(teamId, p.hp) || teamCanReachAndWin(teamId, p.ap)
  }

  // Whether a team can reach AND win a given slot.
  // If the slot is confirmed (both teams set), the team must be one of them.
  // If unconfirmed, the team just needs to be able to reach it.
  function teamCanReachAndWin(teamId: string, slot: number): boolean {
    if (eliminatedTeams.has(teamId)) return false
    const a = actualSlot.get(slot)
    if (a?.home != null && a?.away != null) {
      return a.home === teamId || a.away === teamId
    }
    return teamCanReach(teamId, slot)
  }

  for (const m of allMatchRows) {
    if (m.stage !== 'knockout') continue
    const slot = m.bracket_slot as number
    actualSlot.set(slot, { home: m.home_team_id ?? null, away: m.away_team_id ?? null })
    if (m.actual_home_score !== null && m.home_team_id && m.away_team_id) {
      playedSlots.add(slot)
      let loserId: string
      if (m.actual_winner_id) {
        loserId = m.actual_winner_id === m.home_team_id ? m.away_team_id : m.home_team_id
      } else {
        loserId = (m.actual_home_score as number) > (m.actual_away_score as number) ? m.away_team_id : m.home_team_id
      }
      eliminatedTeams.add(loserId)
    }
  }

  // Group predictions per user
  const groupMatchIds = allMatchRows.filter(m => m.stage === 'group').map((m: any) => m.id as string)
  const userGroupPreds = new Map<string, Map<string, { h: number; a: number }>>()
  if (groupMatchIds.length > 0) {
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('predictions_group')
        .select('user_id, match_id, pred_home_score, pred_away_score')
        .in('match_id', groupMatchIds)
        .range(offset, offset + 999)
      if (!data?.length) break
      for (const p of data as any[]) {
        if (p.pred_home_score === null) continue
        if (!userGroupPreds.has(p.user_id)) userGroupPreds.set(p.user_id, new Map())
        userGroupPreds.get(p.user_id)!.set(p.match_id, { h: p.pred_home_score, a: p.pred_away_score })
      }
      if (data.length < 1000) break
      offset += 1000
    }
  }

  // KO score predictions per user (slot → {h, a}) + stored team IDs
  const userKOPreds = new Map<string, Map<number, { h: number; a: number }>>()
  const userKOTeams = new Map<string, Map<number, { home: string | null; away: string | null }>>()
  {
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('predictions_knockout')
        .select('user_id, bracket_slot, pred_home_score, pred_away_score, pred_home_team_id, pred_away_team_id')
        .range(offset, offset + 999)
      if (!data?.length) break
      for (const p of data as any[]) {
        if (p.pred_home_score === null) continue
        if (!userKOPreds.has(p.user_id)) userKOPreds.set(p.user_id, new Map())
        userKOPreds.get(p.user_id)!.set(p.bracket_slot as number, { h: p.pred_home_score, a: p.pred_away_score })
        if (p.pred_home_team_id || p.pred_away_team_id) {
          if (!userKOTeams.has(p.user_id)) userKOTeams.set(p.user_id, new Map())
          userKOTeams.get(p.user_id)!.set(p.bracket_slot as number, {
            home: p.pred_home_team_id ?? null,
            away: p.pred_away_team_id ?? null,
          })
        }
      }
      if (data.length < 1000) break
      offset += 1000
    }
  }

  const { data: scores } = await supabase.from('scores').select('user_id, total_pts')
  const result: Record<string, number> = {}

  for (const score of (scores ?? []) as any[]) {
    const userId: string = score.user_id
    const basePts: number = score.total_pts ?? 0

    const gp = userGroupPreds.get(userId) ?? new Map()
    const kp = userKOPreds.get(userId) ?? new Map()
    const kt = userKOTeams.get(userId) ?? new Map()

    if (gp.size === 0 && kp.size === 0) {
      result[userId] = basePts
      continue
    }

    // Full bracket simulation from user's group + KO score predictions.
    // Used only for the confirmed-slot pair check (teamsConfirmed branch) when
    // stored pred team IDs are absent. Advancement pts use stored pred IDs + teamCanReach.
    const matchups = simulateAllMatchups(gp, kp, allMatches, allTeams)
    // Map slot → { home, away } for quick lookup
    const userSlot = new Map(matchups.map(m => [m.slot, { home: m.home, away: m.away }]))

    let maxAdditional = 0

    for (let slot = 1; slot <= 32; slot++) {
      if (playedSlots.has(slot)) continue

      const stage = slotStage(slot)
      const stagePts = STAGE_POINTS[stage] ?? 0
      const userMatchup = userSlot.get(slot)
      if (!userMatchup) continue

      const actual = actualSlot.get(slot) // actual home/away team IDs (may be null if not propagated yet)
      const actualTeams = actual && (actual.home || actual.away)
        ? new Set([actual.home, actual.away].filter(Boolean) as string[])
        : null // null = not known yet → optimistic

      if (slot <= 16) {
        // R32: only score pts potential — and only when user's predicted pair matches actual pair
        const homeId = userMatchup.home?.id ?? null
        const awayId = userMatchup.away?.id ?? null
        if (homeId && awayId && actual?.home && actual?.away) {
          if (homeId === actual.home && awayId === actual.away) {
            const pred = kp.get(slot)
            if (pred && pred.h !== pred.a) maxAdditional += 3
          }
        }
        // R32 advancement pts are already in basePts
      } else {
        const homeId = userMatchup.home?.id ?? null
        const awayId = userMatchup.away?.id ?? null
        // teamsConfirmed = both sides already set in DB → advancement pts already in basePts
        const teamsConfirmed = actual?.home != null && actual?.away != null

        if (teamsConfirmed) {
          // Only score pts are still earnable; advancement already scored.
          // Both predicted teams must match actual pair.
          // Prefer stored pred team IDs (saved at prediction time) over simulation,
          // since simulation can return null if the user predicted draws in parent slots.
          const pred = kp.get(slot)
          const storedTeams = kt.get(slot)
          const checkHomeId = storedTeams?.home ?? homeId
          const checkAwayId = storedTeams?.away ?? awayId
          if (pred && pred.h !== pred.a && checkHomeId && checkAwayId &&
              !eliminatedTeams.has(checkHomeId) && !eliminatedTeams.has(checkAwayId) &&
              ((checkHomeId === actual!.home && checkAwayId === actual!.away) ||
               (checkHomeId === actual!.away && checkAwayId === actual!.home))) {
            maxAdditional += 3
          }
        } else {
          // Teams not confirmed → add advancement pts not yet in basePts.
          // Use simulation teams (consistent with rescoreKOPts which also uses simulation).
          // Guard: if a team is already set in any actual slot for this stage, rescoreKOPts
          // already counted their advancement in basePts — don't add again.
          const stageSlots = STAGE_SLOTS[stage] ?? []
          const alreadyInStage = (teamId: string) => stageSlots.some(s => {
            const a = actualSlot.get(s)
            return a?.home === teamId || a?.away === teamId
          })

          const homeAlive = homeId != null && !alreadyInStage(homeId) && teamCanReach(homeId, slot)
          const awayAlive = awayId != null && awayId !== homeId && !alreadyInStage(awayId) && teamCanReach(awayId, slot)

          if (homeAlive) maxAdditional += stagePts
          if (awayAlive) maxAdditional += stagePts

          // Final winner bonus
          if (slot === 32) {
            const pred32 = kp.get(32)
            if (pred32 && pred32.h !== pred32.a) {
              const predWinnerId = pred32.h > pred32.a ? homeId : awayId
              if (predWinnerId && !alreadyInStage(predWinnerId) && teamCanReach(predWinnerId, slot)) {
                maxAdditional += STAGE_POINTS['winner'] ?? 16
              }
            }
          }

          // Score pts: both teams alive (not yet in stage) + non-draw prediction
          const pred = kp.get(slot)
          if (homeAlive && awayAlive && pred && pred.h !== pred.a) {
            maxAdditional += 3
          }
        }
      }
    }

    result[userId] = basePts + maxAdditional
  }

  return NextResponse.json(result)
}
