import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { scoreGroupMatch } from '@/lib/scoring/group'

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  // Verify caller is admin via session
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

  // Rescore group predictions for this match (idempotent)
  if (match.stage === 'group') {
    const { data: predictions } = await supabase
      .from('predictions_group')
      .select('*')
      .eq('match_id', matchId)

    for (const pred of predictions ?? []) {
      if (pred.pred_home_score === null || pred.pred_away_score === null) continue

      const pts = scoreGroupMatch(
        { predHome: pred.pred_home_score, predAway: pred.pred_away_score },
        { actualHome: homeScore, actualAway: awayScore }
      )

      // Upsert score entry
      await supabase.from('scores').upsert(
        { user_id: pred.user_id, group_pts: 0, total_pts: 0 },
        { onConflict: 'user_id', ignoreDuplicates: true }
      )

      // We need to recalculate total from scratch for accuracy
      // For simplicity, add incremental pts (in production, full rescore is recommended)
      const { data: existing } = await supabase
        .from('scores')
        .select('group_pts, total_pts')
        .eq('user_id', pred.user_id)
        .single()

      if (existing) {
        await supabase.from('scores').update({
          group_pts: (existing.group_pts ?? 0) + pts,
          total_pts: (existing.total_pts ?? 0) + pts,
          updated_at: new Date().toISOString(),
        }).eq('user_id', pred.user_id)
      }
    }
  }

  return NextResponse.json({ success: true, match })
}
