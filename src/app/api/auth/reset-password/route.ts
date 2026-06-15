import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function sendEmail(to: string, subject: string, html: string) {
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

export async function POST(request: NextRequest) {
  const { email } = await request.json() as { email: string }
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

  const supabase = svc()

  // Find user by email
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    // Return success anyway to avoid email enumeration
    return NextResponse.json({ success: true })
  }

  const tempPassword = genPassword()

  const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password: tempPassword })
  if (updateErr) return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://spotonwc26.com'
  const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;color:#0B1F3A">
  <div style="background:#0B1F3A;color:white;padding:20px 24px;border-radius:12px 12px 0 0">
    <div style="font-size:22px;font-weight:bold">⚽ SpotOn WC26</div>
  </div>
  <div style="background:#f9f9f9;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none">
    <p style="margin:0 0 12px;font-size:14px">Hey! Your temporary password is:</p>
    <div style="background:white;border:2px solid #0B1F3A;border-radius:8px;padding:14px 20px;text-align:center;font-size:26px;font-family:monospace;font-weight:bold;letter-spacing:4px;color:#0B1F3A">
      ${tempPassword}
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280">
      Sign in at <a href="${appUrl}/auth/login" style="color:#0B1F3A">${appUrl}/auth/login</a> and change your password in account settings afterwards if you like.
    </p>
  </div>
</body></html>`

  await sendEmail(email, '⚽ SpotOn WC26 — Your temporary password', html)

  return NextResponse.json({ success: true })
}
