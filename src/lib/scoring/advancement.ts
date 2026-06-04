const STAGE_POINTS: Record<string, number> = {
  r32: 1,
  r16: 2,
  qf: 4,
  sf: 8,
  final: 12,
  winner: 16,
  third_match: 4,
  third_winner: 8,
}

const STAGE_ORDER = ['r32', 'r16', 'qf', 'sf', 'final']

/**
 * Calculates cumulative advancement points.
 * @param predictedStage - furthest stage the player predicted the team to reach
 * @param actualStage - furthest stage the team actually reached
 * @returns cumulative points earned
 */
export function scoreAdvancement(
  predictedStage: string,
  actualStage: string,
): number {
  const predIdx = STAGE_ORDER.indexOf(predictedStage)
  const actualIdx = STAGE_ORDER.indexOf(actualStage)
  const minIdx = Math.min(predIdx, actualIdx)
  if (minIdx < 0) return 0
  let pts = 0
  for (let i = 0; i <= minIdx; i++) pts += STAGE_POINTS[STAGE_ORDER[i]]
  return pts
}

export { STAGE_POINTS, STAGE_ORDER }
