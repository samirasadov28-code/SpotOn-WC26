import { createClient } from '@supabase/supabase-js'
import { scoreGroupMatch } from './group'
import { STAGE_POINTS } from './advancement'
import { loadGroupData, computeUserR32Positions, R32_DEFS } from './group-qualifiers'
import { BRACKET_ADVANCE } from './bracket-cascade'
import { simulateAllMatchups } from '@/lib/bracket-sim'
import type { MatchInfo, TeamInfo } from '@/lib/bracket-sim'

/**
 * Populates R32 match slots (bracket_slot 1–16) with actual group-stage qualified teams.
 * Must run before syncKOBracket() so winner propagation has team IDs to work with.
 */
export async function syncR32Teams() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { groupMatchesByGroup, teamsByGroup } = await loadGroupData()

  // Empty user preds + strictUserPreds=false → uses actual scores to compute standings
  const actualR32Pos = computeUserR32Positions(
    new Map(),
    groupMatchesByGroup,
    teamsByGroup,
    false
  )

  for (const def of R32_DEFS) {
    const homeTeamId = actualR32Pos.get(def.homePos) ?? null
    const awayTeamId = actualR32Pos.get(def.awayPos) ?? null
    if (homeTeamId && awayTeamId) {
      await supabase.from('matches')
        .update({ home_team_id: homeTeamId, away_team_id: awayTeamId })
        .eq('stage', 'knockout')
        .eq('bracket_slot', def.slot)
    }
  }
}

/**
 * Reads all played KO matches and propagates each winner to the next bracket slot.
 * Safe to run repeatedly — always overwrites from actual results.
 */
export async function syncKOBracket() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Clear all bracket-derived team IDs (slots 17–32) before re-populating
  await supabase.from('matches')
    .update({ home_team_id: null, away_team_id: null })
    .eq('stage', 'knockout')
    .gte('bracket_slot', 17)

  const { data: played } = await supabase
    .from('matches')
    .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score, actual_winner_id')
    .eq('stage', 'knockout')
    .not('actual_home_score', 'is', null) as any

  for (const m of (played ?? []) as any[]) {
    const slot = m.bracket_slot as number
    const adv = BRACKET_ADVANCE[slot]
    if (!adv) continue

    // Determine winner
    let winnerId: string | null = m.actual_winner_id ?? null
    if (!winnerId) {
      const ah = m.actual_home_score as number, aa = m.actual_away_score as number
      if (ah > aa) winnerId = m.home_team_id
      else if (aa > ah) winnerId = m.away_team_id
    }
    if (!winnerId) continue

    const field = adv.side === 'home' ? 'home_team_id' : 'away_team_id'
    await supabase.from('matches')
      .update({ [field]: winnerId })
      .eq('stage', 'knockout')
      .eq('bracket_slot', adv.nextSlot)

    // SF losers go to 3rd-place match
    if (slot === 29 || slot === 30) {
      const loserId = winnerId === m.home_team_id ? m.away_team_id : m.home_team_id
      if (loserId) {
        const loserField = slot === 29 ? 'home_team_id' : 'away_team_id'
        await supabase.from('matches')
          .update({ [loserField]: loserId })
          .eq('stage', 'knockout')
          .eq('bracket_slot', 31)
      }
    }
  }
}

function slotStage(slot: number): string {
  if (slot <= 16) return 'r32'
  if (slot <= 24) return 'r16'
  if (slot <= 28) return 'qf'
  if (slot <= 30) return 'sf'
  if (slot === 31) return 'third_match'
  return 'final'
}

export async function rescoreAllGroupPts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // All finished group matches
  const { data: matches } = await supabase
    .from('matches')
    .select('id, actual_home_score, actual_away_score')
    .eq('stage', 'group')
    .not('actual_home_score', 'is', null) as any

  if (!matches?.length) return

  // Fetch ALL group predictions in pages to avoid the default 1000-row limit
  const allPreds: any[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('predictions_group')
      .select('user_id, match_id, pred_home_score, pred_away_score')
      .order('match_id')
      .range(from, from + PAGE - 1) as any
    if (error || !data?.length) break
    allPreds.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  const matchMap = new Map((matches as any[]).map((m: any) => [m.id, m]))

  // Sum group pts per user from scratch
  const groupPtsMap = new Map<string, number>()
  for (const p of allPreds) {
    if (p.pred_home_score === null || p.pred_away_score === null) continue
    const m = matchMap.get(p.match_id)
    if (!m) continue
    const pts = scoreGroupMatch(
      { predHome: p.pred_home_score, predAway: p.pred_away_score },
      { actualHome: m.actual_home_score, actualAway: m.actual_away_score }
    )
    groupPtsMap.set(p.user_id, (groupPtsMap.get(p.user_id) ?? 0) + pts)
  }

  // Get existing scores to preserve advancement_pts and knockout_match_pts
  const { data: existingScores } = await supabase.from('scores').select('*') as any
  const existingMap = new Map((existingScores ?? []).map((s: any) => [s.user_id, s]))

  // Reset every user that already has a scores row (covers users with 0 group pts too)
  const allUserIds = new Set([...groupPtsMap.keys(), ...(existingScores ?? []).map((s: any) => s.user_id)])

  for (const userId of allUserIds) {
    const groupPts = groupPtsMap.get(userId) ?? 0
    const existing = existingMap.get(userId) as any
    const advPts = existing?.advancement_pts ?? 0
    const koPts = existing?.knockout_match_pts ?? 0
    await supabase.from('scores').upsert({
      user_id: userId,
      group_pts: groupPts,
      advancement_pts: advPts,
      knockout_match_pts: koPts,
      total_pts: groupPts + advPts + koPts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }
}

/**
 * Rescores KO advancement pts and KO match score pts from scratch.
 *
 * R32 advancement: computed from group predictions (pred_home_team_id is null in DB).
 * R16+: uses pred_home_team_id / pred_away_team_id directly.
 */
export async function rescoreKOPts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // All matches and teams (needed for simulateAllMatchups)
  const [koMatchesRes, allMatchesRes, allTeamsRes] = await Promise.all([
    supabase.from('matches')
      .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score')
      .eq('stage', 'knockout')
      .not('home_team_id', 'is', null),
    supabase.from('matches')
      .select('id, stage, group_letter, home_team_id, away_team_id'),
    supabase.from('teams')
      .select('id, name, fifa_code, group_letter, flag_emoji'),
  ])

  // All KO predictions (score preds)
  const { data: preds } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score') as any

  const matchBySlot = new Map(((koMatchesRes.data ?? []) as any[]).map((m: any) => [m.bracket_slot as number, m]))

  const allMatchesFull: MatchInfo[] = ((allMatchesRes.data ?? []) as any[]).map((m: any) => ({
    id: m.id, group_letter: m.group_letter, home_team_id: m.home_team_id, away_team_id: m.away_team_id,
  }))
  const allTeamsFull: TeamInfo[] = ((allTeamsRes.data ?? []) as any[]).map((t: any) => ({
    id: t.id, name: t.name, fifa_code: t.fifa_code, group_letter: t.group_letter, flag_emoji: t.flag_emoji,
  }))

  // Compute R32 predictions from group predictions for all users
  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()
  // Map: userId -> Map<position, teamId>  e.g. '1F' -> teamId
  const userR32PosMap = new Map<string, Map<string, string>>()
  for (const [userId, userGroupPreds] of predsByUser) {
    userR32PosMap.set(userId, computeUserR32Positions(userGroupPreds, groupMatchesByGroup, teamsByGroup, true))
  }

  // Collect all actual R32 teams
  const actualR32Teams = new Set<string>()
  for (const def of R32_DEFS) {
    const m = matchBySlot.get(def.slot)
    if (!m) continue
    if (m.home_team_id) actualR32Teams.add(m.home_team_id)
    if (m.away_team_id) actualR32Teams.add(m.away_team_id)
  }

  const userAdvPts = new Map<string, number>()
  const userKoPts = new Map<string, number>()

  // R32 advancement pts: 1pt per team user predicted that actually appears in R32 (any position)
  for (const [userId, posMap] of userR32PosMap) {
    let advAdd = 0
    for (const teamId of posMap.values()) {
      if (actualR32Teams.has(teamId)) advAdd += STAGE_POINTS['r32'] ?? 1
    }
    if (advAdd > 0) userAdvPts.set(userId, (userAdvPts.get(userId) ?? 0) + advAdd)
  }

  // R32 score pts from predictions_knockout (scores are stored even if team IDs are null)
  for (const p of (preds ?? []) as any[]) {
    if ((p.bracket_slot as number) > 16) continue
    const match = matchBySlot.get(p.bracket_slot as number)
    if (!match || match.actual_home_score === null) continue
    if (p.pred_home_score === null || p.pred_away_score === null) continue
    // Only award score pts if user predicted this match pair (via their group predictions)
    const def = R32_DEFS.find(d => d.slot === p.bracket_slot)
    if (!def) continue
    const userPos = userR32PosMap.get(p.user_id)
    if (!userPos) continue
    const predHome = userPos.get(def.homePos)
    const predAway = userPos.get(def.awayPos)
    if (!predHome || !predAway || predHome !== match.home_team_id || predAway !== match.away_team_id) continue
    const ph = p.pred_home_score as number, pa = p.pred_away_score as number
    const ah = match.actual_home_score as number, aa = match.actual_away_score as number
    let koPts = 0
    if (ph === ah && pa === aa) koPts = 3
    else if (ph - pa === ah - aa) koPts = 2
    else if (Math.sign(ph - pa) === Math.sign(ah - aa)) koPts = 1
    userKoPts.set(p.user_id, (userKoPts.get(p.user_id) ?? 0) + koPts)
  }

  // Build per-user KO score preds map (slot → {h, a})
  const userKoScorePreds = new Map<string, Map<number, { h: number; a: number }>>()
  for (const p of (preds ?? []) as any[]) {
    if (p.pred_home_score === null) continue
    if (!userKoScorePreds.has(p.user_id)) userKoScorePreds.set(p.user_id, new Map())
    userKoScorePreds.get(p.user_id)!.set(p.bracket_slot as number, { h: p.pred_home_score, a: p.pred_away_score })
  }

  // Simulate each user's full predicted bracket using their group + KO score predictions.
  // This correctly handles users who predicted a team (e.g. Canada) in a different R32 slot
  // than the one it actually played in — the simulation seeds from group predictions, not
  // from actual slot assignments, so the path is user-specific.
  const userSimSlot = new Map<string, Map<number, { home: string | null; away: string | null }>>()
  const allUsersWithPreds = new Set([...predsByUser.keys(), ...userKoScorePreds.keys()])
  for (const userId of allUsersWithPreds) {
    const gp = predsByUser.get(userId) ?? new Map()
    const kp = userKoScorePreds.get(userId) ?? new Map()
    if (gp.size === 0 && kp.size === 0) continue
    const matchups = simulateAllMatchups(gp, kp, allMatchesFull, allTeamsFull)
    userSimSlot.set(userId, new Map(matchups.map(m => [m.slot, { home: m.home?.id ?? null, away: m.away?.id ?? null }])))
  }

  // Build actual teams present in each KO stage (stage-based, not slot-based).
  // Teams *in* a stage = teams that appear as home/away in that stage's matches.
  // We use all matches (whether played or not) for team set — actual pts only count for played ones.
  const STAGE_SLOTS: Record<string, number[]> = {
    r16:         [17,18,19,20,21,22,23,24],
    qf:          [25,26,27,28],
    sf:          [29,30],
    third_match: [31],
    final:       [32],
  }
  const actualStageTeams = new Map<string, Set<string>>()
  for (const [stage, slots] of Object.entries(STAGE_SLOTS)) {
    const teams = new Set<string>()
    for (const slot of slots) {
      const m = matchBySlot.get(slot) as any
      if (m?.home_team_id) teams.add(m.home_team_id)
      if (m?.away_team_id) teams.add(m.away_team_id)
    }
    if (teams.size > 0) actualStageTeams.set(stage, teams)
  }

  // Actual champion for winner bonus
  const finalMatchActual = matchBySlot.get(32) as any
  let actualChampionId: string | null = null
  if (finalMatchActual?.actual_home_score !== null && finalMatchActual?.actual_home_score !== undefined) {
    actualChampionId = finalMatchActual.actual_winner_id ?? null
    if (!actualChampionId) {
      const ah = finalMatchActual.actual_home_score as number, aa = finalMatchActual.actual_away_score as number
      actualChampionId = ah >= aa ? finalMatchActual.home_team_id : finalMatchActual.away_team_id
    }
  }

  // R16+ advancement pts — stage-based:
  // For each KO stage, award stagePts for each unique team the user predicted to be
  // in that stage that actually IS in that stage (regardless of which specific slot).
  for (const [userId, simSlots] of userSimSlot) {
    let advAdd = 0

    for (const [stage, slots] of Object.entries(STAGE_SLOTS)) {
      const stagePts = STAGE_POINTS[stage] ?? 0
      if (stagePts === 0) continue
      const actualTeams = actualStageTeams.get(stage)
      if (!actualTeams || actualTeams.size === 0) continue

      // Collect unique teams the user predicted to appear in this stage
      const predictedTeams = new Set<string>()
      for (const slot of slots) {
        const s = simSlots.get(slot)
        if (s?.home) predictedTeams.add(s.home)
        if (s?.away) predictedTeams.add(s.away)
      }

      for (const teamId of predictedTeams) {
        if (actualTeams.has(teamId)) advAdd += stagePts
      }
    }

    // Final winner bonus (16pts): user's predicted winner of the final = actual champion
    if (actualChampionId) {
      const kp = userKoScorePreds.get(userId) ?? new Map()
      const finalPred = kp.get(32)
      const finalSim = simSlots.get(32)
      if (finalPred && finalPred.h !== finalPred.a && finalSim) {
        const predWinnerId = finalPred.h > finalPred.a ? finalSim.home : finalSim.away
        if (predWinnerId && predWinnerId === actualChampionId) {
          advAdd += STAGE_POINTS['winner'] ?? 16
        }
      }
    }

    if (advAdd > 0) userAdvPts.set(userId, (userAdvPts.get(userId) ?? 0) + advAdd)
  }

  // KO score pts (R16+): 3/2/1 for exact/GD/outcome — pair check required
  for (const p of (preds ?? []) as any[]) {
    const slot = p.bracket_slot as number
    if (slot <= 16) continue
    const match = matchBySlot.get(slot) as any
    if (!match || match.actual_home_score === null) continue
    if (p.pred_home_score === null || p.pred_away_score === null) continue
    // Pair check: user must have predicted both correct teams for this slot
    const simSlot = userSimSlot.get(p.user_id)?.get(slot)
    const actualHome = match.home_team_id as string | null
    const actualAway = match.away_team_id as string | null
    if (!actualHome || !actualAway || !simSlot?.home || !simSlot?.away) continue
    const pairMatch = (simSlot.home === actualHome && simSlot.away === actualAway) ||
                      (simSlot.home === actualAway && simSlot.away === actualHome)
    if (!pairMatch) continue
    const ph = p.pred_home_score as number, pa = p.pred_away_score as number
    const ah = match.actual_home_score as number, aa = match.actual_away_score as number
    let koPts = 0
    if (ph === ah && pa === aa) koPts = 3
    else if (ph - pa === ah - aa) koPts = 2
    else if (Math.sign(ph - pa) === Math.sign(ah - aa)) koPts = 1
    if (koPts > 0) userKoPts.set(p.user_id, (userKoPts.get(p.user_id) ?? 0) + koPts)
  }

  // Preserve group_pts; overwrite advancement_pts and knockout_match_pts
  const { data: existingScores } = await supabase.from('scores').select('*') as any
  const existingMap = new Map(((existingScores ?? []) as any[]).map((s: any) => [s.user_id as string, s]))

  const allUserIds = new Set([
    ...userAdvPts.keys(), ...userKoPts.keys(),
    ...((existingScores ?? []) as any[]).map((s: any) => s.user_id as string),
  ])

  for (const userId of allUserIds) {
    const advPts = userAdvPts.get(userId) ?? 0
    const koPts = userKoPts.get(userId) ?? 0
    const existing = existingMap.get(userId) as any
    const groupPts = existing?.group_pts ?? 0
    await supabase.from('scores').upsert({
      user_id: userId,
      group_pts: groupPts,
      advancement_pts: advPts,
      knockout_match_pts: koPts,
      total_pts: groupPts + advPts + koPts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }
}
