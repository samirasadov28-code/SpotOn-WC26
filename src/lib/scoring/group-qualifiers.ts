import { getAnnexC, THIRD_SLOT_OPPONENT } from '@/lib/annex-c'
import { createClient } from '@supabase/supabase-js'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']

export const R32_DEFS = [
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

interface Stat { teamId: string; pts: number; gd: number; gf: number }

function simulateGroup(
  matches: any[],
  teams: any[],
  userPreds: Map<string, { h: number; a: number }>
): Stat[] {
  const stats = new Map<string, Stat>()
  for (const t of teams) stats.set(t.id, { teamId: t.id, pts: 0, gd: 0, gf: 0 })
  for (const m of matches) {
    const pred = userPreds.get(m.id)
    const h = pred !== undefined ? pred.h : m.actual_home_score
    const a = pred !== undefined ? pred.a : m.actual_away_score
    if (h === null || h === undefined || a === null || a === undefined) continue
    const hs = stats.get(m.home_team_id), as_ = stats.get(m.away_team_id)
    if (!hs || !as_) continue
    hs.gf += h; hs.gd += h - a
    as_.gf += a; as_.gd += a - h
    if (h > a) hs.pts += 3
    else if (h < a) as_.pts += 3
    else { hs.pts += 1; as_.pts += 1 }
  }
  return [...stats.values()].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

/** Given a user's group predictions, compute their predicted R32 position → teamId map */
export function computeUserR32Positions(
  userGroupPreds: Map<string, { h: number; a: number }>,
  groupMatchesByGroup: Map<string, any[]>,
  teamsByGroup: Map<string, any[]>
): Map<string, string> {
  const posMap = new Map<string, string>()
  const thirds: Array<Stat & { group: string }> = []

  for (const group of GROUPS) {
    const standings = simulateGroup(
      groupMatchesByGroup.get(group) ?? [],
      teamsByGroup.get(group) ?? [],
      userGroupPreds
    )
    if (standings[0]) posMap.set(`1${group}`, standings[0].teamId)
    if (standings[1]) posMap.set(`2${group}`, standings[1].teamId)
    if (standings[2]) thirds.push({ ...standings[2], group })
  }

  // Best 8 third-place teams
  thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  const best8 = thirds.slice(0, 8)
  const qualifyingGroups = best8.map(t => t.group)
  const thirdByGroup = new Map(best8.map(t => [t.group, t.teamId]))
  const annexC = getAnnexC(qualifyingGroups)

  // THIRD_SLOT_OPPONENT: '3rdN' → group-winner slot it faces (e.g. '3rd1' → '1E')
  // annexC: group-winner slot → '3X' (which group's 3rd plays there)
  for (const [placeholder, opponentSlot] of Object.entries(THIRD_SLOT_OPPONENT)) {
    if (annexC) {
      const entry = annexC[opponentSlot] // e.g. '3F'
      if (entry) {
        const grp = entry.slice(1) // 'F'
        const teamId = thirdByGroup.get(grp)
        if (teamId) posMap.set(placeholder, teamId)
      }
    } else {
      const idx = parseInt(placeholder.replace('3rd', '')) - 1
      if (best8[idx]) posMap.set(placeholder, best8[idx].teamId)
    }
  }

  return posMap
}

/** Load all the shared data needed (group matches, teams, user group preds) */
export async function loadGroupData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [matchRes, teamRes] = await Promise.all([
    supabase.from('matches')
      .select('id, home_team_id, away_team_id, actual_home_score, actual_away_score, group_letter')
      .eq('stage', 'group'),
    supabase.from('teams').select('id, group_letter'),
  ])

  const matches: any[] = matchRes.data ?? []
  const teams: any[] = teamRes.data ?? []

  // Paginate predictions_group to avoid 1000-row default limit
  const preds: any[] = []
  const PAGE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('predictions_group')
      .select('user_id, match_id, pred_home_score, pred_away_score')
      .range(from, from + PAGE - 1)
    if (error || !data?.length) break
    preds.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  const groupMatchesByGroup = new Map<string, any[]>()
  for (const m of matches) {
    if (!m.group_letter) continue
    if (!groupMatchesByGroup.has(m.group_letter)) groupMatchesByGroup.set(m.group_letter, [])
    groupMatchesByGroup.get(m.group_letter)!.push(m)
  }

  const teamsByGroup = new Map<string, any[]>()
  for (const t of teams) {
    if (!t.group_letter) continue
    if (!teamsByGroup.has(t.group_letter)) teamsByGroup.set(t.group_letter, [])
    teamsByGroup.get(t.group_letter)!.push(t)
  }

  // Group predictions by user
  const predsByUser = new Map<string, Map<string, { h: number; a: number }>>()
  for (const p of preds) {
    if (p.pred_home_score === null || p.pred_away_score === null) continue
    if (!predsByUser.has(p.user_id)) predsByUser.set(p.user_id, new Map())
    predsByUser.get(p.user_id)!.set(p.match_id, { h: p.pred_home_score, a: p.pred_away_score })
  }

  return { groupMatchesByGroup, teamsByGroup, predsByUser }
}
