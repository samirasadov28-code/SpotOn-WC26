'use client'

import { useTranslation } from '@/lib/i18n/LanguageContext'
import { TEAM_TRANSLATIONS } from '@/lib/team-translations'

interface Props {
  fifaCode: string
  blurb: string
  history: string
}

export default function TeamProfileTranslated({ fifaCode, blurb, history }: Props) {
  const { lang } = useTranslation()
  const tr = TEAM_TRANSLATIONS[lang]?.[fifaCode]
  const displayBlurb = tr?.blurb ?? blurb
  const displayHistory = tr?.history ?? history

  return (
    <>
      <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-black mb-3 flex items-center gap-2">🌍 World Cup Story</h2>
        <p className="text-white/80 leading-relaxed text-sm sm:text-base">{displayHistory}</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8">
        <h2 className="text-base font-black text-[#0B1F3A] mb-2">📌 2026 Context</h2>
        <p className="text-gray-700 leading-relaxed text-sm">{displayBlurb}</p>
      </div>
    </>
  )
}
