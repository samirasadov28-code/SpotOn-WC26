import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { rescoreAllGroupPts, rescoreKOPts, syncKOBracket } from '@/lib/scoring/rescore'

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

  // Propagate winners + rescore KO pts
  if (match.stage === 'knockout') {
    await syncKOBracket()
    await rescoreKOPts()
  }

  // Full rescore from scratch (idempotent — no double-counting)
  if (match.stage === 'group') {
    await rescoreAllGroupPts()
  }

  return NextResponse.json({ success: true, match })
}
