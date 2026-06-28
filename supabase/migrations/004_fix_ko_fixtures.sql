-- Fix KO fixture kickoff times and assign R32 team IDs
-- Run this in Supabase SQL editor if the /api/admin/sync-ko-fixtures endpoint fails

-- ── R32: correct kickoff_at + home/away team IDs ─────────────────────────────
UPDATE matches SET kickoff_at='2026-06-28 20:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='RSA'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='CAN')
  WHERE stage='knockout' AND bracket_slot=1;

UPDATE matches SET kickoff_at='2026-06-29 21:30:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='GER'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='PAR')
  WHERE stage='knockout' AND bracket_slot=2;

UPDATE matches SET kickoff_at='2026-06-30 02:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='NED'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='MAR')
  WHERE stage='knockout' AND bracket_slot=3;

UPDATE matches SET kickoff_at='2026-06-29 18:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='BRA'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='JPN')
  WHERE stage='knockout' AND bracket_slot=4;

UPDATE matches SET kickoff_at='2026-06-30 22:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='FRA'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='SWE')
  WHERE stage='knockout' AND bracket_slot=5;

UPDATE matches SET kickoff_at='2026-06-30 18:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='CIV'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='NOR')
  WHERE stage='knockout' AND bracket_slot=6;

UPDATE matches SET kickoff_at='2026-07-01 02:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='MEX'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='ECU')
  WHERE stage='knockout' AND bracket_slot=7;

UPDATE matches SET kickoff_at='2026-07-01 17:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='ENG'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='COD')
  WHERE stage='knockout' AND bracket_slot=8;

UPDATE matches SET kickoff_at='2026-07-02 01:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='USA'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='BIH')
  WHERE stage='knockout' AND bracket_slot=9;

UPDATE matches SET kickoff_at='2026-07-01 21:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='BEL'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='SEN')
  WHERE stage='knockout' AND bracket_slot=10;

UPDATE matches SET kickoff_at='2026-07-03 00:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='POR'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='CRO')
  WHERE stage='knockout' AND bracket_slot=11;

UPDATE matches SET kickoff_at='2026-07-02 20:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='ESP'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='AUT')
  WHERE stage='knockout' AND bracket_slot=12;

UPDATE matches SET kickoff_at='2026-07-03 04:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='SUI'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='ALG')
  WHERE stage='knockout' AND bracket_slot=13;

UPDATE matches SET kickoff_at='2026-07-03 23:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='ARG'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='CPV')
  WHERE stage='knockout' AND bracket_slot=14;

UPDATE matches SET kickoff_at='2026-07-04 02:30:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='COL'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='GHA')
  WHERE stage='knockout' AND bracket_slot=15;

UPDATE matches SET kickoff_at='2026-07-03 19:00:00+00',
  home_team_id=(SELECT id FROM teams WHERE fifa_code='AUS'),
  away_team_id=(SELECT id FROM teams WHERE fifa_code='EGY')
  WHERE stage='knockout' AND bracket_slot=16;

-- ── R16–Final: correct kickoff_at only ───────────────────────────────────────
UPDATE matches SET kickoff_at='2026-07-04 22:00:00+00' WHERE stage='knockout' AND bracket_slot=17;
UPDATE matches SET kickoff_at='2026-07-04 18:00:00+00' WHERE stage='knockout' AND bracket_slot=18;
UPDATE matches SET kickoff_at='2026-07-05 21:00:00+00' WHERE stage='knockout' AND bracket_slot=19;
UPDATE matches SET kickoff_at='2026-07-06 01:00:00+00' WHERE stage='knockout' AND bracket_slot=20;
UPDATE matches SET kickoff_at='2026-07-06 20:00:00+00' WHERE stage='knockout' AND bracket_slot=21;
UPDATE matches SET kickoff_at='2026-07-07 01:00:00+00' WHERE stage='knockout' AND bracket_slot=22;
UPDATE matches SET kickoff_at='2026-07-07 17:00:00+00' WHERE stage='knockout' AND bracket_slot=23;
UPDATE matches SET kickoff_at='2026-07-07 21:00:00+00' WHERE stage='knockout' AND bracket_slot=24;
UPDATE matches SET kickoff_at='2026-07-09 21:00:00+00' WHERE stage='knockout' AND bracket_slot=25;
UPDATE matches SET kickoff_at='2026-07-10 20:00:00+00' WHERE stage='knockout' AND bracket_slot=26;
UPDATE matches SET kickoff_at='2026-07-11 22:00:00+00' WHERE stage='knockout' AND bracket_slot=27;
UPDATE matches SET kickoff_at='2026-07-12 02:00:00+00' WHERE stage='knockout' AND bracket_slot=28;
UPDATE matches SET kickoff_at='2026-07-14 20:00:00+00' WHERE stage='knockout' AND bracket_slot=29;
UPDATE matches SET kickoff_at='2026-07-15 20:00:00+00' WHERE stage='knockout' AND bracket_slot=30;
UPDATE matches SET kickoff_at='2026-07-18 22:00:00+00' WHERE stage='knockout' AND bracket_slot=31;
UPDATE matches SET kickoff_at='2026-07-19 20:00:00+00' WHERE stage='knockout' AND bracket_slot=32;
