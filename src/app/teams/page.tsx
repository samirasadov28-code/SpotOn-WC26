import { createClient } from '@/lib/supabase/server'
import { flagUrl } from '@/lib/flag-map'
import Image from 'next/image'
import Link from 'next/link'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

const VENUES = [
  { city: 'Mexico City, Mexico', stadium: 'Estadio Azteca', cap: '87,500', note: 'Opening Match', flag: '🇲🇽' },
  { city: 'New York / NJ, USA', stadium: 'MetLife Stadium', cap: '82,500', note: 'The Final', flag: '🇺🇸' },
  { city: 'Dallas, USA', stadium: 'AT&T Stadium', cap: '80,000', note: 'Most matches (9)', flag: '🇺🇸' },
  { city: 'Los Angeles, USA', stadium: 'SoFi Stadium', cap: '70,240', flag: '🇺🇸' },
  { city: 'Atlanta, USA', stadium: 'Mercedes-Benz Stadium', cap: '71,000', flag: '🇺🇸' },
  { city: 'Houston, USA', stadium: 'NRG Stadium', cap: '72,220', flag: '🇺🇸' },
  { city: 'Kansas City, USA', stadium: 'Arrowhead Stadium', cap: '76,416', flag: '🇺🇸' },
  { city: 'Seattle, USA', stadium: 'Lumen Field', cap: '69,000', flag: '🇺🇸' },
  { city: 'San Francisco Bay, USA', stadium: "Levi's Stadium", cap: '68,500', flag: '🇺🇸' },
  { city: 'Miami, USA', stadium: 'Hard Rock Stadium', cap: '65,000', flag: '🇺🇸' },
  { city: 'Boston, USA', stadium: 'Gillette Stadium', cap: '64,628', flag: '🇺🇸' },
  { city: 'Philadelphia, USA', stadium: 'Lincoln Financial Field', cap: '69,328', flag: '🇺🇸' },
  { city: 'Vancouver, Canada', stadium: 'BC Place', cap: '54,500', flag: '🇨🇦' },
  { city: 'Toronto, Canada', stadium: 'BMO Field', cap: '30,000', flag: '🇨🇦' },
  { city: 'Guadalajara, Mexico', stadium: 'Estadio Akron', cap: '49,850', flag: '🇲🇽' },
  { city: 'Monterrey, Mexico', stadium: 'Estadio BBVA', cap: '53,500', flag: '🇲🇽' },
]

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

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase.from('teams').select('*').order('group_letter')

  const byGroup = new Map<string, any[]>()
  for (const g of GROUPS) byGroup.set(g, (teams ?? []).filter((t: any) => t.group_letter === g))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#0B1F3A] mb-1">Teams & Groups</h1>
        <p className="text-gray-500">48 nations across 12 groups — FIFA World Cup 2026. Click any team for profile & squad.</p>
      </div>

      {/* Groups */}
      <div className="space-y-10 mb-16">
        {GROUPS.map((g) => {
          const grpTeams = byGroup.get(g) ?? []
          return (
            <div key={g}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-[#0B1F3A] text-white rounded-xl flex items-center justify-center font-black text-lg">
                  {g}
                </div>
                <h2 className="text-xl font-black text-[#0B1F3A]">Group {g}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {grpTeams.map((team: any) => {
                  const img = flagUrl(team.fifa_code, 320)
                  return (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      className="group bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md hover:border-[#0B1F3A]/20 transition-all hover:-translate-y-0.5"
                    >
                      {/* Flag image */}
                      <div className="relative h-28 bg-gray-100 overflow-hidden">
                        {img ? (
                          <Image
                            src={img}
                            alt={`${team.name} flag`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-5xl">{team.flag_emoji}</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <span className="absolute bottom-2 left-3 text-2xl">{team.flag_emoji}</span>
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <p className="font-black text-[#0B1F3A] text-sm leading-tight">{team.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{team.confederation}</p>
                        {team.stars && team.stars.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2 truncate">
                            ⭐ {team.stars.slice(0, 2).join(', ')}
                          </p>
                        )}
                        <p className="text-xs text-[#0B1F3A] font-semibold mt-2 group-hover:underline">View profile →</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Venues */}
      <div className="mb-12">
        <h2 className="text-2xl font-black text-[#0B1F3A] mb-6">🏟️ Host Stadiums</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VENUES.map((v) => (
            <div key={v.stadium} className="bg-[#0B1F3A] text-white rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute right-4 top-4 text-4xl opacity-20">{v.flag}</div>
              {v.note && (
                <span className="inline-block bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                  {v.note}
                </span>
              )}
              <p className="font-black text-base">{v.stadium}</p>
              <p className="text-white/60 text-sm mt-1">{v.city}</p>
              <p className="text-white/40 text-xs mt-1">Capacity: {v.cap}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key dates */}
      <div>
        <h2 className="text-2xl font-black text-[#0B1F3A] mb-4">📅 Key Dates</h2>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {KEY_DATES.map((item, i) => (
            <div key={i} className={`flex justify-between items-center px-5 py-3.5 text-sm ${i > 0 ? 'border-t border-gray-100' : ''} ${item.highlight ? 'bg-yellow-50' : ''}`}>
              <span className={`font-medium ${item.highlight ? 'text-[#0B1F3A] font-bold' : 'text-gray-700'}`}>{item.label}</span>
              <span className={`text-xs text-right ml-4 ${item.highlight ? 'text-[#0B1F3A] font-semibold' : 'text-gray-400'}`}>{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
