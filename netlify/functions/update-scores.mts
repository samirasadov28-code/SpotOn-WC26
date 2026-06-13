import type { Config } from '@netlify/functions'

// Runs every 5 minutes to fetch finished match scores and update the leaderboard
export const config: Config = {
  schedule: '*/5 * * * *',
}

export default async () => {
  const baseUrl = process.env.URL ?? process.env.DEPLOY_URL ?? 'http://localhost:3000'
  const today = new Date().toISOString().slice(0, 10)

  try {
    const res = await fetch(`${baseUrl}/api/cron/update-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today }),
    })
    const text = await res.text()
    console.log(`[update-scores] ${res.status} — ${text.slice(0, 200)}`)
  } catch (err) {
    console.error('[update-scores] failed:', err)
  }

  return new Response('OK')
}
