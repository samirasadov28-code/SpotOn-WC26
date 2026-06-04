-- Static WC2026 squads seeded from public knowledge (June 2025)
-- Clears existing player data and re-seeds from this file.

truncate table players restart identity cascade;

do $$
declare t uuid;
begin

-- ============================================================
-- GROUP A
-- ============================================================

-- Mexico (MEX)
select id into t from teams where fifa_code = 'MEX';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Guillermo Ochoa','GK',1,'Salernitana',true),
(t,'Rodolfo Cota','GK',13,'León',true),
(t,'Luis Malagón','GK',22,'Club América',true),
(t,'Jorge Sánchez','DEF',2,'Porto',true),
(t,'Kevin Álvarez','DEF',3,'Club América',true),
(t,'Johan Vásquez','DEF',4,'Genoa',true),
(t,'Edson Álvarez','DEF',5,'West Ham',true),
(t,'Jesús Gallardo','DEF',23,'Monterrey',true),
(t,'César Montes','DEF',15,'Espanyol',true),
(t,'Jorge Ruvalcaba','DEF',16,'Tigres UANL',true),
(t,'Gerardo Arteaga','DEF',6,'Genk',true),
(t,'Héctor Herrera','MID',16,'Houston Dynamo',true),
(t,'Luis Chávez','MID',8,'Dinamo Moscú',true),
(t,'Carlos Antuna','MID',17,'Cruz Azul',true),
(t,'Roberto Alvarado','MID',20,'Guadalajara',true),
(t,'Orbelin Pineda','MID',21,'AEK Athens',true),
(t,'Hirving Lozano','FWD',11,'PSV',true),
(t,'Santiago Giménez','FWD',9,'Feyenoord',true),
(t,'Raúl Jiménez','FWD',7,'Fulham',true),
(t,'Henry Martín','FWD',14,'Club América',true),
(t,'Alexis Vega','FWD',18,'Guadalajara',true),
(t,'Uriel Antuna','FWD',19,'Cruz Azul',true),
(t,'Julián Quiñones','FWD',10,'Club América',true);

-- South Africa (RSA)
select id into t from teams where fifa_code = 'RSA';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Ronwen Williams','GK',1,'Mamelodi Sundowns',true),
(t,'Veli Mothwa','GK',16,'AmaZulu',true),
(t,'Bruce Bvuma','GK',23,'Kaizer Chiefs',true),
(t,'Sifiso Hlanti','DEF',5,'Kaizer Chiefs',true),
(t,'Thibang Phete','DEF',4,'Moreirense',true),
(t,'Rushine De Reuck','DEF',6,'Mamelodi Sundowns',true),
(t,'Siyanda Xulu','DEF',15,'Mamelodi Sundowns',true),
(t,'Reeve Frosler','DEF',2,'Kaizer Chiefs',true),
(t,'Innocent Maela','DEF',3,'Orlando Pirates',true),
(t,'Bongani Zungu','MID',8,'Rangers',true),
(t,'Themba Zwane','MID',10,'Mamelodi Sundowns',true),
(t,'Sipho Mbule','MID',17,'Kaizer Chiefs',true),
(t,'Goodman Mosele','MID',18,'Stade Brestois',true),
(t,'Mothobi Mvala','MID',14,'Mamelodi Sundowns',true),
(t,'Percy Tau','FWD',11,'Al Ahly',true),
(t,'Lyle Foster','FWD',9,'Burnley',true),
(t,'Elias Mokwana','FWD',7,'Mamelodi Sundowns',true),
(t,'Evidence Makgopa','FWD',19,'Orlando Pirates',true),
(t,'Bradley Grobler','FWD',21,'Mamelodi Sundowns',true),
(t,'Siyethemba Sithebe','MID',20,'AmaZulu',true),
(t,'Nkosinathi Sibisi','DEF',13,'Orlando Pirates',true),
(t,'Teboho Mokoena','MID',12,'Mamelodi Sundowns',true),
(t,'Grant Margeman','MID',22,'Ajax Cape Town',true);

-- South Korea (KOR)
select id into t from teams where fifa_code = 'KOR';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Kim Seung-gyu','GK',1,'Al-Shabab',true),
(t,'Jo Hyeon-woo','GK',21,'Ulsan HD',true),
(t,'Song Bum-keun','GK',23,'Jeonbuk',true),
(t,'Kim Min-jae','DEF',3,'Bayern Munich',true),
(t,'Lee Ki-je','DEF',4,'Jeonbuk',true),
(t,'Kwon Kyung-won','DEF',6,'Galatasaray',true),
(t,'Kim Jin-su','DEF',14,'Jeonbuk',true),
(t,'Kim Tae-hwan','DEF',2,'Al-Hilal',true),
(t,'Hong Chul','DEF',15,'Suwon',true),
(t,'Jung Woo-young','MID',16,'Al-Qadsiah',true),
(t,'Lee Jae-sung','MID',17,'Mainz',true),
(t,'Hwang In-beom','MID',8,'Vancouver Whitecaps',true),
(t,'Paik Seung-ho','MID',12,'Jeonbuk',true),
(t,'Lee Kang-in','MID',10,'PSG',true),
(t,'Son Heung-min','FWD',7,'Tottenham',true),
(t,'Hwang Hee-chan','FWD',11,'Wolverhampton',true),
(t,'Cho Gue-sung','FWD',9,'Jeonbuk',true),
(t,'Oh Hyeon-gyu','FWD',18,'Celtic',true),
(t,'Lee Seung-woo','FWD',19,'Hellas Verona',true),
(t,'Na Sang-ho','FWD',20,'Seoul',true),
(t,'Kim Young-gwon','DEF',5,'Ulsan HD',true),
(t,'Kim Jae-sung','MID',13,'Mainz',true),
(t,'Hwang Ui-jo','FWD',22,'Nottm Forest',true);

-- Czechia (CZE)
select id into t from teams where fifa_code = 'CZE';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Jindřich Staněk','GK',1,'Slavia Prague',true),
(t,'Tomáš Vaclík','GK',23,'Omonia',true),
(t,'Matěj Kovář','GK',12,'Bayer Leverkusen',true),
(t,'Vladimír Coufal','DEF',2,'West Ham',true),
(t,'Tomáš Holeš','DEF',3,'Slavia Prague',true),
(t,'David Zima','DEF',4,'Torino',true),
(t,'Jakub Brabec','DEF',14,'Sigma Olomouc',true),
(t,'Lukáš Masopust','DEF',15,'Slavia Prague',true),
(t,'Jan Bořil','DEF',5,'Slavia Prague',true),
(t,'Tomáš Souček','MID',6,'West Ham',true),
(t,'Lukáš Provod','MID',8,'Slavia Prague',true),
(t,'Alex Král','MID',11,'Spartak Moscow',true),
(t,'Marek Suchý','DEF',16,'Basel',true),
(t,'Pavel Šulc','MID',17,'Viktoria Plzeň',true),
(t,'Jan Kuchta','FWD',7,'Slavia Prague',true),
(t,'Patrik Schick','FWD',9,'Bayer Leverkusen',true),
(t,'Adam Hložek','FWD',10,'Bayer Leverkusen',true),
(t,'Ondřej Lingr','FWD',18,'Feyenoord',true),
(t,'Václav Černý','FWD',11,'Wolfsburg',true),
(t,'Martin Vitík','DEF',13,'Sparta Prague',true),
(t,'Tomáš Čvančara','FWD',19,'Mönchengladbach',true),
(t,'Michal Sadílek','MID',20,'Twente',true),
(t,'Jan Laštůvka','GK',22,'Baník Ostrava',true);

-- ============================================================
-- GROUP B
-- ============================================================

-- Canada (CAN)
select id into t from teams where fifa_code = 'CAN';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Maxime Crépeau','GK',1,'LA Galaxy',true),
(t,'Dayne St. Clair','GK',16,'Minnesota United',true),
(t,'Milan Borjan','GK',18,'Red Star Belgrade',true),
(t,'Alistair Johnston','DEF',2,'Celtic',true),
(t,'Richie Laryea','DEF',22,'Nottm Forest',true),
(t,'Kamal Miller','DEF',5,'Portland Timbers',true),
(t,'Moise Bombito','DEF',4,'Juventus',true),
(t,'Derek Cornelius','DEF',3,'Panathinaikos',true),
(t,'Sam Adekugbe','DEF',17,'Hatayspor',true),
(t,'Alphonso Davies','DEF',11,'Bayern Munich',true),
(t,'Jonathan Osorio','MID',8,'Toronto FC',true),
(t,'Stephen Eustaquio','MID',7,'Porto',true),
(t,'Samuel Piette','MID',6,'CF Montréal',true),
(t,'Tajon Buchanan','MID',19,'Inter',true),
(t,'Ismaël Koné','MID',20,'Watford',true),
(t,'Liam Millar','FWD',13,'Basel',true),
(t,'Jonathan David','FWD',9,'LOSC Lille',true),
(t,'Cyle Larin','FWD',10,'Mallorca',true),
(t,'Lucas Cavallini','FWD',14,'Vancouver Whitecaps',true),
(t,'Jacen Russell-Rowe','FWD',23,'Columbus Crew',true),
(t,'Scott Kennedy','DEF',15,'CF Montréal',true),
(t,'Mathieu Choinière','FWD',21,'CF Montréal',true),
(t,'Mark-Anthony Kaye','MID',12,'Toronto FC',true);

-- Bosnia & Herzegovina (BIH)
select id into t from teams where fifa_code = 'BIH';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Ibrahim Šehić','GK',1,'Konyaspor',true),
(t,'Nikola Vasiljević','GK',12,'Vaduz',true),
(t,'Kenan Pirić','GK',23,'Udinese',true),
(t,'Sead Kolašinac','DEF',5,'Marseille',true),
(t,'Ermin Bičakčić','DEF',4,'Greuther Fürth',true),
(t,'Jusuf Gazibegović','DEF',2,'Sturm Graz',true),
(t,'Ognjen Todorović','DEF',3,'Qarabag',true),
(t,'Kenan Kodro','DEF',15,'Kayserispor',true),
(t,'Veldin Karić','DEF',14,'Strasbourg',true),
(t,'Gojko Cimirot','MID',6,'Standard Liège',true),
(t,'Džemal Šiljak','MID',8,'BSK Borač',true),
(t,'Ermin Hodžić','MID',17,'Antalyaspor',true),
(t,'Amer Gojak','MID',18,'Anderlecht',true),
(t,'Haris Vučkić','MID',11,'NEC Nijmegen',true),
(t,'Edin Džeko','FWD',9,'Fenerbahçe',true),
(t,'Saša Kalajdžić','FWD',19,'Wolves',true),
(t,'Ognjen Štilić','FWD',10,'Orduspor',true),
(t,'Armin Hodžić','FWD',7,'İstanbul BB',true),
(t,'Eldar Ćivić','FWD',20,'Panathinaikos',true),
(t,'Darko Todorović','MID',16,'Partizan',true),
(t,'Amar Begić','DEF',22,'Schalke',true),
(t,'Luka Menalo','FWD',21,'Dinamo Zagreb',true),
(t,'Toni Šunjić','DEF',13,'VfL Bochum',true);

-- Qatar (QAT)
select id into t from teams where fifa_code = 'QAT';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Meshaal Barsham','GK',1,'Al-Sadd',true),
(t,'Yousuf Hassan','GK',21,'Al-Gharafa',true),
(t,'Saad Al Sheeb','GK',22,'Al-Sadd',true),
(t,'Pedro Miguel','DEF',2,'Al-Sadd',true),
(t,'Abdelkarim Hassan','DEF',3,'Al-Sadd',true),
(t,'Bassam Al-Rawi','DEF',5,'Al-Sadd',true),
(t,'Tarek Salman','DEF',4,'Al-Duhail',true),
(t,'Homam Ahmed','DEF',14,'Al-Duhail',true),
(t,'Ismail Mohamad','DEF',15,'Al-Arabi',true),
(t,'Karim Boudiaf','MID',6,'Al-Duhail',true),
(t,'Abdulaziz Hatem','MID',8,'Al-Rayyan',true),
(t,'Ali Asad','MID',11,'Al-Sadd',true),
(t,'Ahmed Alaaeldin','MID',17,'Al-Duhail',true),
(t,'Assim Omer','MID',20,'Al-Gharafa',true),
(t,'Akram Afif','FWD',10,'Al-Sadd',true),
(t,'Almoez Ali','FWD',9,'Al-Duhail',true),
(t,'Hassan Al-Haydos','FWD',7,'Al-Sadd',true),
(t,'Mohammed Muntari','FWD',19,'Al-Duhail',true),
(t,'Ahmed Al-Rawabi','FWD',18,'Al-Sadd',true),
(t,'Salem Al-Hajri','MID',16,'Al-Arabi',true),
(t,'Musab Khidir','MID',12,'Al-Sadd',true),
(t,'Jassem Gaber','DEF',13,'Al-Wakrah',true),
(t,'Yusuf Abdurisag','FWD',23,'Al-Ahli',true);

-- Switzerland (SUI)
select id into t from teams where fifa_code = 'SUI';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Yann Sommer','GK',1,'Inter',true),
(t,'Gregor Kobel','GK',21,'Borussia Dortmund',true),
(t,'Jonas Omlin','GK',12,'Monaco',true),
(t,'Silvan Widmer','DEF',2,'Mainz',true),
(t,'Fabian Schär','DEF',5,'Newcastle',true),
(t,'Manuel Akanji','DEF',6,'Man City',true),
(t,'Nico Elvedi','DEF',4,'Mönchengladbach',true),
(t,'Ricardo Rodríguez','DEF',13,'Torino',true),
(t,'Kevin Mbabu','DEF',17,'Augsburg',true),
(t,'Granit Xhaka','MID',10,'Bayer Leverkusen',true),
(t,'Remo Freuler','MID',11,'Nottm Forest',true),
(t,'Denis Zakaria','MID',8,'Monaco',true),
(t,'Michel Aebischer','MID',7,'Bologna',true),
(t,'Vincent Sierro','MID',20,'Toulouse',true),
(t,'Xherdan Shaqiri','FWD',23,'Chicago Fire',true),
(t,'Breel Embolo','FWD',9,'Monaco',true),
(t,'Haris Seferović','FWD',19,'Benfica',true),
(t,'Noah Okafor','FWD',18,'AC Milan',true),
(t,'Zeki Amdouni','FWD',22,'Burnley',true),
(t,'Fabian Rieder','MID',16,'Stade Rennais',true),
(t,'Kwadwo Duah','FWD',14,'Ludogorets',true),
(t,'Edimilson Fernandes','MID',15,'Mainz',true),
(t,'Ulisses Garcia','DEF',3,'Marseille',true);

-- ============================================================
-- GROUP C
-- ============================================================

-- Brazil (BRA)
select id into t from teams where fifa_code = 'BRA';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Ederson','GK',1,'Man City',true),
(t,'Alisson Becker','GK',23,'Liverpool',true),
(t,'Weverton','GK',12,'Palmeiras',true),
(t,'Danilo','DEF',2,'Juventus',true),
(t,'Éder Militão','DEF',3,'Real Madrid',true),
(t,'Marquinhos','DEF',4,'PSG',true),
(t,'Bremer','DEF',14,'Juventus',true),
(t,'Alex Sandro','DEF',6,'Juventus',true),
(t,'Alex Telles','DEF',15,'Sevilla',true),
(t,'Guilherme Arana','DEF',16,'Atlético Mineiro',true),
(t,'Casemiro','MID',5,'Man United',true),
(t,'Lucas Paquetá','MID',10,'West Ham',true),
(t,'Gerson','MID',8,'Flamengo',true),
(t,'Bruno Guimarães','MID',18,'Newcastle',true),
(t,'Vinicius Jr','FWD',7,'Real Madrid',true),
(t,'Rodrygo','FWD',11,'Real Madrid',true),
(t,'Neymar Jr','FWD',10,'Al-Hilal',true),
(t,'Raphinha','FWD',19,'Barcelona',true),
(t,'Endrick','FWD',9,'Real Madrid',true),
(t,'Gabriel Martinelli','FWD',17,'Arsenal',true),
(t,'Pedro','FWD',21,'Flamengo',true),
(t,'Andreas Pereira','MID',13,'Fulham',true),
(t,'Renan Lodi','DEF',22,'Nottm Forest',true);

-- Morocco (MAR)
select id into t from teams where fifa_code = 'MAR';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Yassine Bounou','GK',1,'Al-Hilal',true),
(t,'Munir Mohamedi','GK',16,'Nantes',true),
(t,'Ahmed Reda Tagnaouti','GK',23,'Wydad AC',true),
(t,'Achraf Hakimi','DEF',2,'PSG',true),
(t,'Romain Saïss','DEF',5,'Besiktas',true),
(t,'Nayef Aguerd','DEF',4,'West Ham',true),
(t,'Jawad El Yamiq','DEF',3,'Real Valladolid',true),
(t,'Noussair Mazraoui','DEF',19,'Man United',true),
(t,'Yahia Attiyat Allah','DEF',14,'Wydad AC',true),
(t,'Sofyan Amrabat','MID',6,'Man United',true),
(t,'Azzedine Ounahi','MID',8,'Marseille',true),
(t,'Selim Amallah','MID',15,'Standard Liège',true),
(t,'Bilal El Khannouss','MID',17,'Genk',true),
(t,'Ilias Chair','MID',20,'QPR',true),
(t,'Hakim Ziyech','FWD',7,'Galatasaray',true),
(t,'Youssef En-Nesyri','FWD',9,'Sevilla',true),
(t,'Soufiane Boufal','FWD',11,'Southampton',true),
(t,'Abdessamad Ezzalzouli','FWD',18,'Osasuna',true),
(t,'Zakaria Aboukhlal','FWD',10,'Toulouse',true),
(t,'Anass Zaroury','FWD',21,'Burnley',true),
(t,'Ibrahim Salah','FWD',22,'Al-Qadsiah',true),
(t,'Eddy Gnahore','MID',13,'Troyes',true),
(t,'Badr Benoun','DEF',12,'Qatar SC',true);

-- Haiti (HAI)
select id into t from teams where fifa_code = 'HAI';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Josué Duverger','GK',1,'Faly FC',true),
(t,'Jonathan Octave','GK',22,'AS Capoise',true),
(t,'Kenson Yonel','GK',18,'AS Cavaly',true),
(t,'Derrick Etienne','DEF',2,'CF Montréal',true),
(t,'Mechack Jérôme','DEF',6,'DC United',true),
(t,'Frednel Bélizaire','DEF',3,'FC Chambly',true),
(t,'Jems Geffrard','DEF',4,'SønderjyskE',true),
(t,'Andréshino Fontaine','DEF',13,'Violette AC',true),
(t,'Anthony Némadie','DEF',16,'Racing Club de Haïti',true),
(t,'Cheskel Dezil','MID',8,'Charlotte FC',true),
(t,'Wilde-Donald Guerrier','MID',10,'Ayiti CFS',true),
(t,'Duckens Nazon','MID',7,'St. Truiden',true),
(t,'Steeven Saba','MID',11,'Tours FC',true),
(t,'Jeffrey Octave','MID',17,'FC Lorient',true),
(t,'Nicolas Moïse','FWD',9,'Portmore United',true),
(t,'Frantzdy Pierrot','FWD',19,'LA Galaxy',true),
(t,'Osman Gilles','FWD',20,'Real Monarchs',true),
(t,'Ronaldo Cigole','FWD',21,'Violette AC',true),
(t,'Djamel Amrani','FWD',14,'AS Capoise',true),
(t,'Roudinei Pierre','DEF',5,'Cibao FC',true),
(t,'Richie Laryea','DEF',15,'Nottm Forest',true),
(t,'Damien Lopy','MID',12,'Amiens',true),
(t,'Lionel Benjamin','MID',23,'Violette AC',true);

-- Scotland (SCO)
select id into t from teams where fifa_code = 'SCO';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Angus Gunn','GK',1,'Norwich City',true),
(t,'Craig Gordon','GK',13,'Heart of Midlothian',true),
(t,'Zander Clark','GK',22,'Hearts',true),
(t,'Aaron Hickey','DEF',2,'Brentford',true),
(t,'Kieran Tierney','DEF',3,'Arsenal',true),
(t,'Grant Hanley','DEF',5,'Norwich City',true),
(t,'Jack Hendry','DEF',6,'Al-Ettifaq',true),
(t,'Liam Cooper','DEF',12,'Leeds',true),
(t,'Anthony Ralston','DEF',19,'Celtic',true),
(t,'Scott McTominay','MID',8,'Napoli',true),
(t,'John McGinn','MID',7,'Aston Villa',true),
(t,'Billy Gilmour','MID',4,'Brighton',true),
(t,'Callum McGregor','MID',14,'Celtic',true),
(t,'Ryan Jack','MID',16,'Rangers',true),
(t,'Stuart Armstrong','MID',17,'Southampton',true),
(t,'Lawrence Shankland','FWD',9,'Hearts',true),
(t,'Lyndon Dykes','FWD',10,'QPR',true),
(t,'Ryan Christie','FWD',11,'Bournemouth',true),
(t,'Che Adams','FWD',18,'Southampton',true),
(t,'Kevin Nisbet','FWD',20,'Millwall',true),
(t,'Liam Kelly','MID',15,'Coventry',true),
(t,'Ryan Porteous','DEF',21,'Watford',true),
(t,'Ben Doak','FWD',23,'Liverpool',true);

-- ============================================================
-- GROUP D
-- ============================================================

-- United States (USA)
select id into t from teams where fifa_code = 'USA';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Matt Turner','GK',1,'Nottm Forest',true),
(t,'Ethan Horvath','GK',12,'Cardiff City',true),
(t,'Sean Johnson','GK',23,'Toronto FC',true),
(t,'Sergino Dest','DEF',2,'PSV',true),
(t,'Walker Zimmerman','DEF',3,'Nashville SC',true),
(t,'Tim Ream','DEF',4,'Fulham',true),
(t,'Miles Robinson','DEF',5,'Atlanta United',true),
(t,'Antonee Robinson','DEF',6,'Fulham',true),
(t,'Joe Scally','DEF',14,'Mönchengladbach',true),
(t,'Tyler Adams','MID',8,'Leeds United',true),
(t,'Weston McKennie','MID',7,'Juventus',true),
(t,'Yunus Musah','MID',11,'AC Milan',true),
(t,'Gio Reyna','MID',19,'Nottm Forest',true),
(t,'Brenden Aaronson','MID',13,'Leeds United',true),
(t,'Christian Pulisic','FWD',10,'AC Milan',true),
(t,'Ricardo Pepi','FWD',9,'PSV',true),
(t,'Josh Sargent','FWD',18,'Norwich',true),
(t,'Folarin Balogun','FWD',17,'Monaco',true),
(t,'Tim Weah','FWD',21,'Juventus',true),
(t,'Malik Tillman','FWD',16,'PSV',true),
(t,'Caleb Wiley','DEF',22,'Strasbourg',true),
(t,'Chris Richards','DEF',15,'Crystal Palace',true),
(t,'Luca de la Torre','MID',20,'Celta Vigo',true);

-- Paraguay (PAR)
select id into t from teams where fifa_code = 'PAR';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Antony Silva','GK',1,'Olimpia',true),
(t,'Roberto Fernández','GK',12,'Sportivo Luqueño',true),
(t,'Alfredo Aguilar','GK',23,'Guaraní',true),
(t,'Robert Rojas','DEF',2,'River Plate',true),
(t,'Fabián Balbuena','DEF',4,'Dinamo Moscú',true),
(t,'Gustavo Gómez','DEF',5,'Palmeiras',true),
(t,'Omar Alderete','DEF',3,'Valencia',true),
(t,'Santiago Arzamendia','DEF',6,'Atlético Mineiro',true),
(t,'Matías Espinoza','DEF',14,'Newell''s Old Boys',true),
(t,'Andrés Cubas','MID',8,'Nîmes',true),
(t,'Mathias Villasanti','MID',7,'Grêmio',true),
(t,'Ángel Cardozo','MID',15,'Olimpia',true),
(t,'Gastón Giménez','MID',16,'Chicago Fire',true),
(t,'Miguel Almirón','MID',10,'Newcastle',true),
(t,'Julio Enciso','FWD',11,'Brighton',true),
(t,'Ramón Sosa','FWD',9,'Nottm Forest',true),
(t,'Antonio Sanabria','FWD',19,'Torino',true),
(t,'Fernando Cardozo','FWD',18,'Olimpia',true),
(t,'Braian Samudio','FWD',21,'Morelia',true),
(t,'Richard Sánchez','MID',17,'Club América',true),
(t,'Diego Gómez','MID',20,'Inter Miami',true),
(t,'Héctor Villalba','FWD',22,'Atlanta United',true),
(t,'Junior Alonso','DEF',13,'Athletico Paranaense',true);

-- Australia (AUS)
select id into t from teams where fifa_code = 'AUS';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Mat Ryan','GK',1,'Real Sociedad',true),
(t,'Danny Vukovic','GK',12,'Genk',true),
(t,'Joe Gauci','GK',23,'Adelaide United',true),
(t,'Milos Degenek','DEF',5,'Columbus Crew',true),
(t,'Harry Souttar','DEF',3,'Leicester',true),
(t,'Kye Rowles','DEF',4,'Hearts',true),
(t,'Nathaniel Atkinson','DEF',2,'Hearts',true),
(t,'Aziz Behich','DEF',6,'Dundee United',true),
(t,'Joel King','DEF',19,'OB Odense',true),
(t,'Aaron Mooy','MID',8,'Celtic',true),
(t,'Jackson Irvine','MID',10,'St. Pauli',true),
(t,'Riley McGree','MID',7,'Middlesbrough',true),
(t,'Ajdin Hrustic','MID',15,'Hellas Verona',true),
(t,'Keanu Baccus','MID',14,'St. Mirren',true),
(t,'Mathew Leckie','FWD',17,'Melbourne City',true),
(t,'Mitchell Duke','FWD',9,'Fagiano Okayama',true),
(t,'Martin Boyle','FWD',11,'Hibernian',true),
(t,'Craig Goodwin','FWD',21,'Adelaide United',true),
(t,'Cameron Devlin','MID',16,'Hearts',true),
(t,'Denis Genreau','MID',20,'Toulouse',true),
(t,'Nick D''Agostino','FWD',18,'Groningen',true),
(t,'Gianni Stensness','DEF',22,'Viking',true),
(t,'Garang Kuol','FWD',13,'Heart of Midlothian',true);

-- Türkiye (TUR)
select id into t from teams where fifa_code = 'TUR';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Altay Bayındır','GK',1,'Man United',true),
(t,'Mert Günok','GK',23,'Besiktas',true),
(t,'Uğurcan Çakır','GK',12,'Trabzonspor',true),
(t,'Zeki Çelik','DEF',2,'Roma',true),
(t,'Merih Demiral','DEF',3,'Al-Qadsiah',true),
(t,'Ozan Kabak','DEF',4,'Norwich',true),
(t,'Samet Akaydin','DEF',5,'Fenerbahçe',true),
(t,'Ferdi Kadıoğlu','DEF',6,'Fenerbahçe',true),
(t,'Mert Müldür','DEF',13,'Sassuolo',true),
(t,'Salih Özcan','MID',8,'Borussia Dortmund',true),
(t,'İsmail Yüksek','MID',16,'Fenerbahçe',true),
(t,'Orkun Kökçü','MID',10,'Benfica',true),
(t,'Hakan Çalhanoğlu','MID',7,'Inter',true),
(t,'Kaan Ayhan','MID',14,'Galatasaray',true),
(t,'Arda Güler','FWD',11,'Real Madrid',true),
(t,'Kerem Aktürkoğlu','FWD',19,'Galatasaray',true),
(t,'Yusuf Yazıcı','FWD',9,'Trabzonspor',true),
(t,'Baris Alper Yilmaz','FWD',17,'Galatasaray',true),
(t,'Cenk Tosun','FWD',18,'Besiktas',true),
(t,'Bertuğ Yıldırım','FWD',21,'Rennes',true),
(t,'Çağlar Söyüncü','DEF',15,'Atletico Madrid',true),
(t,'İrfan Can Kahveci','MID',20,'Fenerbahçe',true),
(t,'Abdülkerim Bardakcı','DEF',22,'Galatasaray',true);

-- ============================================================
-- GROUP E
-- ============================================================

-- Germany (GER)
select id into t from teams where fifa_code = 'GER';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Manuel Neuer','GK',1,'Bayern Munich',true),
(t,'Marc-André ter Stegen','GK',22,'Barcelona',true),
(t,'Oliver Baumann','GK',12,'Hoffenheim',true),
(t,'Timo Baumgartl','DEF',15,'Union Berlin',true),
(t,'Benjamin Henrichs','DEF',5,'RB Leipzig',true),
(t,'Jonathan Tah','DEF',4,'Bayer Leverkusen',true),
(t,'Nico Schlotterbeck','DEF',3,'Borussia Dortmund',true),
(t,'Joshua Kimmich','DEF',6,'Bayern Munich',true),
(t,'David Raum','DEF',14,'RB Leipzig',true),
(t,'Ilkay Gündogan','MID',21,'Barcelona',true),
(t,'Leon Goretzka','MID',8,'Bayern Munich',true),
(t,'Robert Andrich','MID',23,'Bayer Leverkusen',true),
(t,'Leroy Sané','MID',19,'Bayern Munich',true),
(t,'Florian Wirtz','MID',10,'Bayer Leverkusen',true),
(t,'Jamal Musiala','MID',7,'Bayern Munich',true),
(t,'Kai Havertz','FWD',9,'Arsenal',true),
(t,'Thomas Müller','FWD',25,'Bayern Munich',true),
(t,'Serge Gnabry','FWD',11,'Bayern Munich',true),
(t,'Deniz Undav','FWD',20,'VfB Stuttgart',true),
(t,'Niclas Füllkrug','FWD',16,'West Ham',true),
(t,'Pascal Groß','MID',13,'Borussia Dortmund',true),
(t,'Chris Führich','FWD',17,'VfB Stuttgart',true),
(t,'Max Mittelstädt','DEF',2,'VfB Stuttgart',true);

-- Curaçao (CUW)
select id into t from teams where fifa_code = 'CUW';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Eloy Room','GK',1,'FC Cincinnati',true),
(t,'Giliano Wijnaldum','GK',22,'ADO Den Haag',true),
(t,'Rubio Rubin','GK',23,'San Jose Earthquakes',true),
(t,'Cuco Martina','DEF',2,'FC Emmen',true),
(t,'Etienne Reijnen','DEF',3,'LA Galaxy',true),
(t,'Juriën Gaari','DEF',4,'Almería',true),
(t,'Darryl Lachman','DEF',5,'ADO Den Haag',true),
(t,'Rangelo Janga','DEF',14,'FC Emmen',true),
(t,'Jarchinio Antonia','DEF',15,'Würzburger Kickers',true),
(t,'Leandro Bacuna','MID',8,'Cardiff City',true),
(t,'Gevaro Nepomuceno','MID',10,'Cercle Brugge',true),
(t,'Glenn Druijf','MID',16,'Heracles',true),
(t,'Jurgen Ekkelenkamp','MID',7,'Hertha BSC',true),
(t,'Brandley Kuwas','MID',11,'Twente',true),
(t,'Myron Boadu','FWD',9,'Monaco',true),
(t,'Rajiv van La Parra','FWD',17,'Excelsior',true),
(t,'Quentin Lecoeuche','FWD',19,'Valenciennes',true),
(t,'Xavier Barón','FWD',18,'FC Emmen',true),
(t,'Dayvian Lasten','FWD',20,'Violette AC',true),
(t,'Gianluca Nijholt','MID',12,'Almere City',true),
(t,'Raily Ignacio','DEF',13,'Almere City',true),
(t,'Ferhaino Felitser','MID',21,'Go Ahead Eagles',true),
(t,'Mamiro Lio','FWD',6,'Esperance de Tunis',true);

-- Côte d'Ivoire (CIV)
select id into t from teams where fifa_code = 'CIV';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Yahia Fofana','GK',1,'Leicester',true),
(t,'Badra Ali Sangaré','GK',16,'ASEC Mimosas',true),
(t,'Sylvain Gbohouo','GK',23,'Berekum Chelsea',true),
(t,'Serge Aurier','DEF',2,'Villarreal',true),
(t,'Willy Boly','DEF',3,'Nottm Forest',true),
(t,'Odilon Kossounou','DEF',4,'Bayer Leverkusen',true),
(t,'Wilfried Zaha','DEF',11,'Galatasaray',true),
(t,'Ghislain Konan','DEF',5,'Reims',true),
(t,'Hamari Traoré','DEF',17,'Rennes',true),
(t,'Franck Kessié','MID',6,'Al-Ahli',true),
(t,'Jean-Michaël Seri','MID',8,'Fulham',true),
(t,'Ibrahim Sangaré','MID',14,'Nottm Forest',true),
(t,'Seko Fofana','MID',10,'Al-Qadsiah',true),
(t,'Ahmed Touba','DEF',15,'Almería',true),
(t,'Nicolas Pépé','FWD',7,'Trabzonspor',true),
(t,'Sébastien Haller','FWD',9,'Borussia Dortmund',true),
(t,'Jonathan Kodjia','FWD',19,'Fatih Karagümrük',true),
(t,'Simon Adingra','FWD',18,'Brighton',true),
(t,'Max Gradel','FWD',21,'Toulouse',true),
(t,'Karim Konaté','FWD',20,'RB Salzburg',true),
(t,'Oumar Diakité','MID',13,'Panathinaikos',true),
(t,'Ilaix Moriba','MID',12,'RB Leipzig',true),
(t,'Eric Bailly','DEF',22,'LOSC Lille',true);

-- Ecuador (ECU)
select id into t from teams where fifa_code = 'ECU';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Hernán Galíndez','GK',1,'Aucas',true),
(t,'Alexander Domínguez','GK',12,'LDU Quito',true),
(t,'Mario Pineida','GK',23,'Barcelona SC',true),
(t,'Ángelo Preciado','DEF',2,'Genk',true),
(t,'Piero Hincapié','DEF',3,'Bayer Leverkusen',true),
(t,'Félix Torres','DEF',4,'Santos Laguna',true),
(t,'William Pacho','DEF',5,'Eintracht Frankfurt',true),
(t,'Pervis Estupiñán','DEF',6,'Brighton',true),
(t,'Diego Palacios','DEF',15,'LA FC',true),
(t,'Carlos Gruezo','MID',8,'Augsburg',true),
(t,'Moisés Caicedo','MID',10,'Chelsea',true),
(t,'Jhegson Méndez','MID',7,'LA FC',true),
(t,'Ángel Mena','MID',11,'León',true),
(t,'Jeremy Sarmiento','MID',18,'Brighton',true),
(t,'Enner Valencia','FWD',13,'Internacional',true),
(t,'Gonzalo Plata','FWD',17,'Valladolid',true),
(t,'Michael Estrada','FWD',19,'Cruz Azul',true),
(t,'Djorkaeff Reasco','FWD',20,'Newell''s Old Boys',true),
(t,'Romario Ibarra','FWD',16,'Pachuca',true),
(t,'José Cifuentes','MID',14,'Leeds',true),
(t,'Alan Franco','DEF',22,'Athletico Paranaense',true),
(t,'Sebas Méndez','MID',21,'Orlando City',true),
(t,'Kevin Rodríguez','FWD',9,'Ipswich',true);

-- ============================================================
-- GROUP F
-- ============================================================

-- Netherlands (NED)
select id into t from teams where fifa_code = 'NED';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Bart Verbruggen','GK',1,'Brighton',true),
(t,'Mark Flekken','GK',22,'Brentford',true),
(t,'Jasper Cillessen','GK',13,'NEC Nijmegen',true),
(t,'Denzel Dumfries','DEF',2,'Inter',true),
(t,'Stefan de Vrij','DEF',6,'Inter',true),
(t,'Virgil van Dijk','DEF',4,'Liverpool',true),
(t,'Matthijs de Ligt','DEF',3,'Man United',true),
(t,'Nathan Aké','DEF',5,'Man City',true),
(t,'Daley Blind','DEF',17,'Girona',true),
(t,'Frenkie de Jong','MID',21,'Barcelona',true),
(t,'Teun Koopmeiners','MID',8,'Juventus',true),
(t,'Tijjani Reijnders','MID',14,'AC Milan',true),
(t,'Xavi Simons','MID',10,'RB Leipzig',true),
(t,'Jerdy Schouten','MID',15,'Bologna',true),
(t,'Memphis Depay','FWD',10,'Atletico Madrid',true),
(t,'Cody Gakpo','FWD',11,'Liverpool',true),
(t,'Wout Weghorst','FWD',9,'Hoffenheim',true),
(t,'Donyell Malen','FWD',18,'Borussia Dortmund',true),
(t,'Steven Bergwijn','FWD',7,'Ajax',true),
(t,'Brian Brobbey','FWD',19,'Ajax',true),
(t,'Micky van de Ven','DEF',16,'Tottenham',true),
(t,'Ryan Gravenberch','MID',12,'Liverpool',true),
(t,'Lutsharel Geertruida','DEF',20,'RB Leipzig',true);

-- Japan (JPN)
select id into t from teams where fifa_code = 'JPN';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Shuichi Gonda','GK',1,'Shimizu S-Pulse',true),
(t,'Zion Suzuki','GK',12,'St. Trond',true),
(t,'Keisuke Osako','GK',23,'Vissel Kobe',true),
(t,'Hiroki Sakai','DEF',2,'Urawa Red Diamonds',true),
(t,'Shogo Taniguchi','DEF',3,'Kawasaki Frontale',true),
(t,'Ko Itakura','DEF',4,'Mönchengladbach',true),
(t,'Maya Yoshida','DEF',5,'FC Basel',true),
(t,'Yuto Nagatomo','DEF',6,'Tokyo',true),
(t,'Takehiro Tomiyasu','DEF',16,'Arsenal',true),
(t,'Wataru Endo','MID',8,'Liverpool',true),
(t,'Gaku Shibasaki','MID',7,'Leganés',true),
(t,'Hidemasa Morita','MID',17,'Sporting CP',true),
(t,'Daichi Kamada','MID',10,'Crystal Palace',true),
(t,'Ritsu Doan','MID',19,'Freiburg',true),
(t,'Junya Ito','FWD',14,'Stade Rennais',true),
(t,'Takumi Minamino','FWD',9,'Monaco',true),
(t,'Kaoru Mitoma','FWD',11,'Brighton',true),
(t,'Ao Tanaka','MID',15,'Borussia Dortmund',true),
(t,'Ayase Ueda','FWD',20,'Feyenoord',true),
(t,'Takefusa Kubo','FWD',21,'Real Sociedad',true),
(t,'Yoshiki Takahashi','MID',13,'Kawasaki Frontale',true),
(t,'Mao Hosoya','FWD',18,'Kashiwa Reysol',true),
(t,'Yukinari Sugawara','DEF',22,'AZ Alkmaar',true);

-- Sweden (SWE)
select id into t from teams where fifa_code = 'SWE';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Robin Olsen','GK',1,'Aston Villa',true),
(t,'Karl-Johan Johnsson','GK',12,'Guingamp',true),
(t,'Andreas Linde','GK',23,'Molde',true),
(t,'Emil Krafth','DEF',2,'Newcastle',true),
(t,'Marcus Danielson','DEF',4,'Djurgårdens IF',true),
(t,'Victor Nilsson Lindelöf','DEF',5,'Man United',true),
(t,'Niclas Eliasson','DEF',14,'Bristol City',true),
(t,'Ludwig Augustinsson','DEF',3,'Sevilla',true),
(t,'Filip Helander','DEF',6,'Rangers',true),
(t,'Albin Ekdal','MID',8,'Sampdoria',true),
(t,'Kristoffer Olsson','MID',16,'Anderlecht',true),
(t,'Dejan Kulusevski','MID',10,'Tottenham',true),
(t,'Emil Forsberg','MID',7,'RB Leipzig',true),
(t,'Jens-Lys Cajuste','MID',15,'Brighton',true),
(t,'Alexander Isak','FWD',9,'Newcastle',true),
(t,'Viktor Gyökeres','FWD',11,'Sporting CP',true),
(t,'Robin Quaison','FWD',18,'Palermo',true),
(t,'Anthony Elanga','FWD',17,'Nottm Forest',true),
(t,'Jordan Larsson','FWD',19,'Spartak Moscow',true),
(t,'Pontus Jansson','DEF',13,'Brentford',true),
(t,'Sebastian Larsson','MID',21,'AIK',true),
(t,'Gustav Svensson','MID',20,'Nashville SC',true),
(t,'Samuel Adegbenro','FWD',22,'Rosenborg',true);

-- Tunisia (TUN)
select id into t from teams where fifa_code = 'TUN';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Aymen Dahmen','GK',1,'Stade Tunisien',true),
(t,'Moez Ben Cherifia','GK',16,'Espérance ST',true),
(t,'Bechir Ben Said','GK',23,'Club Africain',true),
(t,'Ali Maâloul','DEF',3,'Al-Ahly',true),
(t,'Yassine Meriah','DEF',5,'Espérance ST',true),
(t,'Montassar Talbi','DEF',6,'Lorient',true),
(t,'Dylan Bronn','DEF',4,'Salernitana',true),
(t,'Nader Ghandri','DEF',13,'Gaziantep',true),
(t,'Wajdi Kechrida','DEF',2,'Trabzonspor',true),
(t,'Ellyes Skhiri','MID',7,'Eintracht Frankfurt',true),
(t,'Aïssa Laïdouni','MID',8,'Watford',true),
(t,'Mohamed Ali Ben Romdhane','MID',14,'Nantes',true),
(t,'Hannibal Mejbri','MID',11,'Man United',true),
(t,'Wahbi Khazri','MID',10,'Saint-Etienne',true),
(t,'Issam Jebali','FWD',9,'Odense BK',true),
(t,'Saîf-Eddine Khaoui','FWD',17,'Troyes',true),
(t,'Youssef Msakni','FWD',7,'Al-Arabi',true),
(t,'Seifeddine Jaziri','FWD',19,'Dynamo Dresden',true),
(t,'Mohamed Drager','DEF',20,'Huddersfield',true),
(t,'Bilel Ifa','DEF',15,'Club Africain',true),
(t,'Hamza Mathlouthi','MID',12,'Espérance ST',true),
(t,'Lassad Jarakji','FWD',18,'CS Sfaxien',true),
(t,'Naim Sliti','FWD',22,'Angers',true);

-- ============================================================
-- GROUP G
-- ============================================================

-- Belgium (BEL)
select id into t from teams where fifa_code = 'BEL';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Koen Casteels','GK',1,'Al-Qadsiah',true),
(t,'Simon Mignolet','GK',12,'Club Brugge',true),
(t,'Matz Sels','GK',23,'Nottm Forest',true),
(t,'Timothy Castagne','DEF',2,'Fulham',true),
(t,'Jan Vertonghen','DEF',5,'Anderlecht',true),
(t,'Wout Faes','DEF',4,'Leicester',true),
(t,'Arthur Theate','DEF',3,'Stade Rennais',true),
(t,'Thomas Meunier','DEF',15,'Trabzonspor',true),
(t,'Leander Dendoncker','DEF',14,'Aston Villa',true),
(t,'Kevin De Bruyne','MID',7,'Man City',true),
(t,'Alexis Saelemaekers','MID',13,'Bologna',true),
(t,'Charles De Ketelaere','MID',10,'Atalanta',true),
(t,'Youri Tielemans','MID',8,'Aston Villa',true),
(t,'Amadou Onana','MID',6,'Everton',true),
(t,'Romelu Lukaku','FWD',9,'Inter',true),
(t,'Dries Mertens','FWD',16,'Galatasaray',true),
(t,'Leandro Trossard','FWD',11,'Arsenal',true),
(t,'Jeremy Doku','FWD',19,'Man City',true),
(t,'Lois Openda','FWD',18,'RB Leipzig',true),
(t,'Loïs Openda','FWD',20,'RB Leipzig',true),
(t,'Johan Bakayoko','FWD',22,'PSV',true),
(t,'Axel Witsel','MID',17,'Atletico Madrid',true),
(t,'Zeno Debast','DEF',21,'Anderlecht',true);

-- Egypt (EGY)
select id into t from teams where fifa_code = 'EGY';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Mohamed El-Shennawy','GK',1,'Al-Ahly',true),
(t,'Gabaski','GK',16,'Zamalek',true),
(t,'Mohamed Sobhi','GK',23,'Al-Ahly',true),
(t,'Mohamed El-Shenawy','DEF',2,'Al-Ahly',true),
(t,'Ahmed Hegazi','DEF',5,'Al-Ittihad',true),
(t,'Mahmoud Alaa','DEF',4,'Zamalek',true),
(t,'Akram Tawfik','DEF',3,'Pyramids',true),
(t,'Omar Kamal','DEF',14,'Zamalek',true),
(t,'Ahmed Sayed Zizou','DEF',15,'Pyramids',true),
(t,'Tarek Hamed','MID',6,'Al-Ahly',true),
(t,'Amr El Sulaya','MID',8,'Al-Ahly',true),
(t,'Emam Ashour','MID',7,'Al-Qadsiah',true),
(t,'Hamdy Fathy','MID',17,'Al-Ittihad',true),
(t,'Trézéguet','MID',10,'Istanbul Basaksehir',true),
(t,'Mohamed Salah','FWD',11,'Liverpool',true),
(t,'Mostafa Mohamed','FWD',9,'Nantes',true),
(t,'Marwan Hamdy','FWD',19,'Al-Ahly',true),
(t,'Omar Marmoush','FWD',18,'Man City',true),
(t,'Mohamed Sherif','FWD',20,'Al-Hilal',true),
(t,'Ahmed El-Sheikh','MID',12,'Zamalek',true),
(t,'Ayman Ashraf','DEF',13,'Al-Ahly',true),
(t,'Said Hamed','FWD',21,'Pyramids',true),
(t,'Muhammed El Neny','MID',22,'Arsenal',true);

-- Iran (IRN)
select id into t from teams where fifa_code = 'IRN';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Alireza Beiranvand','GK',1,'Antwerp',true),
(t,'Payam Niazmand','GK',12,'Persepolis',true),
(t,'Hossein Hosseini','GK',23,'Esteghlal',true),
(t,'Shoja Khalilzadeh','DEF',2,'Al-Qadsiah',true),
(t,'Majid Hosseini','DEF',5,'Kayserispor',true),
(t,'Milad Mohammadi','DEF',3,'AEK Athens',true),
(t,'Hossein Kanaanizadegan','DEF',4,'Persepolis',true),
(t,'Sadegh Moharrami','DEF',6,'Dinamo Zagreb',true),
(t,'Ehsan Hajsafi','DEF',14,'AEK Athens',true),
(t,'Ahmad Nourollahi','MID',8,'Al-Qadsiah',true),
(t,'Alireza Jahanbakhsh','MID',7,'Feyenoord',true),
(t,'Saeid Ezatolahi','MID',16,'Vejle BK',true),
(t,'Ali Gholizadeh','MID',11,'Gent',true),
(t,'Ali Karimi','MID',17,'Persepolis',true),
(t,'Sardar Azmoun','FWD',9,'Bayer Leverkusen',true),
(t,'Mehdi Taremi','FWD',20,'Inter',true),
(t,'Ramin Rezaeian','DEF',15,'Oostende',true),
(t,'Allahyar Sayyadmanesh','FWD',10,'Nottm Forest',true),
(t,'Morteza Pouraliganji','DEF',13,'Al-Gharafa',true),
(t,'Mehdi Shiri','MID',18,'Persepolis',true),
(t,'Omid Noorafkan','FWD',21,'Persepolis',true),
(t,'Farshad Ahmadzadeh','FWD',19,'Sanat Naft',true),
(t,'Karim Ansarifard','FWD',22,'Omonia',true);

-- New Zealand (NZL)
select id into t from teams where fifa_code = 'NZL';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Stefan Marinovic','GK',1,'Minnesota United',true),
(t,'Michael Woud','GK',12,'Twente',true),
(t,'Oliver Sail','GK',23,'Notts County',true),
(t,'Winston Reid','DEF',5,'Brentford',true),
(t,'Tommy Smith','DEF',4,'Stoke City',true),
(t,'Michael Boxall','DEF',6,'Minnesota United',true),
(t,'Liberato Cacace','DEF',3,'Empoli',true),
(t,'Nando de Colo','DEF',2,'SV Zulte Waregem',true),
(t,'Tim Payne','DEF',14,'Vancouver Whitecaps',true),
(t,'Marko Stamenic','MID',8,'Charlotte FC',true),
(t,'Clayton Lewis','MID',7,'Nashville SC',true),
(t,'Ryan Thomas','MID',16,'PEC Zwolle',true),
(t,'Alex Greive','MID',10,'St. Mirren',true),
(t,'Elijah Just','MID',17,'Halmstads',true),
(t,'Chris Wood','FWD',9,'Nottm Forest',true),
(t,'Callum McCowatt','FWD',11,'HJK Helsinki',true),
(t,'Myer Bevan','FWD',19,'HJK Helsinki',true),
(t,'Matthew Garbett','MID',15,'PEC Zwolle',true),
(t,'Joe Bell','MID',18,'Miami FC',true),
(t,'Finn Surman','MID',20,'Barnsley',true),
(t,'Deklan Wynne','DEF',13,'Colorado Rapids',true),
(t,'Kosta Barbarouses','FWD',21,'Vancouver Whitecaps',true),
(t,'Ben Old','FWD',22,'Panathinaikos',true);

-- ============================================================
-- GROUP H
-- ============================================================

-- Spain (ESP)
select id into t from teams where fifa_code = 'ESP';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Unai Simón','GK',1,'Athletic Bilbao',true),
(t,'David Raya','GK',13,'Arsenal',true),
(t,'Álex Remiro','GK',23,'Real Sociedad',true),
(t,'Dani Carvajal','DEF',2,'Real Madrid',true),
(t,'Alejandro Balde','DEF',3,'Barcelona',true),
(t,'Pau Cubarsí','DEF',4,'Barcelona',true),
(t,'Aymeric Laporte','DEF',14,'Al-Nassr',true),
(t,'Robin Le Normand','DEF',6,'Atletico Madrid',true),
(t,'Marc Cucurella','DEF',12,'Chelsea',true),
(t,'Rodri','MID',16,'Man City',true),
(t,'Pedri','MID',26,'Barcelona',true),
(t,'Gavi','MID',8,'Barcelona',true),
(t,'Dani Olmo','MID',10,'Barcelona',true),
(t,'Martín Zubimendi','MID',5,'Real Sociedad',true),
(t,'Lamine Yamal','FWD',19,'Barcelona',true),
(t,'Nico Williams','FWD',17,'Athletic Bilbao',true),
(t,'Álvaro Morata','FWD',7,'AC Milan',true),
(t,'Mikel Oyarzabal','FWD',11,'Real Sociedad',true),
(t,'Ferran Torres','FWD',18,'Barcelona',true),
(t,'Ayoze Pérez','FWD',21,'Villarreal',true),
(t,'Fabián Ruiz','MID',15,'PSG',true),
(t,'Joselu','FWD',9,'Real Madrid',true),
(t,'Alejandro Grimaldo','DEF',22,'Bayer Leverkusen',true);

-- Cabo Verde (CPV)
select id into t from teams where fifa_code = 'CPV';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Vozinha','GK',1,'Arouca',true),
(t,'Josimar Dias','GK',23,'FC Porto B',true),
(t,'Elísio Mendes','GK',12,'Académico Viseu',true),
(t,'Stopira','DEF',3,'Hibernians',true),
(t,'Hélder','DEF',4,'Metz',true),
(t,'Rocha','DEF',5,'Midtjylland',true),
(t,'Nuno Borges','DEF',2,'Boavista',true),
(t,'João Miranda','DEF',6,'Nacional',true),
(t,'Jordan Lopes','DEF',14,'Farense',true),
(t,'Kenny Rocha Santos','MID',8,'Chaves',true),
(t,'Jamiro Monteiro','MID',10,'FC Metz',true),
(t,'Steven Fortes','MID',7,'Arouca',true),
(t,'Lisandro Semedo','MID',17,'GD Chaves',true),
(t,'Varela','MID',16,'Académico Viseu',true),
(t,'Ryan Mendes','FWD',11,'GD Chaves',true),
(t,'Garry Rodrigues','FWD',19,'Galatasaray',true),
(t,'Diney Borges','FWD',9,'Dínamo Bucharest',true),
(t,'Djaniny','FWD',18,'Servette',true),
(t,'Willy Semedo','FWD',21,'Académico Viseu',true),
(t,'Gilson Tavares','MID',20,'Arouca',true),
(t,'Patrick Andrade','MID',15,'Qarabag',true),
(t,'Marco Soares','DEF',13,'GD Estoril Praia',true),
(t,'Márcio Nascimento','FWD',22,'Ac Reggiana',true);

-- Saudi Arabia (KSA)
select id into t from teams where fifa_code = 'KSA';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Mohammed Al-Owais','GK',1,'Al-Hilal',true),
(t,'Nawaf Al-Aqidi','GK',21,'Al-Shabab',true),
(t,'Yasser Al-Mosailem','GK',23,'Al-Ettifaq',true),
(t,'Saud Abdulhamid','DEF',2,'Al-Hilal',true),
(t,'Ali Al-Bulayhi','DEF',5,'Al-Hilal',true),
(t,'Hassan Tambakti','DEF',4,'Al-Shabab',true),
(t,'Abdulelah Al-Amri','DEF',13,'Al-Fayha',true),
(t,'Yasser Al-Shahrani','DEF',3,'Al-Hilal',true),
(t,'Abdulellah Al-Malki','DEF',17,'Al-Ahli',true),
(t,'Ali Al-Hassan','MID',8,'Al-Shabab',true),
(t,'Mohamed Kanno','MID',6,'Al-Hilal',true),
(t,'Abdulelah Al-Malki','MID',16,'Al-Ahli',true),
(t,'Abdullah Al-Hamdan','MID',10,'Al-Shabab',true),
(t,'Saleh Al-Shehri','MID',15,'Al-Hilal',true),
(t,'Salem Al-Dawsari','FWD',7,'Al-Hilal',true),
(t,'Firas Al-Buraikan','FWD',11,'Al-Fateh',true),
(t,'Abdullah Radif','FWD',9,'Al-Ahli',true),
(t,'Mohammed Al-Shehri','FWD',19,'Al-Ahli',true),
(t,'Haitham Asiri','FWD',20,'Al-Ittihad',true),
(t,'Riyadh Sharahili','MID',14,'Al-Nassr',true),
(t,'Sultan Al-Ghannam','DEF',22,'Al-Ahli',true),
(t,'Nasser Al-Dawsari','MID',18,'Al-Hilal',true),
(t,'Khalid Al-Ghannam','FWD',12,'Al-Nassr',true);

-- Uruguay (URU)
select id into t from teams where fifa_code = 'URU';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Sergio Rochet','GK',1,'Internacional',true),
(t,'Sebastián Sosa','GK',12,'Independiente',true),
(t,'Santiago Mele','GK',23,'Junior',true),
(t,'Nahitan Nández','DEF',2,'Cagliari',true),
(t,'José María Giménez','DEF',3,'Atletico Madrid',true),
(t,'Ronald Araújo','DEF',4,'Barcelona',true),
(t,'Sebastián Coates','DEF',5,'Sporting CP',true),
(t,'Mathías Olivera','DEF',6,'Napoli',true),
(t,'Guillermo Varela','DEF',14,'Flamengo',true),
(t,'Matías Vecino','MID',8,'Lazio',true),
(t,'Lucas Torreira','MID',7,'Galatasaray',true),
(t,'Manuel Ugarte','MID',17,'PSG',true),
(t,'Federico Valverde','MID',10,'Real Madrid',true),
(t,'Facundo Pellistri','MID',16,'Manchester United',true),
(t,'Darwin Núñez','FWD',9,'Liverpool',true),
(t,'Luis Suárez','FWD',10,'Inter Miami',true),
(t,'Edinson Cavani','FWD',21,'Valencia',true),
(t,'Maxi Gómez','FWD',13,'Spartak Moscow',true),
(t,'Giorgian de Arrascaeta','MID',11,'Flamengo',true),
(t,'Rodrigo Bentancur','MID',15,'Tottenham',true),
(t,'Agustín Canobbio','FWD',18,'Athletico Paranaense',true),
(t,'Diego Godín','DEF',22,'Vélez Sársfield',true),
(t,'Nicolás De La Cruz','MID',19,'River Plate',true);

-- ============================================================
-- GROUP I
-- ============================================================

-- France (FRA)
select id into t from teams where fifa_code = 'FRA';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Mike Maignan','GK',1,'AC Milan',true),
(t,'Alphonse Areola','GK',23,'West Ham',true),
(t,'Brice Samba','GK',16,'RC Lens',true),
(t,'Jules Koundé','DEF',5,'Barcelona',true),
(t,'Dayot Upamecano','DEF',4,'Bayern Munich',true),
(t,'William Saliba','DEF',17,'Arsenal',true),
(t,'Théo Hernández','DEF',22,'AC Milan',true),
(t,'Lucas Hernández','DEF',21,'PSG',true),
(t,'Benjamin Pavard','DEF',2,'Inter',true),
(t,'N''Golo Kanté','MID',13,'Al-Ittihad',true),
(t,'Aurélien Tchouaméni','MID',8,'Real Madrid',true),
(t,'Antoine Griezmann','MID',7,'Atletico Madrid',true),
(t,'Adrien Rabiot','MID',14,'Juventus',true),
(t,'Youssouf Fofana','MID',15,'AC Milan',true),
(t,'Kylian Mbappé','FWD',10,'Real Madrid',true),
(t,'Ousmane Dembélé','FWD',11,'PSG',true),
(t,'Marcus Thuram','FWD',9,'Inter',true),
(t,'Kingsley Coman','FWD',20,'Bayern Munich',true),
(t,'Randal Kolo Muani','FWD',12,'PSG',true),
(t,'Bradley Barcola','FWD',18,'PSG',true),
(t,'Jonathan Clauss','DEF',3,'Marseille',true),
(t,'Eduardo Camavinga','MID',6,'Real Madrid',true),
(t,'Warren Zaïre-Emery','MID',19,'PSG',true);

-- Senegal (SEN)
select id into t from teams where fifa_code = 'SEN';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Édouard Mendy','GK',1,'Chelsea',true),
(t,'Alfred Gomis','GK',16,'Villarreal',true),
(t,'Seny Dieng','GK',23,'Middlesbrough',true),
(t,'Bouna Sarr','DEF',2,'Bayern Munich',true),
(t,'Kalidou Koulibaly','DEF',5,'Chelsea',true),
(t,'Abdou Diallo','DEF',3,'RB Leipzig',true),
(t,'Pape Abou Cissé','DEF',4,'Olympiakos',true),
(t,'Formose Mendy','DEF',6,'Amiens',true),
(t,'Fodé Ballo-Touré','DEF',15,'AC Milan',true),
(t,'Idrissa Gueye','MID',8,'Everton',true),
(t,'Cheikhou Kouyaté','MID',6,'Nottm Forest',true),
(t,'Nampalys Mendy','MID',14,'Leicester',true),
(t,'Pathé Ciss','MID',17,'Rayo Vallecano',true),
(t,'Pape Matar Sarr','MID',7,'Tottenham',true),
(t,'Sadio Mané','FWD',10,'Al-Nassr',true),
(t,'Ismaïla Sarr','FWD',11,'Crystal Palace',true),
(t,'Boulaye Dia','FWD',9,'Salernitana',true),
(t,'Nicolas Jackson','FWD',18,'Chelsea',true),
(t,'Habib Diallo','FWD',19,'Strasbourg',true),
(t,'Abdallah Sima','FWD',20,'Brighton',true),
(t,'Lamine Camara','MID',13,'AS Monaco',true),
(t,'Iliman Ndiaye','FWD',22,'Marseille',true),
(t,'Youssouf Sabaly','DEF',21,'Real Betis',true);

-- Iraq (IRQ)
select id into t from teams where fifa_code = 'IRQ';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Jalal Hassan','GK',1,'Al-Zawraa',true),
(t,'Mohammed Hameed','GK',22,'Al-Quwa Al-Jawiya',true),
(t,'Saad Natiq','GK',23,'Naft Al-Wasat',true),
(t,'Amjad Attwan','DEF',2,'Al-Zawraa',true),
(t,'Ali Adnan','DEF',3,'Giresunspor',true),
(t,'Saad Abdul-Amir','DEF',4,'Erbil',true),
(t,'Hussein Ali','DEF',5,'Al-Naft',true),
(t,'Rebin Sulaka','DEF',14,'Duhok',true),
(t,'Mahmoud Khalid','DEF',15,'Al-Zawraa',true),
(t,'Safaa Hadi','MID',6,'Al-Quwa Al-Jawiya',true),
(t,'Alaa Abdul-Zahra','MID',8,'Al-Zawraa',true),
(t,'Mohanad Abdul-Raheem','MID',10,'Shabab Al-Ahli',true),
(t,'Ali Faez','MID',16,'Al-Quwa Al-Jawiya',true),
(t,'Ahmed Yasin','MID',7,'Real Betis',true),
(t,'Aymen Hussein','FWD',9,'Al-Zawraa',true),
(t,'Bashar Resan','FWD',11,'FC Penafiel',true),
(t,'Ali Jasim','FWD',19,'Almería',true),
(t,'Emad Mohammed','FWD',17,'Al-Zawraa',true),
(t,'Osama Rashid','FWD',20,'Altay',true),
(t,'Ibrahim Bayesh','MID',18,'Al-Shorta',true),
(t,'Ahmed Al-Agouri','MID',12,'Al-Zawraa',true),
(t,'Karrar Mohammed','DEF',13,'Al-Naft',true),
(t,'Salam Shakir','FWD',21,'Air Force Club',true);

-- Norway (NOR)
select id into t from teams where fifa_code = 'NOR';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Ørjan Nyland','GK',1,'Brentford',true),
(t,'Rune Almenning Jarstein','GK',12,'Hertha BSC',true),
(t,'Jørgen Strand Larsen','GK',23,'Celta Vigo',true),
(t,'Kristoffer Ajer','DEF',2,'Brentford',true),
(t,'Leo Skiri Østigård','DEF',5,'Napoli',true),
(t,'Andreas Hanche-Olsen','DEF',4,'Gent',true),
(t,'Birger Meling','DEF',3,'Nantes',true),
(t,'Omar Elabdellaoui','DEF',14,'Olympiakos',true),
(t,'Fredrik Bjørkan','DEF',6,'Bochum',true),
(t,'Martin Ødegaard','MID',8,'Arsenal',true),
(t,'Sander Berge','MID',7,'Fulham',true),
(t,'Mathias Normann','MID',16,'Norwich',true),
(t,'Morten Thorsby','MID',17,'Genoa',true),
(t,'Fredrik Aursnes','MID',15,'Benfica',true),
(t,'Erling Haaland','FWD',9,'Man City',true),
(t,'Alexander Sørloth','FWD',11,'Atletico Madrid',true),
(t,'Mohamed Elyounoussi','FWD',10,'Celtic',true),
(t,'Ola Solbakken','FWD',20,'Roma',true),
(t,'Jens Petter Hauge','FWD',18,'Gent',true),
(t,'Kristian Thorvaldsen','DEF',22,'Rosenborg',true),
(t,'Patrick Berg','MID',19,'Bodo/Glimt',true),
(t,'Tobias Svendsen','FWD',21,'Bodo/Glimt',true),
(t,'Joel Risa','DEF',13,'Molde',true);

-- ============================================================
-- GROUP J
-- ============================================================

-- Argentina (ARG)
select id into t from teams where fifa_code = 'ARG';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Emiliano Martínez','GK',23,'Aston Villa',true),
(t,'Franco Armani','GK',1,'River Plate',true),
(t,'Geronimo Rulli','GK',12,'Ajax',true),
(t,'Gonzalo Montiel','DEF',2,'Nottm Forest',true),
(t,'Nicolás Otamendi','DEF',19,'Benfica',true),
(t,'Cristian Romero','DEF',13,'Tottenham',true),
(t,'Lisandro Martínez','DEF',14,'Man United',true),
(t,'Nicolás Tagliafico','DEF',3,'Olympique Lyon',true),
(t,'Nahuel Molina','DEF',26,'Atletico Madrid',true),
(t,'Rodrigo De Paul','MID',7,'Atletico Madrid',true),
(t,'Leandro Paredes','MID',5,'Roma',true),
(t,'Enzo Fernández','MID',24,'Chelsea',true),
(t,'Alexis Mac Allister','MID',20,'Liverpool',true),
(t,'Giovani Lo Celso','MID',18,'Villarreal',true),
(t,'Lionel Messi','FWD',10,'Inter Miami',true),
(t,'Julián Álvarez','FWD',9,'Atletico Madrid',true),
(t,'Lautaro Martínez','FWD',22,'Inter',true),
(t,'Paulo Dybala','FWD',21,'Roma',true),
(t,'Ángel Di María','FWD',11,'Benfica',true),
(t,'Marcos Acuña','DEF',8,'Sevilla',true),
(t,'Exequiel Palacios','MID',15,'Bayer Leverkusen',true),
(t,'Thiago Almada','MID',16,'Botafogo',true),
(t,'Valentín Carboni','MID',17,'Inter',true);

-- Algeria (ALG)
select id into t from teams where fifa_code = 'ALG';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Raïs M''Bolhi','GK',1,'Al-Ettifaq',true),
(t,'Alexandre Oukidja','GK',16,'Metz',true),
(t,'Yehia Fathi','GK',23,'CR Belouizdad',true),
(t,'Mehdi Zeffane','DEF',2,'Al-Arabi',true),
(t,'Aïssa Mandi','DEF',5,'Villarreal',true),
(t,'Ramy Bensebaïni','DEF',3,'Borussia Dortmund',true),
(t,'Djamel Benlamri','DEF',4,'Lyon',true),
(t,'Hossam Akaichi','DEF',15,'Al-Ittihad',true),
(t,'Saïd Benrahma','MID',7,'Lyon',true),
(t,'Ismaël Bennacer','MID',8,'AC Milan',true),
(t,'Ramiz Zerrouki','MID',14,'Freiburg',true),
(t,'Billal Brahimi','MID',11,'Al-Qadsiah',true),
(t,'Youcef Atal','DEF',17,'Nice',true),
(t,'Andy Delort','FWD',9,'Al-Nassr',true),
(t,'Riyad Mahrez','FWD',10,'Al-Ahli',true),
(t,'Islam Slimani','FWD',19,'Brest',true),
(t,'Yacine Brahimi','FWD',20,'Al-Qadsiah',true),
(t,'Sofiane Feghouli','FWD',18,'Galatasaray',true),
(t,'Baghdad Bounedjah','FWD',21,'Al-Sadd',true),
(t,'Djamel Benlamri','DEF',13,'Nantes',true),
(t,'Haris Belkebla','MID',6,'Bochum',true),
(t,'Farès Chaïbi','MID',22,'Eintracht Frankfurt',true),
(t,'Abdelkader Bedrane','DEF',12,'RC Lens',true);

-- Austria (AUT)
select id into t from teams where fifa_code = 'AUT';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Patrick Pentz','GK',1,'Bayer Leverkusen',true),
(t,'Heinz Lindner','GK',12,'Eintracht Frankfurt',true),
(t,'Daniel Bachmann','GK',23,'Watford',true),
(t,'Stefan Lainer','DEF',2,'Mönchengladbach',true),
(t,'Philipp Lienhart','DEF',4,'Freiburg',true),
(t,'Aleksandar Dragović','DEF',5,'Bayer Leverkusen',true),
(t,'Maximilian Wöber','DEF',3,'Leeds',true),
(t,'David Alaba','DEF',6,'Real Madrid',true),
(t,'Phillipp Mwene','DEF',14,'PSV',true),
(t,'Julian Baumgartlinger','MID',8,'Bayer Leverkusen',true),
(t,'Konrad Laimer','MID',7,'Bayern Munich',true),
(t,'Marcel Sabitzer','MID',10,'Man United',true),
(t,'Xaver Schlager','MID',17,'RB Leipzig',true),
(t,'Christoph Baumgartner','MID',19,'RB Leipzig',true),
(t,'Marko Arnautović','FWD',9,'Inter',true),
(t,'Michael Gregoritsch','FWD',11,'Freiburg',true),
(t,'Sasa Kalajdzic','FWD',20,'Wolves',true),
(t,'Florian Grillitsch','MID',15,'Ajax',true),
(t,'Patrick Wimmer','MID',16,'VfL Wolfsburg',true),
(t,'Romano Schmid','MID',21,'Werder Bremen',true),
(t,'Gernot Trauner','DEF',22,'Feyenoord',true),
(t,'Guido Burgstaller','FWD',13,'Rapid Wien',true),
(t,'Nicolas Seiwald','MID',18,'RB Leipzig',true);

-- Jordan (JOR)
select id into t from teams where fifa_code = 'JOR';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Yazeed Abu Laila','GK',1,'Al-Wehdat',true),
(t,'Amer Shafi','GK',12,'Shabab Al-Ordon',true),
(t,'Mohammad Abu Zaid','GK',23,'Al-Ramtha',true),
(t,'Mohammad Al-Dmeiri','DEF',2,'Al-Wehdat',true),
(t,'Baher Al-Nasour','DEF',5,'Al-Ahli Amman',true),
(t,'Anas Bani Yaseen','DEF',3,'Al-Qadsiah',true),
(t,'Baha''a Faisal','DEF',4,'Al-Qadsiah',true),
(t,'Mahmoud Al-Mardi','DEF',6,'Al-Wehdat',true),
(t,'Saeed Al-Murjan','DEF',14,'Al-Faisaly',true),
(t,'Musa Al-Taamari','MID',10,'Montpellier',true),
(t,'Yazan Al-Naimat','MID',8,'Al-Qadsiah',true),
(t,'Mohammad Rashdan','MID',7,'Nantes',true),
(t,'Ahmad Al-Saraireh','MID',16,'Al-Ahli Amman',true),
(t,'Mahmoud Al-Rawashdeh','MID',17,'Pakhtakor',true),
(t,'Ali Olwan','FWD',9,'Sepahan',true),
(t,'Ahmad Hayel','FWD',11,'Al-Faisaly',true),
(t,'Khaled Al-Rashdan','FWD',19,'Al-Ahli Amman',true),
(t,'Zaid Qunbar','FWD',18,'Pakhtakor',true),
(t,'Saleh Rateb','MID',15,'Al-Wehdat',true),
(t,'Hamza Al-Dardour','FWD',21,'Huesca',true),
(t,'Odai Al-Saify','DEF',13,'Sepahan',true),
(t,'Ebrahim Hashem','MID',20,'Al-Shorta',true),
(t,'Hesham Izzaldeen','FWD',22,'Al-Faisaly',true);

-- ============================================================
-- GROUP K
-- ============================================================

-- Portugal (POR)
select id into t from teams where fifa_code = 'POR';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Diogo Costa','GK',1,'Porto',true),
(t,'José Sá','GK',22,'Wolves',true),
(t,'Rui Patrício','GK',12,'Roma',true),
(t,'João Cancelo','DEF',20,'Barcelona',true),
(t,'Rúben Dias','DEF',4,'Man City',true),
(t,'Pepe','DEF',3,'Porto',true),
(t,'Gonçalo Inácio','DEF',5,'Sporting CP',true),
(t,'Nuno Mendes','DEF',19,'PSG',true),
(t,'Diogo Dalot','DEF',2,'Man United',true),
(t,'William Carvalho','MID',14,'Real Betis',true),
(t,'João Palhinha','MID',26,'Bayern Munich',true),
(t,'Bruno Fernandes','MID',8,'Man United',true),
(t,'Bernardo Silva','MID',10,'Man City',true),
(t,'Vitinha','MID',17,'PSG',true),
(t,'Cristiano Ronaldo','FWD',7,'Al-Nassr',true),
(t,'Gonçalo Ramos','FWD',9,'PSG',true),
(t,'Rafael Leão','FWD',11,'AC Milan',true),
(t,'Pedro Neto','FWD',16,'Chelsea',true),
(t,'João Félix','FWD',21,'Chelsea',true),
(t,'Ricardo Horta','FWD',18,'Braga',true),
(t,'Rúben Neves','MID',15,'Al-Hilal',true),
(t,'Matheus Nunes','MID',13,'Man City',true),
(t,'Danilo Pereira','DEF',6,'PSG',true);

-- DR Congo (COD)
select id into t from teams where fifa_code = 'COD';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Joël Kiassumbua','GK',1,'Vittoria Setubal',true),
(t,'Lionel Mpasi','GK',16,'TP Mazembe',true),
(t,'Ley Matampi','GK',23,'AS V.Club',true),
(t,'Chancel Mbemba','DEF',5,'Porto',true),
(t,'Marcel Tisserand','DEF',4,'Fenerbahçe',true),
(t,'Yannick Ngoma','DEF',3,'Valenciennes',true),
(t,'Silas Mvumpa','DEF',2,'As Vita Club',true),
(t,'Arthur Masuaku','DEF',6,'West Ham',true),
(t,'Lionel Carole','DEF',15,'Guingamp',true),
(t,'Yannick Bolasie','MID',7,'Middlesbrough',true),
(t,'Paul-José Mpoku','MID',10,'Standard Liège',true),
(t,'Cédric Bakambu','FWD',9,'Marseille',true),
(t,'Formose Mendy','MID',14,'Amiens',true),
(t,'Junior Kabananga','FWD',11,'Astana',true),
(t,'Jonathan Bolingi','FWD',19,'Anderlecht',true),
(t,'Merveille Bokadi','DEF',13,'Standard Liège',true),
(t,'Neeskens Kebano','MID',8,'Fulham',true),
(t,'Samuel Moutoussamy','MID',17,'Nantes',true),
(t,'Meschak Elia','FWD',18,'Young Boys',true),
(t,'Firmin Mubele','FWD',20,'Al-Shabab',true),
(t,'Jordi Osei-Tutu','DEF',22,'VfL Bochum',true),
(t,'Ben Malango','FWD',21,'Neftçi Baku',true),
(t,'Ndombe Mubele','MID',12,'Guangzhou City',true);

-- Uzbekistan (UZB)
select id into t from teams where fifa_code = 'UZB';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Abduvohid Nishonov','GK',1,'Pakhtakor',true),
(t,'Jasur Yaxshiboyev','GK',12,'Nasaf Qarshi',true),
(t,'Sanjar Kuvandiqov','GK',23,'Lokomotiv Tashkent',true),
(t,'Dostonbek Tursunov','DEF',2,'Pakhtakor',true),
(t,'Oybek Botirov','DEF',5,'Pakhtakor',true),
(t,'Bahodir Ashurmatov','DEF',4,'Pakhtakor',true),
(t,'Otabek Shukurov','DEF',3,'Al-Qadsiah',true),
(t,'Husayn Norchaev','DEF',6,'Lokomotiv Tashkent',true),
(t,'Shamsiddin Latipov','DEF',14,'Pakhtakor',true),
(t,'Odil Ahmedov','MID',6,'Standard Liège',true),
(t,'Jaloliddin Masharipov','MID',8,'Pakhtakor',true),
(t,'Jamshid Iskanderov','MID',10,'Bunyodkor',true),
(t,'Bekhruz Tursunov','MID',7,'Pakhtakor',true),
(t,'Dilshod Narzullayev','MID',16,'Neftchi Fergana',true),
(t,'Eldor Shomurodov','FWD',9,'Roma',true),
(t,'Sherzod Nasrullayev','FWD',11,'Bunyodkor',true),
(t,'Abbosbek Fayzullayev','FWD',17,'Pakhtakor',true),
(t,'Ulugbek Asrorov','FWD',19,'Torpedo Moscow',true),
(t,'Muzaffar Yusupov','FWD',18,'Lokomotiv Tashkent',true),
(t,'Sardor Rashidov','MID',15,'Pakhtakor',true),
(t,'Bobur Abdixoliqov','DEF',13,'Pakhtakor',true),
(t,'Davron Tursunov','MID',20,'Nasaf',true),
(t,'Shokir Shodiyev','FWD',21,'Lokomotiv Tashkent',true);

-- Colombia (COL)
select id into t from teams where fifa_code = 'COL';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Camilo Vargas','GK',1,'Atlas',true),
(t,'David Ospina','GK',12,'Al-Nassr',true),
(t,'Álvaro Montero','GK',23,'Millonarios',true),
(t,'Daniel Muñoz','DEF',2,'Crystal Palace',true),
(t,'Dávinson Sánchez','DEF',4,'Galatasaray',true),
(t,'Yerry Mina','DEF',3,'Everton',true),
(t,'William Tesillo','DEF',5,'Club León',true),
(t,'Johan Mojica','DEF',6,'Girona',true),
(t,'Santiago Arias','DEF',14,'Bayer Leverkusen',true),
(t,'Wilmar Barrios','MID',8,'Zenit',true),
(t,'Mateus Uribe','MID',7,'Porto',true),
(t,'Juan Cuadrado','MID',11,'Inter',true),
(t,'James Rodríguez','MID',10,'Rayo Vallecano',true),
(t,'Richard Ríos','MID',16,'Palmeiras',true),
(t,'Luis Díaz','FWD',7,'Liverpool',true),
(t,'Jhon Durán','FWD',9,'Aston Villa',true),
(t,'Radamel Falcao','FWD',19,'Millonarios',true),
(t,'Rafael Santos Borré','FWD',18,'Eintracht Frankfurt',true),
(t,'Miguel Ángel Borja','FWD',20,'River Plate',true),
(t,'Óscar Estupiñán','FWD',21,'Watford',true),
(t,'Jefferson Lerma','MID',13,'Crystal Palace',true),
(t,'Jhon Jáder Durán','FWD',22,'Aston Villa',true),
(t,'Kevin Castaño','MID',15,'Al-Shabab',true);

-- ============================================================
-- GROUP L
-- ============================================================

-- England (ENG)
select id into t from teams where fifa_code = 'ENG';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Jordan Pickford','GK',1,'Everton',true),
(t,'Aaron Ramsdale','GK',22,'Arsenal',true),
(t,'Nick Pope','GK',13,'Newcastle',true),
(t,'Kyle Walker','DEF',2,'Man City',true),
(t,'Kieran Trippier','DEF',12,'Newcastle',true),
(t,'Harry Maguire','DEF',6,'Man United',true),
(t,'John Stones','DEF',5,'Man City',true),
(t,'Luke Shaw','DEF',3,'Man United',true),
(t,'Marc Guehi','DEF',4,'Crystal Palace',true),
(t,'Declan Rice','MID',4,'Arsenal',true),
(t,'Jude Bellingham','MID',22,'Real Madrid',true),
(t,'Trent Alexander-Arnold','MID',16,'Real Madrid',true),
(t,'Phil Foden','MID',11,'Man City',true),
(t,'Bukayo Saka','MID',17,'Arsenal',true),
(t,'Harry Kane','FWD',9,'Bayern Munich',true),
(t,'Marcus Rashford','FWD',10,'Man United',true),
(t,'Ollie Watkins','FWD',19,'Aston Villa',true),
(t,'Ivan Toney','FWD',18,'Al-Ahli',true),
(t,'Cole Palmer','FWD',20,'Chelsea',true),
(t,'Anthony Gordon','FWD',21,'Liverpool',true),
(t,'Conor Gallagher','MID',15,'Atletico Madrid',true),
(t,'Kobbie Mainoo','MID',14,'Man United',true),
(t,'Ezri Konsa','DEF',23,'Aston Villa',true);

-- Croatia (CRO)
select id into t from teams where fifa_code = 'CRO';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Dominik Livaković','GK',1,'Fenerbahçe',true),
(t,'Ivica Ivušić','GK',12,'Osijek',true),
(t,'Ivo Grbić','GK',23,'Atletico Madrid',true),
(t,'Josip Juranović','DEF',2,'Celtic',true),
(t,'Joško Gvardiol','DEF',3,'Man City',true),
(t,'Duje Ćaleta-Car','DEF',6,'Lyon',true),
(t,'Borna Sosa','DEF',4,'VfB Stuttgart',true),
(t,'Dejan Lovren','DEF',5,'Zenit',true),
(t,'Josip Stanišić','DEF',14,'Bayer Leverkusen',true),
(t,'Luka Modrić','MID',10,'Real Madrid',true),
(t,'Marcelo Brozović','MID',11,'Al-Nassr',true),
(t,'Mateo Kovačić','MID',8,'Man City',true),
(t,'Mario Pašalić','MID',9,'Atalanta',true),
(t,'Nikola Vlašić','MID',13,'West Ham',true),
(t,'Ivan Perišić','FWD',4,'Hajduk Split',true),
(t,'Ante Budimir','FWD',17,'Osasuna',true),
(t,'Bruno Petković','FWD',16,'Dinamo Zagreb',true),
(t,'Andrej Kramarić','FWD',9,'Hoffenheim',true),
(t,'Mislav Oršić','FWD',18,'Club Brugge',true),
(t,'Lovro Majer','MID',7,'Real Betis',true),
(t,'Luka Ivanušec','MID',20,'Dinamo Zagreb',true),
(t,'Borna Barisic','DEF',22,'Rangers',true),
(t,'Martin Erlić','DEF',15,'RB Leipzig',true);

-- Ghana (GHA)
select id into t from teams where fifa_code = 'GHA';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Lawrence Ati-Zigi','GK',1,'St. Gallen',true),
(t,'Ibrahim Danlad','GK',16,'Asante Kotoko',true),
(t,'Joe Wollacott','GK',23,'Charlton',true),
(t,'Tariq Lamptey','DEF',2,'Brighton',true),
(t,'Daniel Amartey','DEF',5,'Leicester',true),
(t,'Iddrisu Baba','DEF',4,'Mallorca',true),
(t,'Alexander Djiku','DEF',3,'Strasbourg',true),
(t,'Gideon Mensah','DEF',14,'Bordeaux',true),
(t,'Dennis Odoi','DEF',6,'Club Brugge',true),
(t,'Thomas Partey','MID',6,'Arsenal',true),
(t,'Mubarak Wakaso','MID',8,'Al-Raed',true),
(t,'André Ayew','MID',10,'Al-Qadsiah',true),
(t,'Mohammed Kudus','MID',14,'West Ham',true),
(t,'Salis Abdul Samed','MID',16,'RC Lens',true),
(t,'Jordan Ayew','FWD',11,'Crystal Palace',true),
(t,'Inaki Williams','FWD',9,'Athletic Bilbao',true),
(t,'Osman Bukari','FWD',17,'Red Star Belgrade',true),
(t,'Antoine Semenyo','FWD',19,'Bournemouth',true),
(t,'Ransford-Yeboah Königsdörffer','FWD',18,'Hamburger SV',true),
(t,'Daniel Kofi Kyereh','MID',20,'Freiburg',true),
(t,'Elisha Owusu','MID',15,'AZ Alkmaar',true),
(t,'Benjamin Tetteh','FWD',21,'Yeni Malatyaspor',true),
(t,'Edmund Addo','MID',13,'Sheriff Tiraspol',true);

-- Panama (PAN)
select id into t from teams where fifa_code = 'PAN';
insert into players (team_id, name, position, shirt_number, club, is_active) values
(t,'Luis Mejía','GK',1,'Independiente Medellín',true),
(t,'Jaime Penedo','GK',18,'Independiente La Chorrera',true),
(t,'Orlando Mosquera','GK',23,'Tauro FC',true),
(t,'Eric Davis','DEF',2,'Nashville SC',true),
(t,'Andrés Andrade','DEF',4,'Deportivo Cali',true),
(t,'César Yanis','DEF',5,'Anderlecht',true),
(t,'Harold Cummings','DEF',3,'Columbus Crew',true),
(t,'Michael Amir Murillo','DEF',6,'Anderlecht',true),
(t,'Fidel Escobar','DEF',15,'New York Red Bulls',true),
(t,'Adalberto Carrasquilla','MID',8,'Watford',true),
(t,'Alberto Quintero','MID',10,'Club Deportivo Plaza Amador',true),
(t,'Anibal Godoy','MID',7,'Nashville SC',true),
(t,'Ricardo Ávila','MID',14,'CD Árabe Unido',true),
(t,'Édgar Bárcenas','MID',17,'Numancia',true),
(t,'Rolando Blackburn','FWD',9,'Al-Qadsiah',true),
(t,'Cecilio Waterman','FWD',11,'Porto',true),
(t,'José Fajardo','FWD',19,'Rayo Vallecano',true),
(t,'Ismael Díaz','FWD',18,'El Jaish',true),
(t,'Gabriel Torres','FWD',21,'Atletico Tucumán',true),
(t,'Aníbal Godoy','MID',16,'Nashville SC',true),
(t,'Freddy Góndola','FWD',20,'AD San Carlos',true),
(t,'Iván Anderson','DEF',13,'Nottm Forest',true),
(t,'Jorman Aguilar','MID',22,'Club Guaraní',true);

end $$;
