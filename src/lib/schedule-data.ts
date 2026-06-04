// Static WC2026 group-stage schedule (venue assignments per FIFA official schedule)
// Each group plays 6 matches across 3 stadiums (one per matchday pair)

export interface StadiumRef {
  slug: string
  name: string
  city: string
  iso2: string
}

export interface GroupMatch {
  group: string
  matchday: number
  homeCode: string  // FIFA code
  homeName: string
  awayCode: string
  awayName: string
  date: string       // display date
  stadiumSlug: string
}

// Which stadiums host each group's matches (based on official WC2026 schedule)
export const GROUP_STADIUMS: Record<string, StadiumRef[]> = {
  A: [
    { slug: 'azteca',  name: 'Estadio Azteca',    city: 'Mexico City', iso2: 'mx' },
    { slug: 'metlife', name: 'MetLife Stadium',    city: 'New York/NJ', iso2: 'us' },
    { slug: 'att',     name: 'AT&T Stadium',       city: 'Dallas',      iso2: 'us' },
  ],
  B: [
    { slug: 'bcplace',  name: 'BC Place',          city: 'Vancouver', iso2: 'ca' },
    { slug: 'sofi',     name: 'SoFi Stadium',      city: 'Los Angeles', iso2: 'us' },
    { slug: 'hardrock', name: 'Hard Rock Stadium', city: 'Miami', iso2: 'us' },
  ],
  C: [
    { slug: 'att',      name: 'AT&T Stadium',      city: 'Dallas', iso2: 'us' },
    { slug: 'sofi',     name: 'SoFi Stadium',      city: 'Los Angeles', iso2: 'us' },
    { slug: 'metlife',  name: 'MetLife Stadium',   city: 'New York/NJ', iso2: 'us' },
  ],
  D: [
    { slug: 'bbva',     name: 'Estadio BBVA',      city: 'Monterrey', iso2: 'mx' },
    { slug: 'nrg',      name: 'NRG Stadium',       city: 'Houston', iso2: 'us' },
    { slug: 'att',      name: 'AT&T Stadium',      city: 'Dallas', iso2: 'us' },
  ],
  E: [
    { slug: 'azteca',  name: 'Estadio Azteca',     city: 'Mexico City', iso2: 'mx' },
    { slug: 'lumen',   name: 'Lumen Field',        city: 'Seattle', iso2: 'us' },
    { slug: 'lincoln', name: 'Lincoln Financial',  city: 'Philadelphia', iso2: 'us' },
  ],
  F: [
    { slug: 'akron',     name: 'Estadio Akron',    city: 'Guadalajara', iso2: 'mx' },
    { slug: 'nrg',       name: 'NRG Stadium',      city: 'Houston', iso2: 'us' },
    { slug: 'mercedes',  name: 'Mercedes-Benz',    city: 'Atlanta', iso2: 'us' },
  ],
  G: [
    { slug: 'bmo',       name: 'BMO Field',        city: 'Toronto', iso2: 'ca' },
    { slug: 'arrowhead', name: 'Arrowhead Stadium',city: 'Kansas City', iso2: 'us' },
    { slug: 'levis',     name: "Levi's Stadium",   city: 'Bay Area', iso2: 'us' },
  ],
  H: [
    { slug: 'hardrock',  name: 'Hard Rock Stadium',city: 'Miami', iso2: 'us' },
    { slug: 'metlife',   name: 'MetLife Stadium',  city: 'New York/NJ', iso2: 'us' },
    { slug: 'gillette',  name: 'Gillette Stadium', city: 'Boston', iso2: 'us' },
  ],
  I: [
    { slug: 'att',      name: 'AT&T Stadium',      city: 'Dallas', iso2: 'us' },
    { slug: 'sofi',     name: 'SoFi Stadium',      city: 'Los Angeles', iso2: 'us' },
    { slug: 'bcplace',  name: 'BC Place',          city: 'Vancouver', iso2: 'ca' },
  ],
  J: [
    { slug: 'bbva',      name: 'Estadio BBVA',     city: 'Monterrey', iso2: 'mx' },
    { slug: 'akron',     name: 'Estadio Akron',    city: 'Guadalajara', iso2: 'mx' },
    { slug: 'nrg',       name: 'NRG Stadium',      city: 'Houston', iso2: 'us' },
  ],
  K: [
    { slug: 'mercedes',  name: 'Mercedes-Benz',    city: 'Atlanta', iso2: 'us' },
    { slug: 'arrowhead', name: 'Arrowhead Stadium',city: 'Kansas City', iso2: 'us' },
    { slug: 'att',       name: 'AT&T Stadium',     city: 'Dallas', iso2: 'us' },
  ],
  L: [
    { slug: 'metlife',  name: 'MetLife Stadium',   city: 'New York/NJ', iso2: 'us' },
    { slug: 'gillette', name: 'Gillette Stadium',  city: 'Boston', iso2: 'us' },
    { slug: 'lincoln',  name: 'Lincoln Financial', city: 'Philadelphia', iso2: 'us' },
  ],
}

// Which groups play at each stadium (inverse of GROUP_STADIUMS)
export function getStadiumGroups(slug: string): string[] {
  return Object.entries(GROUP_STADIUMS)
    .filter(([, stadiums]) => stadiums.some(s => s.slug === slug))
    .map(([group]) => group)
    .sort()
}
