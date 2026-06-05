'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/LanguageContext'

type Mode = 'signin' | 'signup'

function LoginForm() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const leagueCode = searchParams.get('league')

  const [mode, setMode] = useState<Mode>(leagueCode ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const joinLeagueAndRedirect = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    if (!leagueCode) {
      window.location.href = '/predictions/groups'
      return
    }
    const { data: league } = await supabase
      .from('leagues')
      .select('id')
      .eq('join_code', leagueCode.toUpperCase())
      .single() as any
    if (league) {
      await (supabase as any)
        .from('league_members')
        .upsert({ league_id: league.id, user_id: userId }, { onConflict: 'league_id,user_id' })
      window.location.href = `/league/${league.id}`
    } else {
      window.location.href = '/predictions/groups'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) {
        const msg = err.message.toLowerCase()
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          // Auto-attempt sign in with the same credentials
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
          setLoading(false)
          if (!signInErr && signInData.session) {
            await joinLeagueAndRedirect(supabase, signInData.session.user.id)
          } else {
            setMode('signin')
            setSuccess('You already have an account. Enter your password to sign in.')
          }
        } else {
          setLoading(false)
          setError(err.message)
        }
        return
      }

      const upsertUser = async (userId: string) => {
        await (supabase as any).from('users').upsert(
          { id: userId, email, display_name: displayName.trim() || null },
          { onConflict: 'id' }
        )
      }

      if (data.session) {
        await upsertUser(data.session.user.id)
        await joinLeagueAndRedirect(supabase, data.session.user.id)
        return
      }

      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (signInErr) {
        setSuccess('Account created! Check your email to confirm it, then sign in.')
        setMode('signin')
      } else {
        if (signInData.session) {
          await upsertUser(signInData.session.user.id)
          await joinLeagueAndRedirect(supabase, signInData.session.user.id)
        }
      }
    } else {
      const { data: signInData, error: err } = await supabase.auth.signInWithPassword({ email, password })
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
        if (signInData.session) {
          await joinLeagueAndRedirect(supabase, signInData.session.user.id)
        } else {
          window.location.href = '/predictions/groups'
        }
      }
    }
  }

  const switchMode = (m: Mode) => { setMode(m); setError(null); setSuccess(null) }

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">⚽</div>
        <h1 className="text-2xl font-bold text-[#0B1F3A]">
          {mode === 'signup' ? t('auth_join_subtitle') : t('auth_sign_in_title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {mode === 'signup' ? t('auth_joining_league') : t('auth_welcome_back')}
        </p>
      </div>

      {leagueCode && mode === 'signup' && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-4">
          You&apos;re joining league &quot;{leagueCode}&quot; — enter your details to sign up
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth_your_name')} <span className="text-gray-400 font-normal">({t('auth_shown_on_lb')})</span>
            </label>
            <input
              id="displayName"
              type="text"
              maxLength={30}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Samir"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth_email')}
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
            {t('auth_password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? t('auth_min_6') : '••••••••'}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#0B1F3A] hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '…' : mode === 'signup' ? t('auth_sign_up_btn') : t('auth_sign_in_btn')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        {mode === 'signin' ? (
          <>{t('auth_no_account')}{' '}
            <button onClick={() => switchMode('signup')} className="text-[#0B1F3A] font-semibold hover:underline">
              {t('auth_sign_up')}
            </button>
          </>
        ) : (
          <>{t('auth_have_account')}{' '}
            <button onClick={() => switchMode('signin')} className="text-[#0B1F3A] font-semibold hover:underline">
              {t('auth_sign_in_btn')}
            </button>
          </>
        )}
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div className="text-gray-500">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
