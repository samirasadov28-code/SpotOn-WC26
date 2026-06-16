import { NextResponse } from 'next/server'
import { rescoreAllGroupPts } from '@/lib/scoring/rescore'

export async function POST() {
  await rescoreAllGroupPts()
  return NextResponse.json({ success: true })
}
