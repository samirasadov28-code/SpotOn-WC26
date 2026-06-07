'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function ProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [savedName, setSavedName] = useState('')
  const [email, setEmail] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setEmail(user.email ?? '')
      const { data } = await supabase.from('users').select('display_name').eq('id', user.id).single()
      const name = (data as any)?.display_name ?? ''
      setDisplayName(name)
      setSavedName(name)
      setLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) return
    setNameSaving(true)
    setNameError(null)
    setNameSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('users').upsert(
      { id: user.id, email: user.email ?? '', display_name: name },
      { onConflict: 'id' }
    )
    setNameSaving(false)
    if (error) {
      setNameError(error.message)
    } else {
      setSavedName(name)
      setNameSaved(true)
      setTimeout(() => setNameSaved(false), 3000)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    setDeleteError(null)
    const res = await fetch('/api/user/delete', { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setDeleteError(body.error ?? 'Failed to delete account')
      setDeleting(false)
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-400">…</div>
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-[#0B1F3A] mb-8">{t('profile_title')}</h1>

      {/* Email (read-only) */}
      <div className="mb-2">
        <p className="text-xs text-gray-400 mb-1">Email</p>
        <p className="text-sm font-medium text-[#0B1F3A]">{email}</p>
      </div>

      {/* Change name */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 mt-6">
        <h2 className="text-base font-bold text-[#0B1F3A] mb-4">{t('profile_name_label')}</h2>
        <form onSubmit={handleSaveName} className="flex gap-2">
          <input
            type="text"
            maxLength={30}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F3A]"
          />
          <button
            type="submit"
            disabled={nameSaving || !displayName.trim() || displayName.trim() === savedName}
            className="bg-[#0B1F3A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#0B1F3A]/90 disabled:opacity-40 transition-colors"
          >
            {nameSaved ? t('profile_name_saved') : t('profile_name_save')}
          </button>
        </form>
        {nameError && <p className="text-red-500 text-xs mt-2">{nameError}</p>}
      </div>

      {/* Delete account */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <h2 className="text-base font-bold text-red-600 mb-2">{t('profile_delete_title')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('profile_delete_desc')}</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition-colors"
        >
          {t('profile_delete_btn')}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-black text-[#0B1F3A] mb-2">{t('profile_delete_title')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('profile_delete_desc')}</p>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              {t('profile_delete_confirm')}
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder={t('profile_delete_confirm_word')}
              autoComplete="off"
            />
            {deleteError && <p className="text-red-500 text-xs mb-3">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); setDeleteError(null) }}
                className="flex-1 text-sm border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
              >
                {t('profile_delete_cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== t('profile_delete_confirm_word') || deleting}
                className="flex-1 text-sm font-semibold bg-red-600 text-white rounded-lg py-2 hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {deleting ? '…' : t('profile_delete_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
