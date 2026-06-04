export interface KnockoutPrediction {
  predHomeScore: number
  predAwayScore: number
  predWinnerId: string // player must pick a winner (no draws)
}

export interface KnockoutResult {
  actualHomeScore: number
  actualAwayScore: number
  actualWinnerId: string
  decidedBy: 'ft' | 'et' | 'pens'
}

/**
 * Score a knockout match prediction.
 * Players predict a decisive score (no draws allowed).
 * Rules:
 * - Correct outcome (correct winner): 1pt
 * - Correct GD + correct outcome: 2pt
 * - Exact score: 3pt
 * - Penalty special: if match went to pens and player correctly predicted
 *   advancing team → full 3pt regardless of score prediction
 */
export function scoreKnockoutMatch(
  pred: KnockoutPrediction,
  result: KnockoutResult,
): number {
  const correctWinner = pred.predWinnerId === result.actualWinnerId

  if (!correctWinner) return 0

  // Penalty special: correct winner in a pens match = 3pt automatically
  if (result.decidedBy === 'pens') return 3

  // Check exact score
  if (
    pred.predHomeScore === result.actualHomeScore &&
    pred.predAwayScore === result.actualAwayScore
  ) {
    return 3
  }

  // Check GD
  const predGD = pred.predHomeScore - pred.predAwayScore
  const actualGD = result.actualHomeScore - result.actualAwayScore

  if (predGD === actualGD) return 2

  // Correct winner only
  return 1
}
