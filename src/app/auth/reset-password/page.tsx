'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
        if (err) setError('This reset link is invalid or has expired. Please request a new one.')
        setExchanging(false)
      })
    } else {
      // Fallback: wait for PASSWORD_RECOVERY event from hash-based link
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setExchanging(false)
      })
      // If no code and no event within 3s, show error
      const timer = setTimeout(() => {
        setExchanging(false)
        setError('Invalid reset link. Please request a new one.')
      }, 3000)
      return () => { subscription.unsubscribe(); clearTimeout(timer) }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setDone(true)
      setTimeout(() => { window.location.href = '/leaderboard' }, 2000)
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">🔑</div>
        <h1 className="text-2xl font-bold text-[#0B1F3A]">Set new password</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a strong password for your account.</p>
      </div>

      {exchanging ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-7 h-7 border-[3px] border-[#0B1F3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Verifying reset link…</p>
        </div>
      ) : done ? (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-4 text-center">
          ✅ Password updated! Redirecting you now…
        </div>
      ) : error && !password ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-4 text-center">
          {error}
          <div className="mt-3">
            <a href="/auth/login" className="text-[#0B1F3A] font-semibold hover:underline text-sm">
              Back to sign in →
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0B1F3A] hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="text-gray-500">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
