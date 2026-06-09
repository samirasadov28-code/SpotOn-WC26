'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError(t('onb_not_signed_in'))
      setLoading(false)
      return
    }

    const { error: err } = await supabase
      .from('users')
      .upsert(
        { id: user.id, email: user.email ?? '', display_name: name },
        { onConflict: 'id' }
      )

    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      router.push('/predictions')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">👋</div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            {t('onb_welcome')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('onb_choose')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('onb_display_name')}
            </label>
            <input
              id="name"
              type="text"
              required
              maxLength={30}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('onb_placeholder')}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          {error && <p className="text-brand-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="bg-navy hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? t('onb_saving') : t('onb_cta')}
          </button>
        </form>
      </div>
    </div>
  )
}
