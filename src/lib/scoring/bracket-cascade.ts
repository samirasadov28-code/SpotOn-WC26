/**
 * Shared bracket cascade logic — used by rescoreKOPts, max-pts, and ko-stage-preds.
 */

export const BRACKET_ADVANCE: Record<number, { nextSlot: number; side: 'home' | 'away' }> = {
  1:{nextSlot:18,side:'home'}, 2:{nextSlot:17,side:'home'}, 3:{nextSlot:18,side:'away'},
  4:{nextSlot:19,side:'home'}, 5:{nextSlot:17,side:'away'}, 6:{nextSlot:19,side:'away'},
  7:{nextSlot:20,side:'home'}, 8:{nextSlot:20,side:'away'}, 9:{nextSlot:22,side:'home'},
  10:{nextSlot:22,side:'away'},11:{nextSlot:21,side:'home'},12:{nextSlot:21,side:'away'},
  13:{nextSlot:24,side:'home'},14:{nextSlot:23,side:'home'},15:{nextSlot:24,side:'away'},
  16:{nextSlot:23,side:'away'},17:{nextSlot:25,side:'home'},18:{nextSlot:25,side:'away'},
  19:{nextSlot:27,side:'home'},20:{nextSlot:27,side:'away'},21:{nextSlot:26,side:'home'},
  22:{nextSlot:26,side:'away'},23:{nextSlot:28,side:'home'},24:{nextSlot:28,side:'away'},
  25:{nextSlot:29,side:'home'},26:{nextSlot:29,side:'away'},27:{nextSlot:30,side:'home'},
  28:{nextSlot:30,side:'away'},29:{nextSlot:32,side:'home'},30:{nextSlot:32,side:'away'},
}

/** Inverse: R16/QF/SF slot → which two prev-round slots feed home and away sides */
export const BRACKET_ADVANCE_INV: Record<number, { homeSlot: number; awaySlot: number }> = (() => {
  const inv: Record<number, { homeSlot: number; awaySlot: number }> = {}
  for (const [slotStr, adv] of Object.entries(BRACKET_ADVANCE)) {
    const slot = parseInt(slotStr)
    if (!inv[adv.nextSlot]) inv[adv.nextSlot] = { homeSlot: 0, awaySlot: 0 }
    if (adv.side === 'home') inv[adv.nextSlot].homeSlot = slot
    else inv[adv.nextSlot].awaySlot = slot
  }
  return inv
})()

/**
 * Cascades user score predictions through actual R32 seeds to derive which teams
 * the user predicted at each R16+ slot. Used as fallback when pred_home_team_id is null.
 */
export function buildUserBracket(
  actualSlotTeams: Map<number, { home: string; away: string }>,
  slotPreds: Map<number, { pred_home_score: number | null; pred_away_score: number | null }>
): Map<number, { home: string | null; away: string | null }> {
  const bt = new Map<number, { home: string | null; away: string | null }>()
  for (const [slot, teams] of actualSlotTeams) bt.set(slot, { home: teams.home, away: teams.away })

  const ALL_SLOTS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
                     17,18,19,20,21,22,23,24,25,26,27,28,29,30,32]
  for (const slot of ALL_SLOTS) {
    const teams = bt.get(slot)
    if (!teams?.home || !teams?.away) continue
    const pred = slotPreds.get(slot)
    if (!pred || pred.pred_home_score == null || pred.pred_away_score == null) continue

    const ph = pred.pred_home_score, pa = pred.pred_away_score
    const winner = ph >= pa ? teams.home : teams.away
    const loser  = winner === teams.home ? teams.away : teams.home

    const adv = BRACKET_ADVANCE[slot]
    if (adv) {
      if (!bt.has(adv.nextSlot)) bt.set(adv.nextSlot, { home: null, away: null })
      const next = bt.get(adv.nextSlot)!
      if (adv.side === 'home') next.home = winner; else next.away = winner
    }
    if (slot === 29 || slot === 30) {
      if (!bt.has(31)) bt.set(31, { home: null, away: null })
      const tp = bt.get(31)!
      if (slot === 29) tp.home = loser; else tp.away = loser
    }
  }
  return bt
}
