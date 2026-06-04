-- Seed: Teams (48 teams, 12 groups A-L)
INSERT INTO teams (name, fifa_code, group_letter, flag_emoji, confederation, blurb, stars) VALUES
-- Group A
('Mexico', 'MEX', 'A', '🇲🇽', 'CONCACAF', 'One of the most ever-present World Cup nations (17 previous finals) and host of the opening match at the iconic Estadio Azteca.', ARRAY['Santiago Giménez','Edson Álvarez','Hirving Lozano']),
('South Africa', 'RSA', 'A', '🇿🇦', 'CAF', 'Back at the World Cup for the first time since hosting in 2010. Took bronze at AFCON 2023 behind a superb goalkeeper.', ARRAY['Ronwen Williams','Percy Tau','Lyle Foster']),
('South Korea', 'KOR', 'A', '🇰🇷', 'AFC', 'Remarkably consistent — qualified for an 11th consecutive World Cup. Talisman captain leads a strong European-based core.', ARRAY['Son Heung-min','Lee Kang-in','Kim Min-jae']),
('Czechia', 'CZE', 'A', '🇨🇿', 'UEFA', 'Back at the finals as an independent nation (rich Czechoslovak heritage, Euro 1996 runners-up). Physical, set-piece dangerous.', ARRAY['Patrik Schick','Tomáš Souček','Adam Hložek']),
-- Group B
('Canada', 'CAN', 'B', '🇨🇦', 'CONCACAF', 'Co-host on a rapid rise; stunned observers by reaching the semifinals of Copa América 2024. Pace and athleticism in abundance.', ARRAY['Alphonso Davies','Jonathan David','Cyle Larin']),
('Bosnia & Herzegovina', 'BIH', 'B', '🇧🇦', 'UEFA', 'The team that knocked Italy out in the playoff final. Second World Cup (after 2014), built around an evergreen striker.', ARRAY['Edin Džeko','Amar Dedić','Sead Kolašinac']),
('Qatar', 'QAT', 'B', '🇶🇦', 'AFC', 'Reigning two-time AFC Asian Cup champions (2019, 2023); this time they qualified on merit rather than as 2022 hosts.', ARRAY['Akram Afif','Almoez Ali']),
('Switzerland', 'SUI', 'B', '🇨🇭', 'UEFA', 'Tournament over-achievers — reached the Euro 2024 quarterfinals (eliminating Italy). Always hard to beat.', ARRAY['Granit Xhaka','Manuel Akanji','Breel Embolo']),
-- Group C
('Brazil', 'BRA', 'C', '🇧🇷', 'CONMEBOL', 'The only nation to appear at every World Cup, five-time champions, now under Carlo Ancelotti.', ARRAY['Vinícius Júnior','Rodrygo','Raphinha']),
('Morocco', 'MAR', 'C', '🇲🇦', 'CAF', 'The story of 2022 — first African side to reach a World Cup semifinal. A genuinely elite, well-organized team.', ARRAY['Achraf Hakimi','Brahim Díaz','Youssef En-Nesyri']),
('Haiti', 'HAI', 'C', '🇭🇹', 'CONCACAF', 'A fairytale return to the World Cup for the first time since 1974 — a 52-year wait.', ARRAY['Frantzdy Pierrot','Duckens Nazon']),
('Scotland', 'SCO', 'C', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA', 'Back at a World Cup after a long absence (last in 1998), riding a strong Euro-qualifying era.', ARRAY['Andrew Robertson','Scott McTominay','John McGinn']),
-- Group D
('United States', 'USA', 'D', '🇺🇸', 'CONCACAF', 'Co-host with a talented golden generation playing across Europe''s top leagues. Expectation is high on home soil.', ARRAY['Christian Pulisic','Weston McKennie','Tyler Adams']),
('Paraguay', 'PAR', 'D', '🇵🇾', 'CONMEBOL', 'Back at the World Cup for the first time since 2010; gritty, defensively stubborn South American side.', ARRAY['Miguel Almirón','Gustavo Gómez','Antonio Sanabria']),
('Australia', 'AUS', 'D', '🇦🇺', 'AFC', 'Reliable qualifiers (sixth straight World Cup) who reached the Round of 16 in 2022.', ARRAY['Mat Ryan','Jackson Irvine']),
('Türkiye', 'TUR', 'D', '🇹🇷', 'UEFA', 'Back on the big stage with an exciting young core after reaching the Euro 2024 quarterfinals.', ARRAY['Arda Güler','Hakan Çalhanoğlu','Kenan Yıldız']),
-- Group E
('Germany', 'GER', 'E', '🇩🇪', 'UEFA', 'Four-time world champions chasing redemption after group-stage exits in 2018 and 2022. A new generation leads.', ARRAY['Jamal Musiala','Florian Wirtz','Joshua Kimmich']),
('Curaçao', 'CUW', 'E', '🇨🇼', 'CONCACAF', 'Debutants and the smallest nation by population ever to reach a World Cup (~150k people). A historic underdog.', ARRAY['Leandro Bacuna','Cuco Martina']),
('Ivory Coast', 'CIV', 'E', '🇨🇮', 'CAF', 'Reigning African champions — won AFCON 2023 dramatically on home soil. Powerful, talented squad.', ARRAY['Simon Adingra','Sébastien Haller','Franck Kessié']),
('Ecuador', 'ECU', 'E', '🇪🇨', 'CONMEBOL', 'Strong, athletic qualifiers from a tough CONMEBOL campaign; impressive defensive record.', ARRAY['Moisés Caicedo','Pervis Estupiñán','Enner Valencia']),
-- Group F
('Netherlands', 'NED', 'F', '🇳🇱', 'UEFA', 'Perennial contenders and Euro 2024 semifinalists; deep, balanced squad.', ARRAY['Virgil van Dijk','Cody Gakpo','Frenkie de Jong','Xavi Simons']),
('Japan', 'JPN', 'F', '🇯🇵', 'AFC', 'Asia''s standard-bearers — beat Germany and Spain in 2022. Fast, technical, fearless.', ARRAY['Kaoru Mitoma','Takefusa Kubo','Wataru Endo']),
('Sweden', 'SWE', 'F', '🇸🇪', 'UEFA', 'Back after missing 2022, now powered by one of the most fearsome strike partnerships in Europe.', ARRAY['Alexander Isak','Viktor Gyökeres','Dejan Kulusevski']),
('Tunisia', 'TUN', 'F', '🇹🇳', 'CAF', 'Regular World Cup participants with a disciplined, organized setup.', ARRAY['Youssef Msakni','Aïssa Laïdouni']),
-- Group G
('Belgium', 'BEL', 'G', '🇧🇪', 'UEFA', 'The golden generation evolving into a new era but still loaded with match-winners.', ARRAY['Kevin De Bruyne','Jérémy Doku','Romelu Lukaku']),
('Egypt', 'EGY', 'G', '🇪🇬', 'CAF', 'Built around one of the world''s best forwards and back at the World Cup for the first time since 2018.', ARRAY['Mohamed Salah','Omar Marmoush']),
('Iran', 'IRN', 'G', '🇮🇷', 'AFC', 'Among Asia''s most consistent qualifiers with a strong European-based spine.', ARRAY['Mehdi Taremi','Sardar Azmoun','Alireza Jahanbakhsh']),
('New Zealand', 'NZL', 'G', '🇳🇿', 'OFC', 'Oceania''s representatives, back at a third World Cup, led by a Premier League striker in form.', ARRAY['Chris Wood']),
-- Group H
('Spain', 'ESP', 'H', '🇪🇸', 'UEFA', 'Reigning European champions (Euro 2024) and arguably the world''s most complete team; 2010 world champions.', ARRAY['Lamine Yamal','Pedri','Rodri','Nico Williams']),
('Cape Verde', 'CPV', 'H', '🇨🇻', 'CAF', 'Debutants and one of the smallest nations ever to qualify (~500k people) — the Blue Sharks are a genuine feel-good story.', ARRAY['Ryan Mendes','Garry Rodrigues']),
('Saudi Arabia', 'KSA', 'H', '🇸🇦', 'AFC', 'Famous for stunning Argentina in 2022; well-organized and dangerous on their day.', ARRAY['Salem Al-Dawsari']),
('Uruguay', 'URU', 'H', '🇺🇾', 'CONMEBOL', 'Two-time world champions under Marcelo Bielsa, third at Copa América 2024 with an exciting young generation.', ARRAY['Federico Valverde','Darwin Núñez','Ronald Araújo']),
-- Group I
('France', 'FRA', 'I', '🇫🇷', 'UEFA', '2018 champions, 2022 runners-up, perennial favorites with arguably the deepest talent pool in the world.', ARRAY['Kylian Mbappé','Aurélien Tchouaméni','Ousmane Dembélé']),
('Senegal', 'SEN', 'I', '🇸🇳', 'CAF', 'African champions of 2021 and one of the continent''s strongest, most physical sides.', ARRAY['Sadio Mané','Nicolas Jackson','Pape Matar Sarr']),
('Iraq', 'IRQ', 'I', '🇮🇶', 'AFC', 'A stirring return to the World Cup for the first time since 1986 — a 40-year wait.', ARRAY['Aymen Hussein']),
('Norway', 'NOR', 'I', '🇳🇴', 'UEFA', 'Back at the World Cup after a long absence (last 1998), and finally bringing two of the planet''s biggest stars to the biggest stage.', ARRAY['Erling Haaland','Martin Ødegaard']),
-- Group J
('Argentina', 'ARG', 'J', '🇦🇷', 'CONMEBOL', 'Reigning world champions (2022) and back-to-back Copa América winners. In all likelihood Lionel Messi''s last World Cup.', ARRAY['Lionel Messi','Lautaro Martínez','Julián Álvarez']),
('Algeria', 'ALG', 'J', '🇩🇿', 'CAF', 'Former African champions (2019) with quality and pace; back at the finals after missing 2022.', ARRAY['Riyad Mahrez','Ismaël Bennacer']),
('Austria', 'AUT', 'J', '🇦🇹', 'UEFA', 'On the rise — topped a group containing France and the Netherlands at Euro 2024. Aggressive, high-pressing.', ARRAY['David Alaba','Marcel Sabitzer','Konrad Laimer']),
('Jordan', 'JOR', 'J', '🇯🇴', 'AFC', 'Debutants riding the momentum of a stunning run to the AFC Asian Cup 2023 final.', ARRAY['Mousa Al-Tamari']),
-- Group K
('Portugal', 'POR', 'K', '🇵🇹', 'UEFA', 'Loaded across every position and likely sending its all-time icon to a final World Cup.', ARRAY['Cristiano Ronaldo','Bruno Fernandes','Rafael Leão','Vitinha']),
('DR Congo', 'COD', 'K', '🇨🇩', 'CAF', 'Back at the World Cup for the first time since 1974 (as Zaire); reached the AFCON 2023 semifinals.', ARRAY['Yoane Wissa','Chancel Mbemba']),
('Uzbekistan', 'UZB', 'K', '🇺🇿', 'AFC', 'Debutants — a long-awaited first World Cup for a nation with a strong youth pedigree.', ARRAY['Eldor Shomurodov']),
('Colombia', 'COL', 'K', '🇨🇴', 'CONMEBOL', 'Runners-up at Copa América 2024 and one of the most in-form attacking sides in South America.', ARRAY['Luis Díaz','James Rodríguez','Jhon Durán']),
-- Group L
('England', 'ENG', 'L', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA', 'Euro 2024 runners-up chasing a first major trophy since 1966 with a golden generation.', ARRAY['Harry Kane','Jude Bellingham','Bukayo Saka','Phil Foden']),
('Croatia', 'CRO', 'L', '🇭🇷', 'UEFA', 'Overachievers of the last decade — 2018 finalists, 2022 third place — still marshaled by a legendary midfield maestro.', ARRAY['Luka Modrić','Joško Gvardiol','Mateo Kovačić']),
('Ghana', 'GHA', 'L', '🇬🇭', 'CAF', 'The Black Stars return with an energetic, talented squad.', ARRAY['Mohammed Kudus','Thomas Partey','Iñaki Williams']),
('Panama', 'PAN', 'L', '🇵🇦', 'CONCACAF', 'Second World Cup (after 2018) for a side that has become a real CONCACAF force.', ARRAY['Adalberto Carrasquilla','José Fajardo'])
ON CONFLICT (fifa_code) DO NOTHING;

-- Default league
INSERT INTO leagues (name, join_code) VALUES ('SpotOn WC26', 'SPOTON26')
ON CONFLICT (join_code) DO NOTHING;


-- Group stage matches (72 total) — actual FIFA WC 2026 schedule
-- All times UTC. US venues use EDT (UTC-4), Mexican venues UTC-6 (no DST since 2023),
-- Canadian/Pacific venues use PDT (UTC-7). MD3 games per group kick off simultaneously.
DELETE FROM matches WHERE stage = 'group';

WITH t AS (SELECT fifa_code, id FROM teams)
INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
SELECT 'group', grp, h.id, a.id, kickoff::timestamptz, venue
FROM (VALUES
  -- ── GROUP A: Mexico, South Africa, South Korea, Czechia ──────────────────
  -- MD1
  ('A','MEX','RSA','2026-06-11 19:00:00+00','Estadio Azteca, Mexico City'),
  ('A','KOR','CZE','2026-06-12 02:00:00+00','Estadio Akron, Guadalajara'),
  -- MD2
  ('A','CZE','RSA','2026-06-18 16:00:00+00','Mercedes-Benz Stadium, Atlanta'),
  ('A','MEX','KOR','2026-06-19 03:00:00+00','Estadio Akron, Guadalajara'),
  -- MD3 simultaneous (Jun 24 21:00 local Mexico = Jun 25 03:00 UTC)
  ('A','CZE','MEX','2026-06-25 03:00:00+00','Estadio Azteca, Mexico City'),
  ('A','RSA','KOR','2026-06-25 03:00:00+00','Estadio BBVA, Monterrey'),
  -- ── GROUP B: Canada, Bosnia & Herzegovina, Qatar, Switzerland ─────────────
  -- MD1
  ('B','CAN','BIH','2026-06-12 19:00:00+00','BMO Field, Toronto'),
  ('B','QAT','SUI','2026-06-13 19:00:00+00','Levi''s Stadium, Santa Clara'),
  -- MD2
  ('B','SUI','BIH','2026-06-18 19:00:00+00','SoFi Stadium, Los Angeles'),
  ('B','CAN','QAT','2026-06-18 22:00:00+00','BC Place, Vancouver'),
  -- MD3 simultaneous (Jun 24 12:00 PDT = 19:00 UTC)
  ('B','SUI','CAN','2026-06-24 19:00:00+00','BC Place, Vancouver'),
  ('B','BIH','QAT','2026-06-24 19:00:00+00','Lumen Field, Seattle'),
  -- ── GROUP C: Brazil, Morocco, Haiti, Scotland ─────────────────────────────
  -- MD1
  ('C','BRA','MAR','2026-06-13 22:00:00+00','MetLife Stadium, New York'),
  ('C','HAI','SCO','2026-06-14 01:00:00+00','Gillette Stadium, Boston'),
  -- MD2
  ('C','SCO','MAR','2026-06-19 22:00:00+00','Gillette Stadium, Boston'),
  ('C','BRA','HAI','2026-06-20 01:00:00+00','Lincoln Financial Field, Philadelphia'),
  -- MD3 simultaneous (Jun 24 18:00 EDT = 22:00 UTC)
  ('C','SCO','BRA','2026-06-24 22:00:00+00','Hard Rock Stadium, Miami'),
  ('C','MAR','HAI','2026-06-24 22:00:00+00','Mercedes-Benz Stadium, Atlanta'),
  -- ── GROUP D: United States, Paraguay, Australia, Türkiye ─────────────────
  -- MD1
  ('D','USA','PAR','2026-06-13 01:00:00+00','SoFi Stadium, Los Angeles'),
  ('D','AUS','TUR','2026-06-14 04:00:00+00','BC Place, Vancouver'),
  -- MD2
  ('D','USA','AUS','2026-06-19 19:00:00+00','Lumen Field, Seattle'),
  ('D','TUR','PAR','2026-06-20 04:00:00+00','Levi''s Stadium, Santa Clara'),
  -- MD3 simultaneous (Jun 25 22:00 EDT = Jun 26 02:00 UTC)
  ('D','TUR','USA','2026-06-26 02:00:00+00','SoFi Stadium, Los Angeles'),
  ('D','PAR','AUS','2026-06-26 02:00:00+00','Levi''s Stadium, Santa Clara'),
  -- ── GROUP E: Germany, Curaçao, Côte d'Ivoire, Ecuador ────────────────────
  -- MD1
  ('E','GER','CUW','2026-06-14 17:00:00+00','NRG Stadium, Houston'),
  ('E','CIV','ECU','2026-06-14 23:00:00+00','Lincoln Financial Field, Philadelphia'),
  -- MD2
  ('E','GER','CIV','2026-06-20 20:00:00+00','BMO Field, Toronto'),
  ('E','ECU','CUW','2026-06-21 00:00:00+00','Arrowhead Stadium, Kansas City'),
  -- MD3 simultaneous (Jun 25 16:00 EDT = 20:00 UTC)
  ('E','CUW','CIV','2026-06-25 20:00:00+00','Lincoln Financial Field, Philadelphia'),
  ('E','ECU','GER','2026-06-25 20:00:00+00','MetLife Stadium, New York'),
  -- ── GROUP F: Netherlands, Japan, Sweden, Tunisia ──────────────────────────
  -- MD1
  ('F','NED','JPN','2026-06-14 20:00:00+00','AT&T Stadium, Dallas'),
  ('F','SWE','TUN','2026-06-15 02:00:00+00','Estadio BBVA, Monterrey'),
  -- MD2
  ('F','NED','SWE','2026-06-20 17:00:00+00','NRG Stadium, Houston'),
  ('F','TUN','JPN','2026-06-21 04:00:00+00','Estadio BBVA, Monterrey'),
  -- MD3 simultaneous (Jun 25 19:00 EDT = 23:00 UTC)
  ('F','JPN','SWE','2026-06-25 23:00:00+00','AT&T Stadium, Dallas'),
  ('F','TUN','NED','2026-06-25 23:00:00+00','Arrowhead Stadium, Kansas City'),
  -- ── GROUP G: Belgium, Egypt, Iran, New Zealand ───────────────────────────
  -- MD1
  ('G','BEL','EGY','2026-06-15 22:00:00+00','Lumen Field, Seattle'),
  ('G','IRN','NZL','2026-06-16 04:00:00+00','SoFi Stadium, Los Angeles'),
  -- MD2
  ('G','BEL','IRN','2026-06-21 19:00:00+00','SoFi Stadium, Los Angeles'),
  ('G','NZL','EGY','2026-06-22 01:00:00+00','BC Place, Vancouver'),
  -- MD3 simultaneous (Jun 26 23:00 EDT = Jun 27 03:00 UTC)
  ('G','EGY','IRN','2026-06-27 03:00:00+00','Lumen Field, Seattle'),
  ('G','NZL','BEL','2026-06-27 03:00:00+00','BC Place, Vancouver'),
  -- ── GROUP H: Spain, Cape Verde, Saudi Arabia, Uruguay ────────────────────
  -- MD1
  ('H','ESP','CPV','2026-06-15 16:00:00+00','Mercedes-Benz Stadium, Atlanta'),
  ('H','KSA','URU','2026-06-15 22:00:00+00','Hard Rock Stadium, Miami'),
  -- MD2
  ('H','ESP','KSA','2026-06-21 16:00:00+00','Mercedes-Benz Stadium, Atlanta'),
  ('H','URU','CPV','2026-06-21 22:00:00+00','Hard Rock Stadium, Miami'),
  -- MD3 simultaneous (Jun 26 20:00 EDT = Jun 27 00:00 UTC)
  ('H','CPV','KSA','2026-06-27 00:00:00+00','NRG Stadium, Houston'),
  ('H','URU','ESP','2026-06-27 00:00:00+00','Estadio Akron, Guadalajara'),
  -- ── GROUP I: France, Senegal, Iraq, Norway ───────────────────────────────
  -- MD1
  ('I','FRA','SEN','2026-06-16 19:00:00+00','MetLife Stadium, New York'),
  ('I','IRQ','NOR','2026-06-16 22:00:00+00','Gillette Stadium, Boston'),
  -- MD2
  ('I','FRA','IRQ','2026-06-22 21:00:00+00','Lincoln Financial Field, Philadelphia'),
  ('I','NOR','SEN','2026-06-23 00:00:00+00','MetLife Stadium, New York'),
  -- MD3 simultaneous (Jun 26 19:00 EDT = 23:00 UTC)
  ('I','FRA','NOR','2026-06-26 23:00:00+00','Allegiant Stadium, Las Vegas'),
  ('I','SEN','IRQ','2026-06-26 23:00:00+00','Gillette Stadium, Boston'),
  -- ── GROUP J: Argentina, Algeria, Austria, Jordan ─────────────────────────
  -- MD1 (Jun 16 21:00 EDT = Jun 17 01:00 UTC)
  ('J','ARG','ALG','2026-06-17 01:00:00+00','Arrowhead Stadium, Kansas City'),
  ('J','AUT','JOR','2026-06-17 04:00:00+00','Levi''s Stadium, Santa Clara'),
  -- MD2
  ('J','ARG','AUT','2026-06-22 17:00:00+00','AT&T Stadium, Dallas'),
  ('J','JOR','ALG','2026-06-23 03:00:00+00','Levi''s Stadium, Santa Clara'),
  -- MD3 simultaneous (Jun 27 22:00 EDT = Jun 28 02:00 UTC)
  ('J','JOR','ARG','2026-06-28 02:00:00+00','AT&T Stadium, Dallas'),
  ('J','ALG','AUT','2026-06-28 02:00:00+00','Arrowhead Stadium, Kansas City'),
  -- ── GROUP K: Portugal, DR Congo, Uzbekistan, Colombia ────────────────────
  -- MD1
  ('K','POR','COD','2026-06-17 17:00:00+00','NRG Stadium, Houston'),
  ('K','UZB','COL','2026-06-18 02:00:00+00','Estadio Azteca, Mexico City'),
  -- MD2
  ('K','POR','UZB','2026-06-23 17:00:00+00','NRG Stadium, Houston'),
  ('K','COL','COD','2026-06-24 02:00:00+00','Estadio Akron, Guadalajara'),
  -- MD3 simultaneous (Jun 27 19:30 EDT = 23:30 UTC)
  ('K','COL','POR','2026-06-27 23:30:00+00','Hard Rock Stadium, Miami'),
  ('K','COD','UZB','2026-06-27 23:30:00+00','Mercedes-Benz Stadium, Atlanta'),
  -- ── GROUP L: England, Croatia, Ghana, Panama ─────────────────────────────
  -- MD1
  ('L','ENG','CRO','2026-06-17 20:00:00+00','AT&T Stadium, Dallas'),
  ('L','GHA','PAN','2026-06-17 23:00:00+00','BMO Field, Toronto'),
  -- MD2
  ('L','ENG','GHA','2026-06-23 20:00:00+00','Gillette Stadium, Boston'),
  ('L','PAN','CRO','2026-06-23 23:00:00+00','BMO Field, Toronto'),
  -- MD3 simultaneous (Jun 27 17:00 EDT = 21:00 UTC)
  ('L','PAN','ENG','2026-06-27 21:00:00+00','MetLife Stadium, New York'),
  ('L','CRO','GHA','2026-06-27 21:00:00+00','Lincoln Financial Field, Philadelphia')
) AS m(grp, home_code, away_code, kickoff, venue)
JOIN t h ON h.fifa_code = m.home_code
JOIN t a ON a.fifa_code = m.away_code;
