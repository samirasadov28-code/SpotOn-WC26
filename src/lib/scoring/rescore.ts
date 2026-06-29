import { createClient } from '@supabase/supabase-js'
import { scoreGroupMatch } from './group'
import { STAGE_POINTS } from './advancement'
import { loadGroupData, computeUserR32Positions, R32_DEFS } from './group-qualifiers'

// Derived from KO_SLOT_LABELS: slot N (=MN+72) feeds into which R16/QF/SF slot
// R16 slot 17=W M74+W M77, 18=W M73+W M75, 19=W M76+W M78, 20=W M79+W M80
//          21=W M83+W M84, 22=W M81+W M82, 23=W M86+W M88, 24=W M85+W M87
// QF  slot 25=W M89+W M90, 26=W M93+W M94, 27=W M91+W M92, 28=W M95+W M96
// SF  slot 29=W M97+W M98, 30=W M99+W M100
const BRACKET_ADVANCE: Record<number, { nextSlot: number; side: 'home' | 'away' }> = {
  // R32 → R16  (slot numbers map to match M(slot+72))
  1:  { nextSlot: 18, side: 'home' }, // M73 → M90 home
  2:  { nextSlot: 17, side: 'home' }, // M74 → M89 home
  3:  { nextSlot: 18, side: 'away' }, // M75 → M90 away
  4:  { nextSlot: 19, side: 'home' }, // M76 → M91 home
  5:  { nextSlot: 17, side: 'away' }, // M77 → M89 away
  6:  { nextSlot: 19, side: 'away' }, // M78 → M91 away
  7:  { nextSlot: 20, side: 'home' }, // M79 → M92 home
  8:  { nextSlot: 20, side: 'away' }, // M80 → M92 away
  9:  { nextSlot: 22, side: 'home' }, // M81 → M94 home
  10: { nextSlot: 22, side: 'away' }, // M82 → M94 away
  11: { nextSlot: 21, side: 'home' }, // M83 → M93 home
  12: { nextSlot: 21, side: 'away' }, // M84 → M93 away
  13: { nextSlot: 24, side: 'home' }, // M85 → M96 home
  14: { nextSlot: 23, side: 'home' }, // M86 → M95 home
  15: { nextSlot: 24, side: 'away' }, // M87 → M96 away
  16: { nextSlot: 23, side: 'away' }, // M88 → M95 away
  // R16 → QF
  17: { nextSlot: 25, side: 'home' }, 18: { nextSlot: 25, side: 'away' },
  19: { nextSlot: 27, side: 'home' }, 20: { nextSlot: 27, side: 'away' },
  21: { nextSlot: 26, side: 'home' }, 22: { nextSlot: 26, side: 'away' },
  23: { nextSlot: 28, side: 'home' }, 24: { nextSlot: 28, side: 'away' },
  // QF → SF
  25: { nextSlot: 29, side: 'home' }, 26: { nextSlot: 29, side: 'away' },
  27: { nextSlot: 30, side: 'home' }, 28: { nextSlot: 30, side: 'away' },
  // SF → Final
  29: { nextSlot: 32, side: 'home' },
  30: { nextSlot: 32, side: 'away' },
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

  // All KO matches with teams assigned
  const { data: koMatchesWithTeams } = await supabase
    .from('matches')
    .select('bracket_slot, home_team_id, away_team_id, actual_home_score, actual_away_score')
    .eq('stage', 'knockout')
    .not('home_team_id', 'is', null) as any

  // All KO predictions (score preds + R16+ team preds)
  const { data: preds } = await supabase
    .from('predictions_knockout')
    .select('user_id, bracket_slot, pred_home_team_id, pred_away_team_id, pred_home_score, pred_away_score') as any

  const matchBySlot = new Map(((koMatchesWithTeams ?? []) as any[]).map((m: any) => [m.bracket_slot as number, m]))

  // Compute R32 predictions from group predictions for all users
  const { groupMatchesByGroup, teamsByGroup, predsByUser } = await loadGroupData()
  // Map: userId -> Map<position, teamId>  e.g. '1F' -> teamId
  const userR32PosMap = new Map<string, Map<string, string>>()
  for (const [userId, userGroupPreds] of predsByUser) {
    userR32PosMap.set(userId, computeUserR32Positions(userGroupPreds, groupMatchesByGroup, teamsByGroup))
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

  // R16+ advancement and score pts
  for (const p of (preds ?? []) as any[]) {
    if ((p.bracket_slot as number) <= 16) continue
    const match = matchBySlot.get(p.bracket_slot as number)
    if (!match) continue

    const stage = slotStage(p.bracket_slot)
    const stagePts = STAGE_POINTS[stage] ?? 0

    let advAdd = 0
    if (p.pred_home_team_id && p.pred_home_team_id === match.home_team_id) advAdd += stagePts
    if (p.pred_away_team_id && p.pred_away_team_id === match.away_team_id) advAdd += stagePts

    // Final winner bonus
    if (p.bracket_slot === 32 && match.actual_home_score !== null) {
      const ah = match.actual_home_score as number, aa = match.actual_away_score as number
      const actualWinner = ah > aa ? match.home_team_id : match.away_team_id
      const ph = p.pred_home_score ?? 0, pa = p.pred_away_score ?? 0
      const predWinner = ph > pa ? p.pred_home_team_id : p.pred_away_team_id
      if (predWinner && predWinner === actualWinner) advAdd += STAGE_POINTS['winner'] ?? 16
    }

    if (advAdd > 0) userAdvPts.set(p.user_id, (userAdvPts.get(p.user_id) ?? 0) + advAdd)

    // KO score pts
    if (match.actual_home_score !== null && p.pred_home_score !== null && p.pred_away_score !== null) {
      const ph = p.pred_home_score as number, pa = p.pred_away_score as number
      const ah = match.actual_home_score as number, aa = match.actual_away_score as number
      let koPts = 0
      if (ph === ah && pa === aa) koPts = 3
      else if (ph - pa === ah - aa) koPts = 2
      else if (Math.sign(ph - pa) === Math.sign(ah - aa)) koPts = 1
      userKoPts.set(p.user_id, (userKoPts.get(p.user_id) ?? 0) + koPts)
    }
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
