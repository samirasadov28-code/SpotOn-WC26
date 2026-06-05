'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STATIC_TEAMS, GROUPS_ORDER } from '@/lib/teams-data'
import { useTranslation } from '@/lib/i18n/LanguageContext'

const KEY_DATES = [
  { label: 'Prediction lock', date: 'June 11 · 9:00 AM ET', highlight: true },
  { label: 'Opening match: Mexico vs South Africa', date: 'June 11 · 11:00 AM ET', highlight: true },
  { label: 'Group stage ends', date: 'June 27, 2026' },
  { label: 'Round of 32', date: 'Jun 28 – Jul 3' },
  { label: 'Round of 16', date: 'Jul 4–7' },
  { label: 'Quarterfinals', date: 'Jul 9–11' },
  { label: 'Semifinals', date: 'Jul 14–15' },
  { label: 'Third-place match', date: 'Jul 18' },
  { label: '🏆 Final · MetLife Stadium', date: 'Jul 19, 2026' },
]

const STADIUMS = [
  { slug: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', iso2: 'mx', capacity: '87,500', note: 'Opening Match', matches: 8 },
  { slug: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, NJ', country: 'USA', iso2: 'us', capacity: '82,500', note: 'The Final', matches: 7 },
  { slug: 'att', name: 'AT&T Stadium', city: 'Arlington, Dallas', country: 'USA', iso2: 'us', capacity: '80,000', note: 'Most Matches (9)', matches: 9 },
  { slug: 'sofi', name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', iso2: 'us', capacity: '70,240', note: 'Western Hub', matches: 7 },
  { slug: 'mercedes', name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', iso2: 'us', capacity: '71,000', matches: 6 },
  { slug: 'nrg', name: 'NRG Stadium', city: 'Houston', country: 'USA', iso2: 'us', capacity: '72,220', matches: 6 },
  { slug: 'arrowhead', name: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', iso2: 'us', capacity: '76,416', matches: 5 },
  { slug: 'lumen', name: 'Lumen Field', city: 'Seattle', country: 'USA', iso2: 'us', capacity: '69,000', matches: 5 },
  { slug: 'levis', name: "Levi's Stadium", city: 'Santa Clara, Bay Area', country: 'USA', iso2: 'us', capacity: '68,500', matches: 5 },
  { slug: 'hardrock', name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', iso2: 'us', capacity: '65,000', note: 'Eastern Hub', matches: 6 },
  { slug: 'gillette', name: 'Gillette Stadium', city: 'Foxborough, Boston', country: 'USA', iso2: 'us', capacity: '64,628', matches: 5 },
  { slug: 'lincoln', name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', iso2: 'us', capacity: '69,328', matches: 5 },
  { slug: 'bcplace', name: 'BC Place', city: 'Vancouver', country: 'Canada', iso2: 'ca', capacity: '54,500', note: 'Canadian Host', matches: 6 },
  { slug: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', iso2: 'ca', capacity: '30,000', note: 'Canadian Host', matches: 5 },
  { slug: 'akron', name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', iso2: 'mx', capacity: '49,850', note: 'Mexican Host', matches: 5 },
  { slug: 'bbva', name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', iso2: 'mx', capacity: '53,500', note: 'Mexican Host', matches: 5 },
]

type TeamsTab = 'teams' | 'stadiums'

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState<TeamsTab>('teams')
  const { t } = useTranslation()

  const byGroup = GROUPS_ORDER.map(g => ({
    letter: g,
    teams: STATIC_TEAMS.filter(t => t.groupLetter === g),
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'teams' ? 'bg-[#0B1F3A] text-white' : 'text-gray-600 hover:text-[#0B1F3A]'}`}
        >
          {t('teams_tab')}
        </button>
        <button
          onClick={() => setActiveTab('stadiums')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'stadiums' ? 'bg-[#0B1F3A] text-white' : 'text-gray-600 hover:text-[#0B1F3A]'}`}
        >
          {t('teams_stadiums')}
        </button>
      </div>

      {activeTab === 'teams' && (
        <>
          <div className="mb-10">
            <h1 className="text-3xl font-black text-[#0B1F3A] mb-1">{t('teams_tab')}</h1>
            <p className="text-gray-500">{t('teams_48_desc')}</p>
          </div>

          {/* Groups */}
          <div className="space-y-10 mb-16">
            {byGroup.map(({ letter, teams }) => (
              <div key={letter} id={`group-${letter}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-[#0B1F3A] text-white rounded-xl flex items-center justify-center font-black text-lg">{letter}</div>
                  <h2 className="text-xl font-black text-[#0B1F3A]">Group {letter}</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {teams.map((team) => (
                    <Link
                      key={team.fifaCode}
                      href={`/teams/${team.fifaCode}`}
                      className="group bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-[#0B1F3A]/20 transition-all hover:-translate-y-0.5"
                    >
                      {/* Flag image */}
                      <div className="relative h-28 bg-gray-100 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://flagcdn.com/w640/${team.iso2}.png`}
                          alt={`${team.name} flag`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-2 left-3 text-xl">{team.flagEmoji}</span>
                      </div>
                      <div className="p-3">
                        <p className="font-black text-[#0B1F3A] text-sm leading-tight">{team.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{team.confederation}</p>
                        {team.stars.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2 truncate">⭐ {team.stars.slice(0, 2).join(', ')}</p>
                        )}
                        <p className="text-xs text-[#0B1F3A] font-semibold mt-2 group-hover:underline">{t('teams_view_profile')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Key dates */}
          <div>
            <h2 className="text-2xl font-black text-[#0B1F3A] mb-4">{t('teams_key_dates')}</h2>
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {KEY_DATES.map((item, i) => (
                <div key={i} className={`flex justify-between items-center px-5 py-3.5 text-sm ${i > 0 ? 'border-t border-gray-100' : ''} ${item.highlight ? 'bg-yellow-50' : ''}`}>
                  <span className={`font-medium ${item.highlight ? 'text-[#0B1F3A] font-bold' : 'text-gray-700'}`}>{item.label}</span>
                  <span className={`text-xs text-right ml-4 ${item.highlight ? 'text-[#0B1F3A] font-semibold' : 'text-gray-400'}`}>{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'stadiums' && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#0B1F3A] mb-1">{t('teams_16_stadiums')}</h1>
            <p className="text-gray-500">{t('teams_stadiums_desc')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {STADIUMS.map((s) => (
              <Link
                key={s.slug}
                href={`/stadiums/${s.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all"
              >
                {/* Flag banner */}
                <div className="relative h-28 bg-[#0B1F3A] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w640/${s.iso2}.png`}
                    alt={s.country}
                    className="w-full h-full object-cover opacity-40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/80 to-transparent" />
                  {s.note && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {s.note}
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${s.iso2}.png`}
                    alt={s.country}
                    className="absolute bottom-2 right-2 w-7 h-auto rounded-sm opacity-80"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-black text-[#0B1F3A] text-sm leading-tight group-hover:text-green-700 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">{s.city} · {s.country}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">🏟️ {s.capacity}</span>
                    <span className="text-xs font-bold text-[#0B1F3A]/60">{s.matches} {t('teams_matches')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
