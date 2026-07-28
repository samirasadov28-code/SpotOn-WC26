import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { loadGroupData, computeUserR32Positions } from '@/lib/scoring/group-qualifiers'
import { STAGE_POINTS } from '@/lib/scoring/advancement'

/**
 * Returns per-user predicted R32 positions + R32 advancement roundPts.
 * Result: { preds: Record<userId, Record<position, teamId>>, roundPts: Record<userId, number> }
 */
export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ preds: {}, roundPts: {} }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()

  // Actual R32 teams (from DB — home/away team IDs in knockout slots 1–16)
  const { data: r32Matches } = await supabase
    .from('matches')
    .select('home_team_id, away_team_id')
    .eq('stage', 'knockout')
    .gte('bracket_slot', 1)
    .lte('bracket_slot', 16) as any
  const actualR32Teams = new Set<string>()
  for (const m of (r32Matches ?? []) as any[]) {
    if (m.home_team_id) actualR32Teams.add(m.home_team_id)
    if (m.away_team_id) actualR32Teams.add(m.away_team_id)
  }

  const r32Pts = STAGE_POINTS['r32'] ?? 1
  const preds: Record<string, Record<string, string>> = {}
  const roundPts: Record<string, number> = {}

  for (const [userId, userPreds] of predsByUser) {
    const posMap = computeUserR32Positions(userPreds, groupMatchesByGroup, teamsByGroup, true)
    if (posMap.size > 0) {
      preds[userId] = Object.fromEntries(posMap)
    }
    if (actualR32Teams.size > 0) {
      let pts = 0
      for (const teamId of posMap.values()) {
        if (actualR32Teams.has(teamId)) pts += r32Pts
      }
      if (pts > 0) roundPts[userId] = pts
    }
  }

  return NextResponse.json({ preds, roundPts })
}
