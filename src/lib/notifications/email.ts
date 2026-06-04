import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

function getAdminClient() {
  return createSupabaseAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
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
