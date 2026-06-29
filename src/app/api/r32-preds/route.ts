import { NextResponse } from 'next/server'
import { loadGroupData, computeUserR32Positions, R32_DEFS } from '@/lib/scoring/group-qualifiers'

/**
 * Returns per-user predicted R32 positions computed from their group predictions.
 * Result: Record<userId, Record<position, teamId>>
 * e.g. { "uuid": { "1F": "ned-team-id", "2C": "mar-team-id", ... } }
 */
export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({}, { status: 500 })
  }

  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()

  const result: Record<string, Record<string, string>> = {}

  for (const [userId, userPreds] of predsByUser) {
    // strict=true: only score teams from groups the user actually predicted;
    // don't fall back to actual results (prevents inflated scores)
    const posMap = computeUserR32Positions(userPreds, groupMatchesByGroup, teamsByGroup, true)
    if (posMap.size > 0) {
      result[userId] = Object.fromEntries(posMap)
    }
  }

  return NextResponse.json(result)
}
