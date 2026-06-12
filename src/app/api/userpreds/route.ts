import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { userId } → { groupPreds, koPreds }
export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  const supabase = svc()
  const [gpRes, kpRes] = await Promise.all([
    supabase.from('predictions_group')
      .select('match_id, pred_home_score, pred_away_score')
      .eq('user_id', userId),
    supabase.from('predictions_knockout')
      .select('bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score')
      .eq('user_id', userId),
  ])

  return NextResponse.json({ groupPreds: gpRes.data ?? [], koPreds: kpRes.data ?? [] })
}
