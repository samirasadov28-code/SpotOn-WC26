export interface TeamGroupStats {
  teamId: string
  points: number
  goalDiff: number
  goalsFor: number
  // head-to-head vs tied teams
  h2hPoints: number
  h2hGoalDiff: number
  h2hGoalsFor: number
  fifaRanking: number // for deterministic final tiebreak (lower = better)
}

/**
 * Rank teams in a group using full FIFA tiebreaker logic:
 * 1. Points
 * 2. Goal difference
 * 3. Goals for
 * 4. H2H points (among tied teams)
 * 5. H2H goal difference (among tied teams)
 * 6. H2H goals for (among tied teams)
 * 7. FIFA ranking (deterministic final tiebreak)
 */
export function rankTeamsInGroup(teams: TeamGroupStats[]): TeamGroupStats[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
    // h2h among tied teams
    if (b.h2hPoints !== a.h2hPoints) return b.h2hPoints - a.h2hPoints
    if (b.h2hGoalDiff !== a.h2hGoalDiff) return b.h2hGoalDiff - a.h2hGoalDiff
    if (b.h2hGoalsFor !== a.h2hGoalsFor) return b.h2hGoalsFor - a.h2hGoalsFor
    // deterministic final tiebreak: lower FIFA ranking number = better
    return a.fifaRanking - b.fifaRanking
  })
}

/**
 * Given a list of third-placed teams (one per group) and their stats,
 * return the 8 best third-placed teams ranked by:
 * 1. Points, 2. GD, 3. GF, 4. FIFA ranking
 */
export function selectBestThirdPlaced(
  thirdTeams: TeamGroupStats[],
): TeamGroupStats[] {
  return [...thirdTeams]
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor
      return a.fifaRanking - b.fifaRanking
    })
    .slice(0, 8)
}
