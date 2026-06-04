'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import GroupPredictionsPage from './groups/page'
import KnockoutPredictionsPage from './knockout/page'

type Tab = 'groups' | 'bracket'

function PredictionsInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab: Tab = (searchParams.get('tab') as Tab) ?? 'groups'

  const setTab = (t: Tab) => router.replace(`/predictions?tab=${t}`)

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-0">
          {(['groups', 'bracket'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t
                  ? 'border-[#0B1F3A] text-[#0B1F3A]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t === 'groups' ? '⚽ Group Stage' : '🏆 My Bracket'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'groups' ? <GroupPredictionsPage /> : <KnockoutPredictionsPage />}
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
