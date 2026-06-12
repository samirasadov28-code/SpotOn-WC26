import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

const SYSTEM_PROMPT = `You are Spot, the AI assistant for SpotOn WC26 — a FIFA World Cup 2026 prediction contest between friends. You're enthusiastic about football, fun and witty, but also helpful and informative.

You can help with:
- World Cup 2026 info: teams, groups, schedule, venues (USA/Canada/Mexico hosting)
- Explaining the scoring system: 3pts exact score, 2pts correct goal difference, 1pt correct outcome, 0pts wrong
- Football history, stats, team news, player info
- Prediction strategy advice
- General banter about the competition

WC2026 key facts:
- 48 teams (expanded from 32), 12 groups of 4
- Top 2 from each group + 8 best 3rd-place teams advance to Round of 32
- Hosted across USA, Canada, Mexico — June 11 to July 19, 2026
- Notable first timers / returnees include many new teams
- Group A: Mexico, South Africa, Korea Republic, Czech Republic (MEX beat RSA 2-0 in opener)

Keep replies concise (under 200 words unless asked for detail). Use football emojis occasionally. Never make up specific scores or stats you're unsure about — say you're not certain instead.`

export async function POST(request: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const { messages } = await request.json()
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 512,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-20), // keep last 20 messages for context window
    ],
  })

  const reply = completion.choices[0]?.message?.content ?? ''
  return NextResponse.json({ reply })
}
