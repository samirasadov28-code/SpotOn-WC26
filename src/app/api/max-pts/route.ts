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

  // Actual KO match state
  const eliminatedTeams = new Set<string>()
  const playedSlots = new Set<number>()
  const actualSlot = new Map<number, { home: string | null; away: string | null }>()

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

  // KO score predictions per user (slot → {h, a})
  const userKOPreds = new Map<string, Map<number, { h: number; a: number }>>()
  {
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('predictions_knockout')
        .select('user_id, bracket_slot, pred_home_score, pred_away_score')
        .range(offset, offset + 999)
      if (!data?.length) break
      for (const p of data as any[]) {
        if (p.pred_home_score === null) continue
        if (!userKOPreds.has(p.user_id)) userKOPreds.set(p.user_id, new Map())
        userKOPreds.get(p.user_id)!.set(p.bracket_slot as number, { h: p.pred_home_score, a: p.pred_away_score })
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

    if (gp.size === 0 && kp.size === 0) {
      result[userId] = basePts
      continue
    }

    // Full bracket simulation from user's group + KO score predictions.
    // simulateAllMatchups handles: missing group preds, bracket collisions, third-place routing.
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
        // R16+: advancement pts for each predicted alive team that can be in actual match
        const homeId = userMatchup.home?.id ?? null
        const awayId = userMatchup.away?.id ?? null
        const homeAlive = homeId != null && !eliminatedTeams.has(homeId)
        const awayAlive = awayId != null && awayId !== homeId && !eliminatedTeams.has(awayId)

        // Team "can be in this match" = alive AND (actual match not set OR team is in actual match)
        const homeValid = homeAlive && (actualTeams == null || actualTeams.has(homeId!))
        const awayValid = awayAlive && (actualTeams == null || actualTeams.has(awayId!))

        if (homeValid) maxAdditional += stagePts
        if (awayValid) maxAdditional += stagePts

        // Final winner bonus
        if (slot === 32) {
          const pred32 = kp.get(32)
          if (pred32 && pred32.h !== pred32.a) {
            const predWinnerId = pred32.h > pred32.a ? homeId : awayId
            if (predWinnerId && !eliminatedTeams.has(predWinnerId) && (actualTeams == null || actualTeams.has(predWinnerId))) {
              maxAdditional += STAGE_POINTS['winner'] ?? 16
            }
          }
        }

        // Score pts: both predicted teams must be alive+valid + score prediction exists (non-draw)
        const pred = kp.get(slot)
        if (homeValid && awayValid && pred && pred.h !== pred.a) {
          maxAdditional += 3
        }
      }
    }

    result[userId] = basePts + maxAdditional
  }

  return NextResponse.json(result)
}
