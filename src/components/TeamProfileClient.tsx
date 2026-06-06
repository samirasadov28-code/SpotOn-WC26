'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { TEAM_TRANSLATIONS } from '@/lib/team-translations'

const CONF_COLORS: Record<string, string> = {
  UEFA: 'bg-blue-100 text-blue-800',
  CONMEBOL: 'bg-yellow-100 text-yellow-800',
  CONCACAF: 'bg-red-100 text-red-800',
  CAF: 'bg-green-100 text-green-800',
  AFC: 'bg-purple-100 text-purple-800',
  OFC: 'bg-teal-100 text-teal-800',
}

const POS_ORDER = ['GK', 'DEF', 'MID', 'FWD']

interface Player {
  id: string
  name: string
  position: string
  shirt_number: number | null
  club: string | null
}

interface TeamData {
  name: string
  shortName: string
  fifaCode: string
  iso2: string
  groupLetter: string
  confederation: string
  flagEmoji: string
  blurb: string
  history: string
  stars: string[]
}

interface Props {
  team: TeamData
  players: Player[]
}

export default function TeamProfileClient({ team, players }: Props) {
  const { t, lang } = useTranslation()
  const tr = TEAM_TRANSLATIONS[lang]?.[team.fifaCode]
  const displayBlurb = tr?.blurb ?? team.blurb
  const displayHistory = tr?.history ?? team.history

  const POS_LABEL: Record<string, string> = {
    GK: `🧤 ${t('team_pos_gk')}`,
    DEF: `🛡️ ${t('team_pos_def')}`,
    MID: `⚙️ ${t('team_pos_mid')}`,
    FWD: `⚡ ${t('team_pos_fwd')}`,
  }

  const byPos = POS_ORDER.reduce((acc, pos) => {
    acc[pos] = players.filter(p => p.position === pos)
    return acc
  }, {} as Record<string, Player[]>)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/teams" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B1F3A] mb-6 transition-colors">
        {t('team_back')}
      </Link>

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden shadow-xl mb-8 bg-[#0B1F3A] text-white">
        <div className="relative h-56 sm:h-72 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w1280/${team.iso2}.png`} alt={`${team.name} flag`} className="w-full h-full object-cover opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end gap-4">
              <span className="text-7xl drop-shadow-lg">{team.flagEmoji}</span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${CONF_COLORS[team.confederation] ?? 'bg-white/20 text-white'}`}>{team.confederation}</span>
                  <span className="text-white/50 text-sm">{t('team_group_label')} {team.groupLetter} · {team.fifaCode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* World Cup History */}
      <div className="bg-[#0B1F3A] text-white rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-black mb-3 flex items-center gap-2">🌍 {t('team_wc_story')}</h2>
        <p className="text-white/80 leading-relaxed text-sm sm:text-base">{displayHistory}</p>
      </div>

      {/* 2026 Context */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8">
        <h2 className="text-base font-black text-[#0B1F3A] mb-2">📌 {t('team_context_title')}</h2>
        <p className="text-gray-700 leading-relaxed text-sm">{displayBlurb}</p>
      </div>

      {/* Stars */}
      {team.stars.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-black text-[#0B1F3A] mb-3">⭐ {t('team_stars')}</h2>
          <div className="flex flex-wrap gap-3">
            {team.stars.map((star) => (
              <div key={star} className="flex items-center gap-2 bg-[#0B1F3A] text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm">
                <span>⚽</span><span>{star}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Squad */}
      <div>
        <h2 className="text-lg font-black text-[#0B1F3A] mb-4">👕 {t('team_squad')}</h2>
        {players.length > 0 ? (
          <div className="space-y-6">
            {POS_ORDER.map((pos) => {
              const group = byPos[pos]
              if (!group.length) return null
              return (
                <div key={pos}>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{POS_LABEL[pos]}</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {group.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 bg-[#0B1F3A] text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">{p.shirt_number ?? '—'}</div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0B1F3A] text-sm truncate">
                            {p.name}{team.stars.includes(p.name) && <span className="ml-1 text-yellow-500">⭐</span>}
                          </p>
                          {p.club && <p className="text-xs text-gray-400 truncate">{p.club}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {team.stars.map((star) => (
              <div key={star} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-yellow-400 text-[#0B1F3A] rounded-full flex items-center justify-center text-sm font-black shrink-0">⭐</div>
                <p className="font-semibold text-[#0B1F3A] text-sm">{star}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 text-center">
        <Link href="/predictions/groups" className="inline-block bg-[#0B1F3A] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#162d52] transition-colors">
          {t('team_predict')} →
        </Link>
      </div>
    </div>
  )
}
