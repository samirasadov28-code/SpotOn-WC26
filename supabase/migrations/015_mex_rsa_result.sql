-- Mexico 2-0 South Africa (Group A, MD1)

-- 1. Update the match result
UPDATE matches
SET
  actual_home_score = 2,
  actual_away_score = 0,
  actual_winner_id  = (SELECT id FROM teams WHERE fifa_code = 'MEX'),
  decided_by        = 'ft',
  is_final          = true
WHERE id = (
  SELECT m.id
  FROM   matches m
  JOIN   teams ht ON m.home_team_id = ht.id
  JOIN   teams at ON m.away_team_id = at.id
  WHERE  ht.fifa_code = 'MEX'
  AND    at.fifa_code = 'RSA'
  AND    m.stage = 'group'
  LIMIT  1
);

-- 2. Score every group prediction for this match
--    3 pts = exact (2-0), 2 pts = same GD (+2), 1 pt = correct outcome (MEX win)
WITH match_info AS (
  SELECT m.id AS match_id
  FROM   matches m
  JOIN   teams ht ON m.home_team_id = ht.id
  JOIN   teams at ON m.away_team_id = at.id
  WHERE  ht.fifa_code = 'MEX'
  AND    at.fifa_code = 'RSA'
  AND    m.stage = 'group'
  LIMIT  1
),
scored AS (
  SELECT
    pg.user_id,
    CASE
      WHEN pg.pred_home_score = 2 AND pg.pred_away_score = 0            THEN 3
      WHEN (pg.pred_home_score - pg.pred_away_score) = 2                THEN 2
      WHEN pg.pred_home_score > pg.pred_away_score                      THEN 1
      ELSE 0
    END AS pts
  FROM predictions_group pg
  JOIN match_info mi ON pg.match_id = mi.match_id
  WHERE pg.pred_home_score IS NOT NULL
    AND pg.pred_away_score IS NOT NULL
)
INSERT INTO scores (user_id, group_pts, total_pts, updated_at)
SELECT user_id, pts, pts, NOW()
FROM   scored
ON CONFLICT (user_id) DO UPDATE
  SET group_pts  = scores.group_pts  + EXCLUDED.group_pts,
      total_pts  = scores.total_pts  + EXCLUDED.total_pts,
      updated_at = NOW();
