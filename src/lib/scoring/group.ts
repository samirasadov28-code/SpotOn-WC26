export type GroupPrediction = { predHome: number; predAway: number }
export type GroupResult = { actualHome: number; actualAway: number }

export function scoreGroupMatch(pred: GroupPrediction, result: GroupResult): number {
  if (pred.predHome === result.actualHome && pred.predAway === result.actualAway) return 3
  const predGD = pred.predHome - pred.predAway
  const actualGD = result.actualHome - result.actualAway
  if (predGD === actualGD) return 2 // includes correct draw (both GD=0)
  // check outcome
  const predOutcome = Math.sign(predGD)
  const actualOutcome = Math.sign(actualGD)
  if (predOutcome === actualOutcome) return 1
  return 0
}
