import { TEAM_TRANSLATIONS } from './team-translations'
import { STATIC_TEAMS } from './teams-data'

const EN_NAMES: Record<string, string> = Object.fromEntries(
  STATIC_TEAMS.map(t => [t.fifaCode, t.name])
)

export function getTeamName(fifaCode: string | null | undefined, lang: string): string | null {
  if (!fifaCode) return null
  const tr = TEAM_TRANSLATIONS[lang]?.[fifaCode] as any
  return tr?.name ?? EN_NAMES[fifaCode] ?? null
}
