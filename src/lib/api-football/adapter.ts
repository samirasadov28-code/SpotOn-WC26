const BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3'

export interface PlayerData {
  name: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | null
  club: string | null
  shirt_number: number | null
}

interface ApiPlayerEntry {
  player: {
    id: number
    name: string
    number: number | null
    pos: string | null
    photo: string
  }
}

interface ApiSquadResponse {
  response: Array<{
    team: { id: number; name: string }
    players: ApiPlayerEntry[]
  }>
}

function mapPosition(pos: string | null): 'GK' | 'DEF' | 'MID' | 'FWD' | null {
  if (!pos) return null
  const p = pos.toUpperCase()
  if (p === 'G') return 'GK'
  if (p === 'D') return 'DEF'
  if (p === 'M') return 'MID'
  if (p === 'F') return 'FWD'
  return null
}

export async function fetchSquad(teamApiId: number): Promise<PlayerData[]> {
  const resp = await fetch(`${BASE_URL}/players/squads?team=${teamApiId}`, {
    headers: {
      'X-RapidAPI-Key': process.env.API_FOOTBALL_KEY!,
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
    },
  })

  if (!resp.ok) {
    throw new Error(`API-Football error: ${resp.status} ${resp.statusText}`)
  }

  const data = (await resp.json()) as ApiSquadResponse

  if (!data.response?.[0]?.players) return []

  return data.response[0].players.map((entry) => ({
    name: entry.player.name,
    position: mapPosition(entry.player.pos),
    club: null, // squads endpoint doesn't include club
    shirt_number: entry.player.number ?? null,
  }))
}
