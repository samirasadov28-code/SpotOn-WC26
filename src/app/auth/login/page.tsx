'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        setLoading(false)
        setError(err.message)
        return
      }
      // If session is returned immediately, email confirmation is off — go straight in
      if (data.session) {
        window.location.href = '/'
        return
      }
      // Otherwise try signing in anyway (works when "Confirm email" is disabled in Supabase)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (signInErr) {
        setSuccess('Account created! Check your email to confirm it, then sign in.')
        setMode('signin')
      } else {
        window.location.href = '/'
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (err) {
        const msg = err.message.toLowerCase()
        if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
          setError('Wrong email or password. If you haven\'t signed up yet, click "Sign up" below.')
        } else if (msg.includes('email not confirmed')) {
          setError('Please confirm your email first — check your inbox (including spam).')
        } else {
          setError(err.message)
        }
      } else {
        window.location.href = '/'
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">
            {mode === 'signup' ? 'Create account' : 'Sign in to SpotOn WC26'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'signup' ? 'Join the prediction league' : 'Welcome back'}
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#0B1F3A] hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {mode === 'signin' ? (
            <>No account?{' '}
              <button onClick={() => { setMode('signup'); setError(null); setSuccess(null) }} className="text-[#0B1F3A] font-semibold hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>Already have one?{' '}
              <button onClick={() => { setMode('signin'); setError(null); setSuccess(null) }} className="text-[#0B1F3A] font-semibold hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
