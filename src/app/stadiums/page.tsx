import Link from 'next/link'

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

const COUNTRIES = [
  { name: 'USA', iso2: 'us', count: 11, color: '#B22234' },
  { name: 'Mexico', iso2: 'mx', count: 3, color: '#006847' },
  { name: 'Canada', iso2: 'ca', count: 2, color: '#FF0000' },
]

export default function StadiumsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#0B1F3A] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-green-400 font-bold text-sm uppercase tracking-widest mb-3">FIFA World Cup 2026</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">16 World-Class Stadiums</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Spread across 3 nations and 16 cities — the largest World Cup ever played. From the historic Azteca to the iconic MetLife, these are the theatres of dreams.
          </p>
          <div className="flex justify-center gap-8 mt-8">
            {COUNTRIES.map((c) => (
              <div key={c.name} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://flagcdn.com/w80/${c.iso2}.png`} alt={c.name} className="w-12 h-auto mx-auto rounded mb-2 opacity-90" />
                <p className="text-white font-bold">{c.name}</p>
                <p className="text-white/50 text-sm">{c.count} venues</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
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
                  <span className="text-xs font-bold text-[#0B1F3A]/60">{s.matches} matches</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center py-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-[#0B1F3A] underline">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
