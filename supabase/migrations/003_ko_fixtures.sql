-- WC 2026 Knockout Stage Fixtures
-- Slots 1-16 = R32 (M73-M88), 17-24 = R16, 25-28 = QF, 29-30 = SF, 31 = 3rd, 32 = Final
-- kickoff_at in UTC; toCDTDate subtracts 6h to get the CDT calendar day shown in the app

ALTER TABLE matches ADD COLUMN IF NOT EXISTS ko_stage text check (ko_stage in ('r32','r16','qf','sf','final','third'));
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_slot int;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS venue text;

INSERT INTO matches (stage, ko_stage, bracket_slot, kickoff_at, venue)
VALUES
  -- ── ROUND OF 32 (Jun 28 – Jul 3) ─────────────────────────────────────────
  ('knockout','r32', 1,  '2026-06-28 17:00:00+00', 'SoFi Stadium, Los Angeles'),
  ('knockout','r32', 2,  '2026-06-28 21:00:00+00', 'MetLife Stadium, New York'),
  ('knockout','r32', 3,  '2026-06-29 17:00:00+00', 'AT&T Stadium, Dallas'),
  ('knockout','r32', 4,  '2026-06-29 21:00:00+00', 'Hard Rock Stadium, Miami'),
  ('knockout','r32', 5,  '2026-06-30 17:00:00+00', 'Levi''s Stadium, San Francisco'),
  ('knockout','r32', 6,  '2026-06-30 20:00:00+00', 'Gillette Stadium, Boston'),
  ('knockout','r32', 7,  '2026-06-30 23:00:00+00', 'NRG Stadium, Houston'),
  ('knockout','r32', 8,  '2026-07-01 02:00:00+00', 'Estadio Azteca, Mexico City'),
  ('knockout','r32', 9,  '2026-07-01 17:00:00+00', 'Arrowhead Stadium, Kansas City'),
  ('knockout','r32', 10, '2026-07-01 21:00:00+00', 'Lincoln Financial Field, Philadelphia'),
  ('knockout','r32', 11, '2026-07-02 17:00:00+00', 'Lumen Field, Seattle'),
  ('knockout','r32', 12, '2026-07-02 21:00:00+00', 'BMO Field, Toronto'),
  ('knockout','r32', 13, '2026-07-03 17:00:00+00', 'Rose Bowl, Pasadena'),
  ('knockout','r32', 14, '2026-07-03 20:00:00+00', 'BC Place, Vancouver'),
  ('knockout','r32', 15, '2026-07-03 23:00:00+00', 'Estadio Akron, Guadalajara'),
  ('knockout','r32', 16, '2026-07-04 02:00:00+00', 'Estadio BBvA, Monterrey'),
  -- ── ROUND OF 16 (Jul 5–8) ────────────────────────────────────────────────
  ('knockout','r16', 17, '2026-07-05 17:00:00+00', 'MetLife Stadium, New York'),
  ('knockout','r16', 18, '2026-07-05 21:00:00+00', 'AT&T Stadium, Dallas'),
  ('knockout','r16', 19, '2026-07-06 17:00:00+00', 'SoFi Stadium, Los Angeles'),
  ('knockout','r16', 20, '2026-07-06 21:00:00+00', 'Hard Rock Stadium, Miami'),
  ('knockout','r16', 21, '2026-07-07 17:00:00+00', 'NRG Stadium, Houston'),
  ('knockout','r16', 22, '2026-07-07 21:00:00+00', 'Levi''s Stadium, San Francisco'),
  ('knockout','r16', 23, '2026-07-08 17:00:00+00', 'MetLife Stadium, New York'),
  ('knockout','r16', 24, '2026-07-08 21:00:00+00', 'AT&T Stadium, Dallas'),
  -- ── QUARTER-FINALS (Jul 10–11) ────────────────────────────────────────────
  ('knockout','qf',  25, '2026-07-10 17:00:00+00', 'MetLife Stadium, New York'),
  ('knockout','qf',  26, '2026-07-10 21:00:00+00', 'SoFi Stadium, Los Angeles'),
  ('knockout','qf',  27, '2026-07-11 17:00:00+00', 'AT&T Stadium, Dallas'),
  ('knockout','qf',  28, '2026-07-11 21:00:00+00', 'Hard Rock Stadium, Miami'),
  -- ── SEMI-FINALS (Jul 14–15) ──────────────────────────────────────────────
  ('knockout','sf',  29, '2026-07-14 21:00:00+00', 'MetLife Stadium, New York'),
  ('knockout','sf',  30, '2026-07-15 21:00:00+00', 'AT&T Stadium, Dallas'),
  -- ── THIRD PLACE (Jul 18) ─────────────────────────────────────────────────
  ('knockout','third', 31, '2026-07-18 17:00:00+00', 'Hard Rock Stadium, Miami'),
  -- ── FINAL (Jul 19) ───────────────────────────────────────────────────────
  ('knockout','final', 32, '2026-07-19 20:00:00+00', 'MetLife Stadium, New York')
ON CONFLICT DO NOTHING;
