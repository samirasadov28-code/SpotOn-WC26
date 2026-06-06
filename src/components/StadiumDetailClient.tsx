'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { STADIUM_TRANSLATIONS } from '@/lib/stadium-translations'
import type { StaticStadium } from '@/lib/stadiums-data'
import { STATIC_TEAMS } from '@/lib/teams-data'

interface Match {
  id: string
  home_team: string | null
  away_team: string | null
  kickoff_at: string
  stage: string
  group_letter: string | null
  bracket_slot: string | null
  venue: string | null
}

interface Props {
  stadium: StaticStadium
  matches: Match[]
}

const teamByCode = new Map(STATIC_TEAMS.map(t => [t.fifaCode, t]))

function flagUrl(iso2: string) {
  return `https://flagcdn.com/w40/${iso2}.png`
}

function formatKickoff(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

export default function StadiumDetailClient({ stadium, matches }: Props) {
  const { t, lang } = useTranslation()
  const tr = STADIUM_TRANSLATIONS[lang]?.[stadium.slug]

  const displayDesc = tr?.desc ?? stadium.desc
  const displayFacts = tr?.facts ?? stadium.facts
  const displayNote = tr?.note ?? stadium.note
  const displayMatches = tr?.matches ?? stadium.matches

  function stageLabel(stage: string) {
    const map: Record<string, string> = {
      group: t('stad_stage_group'),
      r32: t('stad_stage_r32'),
      r16: t('stad_stage_r16'),
      qf: t('stad_stage_qf'),
      sf: t('stad_stage_sf'),
      final: t('stad_stage_final'),
      third: t('stad_stage_third'),
    }
    return map[stage] ?? stage
  }

  const groupMatches = matches.filter(m => m.stage === 'group')
  const koMatches = matches.filter(m => m.stage !== 'group')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/stadiums" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B1F3A] mb-6 transition-colors">
        {t('stad_back')}
      </Link>

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden shadow-xl mb-8 bg-[#0B1F3A] text-white">
        <div className="relative h-64 sm:h-80 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w1280/${stadium.iso2}.png`} alt={stadium.country} className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/50 to-transparent" />
          {displayNote && (
            <div className="absolute top-4 left-4">
              <span className="inline-block bg-green-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                {displayNote}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-white/60 text-sm mb-1">{stadium.city} · {stadium.country}</p>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">{stadium.name}</h1>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-white/70">
              <span>🏟️ {stadium.capacity} {t('stad_capacity')}</span>
              <span>📅 {t('stad_opened')} {stadium.opened}</span>
              <span>⚽ {stadium.surface}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matches hosted */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-center gap-3">
        <span className="text-2xl">🗓️</span>
        <div>
          <p className="text-xs text-green-700 font-bold uppercase tracking-wider">{t('stad_wc_matches')}</p>
          <p className="font-semibold text-[#0B1F3A] mt-0.5">{displayMatches}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-black text-[#0B1F3A] mb-3">{t('stad_about')}</h2>
        <p className="text-gray-700 leading-relaxed">{displayDesc}</p>
      </div>

      {/* Key facts */}
      <div className="mb-10">
        <h2 className="text-lg font-black text-[#0B1F3A] mb-4">⚡ {t('stad_key_facts')}</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {displayFacts.map((fact, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
              <span className="text-green-500 font-black text-lg leading-none mt-0.5">✓</span>
              <p className="text-gray-700 text-sm leading-snug">{fact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Group stage matches */}
      {groupMatches.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-black text-[#0B1F3A] mb-4">⚽ {t('stad_group_stage_matches')}</h2>
          <div className="flex flex-col gap-3">
            {groupMatches.map(match => {
              const home = match.home_team ? teamByCode.get(match.home_team) : null
              const away = match.away_team ? teamByCode.get(match.away_team) : null
              return (
                <div key={match.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {t('stad_group_label')} {match.group_letter} · {formatKickoff(match.kickoff_at)}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {home ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={flagUrl(home.iso2)} alt={home.name} className="w-7 h-auto rounded-sm flex-shrink-0" />
                          <Link href={`/teams/${home.fifaCode}`} className="font-semibold text-[#0B1F3A] text-sm hover:underline truncate">{home.name}</Link>
                        </>
                      ) : (
                        <span className="font-semibold text-[#0B1F3A] text-sm">{match.home_team ?? t('stad_tbd')}</span>
                      )}
                    </div>
                    <span className="text-xs font-black text-gray-400 flex-shrink-0 px-2">VS</span>
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      {away ? (
                        <>
                          <Link href={`/teams/${away.fifaCode}`} className="font-semibold text-[#0B1F3A] text-sm hover:underline truncate text-right">{away.name}</Link>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={flagUrl(away.iso2)} alt={away.name} className="w-7 h-auto rounded-sm flex-shrink-0" />
                        </>
                      ) : (
                        <span className="font-semibold text-[#0B1F3A] text-sm text-right">{match.away_team ?? t('stad_tbd')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Knockout matches */}
      {koMatches.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-black text-[#0B1F3A] mb-4">🏆 {t('stad_ko_matches')}</h2>
          <div className="flex flex-col gap-3">
            {koMatches.map(match => {
              const home = match.home_team ? teamByCode.get(match.home_team) : null
              const away = match.away_team ? teamByCode.get(match.away_team) : null
              const homeLabel = home ? home.name : match.home_team ?? t('stad_tbd')
              const awayLabel = away ? away.name : match.away_team ?? t('stad_tbd')
              return (
                <div key={match.id} className="bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {stageLabel(match.stage)} · {formatKickoff(match.kickoff_at)}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {home && <img src={flagUrl(home.iso2)} alt={home.name} className="w-7 h-auto rounded-sm flex-shrink-0" />}
                      {!home && <span className="w-7 h-5 bg-gray-100 rounded-sm flex-shrink-0 flex items-center justify-center text-gray-300 text-xs">?</span>}
                      <span className="font-semibold text-[#0B1F3A] text-sm truncate">{homeLabel}</span>
                    </div>
                    <span className="text-xs font-black text-gray-400 flex-shrink-0 px-2">VS</span>
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span className="font-semibold text-[#0B1F3A] text-sm truncate text-right">{awayLabel}</span>
                      {away && <img src={flagUrl(away.iso2)} alt={away.name} className="w-7 h-auto rounded-sm flex-shrink-0" />}
                      {!away && <span className="w-7 h-5 bg-gray-100 rounded-sm flex-shrink-0 flex items-center justify-center text-gray-300 text-xs">?</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="mb-10 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-gray-500 text-sm">
          {t('stad_no_schedule')}
        </div>
      )}

      <div className="text-center">
        <Link href="/stadiums" className="inline-block border-2 border-[#0B1F3A] text-[#0B1F3A] font-black px-8 py-3 rounded-2xl hover:bg-[#0B1F3A] hover:text-white transition-all mr-4">
          {t('stad_back')}
        </Link>
        <Link href="/predictions/groups" className="inline-block bg-[#0B1F3A] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#162d52] transition-colors">
          {t('stad_predict')} →
        </Link>
      </div>
    </div>
  )
}
