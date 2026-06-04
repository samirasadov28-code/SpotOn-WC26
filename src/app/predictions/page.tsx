'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import GroupPredictionsPage from './groups/page'
import KnockoutPredictionsPage from './knockout/page'

type Tab = 'groups' | 'bracket'

const LOCK_AT = new Date('2026-06-11T13:00:00Z')
const GROUP_TOTAL = 72
const KO_TOTAL = 32

function PredictionsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isLocked = new Date() >= LOCK_AT

  const explicitTab = searchParams.get('tab') as Tab | null
  const [tab, setTabState] = useState<Tab>(explicitTab ?? 'groups')
  const [groupsSaved, setGroupsSaved] = useState(0)
  const [koSaved, setKoSaved] = useState(0)
  const [initialised, setInitialised] = useState(!!explicitTab)

  // On first load: check saved counts for both stages to set correct default tab and badges
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setInitialised(true); return }
      Promise.all([
        supabase.from('predictions_group').select('match_id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('predictions_knockout').select('bracket_slot', { count: 'exact', head: true }).eq('user_id', user.id),
      ]).then(([gRes, kRes]) => {
        const gSaved = gRes.count ?? 0
        const kSaved = kRes.count ?? 0
        setGroupsSaved(gSaved)
        setKoSaved(kSaved)
        if (!explicitTab && gSaved >= GROUP_TOTAL) setTabState('bracket')
        setInitialised(true)
      })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setTab = (t: Tab) => {
    setTabState(t)
    router.replace(`/predictions?tab=${t}`)
  }

  const groupsDone = groupsSaved >= GROUP_TOTAL
  const koDone = koSaved >= KO_TOTAL

  if (!initialised) return null

  return (
    <div>
      {/* Sticky tab bar + counter */}
      <div className="border-b border-gray-200 bg-white sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex">
            {(['groups', 'bracket'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  tab === t
                    ? 'border-[#0B1F3A] text-[#0B1F3A]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t === 'groups' ? '⚽ Group Stage' : '🏆 Playoff Bracket'}
                {t === 'groups' && groupsDone && (
                  <span className="text-[10px] bg-green-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">✓</span>
                )}
                {t === 'bracket' && koDone && (
                  <span className="text-[10px] bg-green-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">✓</span>
                )}
              </button>
            ))}
          </div>
          {/* Live group-stage counter */}
          {tab === 'groups' && (
            <div className={`text-sm font-bold tabular-nums flex items-center gap-1 ${groupsDone ? 'text-green-600' : 'text-[#0B1F3A]'}`}>
              {groupsDone ? '✅' : null}
              <span>{groupsSaved}</span>
              <span className="text-gray-400 font-normal">/</span>
              <span className="text-gray-400 font-normal">{GROUP_TOTAL}</span>
              <span className="text-gray-400 font-normal text-xs hidden sm:inline">saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Deadline / completion reminder banner */}
      {!isLocked && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <p className="text-xs text-amber-800 text-center max-w-2xl mx-auto">
            ⏰ <strong>Predictions lock Jun 11 at 13:00 UTC</strong> — complete both{' '}
            <button onClick={() => setTab('groups')} className={`font-bold underline underline-offset-2 ${tab === 'groups' ? 'text-amber-900' : 'text-amber-700 hover:text-amber-900'}`}>
              Group Stage
            </button>{' '}and{' '}
            <button onClick={() => setTab('bracket')} className={`font-bold underline underline-offset-2 ${tab === 'bracket' ? 'text-amber-900' : 'text-amber-700 hover:text-amber-900'}`}>
              Playoff Bracket
            </button>{' '}before the deadline.
          </p>
        </div>
      )}

      {tab === 'groups' ? <GroupPredictionsPage onCountChange={setGroupsSaved} /> : <KnockoutPredictionsPage onCountChange={setKoSaved} />}
    </div>
  )
}

export default function PredictionsPage() {
  return (
    <Suspense>
      <PredictionsInner />
    </Suspense>
  )
}
