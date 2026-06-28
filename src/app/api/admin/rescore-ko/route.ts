import { NextResponse } from 'next/server'
import { rescoreKOPts } from '@/lib/scoring/rescore'

export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }
  try {
    await rescoreKOPts()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
