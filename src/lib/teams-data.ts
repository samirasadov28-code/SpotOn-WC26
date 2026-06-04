export interface StaticTeam {
  name: string
  shortName: string
  fifaCode: string
  iso2: string
  groupLetter: string
  confederation: string
  flagEmoji: string
  blurb: string      // short teaser (used on group cards)
  history: string    // rich WC history paragraph
  stars: string[]
}

export const STATIC_TEAMS: StaticTeam[] = [
  // ── GROUP A ──
  {
    name: 'Mexico', shortName: 'Mexico', fifaCode: 'MEX', iso2: 'mx', groupLetter: 'A', confederation: 'CONCACAF', flagEmoji: '🇲🇽',
    blurb: 'Co-host and one of the most ever-present nations in World Cup history, opening the tournament at the iconic Estadio Azteca.',
    history: 'Mexico has appeared at 17 World Cups — the joint-most appearances outside Europe. They co-hosted in 1970 and 1986, when the Azteca witnessed Maradona\'s infamous "Hand of God" and "Goal of the Century." Their best run came in 1986 on home soil, reaching the quarterfinals before losing on penalties to West Germany. Known for a curse called the "Quinto Partido" (fifth game) — Mexico has been eliminated at the Round of 16 seven consecutive times (1994–2018), never making it to the quarterfinals in that stretch. Under a new generation led by Santiago Giménez and a fresh coaching setup, they carry the huge weight of a nation that expects more — especially on home soil in 2026.',
    stars: ['Santiago Giménez', 'Edson Álvarez', 'Hirving Lozano'],
  },
  {
    name: 'South Africa', shortName: 'S. Africa', fifaCode: 'RSA', iso2: 'za', groupLetter: 'A', confederation: 'CAF', flagEmoji: '🇿🇦',
    blurb: 'Back at the World Cup for the first time since they hosted in 2010 — qualifying on merit for the first time since 2002.',
    history: 'South Africa made history in 2010 as the first African nation to host the World Cup — a tournament remembered for vuvuzelas, Shakira\'s Waka Waka, and Uruguay\'s Suárez handball. The Bafana Bafana ("The Boys") qualified on merit previously only in 1998 and 2002, exiting in the group stage both times. Automatic host qualification in 2010 saw them become the first host nation to exit the group stage. After 16 years away, they return in 2026 having taken bronze at AFCON 2023, built on the heroics of goalkeeper Ronwen Williams who kept three consecutive clean sheets in the AFCON shootouts. A remarkable comeback story.',
    stars: ['Ronwen Williams', 'Percy Tau', 'Lyle Foster'],
  },
  {
    name: 'South Korea', shortName: 'S. Korea', fifaCode: 'KOR', iso2: 'kr', groupLetter: 'A', confederation: 'AFC', flagEmoji: '🇰🇷',
    blurb: 'Asia\'s most consistent qualifiers, at their 11th consecutive World Cup with Son Heung-min leading the charge.',
    history: 'South Korea are the most successful Asian nation in World Cup history. In 2002, as joint-hosts with Japan, they produced one of the greatest shocks in the tournament\'s history — eliminating Spain and Germany to reach the semifinals, where they fell to Germany. They finished fourth, a record for any Asian team. Since then they have qualified for every tournament, reaching the Round of 16 in 2010 (losing to Uruguay) and 2022. Son Heung-min, one of the world\'s elite forwards, captains a squad heavily based in Europe\'s top leagues. At 11 consecutive appearances, only Brazil, Germany, Argentina, Italy and Spain have a longer unbroken run.',
    stars: ['Son Heung-min', 'Lee Kang-in', 'Kim Min-jae'],
  },
  {
    name: 'Czechia', shortName: 'Czechia', fifaCode: 'CZE', iso2: 'cz', groupLetter: 'A', confederation: 'UEFA', flagEmoji: '🇨🇿',
    blurb: 'Inheritors of a great footballing tradition — Czechoslovakia were World Cup runners-up in 1934 and 1962.',
    history: 'Czechoslovakia were twice World Cup runners-up (1934, 1962) and produced one of the greatest individual goals in tournament history — Panenka\'s chipped penalty in the 1976 European Championship final, a technique now named after him. After the Velvet Divorce split the country in 1993, the Czech Republic (now Czechia) emerged as the stronger footballing nation — reaching the Euro 1996 final (losing to Germany\'s golden goal) and the Euro 2004 semifinals. At World Cup level they appeared in 2006, exiting in the group stage. This is their return to the big stage after a long absence, and a physical, set-piece-dangerous side could cause upsets.',
    stars: ['Patrik Schick', 'Tomáš Souček', 'Adam Hložek'],
  },

  // ── GROUP B ──
  {
    name: 'Canada', shortName: 'Canada', fifaCode: 'CAN', iso2: 'ca', groupLetter: 'B', confederation: 'CONCACAF', flagEmoji: '🇨🇦',
    blurb: 'Co-hosts on a dramatic rise — Copa América 2024 semifinalists with arguably the best generation of players in Canadian history.',
    history: 'Canada\'s sole previous World Cup appearance was in 1986, where they lost all three group games without scoring a goal. Fast forward 36 years: in 2022 they qualified for Qatar — their first appearance in 36 years — exiting in the group stage but showing genuine quality. The transformation accelerated when they shocked football by reaching the Copa América 2024 semifinals as invited guests, defeating Argentina\'s conqueror on the way. Alphonso Davies, playing at Bayern Munich, is one of the planet\'s most dangerous left-backs. As 2026 co-hosts, expectations have never been higher. This could be the moment Canada football arrives permanently.',
    stars: ['Alphonso Davies', 'Jonathan David', 'Cyle Larin'],
  },
  {
    name: 'Bosnia & Herzegovina', shortName: 'Bosnia', fifaCode: 'BIH', iso2: 'ba', groupLetter: 'B', confederation: 'UEFA', flagEmoji: '🇧🇦',
    blurb: 'The team that eliminated Italy in the European playoff — back for only their second World Cup.',
    history: 'Bosnia & Herzegovina\'s first World Cup appearance came in 2014 in Brazil — a debut laced with emotion for a country that suffered a devastating war in the 1990s. They reached the tournament with a squad built around Edin Džeko, one of the best strikers of his generation, who scored their first ever World Cup goal. They exited in the group stage but the occasion meant everything to a nation still healing. Now they return having done the almost unthinkable — knocking Italy out of European qualifying on penalties. Italy, a four-time world champion and 2020 European champion, missing three consecutive World Cups is the biggest shock in recent football history, and Bosnia put them out.',
    stars: ['Edin Džeko', 'Amar Dedić', 'Sead Kolašinac'],
  },
  {
    name: 'Qatar', shortName: 'Qatar', fifaCode: 'QAT', iso2: 'qa', groupLetter: 'B', confederation: 'AFC', flagEmoji: '🇶🇦',
    blurb: 'Two-time reigning AFC Asian Cup champions, this time earning their place through qualification rather than as hosts.',
    history: 'Qatar made their World Cup debut in 2022 as hosts — becoming the first host nation to be eliminated in the group stage, losing all three matches. That 2022 edition was the most controversial World Cup in history, surrounded by questions about the award of hosting rights, worker welfare, and the decision to hold it in November-December. But Qatar have since proven themselves on merit — winning the AFC Asian Cup in both 2019 and 2023, making them back-to-back continental champions. The 2023 triumph, on home soil in the final against Jordan, showed genuine quality. They qualified for 2026 through the AFC process. Akram Afif, their captain and talisman, is a Qatari success story.',
    stars: ['Akram Afif', 'Almoez Ali'],
  },
  {
    name: 'Switzerland', shortName: 'Switzerland', fifaCode: 'SUI', iso2: 'ch', groupLetter: 'B', confederation: 'UEFA', flagEmoji: '🇨🇭',
    blurb: 'The tournament\'s most reliable over-achievers — always hard to beat and regularly reaching the knockout stage.',
    history: 'Switzerland have appeared at 12 World Cups and are the definition of tournament resilience. They co-hosted in 1954, reaching the quarterfinals. Their modern golden era began in the 2000s — qualifying for every tournament since 2006 and consistently reaching the knockout rounds. In 2010 they stunned Spain (eventual champions) in the group stage. In 2022 they eliminated France in the round of 16 on penalties. At Euro 2024 they knocked out the holders Italy before falling to England in the quarterfinals. Their squad, built around Granit Xhaka\'s leadership and Manuel Akanji\'s defensive excellence, punches well above Switzerland\'s size.',
    stars: ['Granit Xhaka', 'Manuel Akanji', 'Breel Embolo'],
  },

  // ── GROUP C ──
  {
    name: 'Brazil', shortName: 'Brazil', fifaCode: 'BRA', iso2: 'br', groupLetter: 'C', confederation: 'CONMEBOL', flagEmoji: '🇧🇷',
    blurb: 'The only nation at every World Cup. Five-time champions. The greatest footballing nation on earth.',
    history: 'Brazil are the most successful World Cup nation in history — the only country to have appeared at all 22 editions, and five-time champions (1958, 1962, 1970, 1994, 2002). The 1970 side, featuring Pelé, is widely considered the greatest international team ever assembled. The 1982 team — Zico, Socrates, Falcao — is perhaps the most beloved never to win it. The 1994 triumph ended a 24-year drought. In 2002, Ronaldo recovered from a mysterious illness to top-score and fire Brazil to their fifth title. But since 2002, a fifth star has felt distant: quarter-final exits in 2006 and 2010, and the humiliation of 7-1 at home to Germany in 2014 — the Mineirazo — remains the most shocking result in Brazilian football history. They are desperate to recapture glory.',
    stars: ['Vinícius Júnior', 'Rodrygo', 'Raphinha'],
  },
  {
    name: 'Morocco', shortName: 'Morocco', fifaCode: 'MAR', iso2: 'ma', groupLetter: 'C', confederation: 'CAF', flagEmoji: '🇲🇦',
    blurb: 'Africa\'s finest — the first African nation to reach a World Cup semifinal, in 2022. No longer an underdog.',
    history: 'Morocco\'s 2022 World Cup campaign in Qatar was one of the greatest stories in football history. They defeated Belgium (world\'s 2nd ranked team), Spain (on penalties), and Portugal to become the first African — and first Arab — nation to reach a World Cup semifinal. They finished fourth. Their Atlas Lions were built on an unbeatable defensive unit (they conceded just one own goal in the whole tournament), incredible team spirit, and a passionate connection to their fans. Before 2022, Morocco had appeared at six World Cups since 1970 without advancing beyond the group stage since 1986 when they became the first African team to top a World Cup group. Now they arrive in 2026 as genuine contenders — no one will underestimate them.',
    stars: ['Achraf Hakimi', 'Brahim Díaz', 'Youssef En-Nesyri'],
  },
  {
    name: 'Haiti', shortName: 'Haiti', fifaCode: 'HAI', iso2: 'ht', groupLetter: 'C', confederation: 'CONCACAF', flagEmoji: '🇭🇹',
    blurb: 'A fairytale — back at the World Cup after 52 years away, representing one of the world\'s most resilient nations.',
    history: 'Haiti\'s sole previous World Cup was in 1974 in West Germany, where they memorably took the lead against Italy through Emmanuel Sanon — only the second goal Italy had conceded in World Cup history at that point. They lost 3-1 and exited in the group stage. Since then, Haiti has been plagued by political instability and devastating natural disasters — including the catastrophic 2010 earthquake. That this small, struggling nation has qualified for the 2026 World Cup is a story of extraordinary sporting resilience. Their qualification came through a tough CONCACAF process and was met with national celebrations. This is a team playing for much more than football.',
    stars: ['Frantzdy Pierrot', 'Duckens Nazon'],
  },
  {
    name: 'Scotland', shortName: 'Scotland', fifaCode: 'SCO', iso2: 'gb-sct', groupLetter: 'C', confederation: 'UEFA', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    blurb: 'Back at the World Cup after 28 years away — the Tartan Army finally has a golden generation to believe in.',
    history: 'Scotland holds the unfortunate record of being the most frequent World Cup qualifier to never advance beyond the group stage — they appeared eight times (1954, 1958, 1974, 1978, 1982, 1986, 1990, 1998) and exited at the group stage every single time, often through heartbreaking goal difference margins. They were famously eliminated in 1978 despite beating the Netherlands 3-2 — one of the tournament\'s great results. Their last appearance was in 1998 (France), a gap of 28 years before 2026. But this generation — Robertson, McTominay, McGinn — is genuinely different. McTominay is a game-changing force of nature. The Tartan Army, football\'s most beloved travelling support, will be there in numbers.',
    stars: ['Andrew Robertson', 'Scott McTominay', 'John McGinn'],
  },

  // ── GROUP D ──
  {
    name: 'United States', shortName: 'USA', fifaCode: 'USA', iso2: 'us', groupLetter: 'D', confederation: 'CONCACAF', flagEmoji: '🇺🇸',
    blurb: 'Co-hosts with perhaps the best generation of US players ever, desperate to prove football\'s place in American sport.',
    history: 'The USA has a surprisingly rich World Cup history. They finished third at the very first World Cup in 1930. They then shocked England 1-0 in 1950 — one of the biggest upsets in the tournament\'s history. After decades of absence, they returned in 1990 and co-hosted in 1994 (reaching the last 16). The 2002 squad was remarkable — beating Portugal and Mexico to reach the quarterfinals, their best modern result. They\'ve appeared at ten World Cups but missed the 2018 tournament after a humiliating qualifying loss to Trinidad and Tobago. In 2022 they returned, drawing with England and exiting in the round of 16 to the Netherlands. Now, as 2026 co-hosts, Christian Pulisic leads a squad of talented European-based players. The stakes have never been higher.',
    stars: ['Christian Pulisic', 'Weston McKennie', 'Tyler Adams'],
  },
  {
    name: 'Paraguay', shortName: 'Paraguay', fifaCode: 'PAR', iso2: 'py', groupLetter: 'D', confederation: 'CONMEBOL', flagEmoji: '🇵🇾',
    blurb: 'Back after 16 years away — a gritty, defensively disciplined South American side with a proud World Cup tradition.',
    history: 'Paraguay has punched far above its weight in World Cup history for such a small nation. They appeared at nine tournaments, with their peak in 2010 in South Africa — where they reached the quarterfinals for the first time, defeating Japan on penalties before losing to eventual champions Spain. Their trademark has always been defensive solidity and set-piece threat. In 1998 they made the last 16; in 2002, the last 16 again. They missed 2014 and 2018, and failed to qualify for 2022 on the final day in heartbreaking fashion. Now led by Miguel Almirón (Newcastle United), they return with a hardened squad determined to restore Paraguay\'s reputation as CONMEBOL\'s great dark horse.',
    stars: ['Miguel Almirón', 'Gustavo Gómez', 'Antonio Sanabria'],
  },
  {
    name: 'Australia', shortName: 'Australia', fifaCode: 'AUS', iso2: 'au', groupLetter: 'D', confederation: 'AFC', flagEmoji: '🇦🇺',
    blurb: 'The Socceroos at their sixth straight World Cup — 2022 gave Australia their best result in 17 years.',
    history: 'Australia\'s modern World Cup story began with their dramatic qualification in 2006, beating Uruguay on penalties in an intercontinental playoff. In Germany they reached the Round of 16 — their best result — losing narrowly to eventual champions Italy in a controversial penalty shootout. They missed 2010 and 2014 at group stage, then produced a remarkable 2022 campaign in Qatar: beating Denmark to reach the knockout stage, then falling to Argentina (eventual champions) in the Round of 16. The 2022 run, featuring a now-famous Socceroos emoji challenge with Harry Kane, brought football to the forefront of Australian sporting culture. Goalkeeper Mat Ryan\'s experience, accumulated over many years in the Premier League, anchors a determined squad.',
    stars: ['Mat Ryan', 'Jackson Irvine'],
  },
  {
    name: 'Türkiye', shortName: 'Türkiye', fifaCode: 'TUR', iso2: 'tr', groupLetter: 'D', confederation: 'UEFA', flagEmoji: '🇹🇷',
    blurb: 'Back on the biggest stage after their extraordinary 2002 third-place finish — led by one of Europe\'s brightest young stars.',
    history: 'Turkey\'s greatest moment came in 2002 in Japan/South Korea — a tournament that featured multiple shocks. Turkey defeated Senegal in the quarterfinals, then Japan (hosts) in the semifinals\' third-place match, finishing third overall. It remains Turkey\'s best World Cup result and is enshrined in national legend. Striker Hakan Şükür scored the fastest goal in World Cup history — 11 seconds against South Korea in the third-place match. After 2002, Turkey\'s World Cup journey stalled — they missed 2006, 2010, 2014, 2018, and 2022. Now a new generation has emerged: Arda Güler (Real Madrid), Hakan Çalhanoğlu (Inter Milan), and Kenan Yıldız (Juventus) form one of Europe\'s most exciting midfield trios. Euro 2024 showed the world what they can do.',
    stars: ['Arda Güler', 'Hakan Çalhanoğlu', 'Kenan Yıldız'],
  },

  // ── GROUP E ──
  {
    name: 'Germany', shortName: 'Germany', fifaCode: 'GER', iso2: 'de', groupLetter: 'E', confederation: 'UEFA', flagEmoji: '🇩🇪',
    blurb: 'Four-time world champions desperate to end a humiliating decade — Musiala and Wirtz lead a generational renewal.',
    history: 'Germany/West Germany is the second-most successful World Cup nation with four titles (1954, 1974, 1990, 2014) and four runner-up finishes. They have never missed a World Cup. West Germany\'s 1954 "Miracle of Bern" — beating the dominant Hungarian "Golden Team" in the final after losing 8-3 to them in the group stage — is considered the greatest upset in final history. The 2014 triumph in Brazil was complete with the 7-1 demolition of hosts Brazil — the Mineirazo — in the semifinal, and a 1-0 extra-time winner over Argentina in the final. But since then: group-stage exit in 2018 (as defending champions — the biggest shock in modern WC history), group-stage exit in 2022. Euro 2024 quarterfinal exit on home soil. A nation of football demands much more from this young squad.',
    stars: ['Jamal Musiala', 'Florian Wirtz', 'Joshua Kimmich'],
  },
  {
    name: 'Curaçao', shortName: 'Curaçao', fifaCode: 'CUW', iso2: 'cw', groupLetter: 'E', confederation: 'CONCACAF', flagEmoji: '🇨🇼',
    blurb: 'The smallest nation by population ever to reach a World Cup — a Caribbean island of 150,000 people making history.',
    history: 'Curaçao is a Dutch Caribbean island in the southern Caribbean Sea, a constituent country of the Kingdom of the Netherlands. With a population of approximately 150,000, they are the smallest nation by population ever to qualify for a World Cup. Previously known as the Netherlands Antilles, Curaçao became an independent FIFA member in 2010 after the Netherlands Antilles was dissolved. Their rapid rise through CONCACAF — reaching the Gold Cup quarterfinals — is one of football\'s most remarkable development stories. Their squad draws heavily on players born in the Netherlands (Dutch-Antillean heritage) who chose to represent the island. Veteran coach Dick Advocaat, who managed Russia, South Korea, and multiple top clubs, came out of retirement to guide them to this historic moment.',
    stars: ['Leandro Bacuna', 'Cuco Martina'],
  },
  {
    name: 'Ivory Coast', shortName: 'Ivory Coast', fifaCode: 'CIV', iso2: 'ci', groupLetter: 'E', confederation: 'CAF', flagEmoji: '🇨🇮',
    blurb: 'Reigning African champions, AFCON 2023 winners on home soil — a powerful, talented squad with genuine World Cup ambitions.',
    history: 'The Ivory Coast (Côte d\'Ivoire) rose to prominence in the mid-2000s with a golden generation led by Didier Drogba — possibly Africa\'s greatest ever player. They qualified for three consecutive World Cups (2006, 2010, 2014) but were brutally drawn into the "Group of Death" each time, exiting at the group stage twice and once in the round of 16 in 2014 (losing to Greece on a late winner). They missed 2018 and 2022 as that generation faded. But AFCON 2023, held on their own soil, produced a fairy-tale: coming from the brink of elimination in the group stage, they won every knockout game to claim the continental title in front of their own fans — a cathartic national moment. Now a new generation aims to finally replicate that Africa success on the global stage.',
    stars: ['Simon Adingra', 'Sébastien Haller', 'Franck Kessié'],
  },
  {
    name: 'Ecuador', shortName: 'Ecuador', fifaCode: 'ECU', iso2: 'ec', groupLetter: 'E', confederation: 'CONMEBOL', flagEmoji: '🇪🇨',
    blurb: 'A CONMEBOL force — qualified four times since 2002, reaching the round of 16 on their debut, and powered by one of Europe\'s best midfielders.',
    history: 'Ecuador have been the biggest improvers in South American football in the 21st century. Their first World Cup was 2002, and they immediately advanced from the group stage — a debut which announced their arrival. In 2006 they repeated that feat, reaching the last 16. They hosted Copa América in 1993 and have punched above their weight ever since. The 2022 World Cup in Qatar began with them as the opening game opponents — losing 2-0 to the hosts. They exited in the group stage, but their qualifying campaign across CONMEBOL (the toughest route in world football) was impressive. Moisés Caicedo, playing at Chelsea, is one of the world\'s best defensive midfielders. Ecuador\'s compact, athletic style and South American grit make them always dangerous.',
    stars: ['Moisés Caicedo', 'Pervis Estupiñán', 'Enner Valencia'],
  },

  // ── GROUP F ──
  {
    name: 'Netherlands', shortName: 'Netherlands', fifaCode: 'NED', iso2: 'nl', groupLetter: 'F', confederation: 'UEFA', flagEmoji: '🇳🇱',
    blurb: 'The great nearly-men of world football — three World Cup finals, zero wins — but a perennial force in every tournament.',
    history: 'No nation has reached more World Cup finals without winning one than the Netherlands — three finals (1974, 1978, 2010) and zero titles. The 1974 team, led by Johan Cruyff and playing "Total Football," is considered by many the greatest team never to win a World Cup — they lost the final to West Germany in Munich. Their 1978 runners-up finish came without Cruyff (who refused to travel citing political reasons). In 2010 in South Africa, they reached the final again, losing to Spain 1-0 in extra time in one of history\'s most controversial finals. In 2022 they reached the quarterfinals before losing to Argentina. Their current squad — van Dijk, Gakpo, De Jong, Simons — is deep and talented. The quest to finally claim that elusive first world title continues.',
    stars: ['Virgil van Dijk', 'Cody Gakpo', 'Frenkie de Jong', 'Xavi Simons'],
  },
  {
    name: 'Japan', shortName: 'Japan', fifaCode: 'JPN', iso2: 'jp', groupLetter: 'F', confederation: 'AFC', flagEmoji: '🇯🇵',
    blurb: 'Asia\'s biggest shock-givers — beat Germany and Spain in 2022, qualify first for 2026, and have Europe\'s top clubs to thank for their depth.',
    history: 'Japan have qualified for every World Cup since 1998 (seven consecutive tournaments) — a record of consistency that matches many European heavyweights. They co-hosted in 2002, reaching the round of 16. Their 2022 Qatar campaign was the stuff of legend: defeating both Germany and Spain in the group stage — two of the most shocking results in World Cup history — before falling to Croatia on penalties in the last 16. It announced Japan as genuine contenders rather than romantic upsets. Their squad, almost entirely based in Europe\'s top leagues (Bundesliga, Serie A, Premier League), reflects a generational leap in Japanese football. They were among the first teams to qualify for 2026, completing it with ease. Kaoru Mitoma (Brighton) and Takefusa Kubo (Real Sociedad) are elite-level players.',
    stars: ['Kaoru Mitoma', 'Takefusa Kubo', 'Wataru Endo'],
  },
  {
    name: 'Sweden', shortName: 'Sweden', fifaCode: 'SWE', iso2: 'se', groupLetter: 'F', confederation: 'UEFA', flagEmoji: '🇸🇪',
    blurb: 'Back after missing 2022 — powered by Alexander Isak and Viktor Gyökeres, perhaps the most feared striking duo in Europe right now.',
    history: 'Sweden are one of European football\'s most decorated nations with a rich World Cup history. They were runners-up in 1958, losing the final to Brazil (with a teenage Pelé) on home soil in Stockholm. They finished third in 1950 and 1994, the latter on US soil featuring the legendary Henrik Larsson-era squad. In 2018, without the retired Zlatan Ibrahimović (who sensationally came out of international retirement for their 2022 qualifying campaign), they reached the quarterfinals — beating Switzerland and Italy\'s qualifying group. They missed the 2022 tournament via a playoff, losing to Poland. Now Alexander Isak (Newcastle) and Viktor Gyökeres (Sporting CP — perhaps Europe\'s most in-form striker) give them a deadly attacking threat not seen since the Ibrahimović era.',
    stars: ['Alexander Isak', 'Viktor Gyökeres', 'Dejan Kulusevski'],
  },
  {
    name: 'Tunisia', shortName: 'Tunisia', fifaCode: 'TUN', iso2: 'tn', groupLetter: 'F', confederation: 'CAF', flagEmoji: '🇹🇳',
    blurb: 'Africa\'s most regular World Cup participants after Egypt and Nigeria — disciplined, organised, and always competitive.',
    history: 'Tunisia have qualified for six World Cups (1978, 1998, 2002, 2006, 2018, 2022) — the most of any African nation after Egypt\'s seven. In 1978 they became the first African team to win a World Cup match (3-1 vs Mexico). They have never advanced beyond the group stage but have always been competitive, often running giants close. In 2022 they memorably beat France (resting players ahead of the knockout rounds) 1-0 in their final group game — an emotional victory but one that came too late. The Carthage Eagles are typically well-organised and defensively solid, with individual quality in attacking areas through players like Youssef Msakni, whose career has spanned several World Cup campaigns.',
    stars: ['Youssef Msakni', 'Aïssa Laïdouni'],
  },

  // ── GROUP G ──
  {
    name: 'Belgium', shortName: 'Belgium', fifaCode: 'BEL', iso2: 'be', groupLetter: 'G', confederation: 'UEFA', flagEmoji: '🇧🇪',
    blurb: 'The golden generation\'s twilight — De Bruyne, Lukaku and Doku lead a side that peaked at third in 2018 and desperately wants a title.',
    history: 'Belgium\'s "golden generation" — built around De Bruyne, Lukaku, Hazard, and others who all emerged around 2010–2015 — was ranked World Number 1 by FIFA for a record 1,000+ days. Their peak came at the 2018 World Cup in Russia: they defeated Brazil and England to claim third place — their best result ever. In 2022 they exited in the group stage, ending one of the most hyped generations without a title. The core players have aged but De Bruyne (Manchester City) and Lukaku remain world-class. A new generation is emerging alongside them. Belgium has been a World Cup regular since 1986 (eight consecutive appearances), with their previous best being fourth in 1986. The pressure to finally win something before this golden era fully ends is immense.',
    stars: ['Kevin De Bruyne', 'Jérémy Doku', 'Romelu Lukaku'],
  },
  {
    name: 'Egypt', shortName: 'Egypt', fifaCode: 'EGY', iso2: 'eg', groupLetter: 'G', confederation: 'CAF', flagEmoji: '🇪🇬',
    blurb: 'Mohamed Salah finally gets his World Cup moment — Egypt\'s most successful footballer leads them back to the biggest stage.',
    history: 'Egypt hold the record as Africa\'s most frequent World Cup participants with nine appearances — though six came in the first four editions (1930–1960). Their most recent run before 2026 was in 2018 in Russia, where Mohamed Salah played through a shoulder injury sustained in the Champions League final days earlier. Egypt lost all three games, and Salah — widely considered one of the world\'s best players — was left without a World Cup goal. He retired from international football briefly before returning. Now 34, this is almost certainly his last World Cup — a chance to finally perform on football\'s biggest stage. With teammate Omar Marmoush (one of 2024-25\'s most prolific scorers in European football), Egypt carry genuine attacking threat.',
    stars: ['Mohamed Salah', 'Omar Marmoush'],
  },
  {
    name: 'Iran', shortName: 'Iran', fifaCode: 'IRN', iso2: 'ir', groupLetter: 'G', confederation: 'AFC', flagEmoji: '🇮🇷',
    blurb: 'Asia\'s most consistent qualifiers alongside Japan — always tough to break down, with European-based quality throughout.',
    history: 'Iran have qualified for every World Cup since 1998 (2002, 2006, 2014, 2018, 2022) plus 1978 — six appearances in total. Their most famous moment came in 1998 when they beat the United States 2-1 in a politically charged match in France — still the most watched sporting event in Iranian history, with tens of millions celebrating in the streets of Tehran. In 2022 they were embroiled in controversy when their players refused to sing the national anthem in solidarity with protests back home — a courageous and historic political act. They advanced from the group stage before falling to the USA. Mehdi Taremi (Inter Milan) is a world-class striker whose composure and technical ability is at the highest level.',
    stars: ['Mehdi Taremi', 'Sardar Azmoun', 'Alireza Jahanbakhsh'],
  },
  {
    name: 'New Zealand', shortName: 'New Zealand', fifaCode: 'NZL', iso2: 'nz', groupLetter: 'G', confederation: 'OFC', flagEmoji: '🇳🇿',
    blurb: 'Oceania\'s representatives — the All Whites are back for a third World Cup, led by Premier League striker Chris Wood.',
    history: 'New Zealand have appeared at the World Cup twice before — 1982 and 2010. In 2010 in South Africa they produced one of the tournament\'s great stories: drawing all three group games (against Slovakia, Italy, and Paraguay) to become the only unbeaten team not to advance from the group stage. That 1-1 draw with Italy — the defending champions — was extraordinary. Chris Wood, now one of the Premier League\'s most reliable goalscorers, is their captain and talisman. Their path through OFC (Oceania) qualification is less competitive than other confederations, but they have proven capable of troubling bigger nations. In a group with Belgium, Egypt, and Iran, every point will feel like a victory.',
    stars: ['Chris Wood'],
  },

  // ── GROUP H ──
  {
    name: 'Spain', shortName: 'Spain', fifaCode: 'ESP', iso2: 'es', groupLetter: 'H', confederation: 'UEFA', flagEmoji: '🇪🇸',
    blurb: 'Reigning European champions and arguably the world\'s most complete team — 2010 world champions hunting a second star.',
    history: 'Spain\'s golden era in world football is unmatched in recent history: they won three consecutive major tournaments — Euro 2008, World Cup 2010, Euro 2012 — an unprecedented treble. The 2010 World Cup triumph in South Africa, with Iniesta\'s extra-time winner in the final against the Netherlands, was the culmination of a decade of "tiki-taka" perfection built around Xavi, Iniesta, and the Barcelona philosophy. After a dip (group stage exit in 2014 as holders), they reached the last 16 in 2018 and the quarterfinals in 2022. Euro 2024, won in Germany, showed a new Spain built around the extraordinary 16-year-old Lamine Yamal — possibly the most talented teenager in football history — and the controlling genius of Rodri. They arrive in 2026 as many experts\' favourites.',
    stars: ['Lamine Yamal', 'Pedri', 'Rodri', 'Nico Williams'],
  },
  {
    name: 'Cape Verde', shortName: 'Cape Verde', fifaCode: 'CPV', iso2: 'cv', groupLetter: 'H', confederation: 'CAF', flagEmoji: '🇨🇻',
    blurb: 'Debutants and one of the smallest nations ever to qualify — the Blue Sharks of the Atlantic Ocean make history.',
    history: 'Cape Verde is an archipelago of ten volcanic islands in the central Atlantic Ocean, with a population of approximately 560,000. Their football rise is extraordinary: they only joined FIFA in 1986 and made their African Cup of Nations debut in 2013. They\'ve since appeared at AFCON 2015, 2021, and 2023, reaching the quarterfinals in 2021. Their squad is built heavily on diaspora players — Portuguese-Cape Verdean footballers who have chosen to represent the island nation over Portugal. Key players have played in Portugal\'s Primeira Liga, Spanish Segunda División, and French Ligue 2. Their qualification for WC2026 sent the islands into celebrations not seen since independence in 1975. The Blue Sharks swim with the big fish for the first time.',
    stars: ['Ryan Mendes', 'Garry Rodrigues'],
  },
  {
    name: 'Saudi Arabia', shortName: 'Saudi Arabia', fifaCode: 'KSA', iso2: 'sa', groupLetter: 'H', confederation: 'AFC', flagEmoji: '🇸🇦',
    blurb: 'Famous for stunning Argentina in 2022 — the Green Falcons have appeared at six World Cups with solid knockout round pedigree.',
    history: 'Saudi Arabia\'s World Cup history began in 1994 in the USA — a debut they celebrated by reaching the round of 16. That first tournament featured Saeed Al-Owairan\'s stunning solo goal against Belgium — one of the greatest World Cup goals ever scored, a 60-yard run past five defenders. They appeared in 1998 and 2002 but lost their way in the 2010s. Their return to the world stage was 2018, then 2022 in Qatar — where they produced the biggest result of the 2022 tournament: defeating Argentina 2-1 from 1-0 down at half-time, as Messi and company missed chance after chance. The dressing room celebrations were broadcast worldwide, and Saudi national holiday was declared. The Green Falcons now aim to show that result was not a fluke.',
    stars: ['Salem Al-Dawsari'],
  },
  {
    name: 'Uruguay', shortName: 'Uruguay', fifaCode: 'URU', iso2: 'uy', groupLetter: 'H', confederation: 'CONMEBOL', flagEmoji: '🇺🇾',
    blurb: 'Two-time world champions with football far beyond their size — now under Marcelo Bielsa with a brilliant new generation.',
    history: 'Uruguay are the original world champions — they won the first ever World Cup in 1930 on home soil, defeating Argentina in the final in Montevideo. They won again in 1950 in one of the most famous results in football history: the "Maracanazo" — defeating Brazil 2-1 in the final game of the tournament, in Rio\'s Maracanã stadium with 200,000 people in attendance, most of them Brazilian. Brazil\'s defeat was so catastrophic that the Uruguayan scorer Alcides Ghiggia famously said: "Only three people have, with just one move, silenced the Maracanã: the Pope, Frank Sinatra, and me." Uruguay finished fourth in 1954 and 1970. In 2010 they reached the semifinals through Luis Suárez\'s controversial handball on the line. Now Fede Valverde and Darwin Núñez carry a proud two-star nation.',
    stars: ['Federico Valverde', 'Darwin Núñez', 'Ronald Araújo'],
  },

  // ── GROUP I ──
  {
    name: 'France', shortName: 'France', fifaCode: 'FRA', iso2: 'fr', groupLetter: 'I', confederation: 'UEFA', flagEmoji: '🇫🇷',
    blurb: '2018 world champions, 2022 runners-up — the deepest talent pool in world football, led by the unstoppable Kylian Mbappé.',
    history: 'France have won the World Cup twice — 1998 on home soil with Zinedine Zidane heading in two goals in the final against Brazil, and 2018 in Russia with a young Mbappé announcing himself to the world at just 19 (the first teenager to score in a World Cup final since Pelé in 1958). In between, they finished fourth in 2014 and were runners-up in 2022, losing a breathtaking final to Argentina 3-3 after extra time, then on penalties — Mbappé scored a hat-trick including two goals in the last ten minutes of normal time, one of the greatest individual final performances ever. France have never failed to reach at least the quarterfinals when they\'ve qualified since 1998. They arrive in 2026 as the most feared team on the planet.',
    stars: ['Kylian Mbappé', 'Aurélien Tchouaméni', 'Ousmane Dembélé'],
  },
  {
    name: 'Senegal', shortName: 'Senegal', fifaCode: 'SEN', iso2: 'sn', groupLetter: 'I', confederation: 'CAF', flagEmoji: '🇸🇳',
    blurb: 'Reigning African champions and one of the continent\'s strongest sides — Sadio Mané leads a physical, talented squad.',
    history: 'Senegal\'s World Cup debut in 2002 in Japan/Korea is the stuff of legend. In their first ever game, they defeated France — the reigning world and European champions — 1-0 in one of the biggest shocks in tournament history. They went on to reach the quarterfinals (the second African nation to do so after Cameroon in 1990), losing to Turkey. The hero was El-Hadji Diouf. They then missed the next three World Cups. In 2022 they lost to England in the round of 16 despite having Sadio Mané — the 2022 African Footballer of the Year — limited by injury. They have since won AFCON 2021 and are Africa\'s most feared team entering 2026. Sadio Mané, now at an older age but still a dangerous player, leads a squad that includes Nicolas Jackson (Chelsea) among an exceptionally talented generation.',
    stars: ['Sadio Mané', 'Nicolas Jackson', 'Pape Matar Sarr'],
  },
  {
    name: 'Iraq', shortName: 'Iraq', fifaCode: 'IRQ', iso2: 'iq', groupLetter: 'I', confederation: 'AFC', flagEmoji: '🇮🇶',
    blurb: 'Back at the World Cup after 40 years — one of football\'s most emotional stories of resilience and renewal.',
    history: 'Iraq\'s sole previous World Cup appearance was in 1986 in Mexico — where they lost all three group games. The country then descended into the Gulf Wars, international sanctions, and the devastating 2003 invasion, which completely disrupted football infrastructure. Their 2007 Asia Cup triumph — won against Saudi Arabia with a nation torn by civil war — was one of sport\'s most extraordinary moments. Thousands poured into the streets of Baghdad in celebration during some of the war\'s most violent months. Now, 40 years after their only World Cup appearance, they have qualified again. This is not just football — it\'s a statement about a nation\'s recovery. Every minute Iraq plays in 2026 will be celebrated by millions.',
    stars: ['Aymen Hussein'],
  },
  {
    name: 'Norway', shortName: 'Norway', fifaCode: 'NOR', iso2: 'no', groupLetter: 'I', confederation: 'UEFA', flagEmoji: '🇳🇴',
    blurb: 'Back after 28 years away — finally, Erling Haaland and Martin Ødegaard get to grace the World Cup stage together.',
    history: 'Norway\'s last World Cup was in 1998 in France — where they beat Brazil 2-1 in the group stage and advanced to the round of 16 before losing to Italy. Before that, they appeared in 1994. Norwegian football produced Ole Gunnar Solskjær, Tore André Flo, and Peter Schmeichel\'s son Kasper for Denmark. But Norway\'s most painful recent story is this: they have had the world\'s best player (Erling Haaland, Premier League record scorer, Champions League winner) and arguably England\'s best playmaker (Martin Ødegaard, Arsenal captain) at the same time — yet repeatedly failed to qualify. After agonising near-misses, they have finally made it to 2026. A nation starved of World Cup football for 28 years gets to watch Haaland — arguably the most clinical finisher alive — finally play at a World Cup. The anticipation is enormous.',
    stars: ['Erling Haaland', 'Martin Ødegaard'],
  },

  // ── GROUP J ──
  {
    name: 'Argentina', shortName: 'Argentina', fifaCode: 'ARG', iso2: 'ar', groupLetter: 'J', confederation: 'CONMEBOL', flagEmoji: '🇦🇷',
    blurb: 'Reigning world champions. Lionel Messi in his final World Cup. The weight of two stars and one legend.',
    history: 'Argentina have won the World Cup three times (1978, 1986, 2022) and have a rich, turbulent history. In 1978 they won it on home soil under controversial circumstances. In 1986, Diego Maradona single-handedly carried them to the title — scoring the "Hand of God" goal and the "Goal of the Century" in the same quarterfinal against England, then inspiring them to the final. Maradona is widely considered the greatest World Cup performance by an individual in any tournament. After Maradona, Messi — considered his equal as the greatest player in history — joined a generation of near-misses: runners-up in 2014 (lost to Germany in extra time), quarter-finals in 2010 and 2018. Then 2022: the greatest World Cup final in history, Argentina defeating France 4-2 on penalties after a 3-3 draw. Messi, in his fifth and final World Cup, finally claimed the one prize that had eluded him. In 2026, at 38, he plays one more time.',
    stars: ['Lionel Messi', 'Lautaro Martínez', 'Julián Álvarez'],
  },
  {
    name: 'Algeria', shortName: 'Algeria', fifaCode: 'ALG', iso2: 'dz', groupLetter: 'J', confederation: 'CAF', flagEmoji: '🇩🇿',
    blurb: 'Former African champions back after missing 2022 — Riyad Mahrez captains a talented side hungry to recapture 2014 magic.',
    history: 'Algeria\'s finest World Cup moment came in 2014 in Brazil — a stunning run to the round of 16 where they pushed eventual champions Germany to extra time, losing 2-1 in a pulsating match. That squad, led by Sofiane Feghouli and Riyad Mahrez, announced Algeria as a major African force. They were AFCON champions in 2019, with Mahrez — at Manchester City — at his peak. They missed 2022 in controversial circumstances (an alleged VAR error in a playoff against Cameroon denied them qualification). The pain of that near-miss has fuelled their return. Ismaël Bennacer (Milan) in midfield is one of Europe\'s best. Algeria vs France in Group I is a fixture with enormous political and historical significance given Algeria\'s colonial history with France.',
    stars: ['Riyad Mahrez', 'Ismaël Bennacer'],
  },
  {
    name: 'Austria', shortName: 'Austria', fifaCode: 'AUT', iso2: 'at', groupLetter: 'J', confederation: 'UEFA', flagEmoji: '🇦🇹',
    blurb: 'On the rise — topped a Euro 2024 group containing France and the Netherlands, with an aggressive pressing identity.',
    history: 'Austria have a surprising World Cup pedigree from the early era — they finished third in 1954 in Switzerland and are one of the original European powers. From the 1960s to 1990s they qualified regularly (1958, 1978, 1982, 1990, 1998) with moderate success. After 1998 they went through a long fallow period, missing multiple tournaments. Their modern revival is real: at Euro 2024 in Germany they won their group — finishing above France and the Netherlands. David Alaba, despite a serious knee injury, remains their leader; Marcel Sabitzer (Manchester United/Dortmund) is a powerhouse; Konrad Laimer (Bayern Munich) brings elite energy. This is Austria\'s best generation in decades, and a first World Cup in 28 years. They are one of the tournament\'s most intriguing teams.',
    stars: ['David Alaba', 'Marcel Sabitzer', 'Konrad Laimer'],
  },
  {
    name: 'Jordan', shortName: 'Jordan', fifaCode: 'JOR', iso2: 'jo', groupLetter: 'J', confederation: 'AFC', flagEmoji: '🇯🇴',
    blurb: 'Debutants — Jordan\'s first ever World Cup, earned through a remarkable AFC Asian Cup 2023 final appearance.',
    history: 'Jordan making their World Cup debut in 2026 is a first in the nation\'s sporting history. The Nashama (those who long for something) have historically been a lower-tier AFC nation, but recent years have seen dramatic improvement. Their 2023 AFC Asian Cup campaign was extraordinary: defeating Tajikistan, Bahrain, and Iraq to reach the final — where they faced hosts Qatar — losing 3-1. It was Jordan\'s best ever result in any major tournament. The AFC qualification for 2026, with an expanded 8-team playoff, gave Jordan their chance. Mousa Al-Tamari, playing in Belgium, is their standout talent. For a country at the crossroads of one of the world\'s most turbulent regions, this World Cup appearance carries deep meaning beyond sport.',
    stars: ['Mousa Al-Tamari'],
  },

  // ── GROUP K ──
  {
    name: 'Portugal', shortName: 'Portugal', fifaCode: 'POR', iso2: 'pt', groupLetter: 'K', confederation: 'UEFA', flagEmoji: '🇵🇹',
    blurb: 'One of the world\'s most talented squads — Cristiano Ronaldo\'s farewell tournament alongside a brilliant new generation.',
    history: 'Portugal\'s World Cup history is centred on two men: Eusébio and Cristiano Ronaldo. In 1966, the Mozambican-born Eusébio led Portugal to third place — their best ever result — as top scorer with nine goals. Then a 40-year gap before they returned to prominence. In 2006, a team including a young Ronaldo finished fourth. In 2022, Ronaldo — at what many thought would be his last World Cup — was controversially dropped to the bench by coach Fernando Santos after a bust-up, and Portugal were eliminated by Morocco in the quarterfinals. Now Ronaldo is 41 — playing in Saudi Arabia but still the most capped international player in history (200+ caps). He has publicly stated his desire to play in 2026. Alongside Bruno Fernandes, Rafael Leão and Vitinha, Portugal have enormous talent beyond any one player.',
    stars: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Rafael Leão', 'Vitinha'],
  },
  {
    name: 'DR Congo', shortName: 'DR Congo', fifaCode: 'COD', iso2: 'cd', groupLetter: 'K', confederation: 'CAF', flagEmoji: '🇨🇩',
    blurb: 'Back at the World Cup for the first time since 1974 (as Zaire) — an extraordinary footballing nation returning to its rightful place.',
    history: 'DR Congo\'s only previous World Cup appearance was in 1974 in West Germany, when they competed as Zaire — the first sub-Saharan African team at a World Cup. Their participation ended in infamy when Mwepu Ilunga famously ran from the wall and kicked the ball away during a Brazilian free-kick, reportedly fearing another heavy defeat after already losing 9-0 to Yugoslavia. The story behind that moment, only fully revealed decades later, was heartbreaking — the regime of dictator Mobutu had threatened the players if they lost by more than three goals. Since the country\'s renaming to DR Congo, they have been AFCON regulars, reaching the 2015 and 2023 semifinals. Yoane Wissa (Brentford) and Chancel Mbemba are players of genuine quality.',
    stars: ['Yoane Wissa', 'Chancel Mbemba'],
  },
  {
    name: 'Uzbekistan', shortName: 'Uzbekistan', fifaCode: 'UZB', iso2: 'uz', groupLetter: 'K', confederation: 'AFC', flagEmoji: '🇺🇿',
    blurb: 'Debutants — Central Asia\'s great footballing power makes its World Cup debut after decades of development.',
    history: 'Uzbekistan is the most populous of the Central Asian nations (36 million people) and has long had a vibrant football culture — they\'ve produced dozens of players who have played in Russia, South Korea, and European leagues. But as part of the Soviet Union until 1991, they competed under the USSR banner and have had to build a footballing identity from scratch. They\'ve been regular AFC Asian Cup participants since 1994, reaching the quarterfinals multiple times. Their youth development has produced the best generation in Uzbek history: Eldor Shomurodov (Roma), who has played in Serie A, is their star. The expansion of the World Cup to 48 teams gave a nation with serious footballing quality the chance they always deserved. Their debut in 2026 will be a moment of enormous national pride.',
    stars: ['Eldor Shomurodov'],
  },
  {
    name: 'Colombia', shortName: 'Colombia', fifaCode: 'COL', iso2: 'co', groupLetter: 'K', confederation: 'CONMEBOL', flagEmoji: '🇨🇴',
    blurb: 'Copa América 2024 runners-up and one of the most in-form South American sides — James Rodríguez still pulling strings.',
    history: 'Colombia\'s golden era in football is associated with Carlos Valderrama\'s flowing blond hair, Faustino Asprilla\'s brilliance, and the tragic story of Andrés Escobar — murdered after scoring an own goal in the 1994 World Cup. That 1994 squad had been tipped to win the tournament; their first-round elimination shocked the world. Colombia bounced back: in 2014 in Brazil they had their best ever campaign — James Rodríguez won the Golden Boot with six goals (including a stunning volley against Uruguay that won FIFA\'s Goal of the Tournament), and they reached the quarterfinals. In 2018 they lost to England on penalties. In 2022 they failed to qualify. At Copa América 2024 they reached the final unbeaten through the group stage and knockouts, losing to Argentina 1-0. Luis Díaz (Liverpool) and Jhon Durán (Aston Villa) are world-class.',
    stars: ['Luis Díaz', 'James Rodríguez', 'Jhon Durán'],
  },

  // ── GROUP L ──
  {
    name: 'England', shortName: 'England', fifaCode: 'ENG', iso2: 'gb-eng', groupLetter: 'L', confederation: 'UEFA', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    blurb: '60 years without a major trophy. Euro 2024 runners-up. Harry Kane, Bellingham, Saka and Foden — the golden generation that must deliver.',
    history: 'England invented the game, but have won the World Cup only once — on home soil in 1966. Bobby Moore lifted the Jules Rimet trophy at Wembley after a 4-2 final win over West Germany, Geoff Hurst\'s hat-trick the stuff of legend. Since then: quarterfinal exits galore (1986 — "Hand of God"; 1990 — Gazza\'s tears; 2002, 2006 — penalty heartbreak; 2018 — semifinal!). England\'s relationship with penalties is the sport\'s most tragicomic soap opera — they missed in 1990, 1996, 1998, 2004, 2006, and 2021. In 2018 under Gareth Southgate they reached the semifinals (losing to Croatia). At Euro 2020 (played 2021) and Euro 2024 they were runners-up, losing both finals — the latter to Spain. This squad — Kane, Bellingham, Saka, Foden — may be the best since 1966. The pressure of 60 years without a title is immense.',
    stars: ['Harry Kane', 'Jude Bellingham', 'Bukayo Saka', 'Phil Foden'],
  },
  {
    name: 'Croatia', shortName: 'Croatia', fifaCode: 'CRO', iso2: 'hr', groupLetter: 'L', confederation: 'UEFA', flagEmoji: '🇭🇷',
    blurb: 'Extraordinary overachievers — 2018 finalists, 2022 third place, marshalled by the ageless genius of Luka Modrić.',
    history: 'Croatia are perhaps the greatest footballing story of the post-Yugoslavia era. A nation of 4 million people, independent only since 1991, they reached the World Cup final in 1998 at just their second appearance — losing to hosts France 2-1. In 2018 in Russia they went one better: reaching the final (losing to France 4-2) through a series of comeback victories — defeating Denmark, Russia, and England from behind or through extra time. Luka Modrić, who won the Golden Ball as best player, delivered one of football\'s greatest individual tournament performances. In 2022 they finished third again. Modrić is now 40 but has shown no signs of declining; his influence on the game is incalculable. This may be his last World Cup — and Croatian football\'s last hurrah before a transition to a new generation.',
    stars: ['Luka Modrić', 'Joško Gvardiol', 'Mateo Kovačić'],
  },
  {
    name: 'Ghana', shortName: 'Ghana', fifaCode: 'GHA', iso2: 'gh', groupLetter: 'L', confederation: 'CAF', flagEmoji: '🇬🇭',
    blurb: 'The Black Stars — Africa\'s nearly-men of the World Cup, still haunted by Suárez\'s handball, hungry to recapture 2010 magic.',
    history: 'Ghana became the third African nation to reach a World Cup quarterfinal in 2010 in South Africa — and came agonisingly close to the semifinals. In the last minute of extra time against Uruguay, Luis Suárez deliberately handled the ball on the line to deny a goal; he was sent off, but Asamoah Gyan blazed the resulting penalty over the bar. Uruguay won on penalties. It remains one of the most controversial moments in World Cup history. Ghana had also impressed in 2006, reaching the round of 16. They exited in the group stage in 2022 despite beating South Korea. Mohammed Kudus (West Ham) is a hugely exciting talent; Thomas Partey brings Premier League experience; Iñaki Williams (Athletic Bilbao) — born in Spain of Ghanaian parents — chose to represent Ghana after representing Spain at youth level.',
    stars: ['Mohammed Kudus', 'Thomas Partey', 'Iñaki Williams'],
  },
  {
    name: 'Panama', shortName: 'Panama', fifaCode: 'PAN', iso2: 'pa', groupLetter: 'L', confederation: 'CONCACAF', flagEmoji: '🇵🇦',
    blurb: 'Only their second World Cup — a real CONCACAF force growing into a consistent qualifier on the world stage.',
    history: 'Panama\'s first World Cup appearance was in 2018 in Russia — a historic moment for a small Central American nation of 4 million. Their debut included a 6-1 defeat to England (Felipe Baloy scored late, becoming a national hero regardless) and heavy losses, but the qualification itself was celebrated as a national triumph. They have since become one of CONCACAF\'s most consistent performers — winning the CONCACAF Nations League and reaching the Copa América as invited guests. Their strength comes from a highly organised defensive unit and fierce team spirit. Panama play in the same group as England — a rematch of that 2018 meeting. They are no longer coming just to participate; they understand how to compete in the modern CONCACAF.',
    stars: ['Adalberto Carrasquilla', 'José Fajardo'],
  },
]

export const GROUPS_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L']

export function teamsByGroup(letter: string) {
  return STATIC_TEAMS.filter(t => t.groupLetter === letter)
}

export function teamByCode(fifaCode: string) {
  return STATIC_TEAMS.find(t => t.fifaCode === fifaCode)
}
