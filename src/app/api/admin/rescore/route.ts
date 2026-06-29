import { NextResponse } from 'next/server'
import { rescoreAllGroupPts, rescoreKOPts, syncKOBracket, syncR32Teams } from '@/lib/scoring/rescore'

export async function POST() {
  await syncR32Teams()       // populate R32 match slots from actual group standings
  await syncKOBracket()      // propagate all existing KO results to next rounds
  await rescoreAllGroupPts()
  await rescoreKOPts()
  return NextResponse.json({ success: true })
}

export async function GET() {
  return POST()
}
