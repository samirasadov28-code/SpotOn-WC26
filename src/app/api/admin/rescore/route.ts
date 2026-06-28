import { NextResponse } from 'next/server'
import { rescoreAllGroupPts, rescoreKOPts } from '@/lib/scoring/rescore'

export async function POST() {
  await rescoreAllGroupPts()
  await rescoreKOPts()
  return NextResponse.json({ success: true })
}

export async function GET() {
  return POST()
}
