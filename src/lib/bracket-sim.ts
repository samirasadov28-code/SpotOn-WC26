import { getAnnexC, THIRD_SLOT_OPPONENT } from '@/lib/annex-c'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

const R32_DEFS = [
  { slot: 1,  homePos: '2A',   awayPos: '2B'   },
  { slot: 2,  homePos: '1E',   awayPos: '3rd1' },
  { slot: 3,  homePos: '1F',   awayPos: '2C'   },
  { slot: 4,  homePos: '1C',   awayPos: '2F'   },
  { slot: 5,  homePos: '1I',   awayPos: '3rd2' },
  { slot: 6,  homePos: '2E',   awayPos: '2I'   },
  { slot: 7,  homePos: '1A',   awayPos: '3rd3' },
  { slot: 8,  homePos: '1L',   awayPos: '3rd4' },
  { slot: 9,  homePos: '1D',   awayPos: '3rd5' },
  { slot: 10, homePos: '1G',   awayPos: '3rd6' },
  { slot: 11, homePos: '2K',   awayPos: '2L'   },
  { slot: 12, homePos: '1H',   awayPos: '2J'   },
  { slot: 13, homePos: '1B',   awayPos: '3rd7' },
  { slot: 14, homePos: '1J',   awayPos: '2H'   },
  { slot: 15, homePos: '1K',   awayPos: '3rd8' },
  { slot: 16, homePos: '2D',   awayPos: '2G'   },
] as const

const LATER_DEFS = [
  { slot: 17, homeParent: 2,  awayParent: 5,  stage: 'r16'   },
  { slot: 18, homeParent: 1,  awayParent: 3,  stage: 'r16'   },
  { slot: 19, homeParent: 4,  awayParent: 6,  stage: 'r16'   },
  { slot: 20, homeParent: 7,  awayParent: 8,  stage: 'r16'   },
  { slot: 21, homeParent: 11, awayParent: 12, stage: 'r16'   },
  { slot: 22, homeParent: 9,  awayParent: 10, stage: 'r16'   },
  { slot: 23, homeParent: 14, awayParent: 16, stage: 'r16'   },
  { slot: 24, homeParent: 13, awayParent: 15, stage: 'r16'   },
  { slot: 25, homeParent: 17, awayParent: 18, stage: 'qf'    },
  { slot: 26, homeParent: 21, awayParent: 22, stage: 'qf'    },
  { slot: 27, homeParent: 19, awayParent: 20, stage: 'qf'    },
  { slot: 28, homeParent: 23, awayParent: 24, stage: 'qf'    },
  { slot: 29, homeParent: 25, awayParent: 26, stage: 'sf'    },
  { slot: 30, homeParent: 27, awayParent: 28, stage: 'sf'    },
  { slot: 31, homeParent: 29, awayParent: 30, stage: 'third' },
  { slot: 32, homeParent: 29, awayParent: 30, stage: 'final' },
]

export interface TeamInfo {
  id: string
  name: string
  fifa_code: string
  group_letter: string | null
  flag_emoji?: string | null
}

export interface MatchInfo {
  id: string
  group_letter: string | null
  home_team_id: string | null
  away_team_id: string | null
}

// match_id → scores
type GroupPreds = Map<string, { h: number; a: number }>
// bracket_slot → scores
type KOPreds = Map<number, { h: number; a: number }>

function calcQualified(allMatches: MatchInfo[], allTeams: TeamInfo[], groupPreds: GroupPreds): Map<string, TeamInfo> {
  const qualified = new Map<string, TeamInfo>()
  const thirds: Array<{ group: string; pts: number; gd: number; gf: number; team: TeamInfo }> = []

  for (const g of GROUPS) {
    const gMatches = allMatches.filter(m => m.group_letter === g)
    const gTeams = allTeams.filter(t => t.group_letter === g)
    const stats = new Map<string, { team: TeamInfo; pts: number; gd: number; gf: number }>()
    for (const t of gTeams) stats.set(t.id, { team: t, pts: 0, gd: 0, gf: 0 })

    for (const m of gMatches) {
      const p = groupPreds.get(m.id)
      if (!p || !m.home_team_id || !m.away_team_id) continue
      const home = stats.get(m.home_team_id)
      const away = stats.get(m.away_team_id)
      if (!home || !away) continue
      home.gf += p.h; home.gd += p.h - p.a
      away.gf += p.a; away.gd += p.a - p.h
      if (p.h > p.a) { home.pts += 3 }
      else if (p.h < p.a) { away.pts += 3 }
      else { home.pts += 1; away.pts += 1 }
    }

    const sorted = [...stats.values()].sort((a, b) =>
      b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name)
    )

    if (sorted[0]) qualified.set('1' + g, sorted[0].team)
    if (sorted[1]) qualified.set('2' + g, sorted[1].team)
    if (sorted[2]) thirds.push({ group: g, ...sorted[2] })
  }

  const top8 = thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf).slice(0, 8)
  const thirdsMap = new Map(top8.map(t => [t.group, t.team]))

  const slotOpponents = Object.entries(THIRD_SLOT_OPPONENT).map(
    ([placeholder, opponent]) => ({ placeholder, opponentGroup: opponent[1] })
  )

  let assigned = false
  const annexMapping = getAnnexC(top8.map(t => t.group))
  if (annexMapping) {
    const temp = new Map<string, TeamInfo>()
    let valid = true
    for (const { placeholder, opponentGroup } of slotOpponents) {
      const groupCode = annexMapping['1' + opponentGroup]
      const groupLetter = groupCode?.slice(1)
      const team = groupLetter ? thirdsMap.get(groupLetter) : undefined
      if (!team || team.group_letter === opponentGroup) { valid = false; break }
      temp.set(placeholder, team)
    }
    if (valid && temp.size === slotOpponents.length) {
      for (const [k, v] of temp) qualified.set(k, v)
      assigned = true
    }
  }

  if (!assigned) {
    const remaining = [...top8]
    for (const { placeholder, opponentGroup } of slotOpponents) {
      const idx = remaining.findIndex(t => t.group !== opponentGroup)
      if (idx >= 0) { qualified.set(placeholder, remaining[idx].team); remaining.splice(idx, 1) }
      else if (remaining.length > 0) { qualified.set(placeholder, remaining[0].team); remaining.splice(0, 1) }
    }
  }

  return qualified
}

function getSlotTeams(slot: number, koPreds: KOPreds, qualified: Map<string, TeamInfo>) {
  if (slot <= 16) {
    const def = R32_DEFS.find(d => d.slot === slot)!
    return { home: qualified.get(def.homePos) ?? null, away: qualified.get(def.awayPos) ?? null }
  }
  const def = LATER_DEFS.find(d => d.slot === slot)!
  if (def.stage === 'third') {
    return {
      home: getLoserOfSlot(29, koPreds, qualified),
      away: getLoserOfSlot(30, koPreds, qualified),
    }
  }
  return {
    home: getWinnerOfSlot(def.homeParent, koPreds, qualified),
    away: getWinnerOfSlot(def.awayParent, koPreds, qualified),
  }
}

function getWinnerOfSlot(slot: number, koPreds: KOPreds, qualified: Map<string, TeamInfo>): TeamInfo | null {
  const { home, away } = getSlotTeams(slot, koPreds, qualified)
  const pred = koPreds.get(slot)
  if (!pred || pred.h === pred.a) return null
  return pred.h > pred.a ? home : away
}

function getLoserOfSlot(slot: number, koPreds: KOPreds, qualified: Map<string, TeamInfo>): TeamInfo | null {
  const { home, away } = getSlotTeams(slot, koPreds, qualified)
  const pred = koPreds.get(slot)
  if (!pred || pred.h === pred.a) return null
  return pred.h < pred.a ? home : away
}

export interface SimResult {
  champion: TeamInfo | null
  second: TeamInfo | null
  third: TeamInfo | null
  fourth: TeamInfo | null
}

export type ExitRound = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'fourth' | 'third' | 'second' | 'champion'

export function simulateRounds(
  groupPreds: GroupPreds,
  koPreds: KOPreds,
  allMatches: MatchInfo[],
  allTeams: TeamInfo[]
): Map<string, ExitRound> {
  const exits = new Map<string, ExitRound>()
  const qualified = calcQualified(allMatches, allTeams, groupPreds)
  const qualifiedIds = new Set([...qualified.values()].map(t => t.id))

  for (const team of allTeams) {
    if (!qualifiedIds.has(team.id)) exits.set(team.id, 'group')
  }

  for (let slot = 1; slot <= 16; slot++) {
    const { home, away } = getSlotTeams(slot, koPreds, qualified)
    const pred = koPreds.get(slot)
    if (!pred || pred.h === pred.a) continue
    const loser = pred.h > pred.a ? away : home
    if (loser) exits.set(loser.id, 'r32')
  }

  for (let slot = 17; slot <= 24; slot++) {
    const loser = getLoserOfSlot(slot, koPreds, qualified)
    if (loser) exits.set(loser.id, 'r16')
  }

  for (let slot = 25; slot <= 28; slot++) {
    const loser = getLoserOfSlot(slot, koPreds, qualified)
    if (loser) exits.set(loser.id, 'qf')
  }

  for (let slot = 29; slot <= 30; slot++) {
    const loser = getLoserOfSlot(slot, koPreds, qualified)
    if (loser) exits.set(loser.id, 'sf')
  }

  const thirdPred = koPreds.get(31)
  if (thirdPred && thirdPred.h !== thirdPred.a) {
    const { home: tHome, away: tAway } = getSlotTeams(31, koPreds, qualified)
    const third = thirdPred.h > thirdPred.a ? tHome : tAway
    const fourth = thirdPred.h > thirdPred.a ? tAway : tHome
    if (third) exits.set(third.id, 'third')
    if (fourth) exits.set(fourth.id, 'fourth')
  }

  const finalPred = koPreds.get(32)
  if (finalPred && finalPred.h !== finalPred.a) {
    const { home: fHome, away: fAway } = getSlotTeams(32, koPreds, qualified)
    const champ = finalPred.h > finalPred.a ? fHome : fAway
    const second = finalPred.h > finalPred.a ? fAway : fHome
    if (champ) exits.set(champ.id, 'champion')
    if (second) exits.set(second.id, 'second')
  }

  return exits
}

export function simulateBracket(
  groupPreds: GroupPreds,
  koPreds: KOPreds,
  allMatches: MatchInfo[],
  allTeams: TeamInfo[]
): SimResult {
  const qualified = calcQualified(allMatches, allTeams, groupPreds)

  const finalPred = koPreds.get(32)
  const sf1Pred = koPreds.get(29)
  const sf2Pred = koPreds.get(30)

  let champion: TeamInfo | null = null
  let second: TeamInfo | null = null
  let third: TeamInfo | null = null
  let fourth: TeamInfo | null = null

  if (finalPred && finalPred.h !== finalPred.a) {
    const { home: fHome, away: fAway } = getSlotTeams(32, koPreds, qualified)
    champion = finalPred.h > finalPred.a ? fHome : fAway
    second   = finalPred.h > finalPred.a ? fAway : fHome
  }

  const thirdPred = koPreds.get(31)
  if (thirdPred && thirdPred.h !== thirdPred.a) {
    const { home: tHome, away: tAway } = getSlotTeams(31, koPreds, qualified)
    third  = thirdPred.h > thirdPred.a ? tHome : tAway
    fourth = thirdPred.h > thirdPred.a ? tAway : tHome
  } else {
    // derive from SF losers directly
    if (sf1Pred && sf1Pred.h !== sf1Pred.a) {
      const { home: sf1Home, away: sf1Away } = getSlotTeams(29, koPreds, qualified)
      third = sf1Pred.h < sf1Pred.a ? sf1Home : sf1Away
    }
    if (sf2Pred && sf2Pred.h !== sf2Pred.a) {
      const { home: sf2Home, away: sf2Away } = getSlotTeams(30, koPreds, qualified)
      fourth = sf2Pred.h < sf2Pred.a ? sf2Home : sf2Away
    }
  }

  return { champion, second, third, fourth }
}
