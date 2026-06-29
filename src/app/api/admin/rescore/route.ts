import { NextResponse } from 'next/server'
import { rescoreAllGroupPts, rescoreKOPts, syncKOBracket } from '@/lib/scoring/rescore'

export async function POST() {
  await syncKOBracket()      // propagate all existing KO results to next rounds
  await rescoreAllGroupPts()
  await rescoreKOPts()
  return NextResponse.json({ success: true })
}

export async function GET() {
  return POST()
}
