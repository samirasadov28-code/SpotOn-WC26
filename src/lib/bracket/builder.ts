import type { Team, Match } from '@/lib/supabase/types'
import { rankTeamsInGroup, selectBestThirdPlaced, TeamGroupStats } from './tiebreakers'
import { scoreGroupMatch } from '@/lib/scoring/group'

export interface GroupMatchPrediction {
  matchId: string
  homeTeamId: string
  awayTeamId: string
  predHome: number
  predAway: number
  groupLetter: string
}

export interface BracketSlot {
  slot: number
  homeTeamId: string | null
  awayTeamId: string | null
  stage: string
  label: string
}

export interface BracketData {
  r32: BracketSlot[]
  r16: BracketSlot[]
  qf: BracketSlot[]
  sf: BracketSlot[]
  final: BracketSlot | null
  thirdPlace: BracketSlot | null
  groupTables: Record<string, TeamGroupStats[]>
}

// FIFA predetermined slotting for best third-placed teams in R32
// The 8 best thirds from groups A-L fill specific R32 slots
// NOTE: This is a placeholder table — verify against official 2026 FIFA schedule
// Key: comma-sorted group letters of best 8 thirds → array of slot assignments
// For now we use a sequential assignment to the "third-placed" R32 positions (slots 17-24)
const THIRD_PLACE_R32_SLOTS = [17, 18, 19, 20, 21, 22, 23, 24]

/**
 * Build a predicted bracket from group stage predictions.
 */
export function buildPredictedBracket(
  predictions: GroupMatchPrediction[],
  matches: Match[],
  teams: Team[],
): BracketData {
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]))
  const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  // Build group tables
  const groupTables: Record<string, TeamGroupStats[]> = {}

  for (const grp of groupLetters) {
    const groupTeams = teams.filter((t) => t.group_letter === grp)
    const stats = new Map<string, TeamGroupStats>(
      groupTeams.map((t) => [
        t.id,
        {
          teamId: t.id,
          points: 0,
          goalDiff: 0,
          goalsFor: 0,
          h2hPoints: 0,
          h2hGoalDiff: 0,
          h2hGoalsFor: 0,
          fifaRanking: 99, // placeholder — real FIFA rankings not available
        },
      ])
    )

    const groupMatches = predictions.filter((p) => p.groupLetter === grp)

    for (const pred of groupMatches) {
      const home = stats.get(pred.homeTeamId)
      const away = stats.get(pred.awayTeamId)
      if (!home || !away) continue

      const pts = scoreGroupMatch(
        { predHome: pred.predHome, predAway: pred.predAway },
        { actualHome: pred.predHome, actualAway: pred.predAway }, // "predicted result IS the result" for bracket building
      )
      void pts // we don't need scoring here, just outcome

      const gd = pred.predHome - pred.predAway
      if (gd > 0) {
        home.points += 3
      } else if (gd === 0) {
        home.points += 1
        away.points += 1
      } else {
        away.points += 3
      }

      home.goalDiff += gd
      home.goalsFor += pred.predHome
      away.goalDiff -= gd
      away.goalsFor += pred.predAway
    }

    groupTables[grp] = rankTeamsInGroup([...stats.values()])
  }

  // Extract winners, runners-up, third-placed
  const winners: string[] = []
  const runnersUp: string[] = []
  const thirds: TeamGroupStats[] = []

  for (const grp of groupLetters) {
    const table = groupTables[grp]
    if (table[0]) winners.push(table[0].teamId)
    if (table[1]) runnersUp.push(table[1].teamId)
    if (table[2]) thirds.push(table[2])
  }

  const bestThirds = selectBestThirdPlaced(thirds).map((t) => t.teamId)

  // Build R32 slots (32 matches)
  // Slots 1-12: group winners vs runners-up (standard pattern)
  // Slots 13-16: winner vs runner-up cross-group matches
  // Slots 17-24: best thirds
  // NOTE: exact pairing depends on official FIFA bracket — using simplified sequential pairing
  const r32: BracketSlot[] = []

  // Group A winner vs Group B runner-up, etc. — simplified pairing
  const r32Pairings = [
    [winners[0], runnersUp[1]],   // A1 vs B2
    [winners[2], runnersUp[3]],   // C1 vs D2
    [winners[4], runnersUp[5]],   // E1 vs F2
    [winners[6], runnersUp[7]],   // G1 vs H2
    [winners[8], runnersUp[9]],   // I1 vs J2
    [winners[10], runnersUp[11]], // K1 vs L2
    [winners[1], runnersUp[0]],   // B1 vs A2
    [winners[3], runnersUp[2]],   // D1 vs C2
    [winners[5], runnersUp[4]],   // F1 vs E2
    [winners[7], runnersUp[6]],   // H1 vs G2
    [winners[9], runnersUp[8]],   // J1 vs I2
    [winners[11], runnersUp[10]], // L1 vs K2
    // Third-placed slots
    ...(bestThirds.map((t, i) => [t, bestThirds[i + 8] ?? null]) as [string, string | null][]).slice(0, 8).map(
      ([t, _opp], i) => [t, runnersUp[i] ?? null] as [string | null, string | null]
    ),
  ]

  // Actually build proper R32 with thirds paired with winners/runners-up
  const fullR32Pairs: [string | null, string | null][] = [
    [winners[0], runnersUp[1]],
    [winners[2], runnersUp[3]],
    [winners[4], runnersUp[5]],
    [winners[6], runnersUp[7]],
    [winners[8], runnersUp[9]],
    [winners[10], runnersUp[11]],
    [winners[1], runnersUp[0]],
    [winners[3], runnersUp[2]],
    [winners[5], runnersUp[4]],
    [winners[7], runnersUp[6]],
    [winners[9], runnersUp[8]],
    [winners[11], runnersUp[10]],
    // Best thirds paired against strongest teams not yet matched
    [bestThirds[0] ?? null, winners[0] ?? null], // placeholder pairings
    [bestThirds[1] ?? null, winners[1] ?? null],
    [bestThirds[2] ?? null, winners[2] ?? null],
    [bestThirds[3] ?? null, winners[3] ?? null],
    [bestThirds[4] ?? null, winners[4] ?? null],
    [bestThirds[5] ?? null, winners[5] ?? null],
    [bestThirds[6] ?? null, winners[6] ?? null],
    [bestThirds[7] ?? null, winners[7] ?? null],
  ]

  void r32Pairings // suppress unused warning

  for (let i = 0; i < 16; i++) {
    const pair = fullR32Pairs[i] ?? [null, null]
    r32.push({
      slot: i + 1,
      homeTeamId: pair[0] ?? null,
      awayTeamId: pair[1] ?? null,
      stage: 'r32',
      label: `R32 Match ${i + 1}`,
    })
  }

  // Further rounds would need actual match outcomes predicted
  // For bracket building from group predictions only, we generate R32
  // and leave later rounds as TBD
  const r16: BracketSlot[] = Array.from({ length: 8 }, (_, i) => ({
    slot: 17 + i,
    homeTeamId: null,
    awayTeamId: null,
    stage: 'r16',
    label: `R16 Match ${i + 1}`,
  }))

  const qf: BracketSlot[] = Array.from({ length: 4 }, (_, i) => ({
    slot: 25 + i,
    homeTeamId: null,
    awayTeamId: null,
    stage: 'qf',
    label: `QF Match ${i + 1}`,
  }))

  const sf: BracketSlot[] = Array.from({ length: 2 }, (_, i) => ({
    slot: 29 + i,
    homeTeamId: null,
    awayTeamId: null,
    stage: 'sf',
    label: `SF Match ${i + 1}`,
  }))

  const final: BracketSlot = {
    slot: 31,
    homeTeamId: null,
    awayTeamId: null,
    stage: 'final',
    label: 'Final',
  }

  const thirdPlace: BracketSlot = {
    slot: 32,
    homeTeamId: null,
    awayTeamId: null,
    stage: 'third',
    label: 'Third Place',
  }

  void teamMap
  void THIRD_PLACE_R32_SLOTS

  return {
    r32,
    r16,
    qf,
    sf,
    final,
    thirdPlace,
    groupTables,
  }
}
