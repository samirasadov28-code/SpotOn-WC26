'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [resendCooldown])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    setLoading(false)
    if (err) {
      if (err.message.toLowerCase().includes('rate limit') || err.status === 429) {
        setError('Too many requests — please wait 60 seconds before trying again.')
        setResendCooldown(60)
      } else {
        setError(err.message)
      }
    } else {
      setStep('otp')
      setResendCooldown(60)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Join SpotOn WC26</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'email'
              ? 'Enter your email to sign in'
              : `Check your email for a 6-digit code`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#0B1F3A] hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                6-digit code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white text-gray-900 text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
              />
              <p className="text-xs text-gray-400 mt-1 text-center">Sent to {email}</p>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="bg-[#0B1F3A] hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(null); setResendCooldown(0) }}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                Use a different email
              </button>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={async () => {
                  setError(null)
                  setLoading(true)
                  const supabase = createClient()
                  const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
                  setLoading(false)
                  if (err) {
                    setError(err.message.toLowerCase().includes('rate limit') ? 'Still rate limited — please wait.' : err.message)
                    setResendCooldown(60)
                  } else {
                    setResendCooldown(60)
                  }
                }}
                className="text-[#0B1F3A] hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
