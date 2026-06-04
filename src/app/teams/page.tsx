import Link from 'next/link'
import { STATIC_TEAMS, GROUPS_ORDER } from '@/lib/teams-data'

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

export default function TeamsPage() {
  const byGroup = GROUPS_ORDER.map(g => ({
    letter: g,
    teams: STATIC_TEAMS.filter(t => t.groupLetter === g),
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#0B1F3A] mb-1">Teams & Groups</h1>
        <p className="text-gray-500">48 nations across 12 groups — FIFA World Cup 2026. Click any team for profile & squad.</p>
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
                    <p className="text-xs text-[#0B1F3A] font-semibold mt-2 group-hover:underline">View profile →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
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
