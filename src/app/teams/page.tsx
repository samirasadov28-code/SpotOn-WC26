import Link from 'next/link'
import { STATIC_TEAMS, GROUPS_ORDER } from '@/lib/teams-data'

const STADIUMS = [
  { slug: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', iso2: 'mx', capacity: '87,500', note: 'Opening Match', desc: 'The iconic Azteca has hosted two World Cup finals (1970, 1986) and is one of the most storied venues in football history. Over 100,000 fans once packed its stands.' },
  { slug: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, NJ', country: 'USA', iso2: 'us', capacity: '82,500', note: 'The Final — July 19', desc: 'Home of the NFL\'s Giants and Jets, MetLife sits 8 miles from Manhattan. It will host the 2026 Final on July 19, the culmination of the biggest World Cup in history.' },
  { slug: 'att', name: 'AT&T Stadium', city: 'Arlington, Dallas', country: 'USA', iso2: 'us', capacity: '80,000', note: 'Most matches (9)', desc: 'Known as "Jerry World," AT&T Stadium hosts a record 9 matches in 2026 including a semifinal. Its retractable roof and massive video board make it one of the world\'s most spectacular arenas.' },
  { slug: 'sofi', name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', iso2: 'us', capacity: '70,240', note: 'Western Hub', desc: 'The newest and most technically advanced stadium on the list, SoFi opened in 2020 and already hosted Super Bowl LVI. LA\'s football palace under the California sun.' },
  { slug: 'mercedes', name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', iso2: 'us', capacity: '71,000', desc: 'Atlanta\'s retractable-roof gem, home to Atlanta United and the NFL Falcons. Its petal-shaped opening roof is an engineering marvel.' },
  { slug: 'nrg', name: 'NRG Stadium', city: 'Houston', country: 'USA', iso2: 'us', capacity: '72,220', desc: 'Houston\'s massive domed arena in the heart of Texas. Previously hosted Super Bowl LI and is a regular concert and event venue.' },
  { slug: 'arrowhead', name: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', iso2: 'us', capacity: '76,416', desc: 'Consistently ranked as the loudest outdoor stadium in the NFL. The Kansas City Chiefs\' fortress hosts World Cup group matches in 2026.' },
  { slug: 'lumen', name: 'Lumen Field', city: 'Seattle', country: 'USA', iso2: 'us', capacity: '69,000', desc: 'Home of the Seattle Sounders, one of MLS\'s most passionate clubs. The Pacific Northwest atmosphere will be electric for World Cup football.' },
  { slug: 'levis', name: "Levi's Stadium", city: 'Santa Clara (San Francisco Bay)', country: 'USA', iso2: 'us', capacity: '68,500', desc: 'Silicon Valley\'s stadium, home of the 49ers. The Bay Area football market is one of the largest in the USA.' },
  { slug: 'hardrock', name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', iso2: 'us', capacity: '65,000', note: 'Eastern Hub', desc: 'Miami\'s iconic open-air stadium, already accustomed to huge events including Super Bowls and Copa América matches. Tropical atmosphere guaranteed.' },
  { slug: 'gillette', name: 'Gillette Stadium', city: 'Foxborough (Boston)', country: 'USA', iso2: 'us', capacity: '64,628', desc: 'Home of the New England Patriots, situated 30 miles from downtown Boston. Boston\'s historic football culture meets the World Cup.' },
  { slug: 'lincoln', name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', iso2: 'us', capacity: '69,328', desc: 'The Eagles\' home in the city of brotherly love. Philadelphia has one of the most passionate sports fan bases in North America.' },
  { slug: 'bcplace', name: 'BC Place', city: 'Vancouver', country: 'Canada', iso2: 'ca', capacity: '54,500', note: 'Canadian Host', desc: 'Vancouver\'s covered stadium with a retractable roof, already a 2015 Women\'s World Cup final venue. Sits in one of the world\'s most beautiful cities.' },
  { slug: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', iso2: 'ca', capacity: '30,000', note: 'Canadian Host', desc: 'Toronto FC\'s home ground, the smallest venue of the tournament, offering an intimate atmosphere on the shores of Lake Ontario.' },
  { slug: 'akron', name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', iso2: 'mx', capacity: '49,850', note: 'Mexican Host', desc: 'Home of Club Deportivo Guadalajara (Chivas), the most popular club in Mexico. Guadalajara is Mexico\'s second city and a football-mad town.' },
  { slug: 'bbva', name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', iso2: 'mx', capacity: '53,500', note: 'Mexican Host', desc: 'One of Latin America\'s most modern stadiums, home to CF Monterrey. Set against the stunning backdrop of the Sierra Madre mountains.' },
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

      {/* Stadiums */}
      <div className="mb-12" id="stadiums">
        <h2 className="text-2xl font-black text-[#0B1F3A] mb-2">🏟️ Host Stadiums</h2>
        <p className="text-gray-500 text-sm mb-6">16 venues across 3 countries. Click any stadium for details.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STADIUMS.map((v) => (
            <Link
              key={v.slug}
              href={`/stadiums/${v.slug}`}
              className="group bg-[#0B1F3A] text-white rounded-2xl overflow-hidden hover:bg-[#162d52] transition-colors"
            >
              {/* Country flag as stadium photo */}
              <div className="relative h-32 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w640/${v.iso2}.png`}
                  alt={v.country}
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/40 to-transparent" />
                <div className="absolute top-3 left-3">
                  {v.note && (
                    <span className="inline-block bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {v.note}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5">
                <p className="font-black text-base leading-tight">{v.name}</p>
                <p className="text-white/60 text-sm mt-1">{v.city} · {v.country}</p>
                <p className="text-white/40 text-xs mt-1">Capacity: {v.capacity}</p>
                <p className="text-green-400 text-xs font-semibold mt-3 group-hover:underline">View stadium →</p>
              </div>
            </Link>
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
