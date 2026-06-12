import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// GET → { [userId]: totalPredictionCount }
export async function GET() {
  const supabase = svc()
  const counts = new Map<string, number>()

  for (const table of ['predictions_group', 'predictions_knockout'] as const) {
    let offset = 0
    while (true) {
      const { data } = await supabase.from(table).select('user_id').range(offset, offset + 999)
      if (!data?.length) break
      for (const p of data) counts.set(p.user_id, (counts.get(p.user_id) ?? 0) + 1)
      if (data.length < 1000) break
      offset += 1000
    }
  }

  return NextResponse.json(Object.fromEntries(counts))
}
