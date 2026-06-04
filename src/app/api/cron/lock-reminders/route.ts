import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { sendLockReminder, sendLockConfirmed } from '@/lib/notifications/email'

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Get lock time
  const { data: config } = await supabase
    .from('app_config')
    .select('lock_at')
    .eq('id', 1)
    .single()

  if (!config) {
    return NextResponse.json({ error: 'No app config' }, { status: 500 })
  }

  const lockAt = new Date(config.lock_at)
  const now = new Date()
  const hoursToLock = (lockAt.getTime() - now.getTime()) / 1000 / 3600

  // 24h window: 25-23 hours before lock
  const is24hWindow = hoursToLock <= 25 && hoursToLock >= 23
  // 2h window: 3-1 hours before lock
  const is2hWindow = hoursToLock <= 3 && hoursToLock >= 1
  // Lock just passed: 0 to -1 hour
  const justLocked = hoursToLock <= 0 && hoursToLock >= -1

  if (!is24hWindow && !is2hWindow && !justLocked) {
    return NextResponse.json({ message: 'No reminders needed right now', hoursToLock })
  }

  // Get all users
  const { data: users } = await supabase.from('users').select('id')
  if (!users) return NextResponse.json({ message: 'No users' })

  let sent = 0
  for (const user of users) {
    if (justLocked) {
      await sendLockConfirmed(user.id)
    } else {
      await sendLockReminder(user.id)
    }
    sent++
  }

  return NextResponse.json({ success: true, sent, window: justLocked ? 'locked' : `${Math.round(hoursToLock)}h` })
}
