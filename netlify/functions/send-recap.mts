import type { Config } from '@netlify/functions'

// Runs at 23:00 UTC daily — sends day recap email to all participants
export const config: Config = {
  schedule: '0 23 * * *',
}

export default async () => {
  const baseUrl = process.env.URL ?? process.env.DEPLOY_URL ?? 'http://localhost:3000'

  try {
    const res = await fetch(`${baseUrl}/api/cron/send-recap`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` },
    })
    const text = await res.text()
    console.log(`[send-recap] ${res.status} — ${text.slice(0, 200)}`)
  } catch (err) {
    console.error('[send-recap] failed:', err)
  }

  return new Response('OK')
}
