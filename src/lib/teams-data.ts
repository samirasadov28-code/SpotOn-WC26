export interface StaticTeam {
  name: string
  shortName: string
  fifaCode: string
  iso2: string
  groupLetter: string
  confederation: string
  flagEmoji: string
  blurb: string
  stars: string[]
}

export const STATIC_TEAMS: StaticTeam[] = [
  // Group A
  { name: 'Mexico', shortName: 'Mexico', fifaCode: 'MEX', iso2: 'mx', groupLetter: 'A', confederation: 'CONCACAF', flagEmoji: '🇲🇽', blurb: 'One of the most ever-present World Cup nations (17 previous finals) and host of the opening match at the iconic Estadio Azteca. Regional powerhouse, recent CONCACAF Gold Cup form.', stars: ['Santiago Giménez', 'Edson Álvarez', 'Hirving Lozano'] },
  { name: 'South Africa', shortName: 'S. Africa', fifaCode: 'RSA', iso2: 'za', groupLetter: 'A', confederation: 'CAF', flagEmoji: '🇿🇦', blurb: 'Back at the World Cup for the first time since hosting in 2010, and first time qualifying on merit since 2002. Took bronze at AFCON 2023 behind a superb goalkeeper.', stars: ['Ronwen Williams', 'Percy Tau', 'Lyle Foster'] },
  { name: 'South Korea', shortName: 'S. Korea', fifaCode: 'KOR', iso2: 'kr', groupLetter: 'A', confederation: 'AFC', flagEmoji: '🇰🇷', blurb: 'Remarkably consistent — qualified for an 11th consecutive World Cup, reached the Round of 16 in 2022. Talisman captain leads a strong European-based core.', stars: ['Son Heung-min', 'Lee Kang-in', 'Kim Min-jae'] },
  { name: 'Czechia', shortName: 'Czechia', fifaCode: 'CZE', iso2: 'cz', groupLetter: 'A', confederation: 'UEFA', flagEmoji: '🇨🇿', blurb: 'Back at the finals as an independent nation (rich Czechoslovak heritage, Euro 1996 runners-up). Physical, set-piece dangerous side.', stars: ['Patrik Schick', 'Tomáš Souček', 'Adam Hložek'] },
  // Group B
  { name: 'Canada', shortName: 'Canada', fifaCode: 'CAN', iso2: 'ca', groupLetter: 'B', confederation: 'CONCACAF', flagEmoji: '🇨🇦', blurb: 'Co-host on a rapid rise; stunned observers by reaching the semifinals of Copa América 2024 as guests. Pace and athleticism in abundance.', stars: ['Alphonso Davies', 'Jonathan David', 'Cyle Larin'] },
  { name: 'Bosnia & Herzegovina', shortName: 'Bosnia', fifaCode: 'BIH', iso2: 'ba', groupLetter: 'B', confederation: 'UEFA', flagEmoji: '🇧🇦', blurb: 'The team that knocked Italy out in the playoff final. Second World Cup (after 2014), built around an evergreen striker.', stars: ['Edin Džeko', 'Amar Dedić', 'Sead Kolašinac'] },
  { name: 'Qatar', shortName: 'Qatar', fifaCode: 'QAT', iso2: 'qa', groupLetter: 'B', confederation: 'AFC', flagEmoji: '🇶🇦', blurb: 'Reigning two-time AFC Asian Cup champions (2019, 2023); this time they qualified on merit rather than as 2022 hosts.', stars: ['Akram Afif', 'Almoez Ali'] },
  { name: 'Switzerland', shortName: 'Switzerland', fifaCode: 'SUI', iso2: 'ch', groupLetter: 'B', confederation: 'UEFA', flagEmoji: '🇨🇭', blurb: 'Tournament over-achievers — reached the Euro 2024 quarterfinals (eliminating Italy). Always hard to beat, regular knockout-stage presence.', stars: ['Granit Xhaka', 'Manuel Akanji', 'Breel Embolo'] },
  // Group C
  { name: 'Brazil', shortName: 'Brazil', fifaCode: 'BRA', iso2: 'br', groupLetter: 'C', confederation: 'CONMEBOL', flagEmoji: '🇧🇷', blurb: 'The only nation to appear at every World Cup, five-time champions, now under Carlo Ancelotti. Dazzling attacking talent but rebuilding after a quarterfinal exit at Copa América 2024.', stars: ['Vinícius Júnior', 'Rodrygo', 'Raphinha'] },
  { name: 'Morocco', shortName: 'Morocco', fifaCode: 'MAR', iso2: 'ma', groupLetter: 'C', confederation: 'CAF', flagEmoji: '🇲🇦', blurb: 'The story of 2022 — first African side to reach a World Cup semifinal. A genuinely elite, well-organized team, not a surprise package anymore.', stars: ['Achraf Hakimi', 'Brahim Díaz', 'Youssef En-Nesyri'] },
  { name: 'Haiti', shortName: 'Haiti', fifaCode: 'HAI', iso2: 'ht', groupLetter: 'C', confederation: 'CONCACAF', flagEmoji: '🇭🇹', blurb: 'A fairytale return to the World Cup for the first time since 1974 — a 52-year wait.', stars: ['Frantzdy Pierrot', 'Duckens Nazon'] },
  { name: 'Scotland', shortName: 'Scotland', fifaCode: 'SCO', iso2: 'gb-sct', groupLetter: 'C', confederation: 'UEFA', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', blurb: 'Back at a World Cup after a long absence (last in 1998), riding a strong Euro-qualifying era. Spirited, well-drilled.', stars: ['Andrew Robertson', 'Scott McTominay', 'John McGinn'] },
  // Group D
  { name: 'United States', shortName: 'USA', fifaCode: 'USA', iso2: 'us', groupLetter: 'D', confederation: 'CONCACAF', flagEmoji: '🇺🇸', blurb: 'Co-host with a talented golden generation playing across Europe\'s top leagues. Expectation is high on home soil.', stars: ['Christian Pulisic', 'Weston McKennie', 'Tyler Adams'] },
  { name: 'Paraguay', shortName: 'Paraguay', fifaCode: 'PAR', iso2: 'py', groupLetter: 'D', confederation: 'CONMEBOL', flagEmoji: '🇵🇾', blurb: 'Back at the World Cup for the first time since 2010; gritty, defensively stubborn South American side.', stars: ['Miguel Almirón', 'Gustavo Gómez', 'Antonio Sanabria'] },
  { name: 'Australia', shortName: 'Australia', fifaCode: 'AUS', iso2: 'au', groupLetter: 'D', confederation: 'AFC', flagEmoji: '🇦🇺', blurb: 'Reliable qualifiers (sixth straight World Cup) who reached the Round of 16 in 2022.', stars: ['Mat Ryan', 'Jackson Irvine'] },
  { name: 'Türkiye', shortName: 'Türkiye', fifaCode: 'TUR', iso2: 'tr', groupLetter: 'D', confederation: 'UEFA', flagEmoji: '🇹🇷', blurb: 'Back on the big stage with an exciting young core after reaching the Euro 2024 quarterfinals; first World Cup since their 2002 third-place run.', stars: ['Arda Güler', 'Hakan Çalhanoğlu', 'Kenan Yıldız'] },
  // Group E
  { name: 'Germany', shortName: 'Germany', fifaCode: 'GER', iso2: 'de', groupLetter: 'E', confederation: 'UEFA', flagEmoji: '🇩🇪', blurb: 'Four-time world champions chasing redemption after group-stage exits in 2018 and 2022; reached the Euro 2024 quarterfinals on home soil. A new generation leads.', stars: ['Jamal Musiala', 'Florian Wirtz', 'Joshua Kimmich'] },
  { name: 'Curaçao', shortName: 'Curaçao', fifaCode: 'CUW', iso2: 'cw', groupLetter: 'E', confederation: 'CONCACAF', flagEmoji: '🇨🇼', blurb: 'Debutants and the smallest nation by population ever to reach a World Cup (~150k people), guided by veteran coach Dick Advocaat. A historic underdog.', stars: ['Leandro Bacuna', 'Cuco Martina'] },
  { name: 'Ivory Coast', shortName: 'Ivory Coast', fifaCode: 'CIV', iso2: 'ci', groupLetter: 'E', confederation: 'CAF', flagEmoji: '🇨🇮', blurb: 'Reigning African champions — won AFCON 2023 dramatically on home soil. Powerful, talented squad.', stars: ['Simon Adingra', 'Sébastien Haller', 'Franck Kessié'] },
  { name: 'Ecuador', shortName: 'Ecuador', fifaCode: 'ECU', iso2: 'ec', groupLetter: 'E', confederation: 'CONMEBOL', flagEmoji: '🇪🇨', blurb: 'Strong, athletic qualifiers from a tough CONMEBOL campaign; impressive defensive record.', stars: ['Moisés Caicedo', 'Pervis Estupiñán', 'Enner Valencia'] },
  // Group F
  { name: 'Netherlands', shortName: 'Netherlands', fifaCode: 'NED', iso2: 'nl', groupLetter: 'F', confederation: 'UEFA', flagEmoji: '🇳🇱', blurb: 'Perennial contenders and Euro 2024 semifinalists; deep, balanced squad.', stars: ['Virgil van Dijk', 'Cody Gakpo', 'Frenkie de Jong', 'Xavi Simons'] },
  { name: 'Japan', shortName: 'Japan', fifaCode: 'JPN', iso2: 'jp', groupLetter: 'F', confederation: 'AFC', flagEmoji: '🇯🇵', blurb: 'Asia\'s standard-bearers — beat Germany and Spain in 2022 — and among the first teams to qualify for 2026. Fast, technical, fearless.', stars: ['Kaoru Mitoma', 'Takefusa Kubo', 'Wataru Endo'] },
  { name: 'Sweden', shortName: 'Sweden', fifaCode: 'SWE', iso2: 'se', groupLetter: 'F', confederation: 'UEFA', flagEmoji: '🇸🇪', blurb: 'Back after missing 2022, now powered by one of the most fearsome strike partnerships in Europe.', stars: ['Alexander Isak', 'Viktor Gyökeres', 'Dejan Kulusevski'] },
  { name: 'Tunisia', shortName: 'Tunisia', fifaCode: 'TUN', iso2: 'tn', groupLetter: 'F', confederation: 'CAF', flagEmoji: '🇹🇳', blurb: 'Regular World Cup participants with a disciplined, organized setup.', stars: ['Youssef Msakni', 'Aïssa Laïdouni'] },
  // Group G
  { name: 'Belgium', shortName: 'Belgium', fifaCode: 'BEL', iso2: 'be', groupLetter: 'G', confederation: 'UEFA', flagEmoji: '🇧🇪', blurb: 'The golden generation evolving into a new era but still loaded with match-winners.', stars: ['Kevin De Bruyne', 'Jérémy Doku', 'Romelu Lukaku'] },
  { name: 'Egypt', shortName: 'Egypt', fifaCode: 'EGY', iso2: 'eg', groupLetter: 'G', confederation: 'CAF', flagEmoji: '🇪🇬', blurb: 'Built around one of the world\'s best forwards and back at the World Cup for the first time since 2018.', stars: ['Mohamed Salah', 'Omar Marmoush'] },
  { name: 'Iran', shortName: 'Iran', fifaCode: 'IRN', iso2: 'ir', groupLetter: 'G', confederation: 'AFC', flagEmoji: '🇮🇷', blurb: 'Among Asia\'s most consistent qualifiers with a strong European-based spine.', stars: ['Mehdi Taremi', 'Sardar Azmoun', 'Alireza Jahanbakhsh'] },
  { name: 'New Zealand', shortName: 'New Zealand', fifaCode: 'NZL', iso2: 'nz', groupLetter: 'G', confederation: 'OFC', flagEmoji: '🇳🇿', blurb: 'Oceania\'s representatives, back at a third World Cup, led by a Premier League striker in form.', stars: ['Chris Wood'] },
  // Group H
  { name: 'Spain', shortName: 'Spain', fifaCode: 'ESP', iso2: 'es', groupLetter: 'H', confederation: 'UEFA', flagEmoji: '🇪🇸', blurb: 'Reigning European champions (Euro 2024) and arguably the world\'s most complete team; 2010 world champions.', stars: ['Lamine Yamal', 'Pedri', 'Rodri', 'Nico Williams'] },
  { name: 'Cape Verde', shortName: 'Cape Verde', fifaCode: 'CPV', iso2: 'cv', groupLetter: 'H', confederation: 'CAF', flagEmoji: '🇨🇻', blurb: 'Debutants and one of the smallest nations ever to qualify (~500k people) — the Blue Sharks are a genuine feel-good story.', stars: ['Ryan Mendes', 'Garry Rodrigues'] },
  { name: 'Saudi Arabia', shortName: 'Saudi Arabia', fifaCode: 'KSA', iso2: 'sa', groupLetter: 'H', confederation: 'AFC', flagEmoji: '🇸🇦', blurb: 'Famous for stunning Argentina in 2022; well-organized and dangerous on their day.', stars: ['Salem Al-Dawsari'] },
  { name: 'Uruguay', shortName: 'Uruguay', fifaCode: 'URU', iso2: 'uy', groupLetter: 'H', confederation: 'CONMEBOL', flagEmoji: '🇺🇾', blurb: 'Two-time world champions under Marcelo Bielsa, third at Copa América 2024 with an exciting young generation.', stars: ['Federico Valverde', 'Darwin Núñez', 'Ronald Araújo'] },
  // Group I
  { name: 'France', shortName: 'France', fifaCode: 'FRA', iso2: 'fr', groupLetter: 'I', confederation: 'UEFA', flagEmoji: '🇫🇷', blurb: '2018 champions, 2022 runners-up, Euro 2024 semifinalists — perennial favorites with arguably the deepest talent pool in the world.', stars: ['Kylian Mbappé', 'Aurélien Tchouaméni', 'Ousmane Dembélé'] },
  { name: 'Senegal', shortName: 'Senegal', fifaCode: 'SEN', iso2: 'sn', groupLetter: 'I', confederation: 'CAF', flagEmoji: '🇸🇳', blurb: 'African champions of 2021 and one of the continent\'s strongest, most physical sides.', stars: ['Sadio Mané', 'Nicolas Jackson', 'Pape Matar Sarr'] },
  { name: 'Iraq', shortName: 'Iraq', fifaCode: 'IRQ', iso2: 'iq', groupLetter: 'I', confederation: 'AFC', flagEmoji: '🇮🇶', blurb: 'A stirring return to the World Cup for the first time since 1986 — a 40-year wait.', stars: ['Aymen Hussein'] },
  { name: 'Norway', shortName: 'Norway', fifaCode: 'NOR', iso2: 'no', groupLetter: 'I', confederation: 'UEFA', flagEmoji: '🇳🇴', blurb: 'Back at the World Cup after a long absence (last 1998), and finally bringing two of the planet\'s biggest stars to the biggest stage.', stars: ['Erling Haaland', 'Martin Ødegaard'] },
  // Group J
  { name: 'Argentina', shortName: 'Argentina', fifaCode: 'ARG', iso2: 'ar', groupLetter: 'J', confederation: 'CONMEBOL', flagEmoji: '🇦🇷', blurb: 'Reigning world champions (2022) and back-to-back Copa América winners — in all likelihood Lionel Messi\'s last World Cup.', stars: ['Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez'] },
  { name: 'Algeria', shortName: 'Algeria', fifaCode: 'ALG', iso2: 'dz', groupLetter: 'J', confederation: 'CAF', flagEmoji: '🇩🇿', blurb: 'Former African champions (2019) with quality and pace; back at the finals after missing 2022.', stars: ['Riyad Mahrez', 'Ismaël Bennacer'] },
  { name: 'Austria', shortName: 'Austria', fifaCode: 'AUT', iso2: 'at', groupLetter: 'J', confederation: 'UEFA', flagEmoji: '🇦🇹', blurb: 'On the rise — topped a group containing France and the Netherlands at Euro 2024. Aggressive, high-pressing.', stars: ['David Alaba', 'Marcel Sabitzer', 'Konrad Laimer'] },
  { name: 'Jordan', shortName: 'Jordan', fifaCode: 'JOR', iso2: 'jo', groupLetter: 'J', confederation: 'AFC', flagEmoji: '🇯🇴', blurb: 'Debutants riding the momentum of a stunning run to the AFC Asian Cup 2023 final.', stars: ['Mousa Al-Tamari'] },
  // Group K
  { name: 'Portugal', shortName: 'Portugal', fifaCode: 'POR', iso2: 'pt', groupLetter: 'K', confederation: 'UEFA', flagEmoji: '🇵🇹', blurb: 'Loaded across every position and likely sending its all-time icon to a final World Cup, alongside a brilliant midfield generation.', stars: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Rafael Leão', 'Vitinha'] },
  { name: 'DR Congo', shortName: 'DR Congo', fifaCode: 'COD', iso2: 'cd', groupLetter: 'K', confederation: 'CAF', flagEmoji: '🇨🇩', blurb: 'Back at the World Cup for the first time since 1974 (as Zaire); reached the AFCON 2023 semifinals.', stars: ['Yoane Wissa', 'Chancel Mbemba'] },
  { name: 'Uzbekistan', shortName: 'Uzbekistan', fifaCode: 'UZB', iso2: 'uz', groupLetter: 'K', confederation: 'AFC', flagEmoji: '🇺🇿', blurb: 'Debutants — a long-awaited first World Cup for a nation with a strong youth pedigree.', stars: ['Eldor Shomurodov'] },
  { name: 'Colombia', shortName: 'Colombia', fifaCode: 'COL', iso2: 'co', groupLetter: 'K', confederation: 'CONMEBOL', flagEmoji: '🇨🇴', blurb: 'Runners-up at Copa América 2024 and one of the most in-form attacking sides in South America.', stars: ['Luis Díaz', 'James Rodríguez', 'Jhon Durán'] },
  // Group L
  { name: 'England', shortName: 'England', fifaCode: 'ENG', iso2: 'gb-eng', groupLetter: 'L', confederation: 'UEFA', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', blurb: 'Euro 2024 runners-up (and 2020 finalists) chasing a first major trophy since 1966 with a golden generation.', stars: ['Harry Kane', 'Jude Bellingham', 'Bukayo Saka', 'Phil Foden'] },
  { name: 'Croatia', shortName: 'Croatia', fifaCode: 'CRO', iso2: 'hr', groupLetter: 'L', confederation: 'UEFA', flagEmoji: '🇭🇷', blurb: 'Overachievers of the last decade — 2018 finalists, 2022 third place — still marshaled by a legendary midfield maestro.', stars: ['Luka Modrić', 'Joško Gvardiol', 'Mateo Kovačić'] },
  { name: 'Ghana', shortName: 'Ghana', fifaCode: 'GHA', iso2: 'gh', groupLetter: 'L', confederation: 'CAF', flagEmoji: '🇬🇭', blurb: 'The Black Stars return with an energetic, talented squad.', stars: ['Mohammed Kudus', 'Thomas Partey', 'Iñaki Williams'] },
  { name: 'Panama', shortName: 'Panama', fifaCode: 'PAN', iso2: 'pa', groupLetter: 'L', confederation: 'CONCACAF', flagEmoji: '🇵🇦', blurb: 'Second World Cup (after 2018) for a side that has become a real CONCACAF force.', stars: ['Adalberto Carrasquilla', 'José Fajardo'] },
]

export const GROUPS_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L']

export function teamsByGroup(letter: string) {
  return STATIC_TEAMS.filter(t => t.groupLetter === letter)
}

export function teamByCode(fifaCode: string) {
  return STATIC_TEAMS.find(t => t.fifaCode === fifaCode)
}
