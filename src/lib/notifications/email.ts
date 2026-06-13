import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

function getAdminClient() {
  return createSupabaseAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[EMAIL] Would send to ${to}: ${subject}`)
    return
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'SpotOn WC26 <noreply@spotonwc26.com>',
      to,
      subject,
      html,
    }),
  })
}

async function shouldSend(
  userId: string,
  prefKey: 'email_lock_reminder' | 'email_lock_confirmed' | 'email_leaderboard_digest',
): Promise<boolean> {
  const supabase = getAdminClient()
  const { data } = await supabase
    .from('notification_prefs')
    .select(prefKey)
    .eq('user_id', userId)
    .single()

  if (!data) return true // default to true if no prefs set
  return data[prefKey] as boolean
}

export async function sendLockReminder(userId: string): Promise<void> {
  const ok = await shouldSend(userId, 'email_lock_reminder')
  if (!ok) return

  const supabase = getAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', userId)
    .single()

  if (!user) return

  // Use Supabase Auth admin API to send custom email
  // In production, integrate with your email provider (Resend, SendGrid, etc.)
  console.log(`[EMAIL] Lock reminder to ${user.email} (${user.display_name ?? 'user'})`)
}

export async function sendLockConfirmed(userId: string): Promise<void> {
  const ok = await shouldSend(userId, 'email_lock_confirmed')
  if (!ok) return

  const supabase = getAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', userId)
    .single()

  if (!user) return

  console.log(`[EMAIL] Lock confirmed to ${user.email} (${user.display_name ?? 'user'})`)
}

export async function sendLeaderboardDigest(
  userId: string,
  rank: number,
): Promise<void> {
  const ok = await shouldSend(userId, 'email_leaderboard_digest')
  if (!ok) return

  const supabase = getAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', userId)
    .single()

  if (!user) return

  console.log(
    `[EMAIL] Leaderboard digest to ${user.email}: rank #${rank}`,
  )
}

export async function sendDayRecapEmail(
  userId: string,
  day: string,
  recapText: string,
  leagueId: string | null,
  leagueName: string,
): Promise<void> {
  const supabase = getAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('email, display_name')
    .eq('id', userId)
    .single()

  if (!user?.email) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spotonwc26.com'
  const lbUrl = leagueId ? `${appUrl}/leaderboard?league=${leagueId}` : `${appUrl}/leaderboard`
  const name = user.display_name ?? 'there'
  const dateLabel = new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const leagueLabel = leagueName ?? 'SpotOn WC26'

  // Convert plain text recap to simple HTML paragraphs
  const recapHtml = recapText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `<p style="margin:0 0 10px">${line}</p>`)
    .join('')

  const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#0B1F3A">
  <div style="background:#0B1F3A;color:white;padding:20px 24px;border-radius:12px 12px 0 0">
    <div style="font-size:24px;font-weight:bold">⚽ SpotOn WC26</div>
    <div style="opacity:0.7;font-size:13px;margin-top:4px">${leagueLabel} · Day Recap</div>
  </div>
  <div style="background:#f9f9f9;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
    <p style="margin:0 0 16px;font-size:14px">Hi ${name},</p>
    <p style="margin:0 0 16px;font-size:14px">Here's your ${dateLabel} match recap for <strong>${leagueLabel}</strong>:</p>
    <div style="background:white;border-radius:8px;padding:16px;border:1px solid #e5e7eb;font-size:14px;line-height:1.6">
      ${recapHtml}
    </div>
    <div style="margin-top:20px;text-align:center">
      <a href="${lbUrl}" style="display:inline-block;background:#0B1F3A;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
        View Leaderboard →
      </a>
    </div>
    <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;text-align:center">
      SpotOn WC26 · <a href="${appUrl}" style="color:#9ca3af">spotonwc26.com</a>
    </p>
  </div>
</body></html>`

  await sendEmail(user.email, `⚽ Day Recap: ${dateLabel} — ${leagueLabel}`, html)
}
