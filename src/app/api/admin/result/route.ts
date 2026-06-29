import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { rescoreAllGroupPts, rescoreKOPts } from '@/lib/scoring/rescore'

// Maps each KO slot to the next slot and which side (home/away) the winner fills
const BRACKET_ADVANCE: Record<number, { nextSlot: number; side: 'home' | 'away' }> = {
  1:  { nextSlot: 17, side: 'home' }, 2:  { nextSlot: 17, side: 'away' },
  3:  { nextSlot: 18, side: 'home' }, 4:  { nextSlot: 18, side: 'away' },
  5:  { nextSlot: 19, side: 'home' }, 6:  { nextSlot: 19, side: 'away' },
  7:  { nextSlot: 20, side: 'home' }, 8:  { nextSlot: 20, side: 'away' },
  9:  { nextSlot: 21, side: 'home' }, 10: { nextSlot: 21, side: 'away' },
  11: { nextSlot: 22, side: 'home' }, 12: { nextSlot: 22, side: 'away' },
  13: { nextSlot: 23, side: 'home' }, 14: { nextSlot: 23, side: 'away' },
  15: { nextSlot: 24, side: 'home' }, 16: { nextSlot: 24, side: 'away' },
  17: { nextSlot: 25, side: 'home' }, 18: { nextSlot: 25, side: 'away' },
  19: { nextSlot: 26, side: 'home' }, 20: { nextSlot: 26, side: 'away' },
  21: { nextSlot: 27, side: 'home' }, 22: { nextSlot: 27, side: 'away' },
  23: { nextSlot: 28, side: 'home' }, 24: { nextSlot: 28, side: 'away' },
  25: { nextSlot: 29, side: 'home' }, 26: { nextSlot: 29, side: 'away' },
  27: { nextSlot: 30, side: 'home' }, 28: { nextSlot: 30, side: 'away' },
  29: { nextSlot: 32, side: 'home' }, // SF1 winner → Final home; loser → 3rd place home
  30: { nextSlot: 32, side: 'away' }, // SF2 winner → Final away; loser → 3rd place away
}

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient()

  const body = await request.json() as {
    matchId: string
    homeScore: number
    awayScore: number
    decidedBy?: 'ft' | 'et' | 'pens'
    winnerId?: string | null
  }

  const { matchId, homeScore, awayScore, decidedBy = 'ft', winnerId } = body

  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Update match
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .update({
      actual_home_score: homeScore,
      actual_away_score: awayScore,
      decided_by: decidedBy,
      actual_winner_id: winnerId ?? null,
      is_final: true,
    })
    .eq('id', matchId)
    .select()
    .single()

  if (matchErr || !match) {
    return NextResponse.json({ error: matchErr?.message ?? 'Match not found' }, { status: 400 })
  }

  // Propagate winner to next KO slot
  if (match.stage === 'knockout' && match.bracket_slot) {
    const slot = match.bracket_slot as number
    const adv = BRACKET_ADVANCE[slot]

    // Determine winner ID
    let winnerId = body.winnerId ?? null
    if (!winnerId) {
      if (homeScore > awayScore) winnerId = (match as any).home_team_id
      else if (awayScore > homeScore) winnerId = (match as any).away_team_id
    }

    if (winnerId && adv) {
      const updateField = adv.side === 'home' ? 'home_team_id' : 'away_team_id'
      await supabase.from('matches')
        .update({ [updateField]: winnerId })
        .eq('stage', 'knockout')
        .eq('bracket_slot', adv.nextSlot)
    }

    // For SF (slots 29/30), also place loser in 3rd place match
    if ((slot === 29 || slot === 30) && (match as any).home_team_id && (match as any).away_team_id) {
      const loserId = winnerId === (match as any).home_team_id
        ? (match as any).away_team_id
        : (match as any).home_team_id
      if (loserId) {
        const loserField = slot === 29 ? 'home_team_id' : 'away_team_id'
        await supabase.from('matches')
          .update({ [loserField]: loserId })
          .eq('stage', 'knockout')
          .eq('bracket_slot', 31)
      }
    }

    await rescoreKOPts()
  }

  // Full rescore from scratch (idempotent — no double-counting)
  if (match.stage === 'group') {
    await rescoreAllGroupPts()
  }

  return NextResponse.json({ success: true, match })
}
