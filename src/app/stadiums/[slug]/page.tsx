import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStadiumGroups, GROUP_STADIUMS } from '@/lib/schedule-data'
import { STATIC_TEAMS } from '@/lib/teams-data'

const STADIUMS = [
  { slug: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', iso2: 'mx', capacity: '87,500', opened: 1966, surface: 'Grass', note: 'Opening Match', matches: 'Group stage + Round of 32', desc: 'The Azteca is the only stadium to have hosted two World Cup finals — 1970 (Brazil 4–1 Italy) and 1986 (Argentina 3–2 West Germany, the "Hand of God" tournament). It is the largest stadium in Mexico and one of the most atmospheric venues in football. The opening match of WC2026 is played here: Mexico vs South Africa.', facts: ['Hosted the 1970 and 1986 World Cup finals', 'Capacity once exceeded 115,000 before safety modifications', 'Site of Diego Maradona\'s "Goal of the Century" in 1986', 'Home of Club América and the Mexican national team'] },
  { slug: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, New Jersey', country: 'USA', iso2: 'us', capacity: '82,500', opened: 2010, surface: 'FieldTurf (grass for WC)', note: 'The Final — July 19, 2026', matches: 'Group stage + Knockout rounds + Final', desc: 'The largest stadium in the NFL, MetLife sits 8 miles west of Manhattan in the New Jersey Meadowlands. It will host the biggest game in the world on July 19, 2026 — the FIFA World Cup Final. Shared by the New York Giants and New York Jets, it has also hosted Super Bowl XLVIII.', facts: ['Will host the 2026 World Cup Final', 'Hosted Super Bowl XLVIII (2014)', 'Shared by both New York NFL teams', '8 miles from Times Square, Manhattan'] },
  { slug: 'att', name: 'AT&T Stadium', city: 'Arlington, Dallas', country: 'USA', iso2: 'us', capacity: '80,000', opened: 2009, surface: 'Natural grass', note: 'Most matches — 9', matches: 'Group stage + Knockout rounds + Semifinal', desc: 'Known as "Jerry World" after Cowboys owner Jerry Jones, AT&T Stadium is a technological marvel. Its retractable roof, 160×72-foot centre-hung video board (the world\'s largest at opening), and 80,000+ capacity make it a premier global sports venue. It hosts a record 9 WC2026 matches including a semifinal.', facts: ['Hosts a tournament-record 9 matches', 'Features the world\'s largest HD video board', 'Retractable roof for year-round use', 'Home of the Dallas Cowboys NFL team'] },
  { slug: 'sofi', name: 'SoFi Stadium', city: 'Inglewood, Los Angeles', country: 'USA', iso2: 'us', capacity: '70,240', opened: 2020, surface: 'Matrix Helix (hybrid grass)', note: 'Western Hub', matches: 'Group stage + Knockout rounds', desc: 'The most expensive stadium ever built ($5.5 billion), SoFi opened in 2020 and immediately became one of the world\'s most stunning venues. Featuring a translucent ETFE roof and surrounded by an open-air concourse, it hosted Super Bowl LVI in 2022 and will be a marquee WC2026 venue.', facts: ['Cost $5.5 billion — most expensive stadium ever built', 'Hosted Super Bowl LVI (2022)', 'Home of both the LA Rams and LA Chargers', 'Features a transparent "halo board" scoreboard'] },
  { slug: 'mercedes', name: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'USA', iso2: 'us', capacity: '71,000', opened: 2017, surface: 'Natural grass', matches: 'Group stage + Knockout rounds', desc: 'Atlanta\'s stunning multipurpose arena features an unprecedented retractable roof with 8 sections that open like a camera aperture, nicknamed "the halo." Home to both Atlanta United (MLS) and the Atlanta Falcons (NFL), it hosted Super Bowl LIII in 2019.', facts: ['Unique 8-panel camera aperture retractable roof', 'Home of Atlanta United FC and Atlanta Falcons', 'Hosted Super Bowl LIII (2019)', 'Features a 360-degree halo video board'] },
  { slug: 'nrg', name: 'NRG Stadium', city: 'Houston', country: 'USA', iso2: 'us', capacity: '72,220', opened: 2002, surface: 'Natural grass', matches: 'Group stage + Knockout rounds', desc: 'Houston\'s fully climate-controlled domed stadium, home to the Houston Texans. With its retractable roof, NRG can host events in any weather — crucial for a Texas summer. It has hosted Super Bowls, WrestleMania, and NCAA championships.', facts: ['Fully retractable roof for climate control', 'Hosted Super Bowls XXXVIII and LI', 'Home of the Houston Texans', 'Located in the largest medical complex in the world'] },
  { slug: 'arrowhead', name: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', iso2: 'us', capacity: '76,416', opened: 1972, surface: 'Natural grass', matches: 'Group stage', desc: 'Consistently rated the loudest outdoor stadium in the NFL, Arrowhead has a passionate fanbase and a remarkable atmosphere. The Kansas City Chiefs have made it one of the most feared home venues in American sports. WC2026 group matches here will be deafening.', facts: ['Certified as the loudest outdoor stadium in the NFL', 'Home of the Kansas City Chiefs (multiple Super Bowl winners)', 'One of the NFL\'s oldest continuously-used stadiums', 'Known for its sea of red-clad fans'] },
  { slug: 'lumen', name: 'Lumen Field', city: 'Seattle', country: 'USA', iso2: 'us', capacity: '69,000', opened: 2002, surface: 'FieldTurf (grass for WC)', matches: 'Group stage', desc: 'Home of the Seattle Sounders, one of MLS\'s most decorated clubs, and the Seattle Seahawks NFL team. Lumen Field is famous for its noise — the Seahawks fans set a crowd noise record here in 2013 (137.6 dB). The Pacific Northwest setting and die-hard football culture will make it special.', facts: ['Home of Seattle Sounders FC and Seattle Seahawks', 'Fans set a crowd noise world record (137.6 dB) in 2013', 'Seattle has one of MLS\'s most passionate supporter cultures', 'Panoramic views of the Puget Sound and downtown Seattle'] },
  { slug: 'levis', name: "Levi's Stadium", city: 'Santa Clara (Bay Area)', country: 'USA', iso2: 'us', capacity: '68,500', opened: 2014, surface: 'Natural grass', matches: 'Group stage', desc: 'Home of the San Francisco 49ers in the heart of Silicon Valley. Levi\'s Stadium is a technological showcase — the first to offer free Wi-Fi across the entire seating bowl. It hosted Super Bowl 50 in 2016 and Copa América Centenario matches.', facts: ['Located in the heart of Silicon Valley', 'First stadium with Wi-Fi for all 70,000 seats', 'Hosted Super Bowl 50 (2016)', 'Solar panels on the roof generate enough electricity for all home games'] },
  { slug: 'hardrock', name: 'Hard Rock Stadium', city: 'Miami Gardens', country: 'USA', iso2: 'us', capacity: '65,000', opened: 1987, surface: 'Natural grass', note: 'Eastern Hub', matches: 'Group stage + Knockout rounds', desc: 'Miami\'s iconic open-air stadium underwent a $550 million renovation in 2016 and now features a distinctive canopy that shades all seats. It hosted Copa América Centenario 2016 and Copa América 2024, making it one of the most experienced international football venues in the US.', facts: ['Hosted Copa América 2024 including the Final', 'Unique canopy design shades all 65,000 seats', 'Home of Miami Dolphins and University of Miami Hurricanes', 'Hosted 5 Super Bowls'] },
  { slug: 'gillette', name: 'Gillette Stadium', city: 'Foxborough (Boston area)', country: 'USA', iso2: 'us', capacity: '64,628', opened: 2002, surface: 'FieldTurf (grass for WC)', matches: 'Group stage', desc: 'Home of the New England Patriots (dynasty of the 2000s–2010s) and New England Revolution (MLS). Located 30 miles southwest of Boston, one of America\'s most historic cities. The stadium is known for its lighthouse feature and passionate New England sports culture.', facts: ['Home of the New England Patriots (6× Super Bowl champions)', 'Also home of New England Revolution (MLS)', 'Features a distinctive lighthouse at one end', '30 miles from historic Boston'] },
  { slug: 'lincoln', name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', iso2: 'us', capacity: '69,328', opened: 2003, surface: 'Natural grass', matches: 'Group stage', desc: 'The home of the Philadelphia Eagles NFL team in one of America\'s most passionate sports cities. "The Linc" is known for its raucous atmosphere — Eagles fans are legendary for their intensity. Philadelphia is the birthplace of American independence and one of the most football-mad cities in the country.', facts: ['Home of the Philadelphia Eagles NFL team', 'Philadelphia fans are among the most passionate in American sports', 'Capacity expanded to over 69,000', 'Located in the South Philadelphia Sports Complex'] },
  { slug: 'bcplace', name: 'BC Place', city: 'Vancouver', country: 'Canada', iso2: 'ca', capacity: '54,500', opened: 1983, surface: 'FieldTurf', note: 'Canadian Host', matches: 'Group stage + Knockout rounds', desc: 'Vancouver\'s covered multi-purpose stadium, the largest in western Canada. BC Place hosted the closing ceremony and gold medal football match of the 2010 Winter Olympics, and was the venue for the 2015 FIFA Women\'s World Cup Final. Situated in one of the world\'s most livable and scenic cities.', facts: ['Hosted 2015 FIFA Women\'s World Cup Final', '2010 Winter Olympics closing ceremony venue', 'Features a retractable air-supported roof', 'Surrounded by mountains, sea, and Stanley Park'] },
  { slug: 'bmo', name: 'BMO Field', city: 'Toronto', country: 'Canada', iso2: 'ca', capacity: '30,000', opened: 2007, surface: 'Natural grass', note: 'Canadian Host', matches: 'Group stage', desc: 'The smallest venue of WC2026, BMO Field offers an intimate, electric atmosphere on the Toronto waterfront. Home of Toronto FC, one of MLS\'s most supported clubs, it sits on the shore of Lake Ontario with views of downtown Toronto\'s iconic skyline.', facts: ['Smallest stadium in WC2026 — intimate and electric', 'Home of Toronto FC (3× MLS Cup finalists)', 'Waterfront location with Lake Ontario and CN Tower views', 'Toronto is Canada\'s largest city and a global metropolis'] },
  { slug: 'akron', name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', iso2: 'mx', capacity: '49,850', opened: 2010, surface: 'Natural grass', note: 'Mexican Host', matches: 'Group stage', desc: 'Home of Club Deportivo Guadalajara (Chivas), the most beloved club in Mexican football. Guadalajara is Mexico\'s second city and its football-crazed culture will ensure a passionate World Cup atmosphere. The stadium opened in 2010 and features a distinctive translucent roof.', facts: ['Home of Chivas (the most popular club in Mexico)', 'Guadalajara is Mexico\'s second-largest city', 'Translucent roof allows natural light while shielding from rain', 'Known locally as "Estadio Chivas"'] },
  { slug: 'bbva', name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', iso2: 'mx', capacity: '53,500', opened: 2015, surface: 'Natural grass', note: 'Mexican Host', matches: 'Group stage', desc: 'One of Latin America\'s most impressive modern stadiums, home to CF Monterrey (Rayados). Set against the breathtaking backdrop of the Sierra Madre Oriental mountains, Estadio BBVA is consistently ranked among the most beautiful football venues in the world. Monterrey is Mexico\'s industrial capital and its passionate football culture is legendary.', facts: ['Stunning backdrop of the Sierra Madre mountains', 'Opened in 2015 — one of the most modern in Latin America', 'Home of CF Monterrey, winners of multiple CONCACAF Champions Cups', 'Monterrey is known for the most passionate football crowds in Mexico'] },
]

function flagUrl(iso2: string) {
  return `https://flagcdn.com/w40/${iso2}.png`
}

export default function StadiumPage({ params }: { params: { slug: string } }) {
  const stadium = STADIUMS.find(s => s.slug === params.slug)
  if (!stadium) notFound()

  const hostedGroups = getStadiumGroups(params.slug)
  const groupTeams = hostedGroups.map(letter => ({
    letter,
    teams: STATIC_TEAMS.filter(t => t.groupLetter === letter),
    stadiums: GROUP_STADIUMS[letter] ?? [],
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/stadiums" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B1F3A] mb-6 transition-colors">
        ← All stadiums
      </Link>

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden shadow-xl mb-8 bg-[#0B1F3A] text-white">
        <div className="relative h-64 sm:h-80 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w1280/${stadium.iso2}.png`}
            alt={stadium.country}
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/50 to-transparent" />
          {stadium.note && (
            <div className="absolute top-4 left-4">
              <span className="inline-block bg-green-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                {stadium.note}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-white/60 text-sm mb-1">{stadium.city} · {stadium.country}</p>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">{stadium.name}</h1>
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-white/70">
              <span>🏟️ {stadium.capacity} capacity</span>
              <span>📅 Opened {stadium.opened}</span>
              <span>⚽ {stadium.surface}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matches hosted */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-center gap-3">
        <span className="text-2xl">🗓️</span>
        <div>
          <p className="text-xs text-green-700 font-bold uppercase tracking-wider">WC2026 Matches</p>
          <p className="font-semibold text-[#0B1F3A] mt-0.5">{stadium.matches}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-black text-[#0B1F3A] mb-3">About the Stadium</h2>
        <p className="text-gray-700 leading-relaxed">{stadium.desc}</p>
      </div>

      {/* Key facts */}
      <div className="mb-10">
        <h2 className="text-lg font-black text-[#0B1F3A] mb-4">⚡ Key Facts</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {stadium.facts.map((fact, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
              <span className="text-green-500 font-black text-lg leading-none mt-0.5">✓</span>
              <p className="text-gray-700 text-sm leading-snug">{fact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Group stage matches hosted here */}
      {hostedGroups.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-black text-[#0B1F3A] mb-4">⚽ Group Stage Matches Here</h2>
          <div className="flex flex-col gap-4">
            {groupTeams.map(({ letter, teams }) => (
              <div key={letter} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-[#0B1F3A] px-4 py-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 bg-white/15 text-white rounded-lg flex items-center justify-center font-black text-xs">{letter}</div>
                  <span className="text-white font-bold text-sm">Group {letter}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {teams.map(t => (
                    <Link
                      key={t.fifaCode}
                      href={`/teams/${t.fifaCode}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={flagUrl(t.iso2)} alt={t.name} className="w-7 h-auto rounded-sm flex-shrink-0" />
                      <span className="font-semibold text-[#0B1F3A] text-sm">{t.name}</span>
                      <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{t.confederation}</span>
                    </Link>
                  ))}
                </div>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400">Group {letter} plays some of its 6 matches at this venue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/stadiums" className="inline-block border-2 border-[#0B1F3A] text-[#0B1F3A] font-black px-8 py-3 rounded-2xl hover:bg-[#0B1F3A] hover:text-white transition-all mr-4">
          ← All Stadiums
        </Link>
        <Link href="/predictions/groups" className="inline-block bg-[#0B1F3A] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#162d52] transition-colors">
          Make Your Predictions →
        </Link>
      </div>
    </div>
  )
}
