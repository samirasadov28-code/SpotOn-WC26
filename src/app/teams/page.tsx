import { createClient } from '@/lib/supabase/server'
import type { Team } from '@/lib/supabase/types'

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

const VENUES = [
  { city: 'New York/New Jersey', stadium: 'MetLife Stadium', capacity: '82,500' },
  { city: 'Los Angeles', stadium: 'SoFi Stadium', capacity: '70,240' },
  { city: 'Los Angeles', stadium: 'Rose Bowl', capacity: '88,565' },
  { city: 'Dallas', stadium: 'AT&T Stadium', capacity: '80,000' },
  { city: 'San Francisco Bay Area', stadium: "Levi's Stadium", capacity: '68,500' },
  { city: 'Miami', stadium: 'Hard Rock Stadium', capacity: '64,767' },
  { city: 'Atlanta', stadium: 'Mercedes-Benz Stadium', capacity: '71,000' },
  { city: 'Seattle', stadium: 'Lumen Field', capacity: '69,000' },
  { city: 'Houston', stadium: 'NRG Stadium', capacity: '72,220' },
  { city: 'Kansas City', stadium: 'Arrowhead Stadium', capacity: '76,416' },
  { city: 'Boston', stadium: 'Gillette Stadium', capacity: '64,628' },
  { city: 'Philadelphia', stadium: 'Lincoln Financial Field', capacity: '69,328' },
  { city: 'Denver', stadium: 'Empower Field at Mile High', capacity: '76,125' },
  { city: 'Las Vegas', stadium: 'Allegiant Stadium', capacity: '65,000' },
  { city: 'Vancouver', stadium: 'BC Place', capacity: '54,500' },
  { city: 'Toronto', stadium: 'BMO Field', capacity: '30,000' },
  { city: 'Mexico City', stadium: 'Estadio Azteca', capacity: '87,523' },
  { city: 'Guadalajara', stadium: 'Estadio Akron', capacity: '49,850' },
  { city: 'Monterrey', stadium: 'Estadio BBVA', capacity: '53,500' },
  { city: 'Charlotte', stadium: 'Bank of America Stadium', capacity: '74,867' },
  { city: 'Orlando', stadium: 'Camping World Stadium', capacity: '60,219' },
  { city: 'San Francisco', stadium: 'Oracle Park', capacity: '41,915' },
]

const KEY_DATES = [
  { label: 'Opening match: Mexico vs South Africa', date: 'June 11, 2026 · 11:00 AM ET' },
  { label: 'Global prediction lock', date: 'June 11, 2026 · 9:00 AM ET' },
  { label: 'Group stage ends', date: 'June 27, 2026' },
  { label: 'Round of 32', date: 'June 29 – July 3, 2026' },
  { label: 'Round of 16', date: 'July 5–8, 2026' },
  { label: 'Quarterfinals', date: 'July 10–11, 2026' },
  { label: 'Semifinals', date: 'July 14–15, 2026' },
  { label: 'Third-place match', date: 'July 18, 2026' },
  { label: 'Final · MetLife Stadium', date: 'July 19, 2026' },
]

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase.from('teams').select('*').order('group_letter')

  const teamsByGroup = new Map<string, Team[]>()
  for (const grp of GROUPS) {
    teamsByGroup.set(grp, (teams ?? []).filter((t) => t.group_letter === grp))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Teams & Groups</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        48 teams across 12 groups — World Cup 2026
      </p>

      {/* Groups */}
      <div className="grid gap-8 mb-16">
        {GROUPS.map((grp) => {
          const grpTeams = teamsByGroup.get(grp) ?? []
          return (
            <div key={grp}>
              <h2 className="text-xl font-bold text-navy dark:text-white mb-3">Group {grp}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {grpTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                  >
                    <div className="text-2xl mb-2">{team.flag_emoji}</div>
                    <div className="font-bold text-navy dark:text-white text-sm mb-0.5">
                      {team.name}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{team.confederation} · {team.fifa_code}</div>
                    {team.blurb && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug mb-2">
                        {team.blurb}
                      </p>
                    )}
                    {team.stars && team.stars.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {team.stars.map((star) => (
                          <span
                            key={star}
                            className="text-xs bg-navy/10 dark:bg-white/10 text-navy dark:text-white rounded-full px-2 py-0.5"
                          >
                            ⭐ {star}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Venues */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-navy dark:text-white mb-4">Host Venues</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VENUES.map((v) => (
            <div key={v.stadium} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <div className="font-bold text-sm text-navy dark:text-white">{v.stadium}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{v.city} · {v.capacity} cap.</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key dates */}
      <div>
        <h2 className="text-2xl font-bold text-navy dark:text-white mb-4">Key Dates</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {KEY_DATES.map((item, i) => (
            <div key={i} className={`flex justify-between items-center px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs text-right ml-4">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
