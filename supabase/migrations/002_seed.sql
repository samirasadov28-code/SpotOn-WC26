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
('Panama', 'PAN', 'L', '🇵🇦', 'CONCACAF', 'Second World Cup (after 2018) for a side that has become a real CONCACAF force.', ARRAY['Adalberto Carrasquilla','José Fajardo']);

-- Default league
INSERT INTO leagues (name, join_code) VALUES ('SpotOn WC26', 'SPOTON26');

-- Group stage matches (72 total)
-- Using a DO block to resolve team IDs by fifa_code
DO $$
DECLARE
  -- Group A
  v_MEX uuid; v_RSA uuid; v_KOR uuid; v_CZE uuid;
  -- Group B
  v_CAN uuid; v_BIH uuid; v_QAT uuid; v_SUI uuid;
  -- Group C
  v_BRA uuid; v_MAR uuid; v_HAI uuid; v_SCO uuid;
  -- Group D
  v_USA uuid; v_PAR uuid; v_AUS uuid; v_TUR uuid;
  -- Group E
  v_GER uuid; v_CUW uuid; v_CIV uuid; v_ECU uuid;
  -- Group F
  v_NED uuid; v_JPN uuid; v_SWE uuid; v_TUN uuid;
  -- Group G
  v_BEL uuid; v_EGY uuid; v_IRN uuid; v_NZL uuid;
  -- Group H
  v_ESP uuid; v_CPV uuid; v_KSA uuid; v_URU uuid;
  -- Group I
  v_FRA uuid; v_SEN uuid; v_IRQ uuid; v_NOR uuid;
  -- Group J
  v_ARG uuid; v_ALG uuid; v_AUT uuid; v_JOR uuid;
  -- Group K
  v_POR uuid; v_COD uuid; v_UZB uuid; v_COL uuid;
  -- Group L
  v_ENG uuid; v_CRO uuid; v_GHA uuid; v_PAN uuid;
BEGIN
  SELECT id INTO v_MEX FROM teams WHERE fifa_code='MEX';
  SELECT id INTO v_RSA FROM teams WHERE fifa_code='RSA';
  SELECT id INTO v_KOR FROM teams WHERE fifa_code='KOR';
  SELECT id INTO v_CZE FROM teams WHERE fifa_code='CZE';

  SELECT id INTO v_CAN FROM teams WHERE fifa_code='CAN';
  SELECT id INTO v_BIH FROM teams WHERE fifa_code='BIH';
  SELECT id INTO v_QAT FROM teams WHERE fifa_code='QAT';
  SELECT id INTO v_SUI FROM teams WHERE fifa_code='SUI';

  SELECT id INTO v_BRA FROM teams WHERE fifa_code='BRA';
  SELECT id INTO v_MAR FROM teams WHERE fifa_code='MAR';
  SELECT id INTO v_HAI FROM teams WHERE fifa_code='HAI';
  SELECT id INTO v_SCO FROM teams WHERE fifa_code='SCO';

  SELECT id INTO v_USA FROM teams WHERE fifa_code='USA';
  SELECT id INTO v_PAR FROM teams WHERE fifa_code='PAR';
  SELECT id INTO v_AUS FROM teams WHERE fifa_code='AUS';
  SELECT id INTO v_TUR FROM teams WHERE fifa_code='TUR';

  SELECT id INTO v_GER FROM teams WHERE fifa_code='GER';
  SELECT id INTO v_CUW FROM teams WHERE fifa_code='CUW';
  SELECT id INTO v_CIV FROM teams WHERE fifa_code='CIV';
  SELECT id INTO v_ECU FROM teams WHERE fifa_code='ECU';

  SELECT id INTO v_NED FROM teams WHERE fifa_code='NED';
  SELECT id INTO v_JPN FROM teams WHERE fifa_code='JPN';
  SELECT id INTO v_SWE FROM teams WHERE fifa_code='SWE';
  SELECT id INTO v_TUN FROM teams WHERE fifa_code='TUN';

  SELECT id INTO v_BEL FROM teams WHERE fifa_code='BEL';
  SELECT id INTO v_EGY FROM teams WHERE fifa_code='EGY';
  SELECT id INTO v_IRN FROM teams WHERE fifa_code='IRN';
  SELECT id INTO v_NZL FROM teams WHERE fifa_code='NZL';

  SELECT id INTO v_ESP FROM teams WHERE fifa_code='ESP';
  SELECT id INTO v_CPV FROM teams WHERE fifa_code='CPV';
  SELECT id INTO v_KSA FROM teams WHERE fifa_code='KSA';
  SELECT id INTO v_URU FROM teams WHERE fifa_code='URU';

  SELECT id INTO v_FRA FROM teams WHERE fifa_code='FRA';
  SELECT id INTO v_SEN FROM teams WHERE fifa_code='SEN';
  SELECT id INTO v_IRQ FROM teams WHERE fifa_code='IRQ';
  SELECT id INTO v_NOR FROM teams WHERE fifa_code='NOR';

  SELECT id INTO v_ARG FROM teams WHERE fifa_code='ARG';
  SELECT id INTO v_ALG FROM teams WHERE fifa_code='ALG';
  SELECT id INTO v_AUT FROM teams WHERE fifa_code='AUT';
  SELECT id INTO v_JOR FROM teams WHERE fifa_code='JOR';

  SELECT id INTO v_POR FROM teams WHERE fifa_code='POR';
  SELECT id INTO v_COD FROM teams WHERE fifa_code='COD';
  SELECT id INTO v_UZB FROM teams WHERE fifa_code='UZB';
  SELECT id INTO v_COL FROM teams WHERE fifa_code='COL';

  SELECT id INTO v_ENG FROM teams WHERE fifa_code='ENG';
  SELECT id INTO v_CRO FROM teams WHERE fifa_code='CRO';
  SELECT id INTO v_GHA FROM teams WHERE fifa_code='GHA';
  SELECT id INTO v_PAN FROM teams WHERE fifa_code='PAN';

  -- ==============================
  -- GROUP A (MEX, RSA, KOR, CZE)
  -- ==============================
  -- Match 1: OPENING MATCH - fixed time
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'A', v_MEX, v_RSA, '2026-06-11 15:00:00+00', 'Estadio Azteca, Mexico City');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'A', v_MEX, v_KOR, '2026-06-15 18:00:00+00', 'Estadio Azteca, Mexico City');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'A', v_MEX, v_CZE, '2026-06-19 21:00:00+00', 'Estadio Azteca, Mexico City');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'A', v_RSA, v_KOR, '2026-06-12 18:00:00+00', 'Rose Bowl, Los Angeles');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'A', v_RSA, v_CZE, '2026-06-16 21:00:00+00', 'Rose Bowl, Los Angeles');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'A', v_KOR, v_CZE, '2026-06-20 18:00:00+00', 'Rose Bowl, Los Angeles');

  -- ==============================
  -- GROUP B (CAN, BIH, QAT, SUI)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'B', v_CAN, v_BIH, '2026-06-12 15:00:00+00', 'BC Place, Vancouver');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'B', v_CAN, v_QAT, '2026-06-16 18:00:00+00', 'BC Place, Vancouver');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'B', v_CAN, v_SUI, '2026-06-20 21:00:00+00', 'BC Place, Vancouver');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'B', v_BIH, v_QAT, '2026-06-13 15:00:00+00', 'SoFi Stadium, Los Angeles');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'B', v_BIH, v_SUI, '2026-06-17 18:00:00+00', 'SoFi Stadium, Los Angeles');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'B', v_QAT, v_SUI, '2026-06-21 18:00:00+00', 'SoFi Stadium, Los Angeles');

  -- ==============================
  -- GROUP C (BRA, MAR, HAI, SCO)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'C', v_BRA, v_MAR, '2026-06-12 21:00:00+00', 'MetLife Stadium, New York');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'C', v_BRA, v_HAI, '2026-06-17 15:00:00+00', 'MetLife Stadium, New York');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'C', v_BRA, v_SCO, '2026-06-21 21:00:00+00', 'MetLife Stadium, New York');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'C', v_MAR, v_HAI, '2026-06-13 18:00:00+00', 'Hard Rock Stadium, Miami');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'C', v_MAR, v_SCO, '2026-06-17 21:00:00+00', 'Hard Rock Stadium, Miami');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'C', v_HAI, v_SCO, '2026-06-21 15:00:00+00', 'Hard Rock Stadium, Miami');

  -- ==============================
  -- GROUP D (USA, PAR, AUS, TUR)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'D', v_USA, v_PAR, '2026-06-13 21:00:00+00', 'AT&T Stadium, Dallas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'D', v_USA, v_AUS, '2026-06-18 18:00:00+00', 'AT&T Stadium, Dallas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'D', v_USA, v_TUR, '2026-06-22 21:00:00+00', 'AT&T Stadium, Dallas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'D', v_PAR, v_AUS, '2026-06-14 15:00:00+00', 'Lumen Field, Seattle');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'D', v_PAR, v_TUR, '2026-06-18 21:00:00+00', 'Lumen Field, Seattle');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'D', v_AUS, v_TUR, '2026-06-22 18:00:00+00', 'Lumen Field, Seattle');

  -- ==============================
  -- GROUP E (GER, CUW, CIV, ECU)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'E', v_GER, v_CUW, '2026-06-14 18:00:00+00', 'Mercedes-Benz Stadium, Atlanta');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'E', v_GER, v_CIV, '2026-06-18 15:00:00+00', 'Mercedes-Benz Stadium, Atlanta');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'E', v_GER, v_ECU, '2026-06-22 15:00:00+00', 'Mercedes-Benz Stadium, Atlanta');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'E', v_CUW, v_CIV, '2026-06-14 21:00:00+00', 'Estadio BBVA, Monterrey');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'E', v_CUW, v_ECU, '2026-06-19 15:00:00+00', 'Estadio BBVA, Monterrey');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'E', v_CIV, v_ECU, '2026-06-23 18:00:00+00', 'Estadio BBVA, Monterrey');

  -- ==============================
  -- GROUP F (NED, JPN, SWE, TUN)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'F', v_NED, v_JPN, '2026-06-15 15:00:00+00', 'Gillette Stadium, Boston');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'F', v_NED, v_SWE, '2026-06-19 18:00:00+00', 'Gillette Stadium, Boston');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'F', v_NED, v_TUN, '2026-06-23 21:00:00+00', 'Gillette Stadium, Boston');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'F', v_JPN, v_SWE, '2026-06-15 21:00:00+00', 'Lincoln Financial Field, Philadelphia');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'F', v_JPN, v_TUN, '2026-06-20 15:00:00+00', 'Lincoln Financial Field, Philadelphia');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'F', v_SWE, v_TUN, '2026-06-24 15:00:00+00', 'Lincoln Financial Field, Philadelphia');

  -- ==============================
  -- GROUP G (BEL, EGY, IRN, NZL)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'G', v_BEL, v_EGY, '2026-06-15 21:00:00+00', 'Arrowhead Stadium, Kansas City');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'G', v_BEL, v_IRN, '2026-06-20 18:00:00+00', 'Arrowhead Stadium, Kansas City');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'G', v_BEL, v_NZL, '2026-06-24 18:00:00+00', 'Arrowhead Stadium, Kansas City');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'G', v_EGY, v_IRN, '2026-06-16 15:00:00+00', 'Empower Field, Denver');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'G', v_EGY, v_NZL, '2026-06-20 21:00:00+00', 'Empower Field, Denver');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'G', v_IRN, v_NZL, '2026-06-24 21:00:00+00', 'Empower Field, Denver');

  -- ==============================
  -- GROUP H (ESP, CPV, KSA, URU)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'H', v_ESP, v_CPV, '2026-06-16 18:00:00+00', 'NRG Stadium, Houston');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'H', v_ESP, v_KSA, '2026-06-20 15:00:00+00', 'NRG Stadium, Houston');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'H', v_ESP, v_URU, '2026-06-24 21:00:00+00', 'NRG Stadium, Houston');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'H', v_CPV, v_KSA, '2026-06-16 21:00:00+00', 'Estadio Akron, Guadalajara');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'H', v_CPV, v_URU, '2026-06-21 18:00:00+00', 'Estadio Akron, Guadalajara');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'H', v_KSA, v_URU, '2026-06-25 15:00:00+00', 'Estadio Akron, Guadalajara');

  -- ==============================
  -- GROUP I (FRA, SEN, IRQ, NOR)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'I', v_FRA, v_SEN, '2026-06-17 18:00:00+00', 'Allegiant Stadium, Las Vegas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'I', v_FRA, v_IRQ, '2026-06-21 15:00:00+00', 'Allegiant Stadium, Las Vegas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'I', v_FRA, v_NOR, '2026-06-25 18:00:00+00', 'Allegiant Stadium, Las Vegas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'I', v_SEN, v_IRQ, '2026-06-17 21:00:00+00', 'Oracle Park, San Francisco');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'I', v_SEN, v_NOR, '2026-06-22 15:00:00+00', 'Oracle Park, San Francisco');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'I', v_IRQ, v_NOR, '2026-06-25 21:00:00+00', 'Oracle Park, San Francisco');

  -- ==============================
  -- GROUP J (ARG, ALG, AUT, JOR)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'J', v_ARG, v_ALG, '2026-06-18 21:00:00+00', 'MetLife Stadium, New York');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'J', v_ARG, v_AUT, '2026-06-22 18:00:00+00', 'MetLife Stadium, New York');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'J', v_ARG, v_JOR, '2026-06-26 21:00:00+00', 'MetLife Stadium, New York');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'J', v_ALG, v_AUT, '2026-06-19 18:00:00+00', 'Lincoln Financial Field, Philadelphia');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'J', v_ALG, v_JOR, '2026-06-23 15:00:00+00', 'Lincoln Financial Field, Philadelphia');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'J', v_AUT, v_JOR, '2026-06-26 18:00:00+00', 'Lincoln Financial Field, Philadelphia');

  -- ==============================
  -- GROUP K (POR, COD, UZB, COL)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'K', v_POR, v_COD, '2026-06-19 21:00:00+00', 'Camping World Stadium, Orlando');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'K', v_POR, v_UZB, '2026-06-23 18:00:00+00', 'Camping World Stadium, Orlando');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'K', v_POR, v_COL, '2026-06-27 21:00:00+00', 'Camping World Stadium, Orlando');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'K', v_COD, v_UZB, '2026-06-19 15:00:00+00', 'Bank of America Stadium, Charlotte');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'K', v_COD, v_COL, '2026-06-23 21:00:00+00', 'Bank of America Stadium, Charlotte');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'K', v_UZB, v_COL, '2026-06-27 18:00:00+00', 'Bank of America Stadium, Charlotte');

  -- ==============================
  -- GROUP L (ENG, CRO, GHA, PAN)
  -- ==============================
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'L', v_ENG, v_CRO, '2026-06-20 21:00:00+00', 'AT&T Stadium, Dallas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'L', v_ENG, v_GHA, '2026-06-24 18:00:00+00', 'AT&T Stadium, Dallas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'L', v_ENG, v_PAN, '2026-06-27 15:00:00+00', 'AT&T Stadium, Dallas');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'L', v_CRO, v_GHA, '2026-06-24 15:00:00+00', 'Levi''s Stadium, San Francisco');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'L', v_CRO, v_PAN, '2026-06-27 21:00:00+00', 'Levi''s Stadium, San Francisco');
  INSERT INTO matches (stage, group_letter, home_team_id, away_team_id, kickoff_at, venue)
    VALUES ('group', 'L', v_GHA, v_PAN, '2026-06-25 21:00:00+00', 'Levi''s Stadium, San Francisco');

END $$;
