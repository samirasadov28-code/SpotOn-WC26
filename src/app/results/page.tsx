'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const KO_STAGES = [
  { key: 'r32', label: 'Round of 32' },
  { key: 'r16', label: 'Round of 16' },
  { key: 'qf',  label: 'Quarterfinals' },
  { key: 'sf',  label: 'Semifinals' },
  { key: 'third', label: 'Third Place' },
  { key: 'final', label: 'Final' },
]

interface MatchRow {
  id: string
  stage: string
  group_letter: string | null
  ko_stage: string | null
  kickoff_at: string | null
  venue: string | null
  home_score: number | null
  away_score: number | null
  home_team: { name: string; flag_emoji: string; fifa_code: string } | null
  away_team: { name: string; flag_emoji: string; fifa_code: string } | null
}

type SectionTab = 'group' | 'knockout'

export default function ResultsPage() {
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState('A')
  const [activeKoStage, setActiveKoStage] = useState('r32')
  const [tab, setTab] = useState<SectionTab>('group')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(name,flag_emoji,fifa_code), away_team:teams!matches_away_team_id_fkey(name,flag_emoji,fifa_code)')
      .order('kickoff_at')
      .then(({ data }) => {
        setMatches((data as MatchRow[]) ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading results…</div>
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
        <div className="text-4xl">🏗️</div>
        <h2 className="text-xl font-bold text-[#0B1F3A]">No match data yet</h2>
        <p className="text-gray-500 text-sm max-w-sm">Results will appear here once matches are played and the database is seeded.</p>
      </div>
    )
  }

  const groupMatches = matches.filter(m => m.stage === 'group' && m.group_letter === activeGroup)
  const koMatches = matches.filter(m => m.stage === 'knockout' && m.ko_stage === activeKoStage)
  const played = matches.filter(m => m.home_score !== null).length
  const total = matches.length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Match Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">{played} of {total} matches played</p>
        </div>
        {/* Progress bar */}
        <div className="w-40">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.round((played / total) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{Math.round((played / total) * 100)}% complete</p>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(['group', 'knockout'] as SectionTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === t ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'group' ? 'Group Stage' : 'Knockout Stage'}
          </button>
        ))}
      </div>

      {tab === 'group' && (
        <>
          {/* Group selector */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {GROUPS.map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeGroup === g ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="sm:hidden">{g}</span>
                <span className="hidden sm:inline">Group {g}</span>
              </button>
            ))}
          </div>
          <MatchList matches={groupMatches} />
        </>
      )}

      {tab === 'knockout' && (
        <>
          <div className="flex flex-wrap gap-1.5 mb-6">
            {KO_STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveKoStage(s.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeKoStage === s.key ? 'bg-[#0B1F3A] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <MatchList matches={koMatches} />
        </>
      )}
    </div>
  )
}

function MatchList({ matches }: { matches: MatchRow[] }) {
  if (matches.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-10">No matches in this selection yet.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {matches.map(m => {
        const played = m.home_score !== null && m.away_score !== null
        const kickoff = m.kickoff_at
          ? new Date(m.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' })
          : ''
        return (
          <div key={m.id} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${played ? 'border-green-500' : 'border-gray-200'}`}>
            <div className="text-xs text-gray-400 mb-2 truncate">{kickoff}{m.venue ? ` · ${m.venue}` : ''}</div>
            <div className="flex items-center gap-2">
              <span className="flex-1 min-w-0 text-right font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">
                {m.home_team?.flag_emoji} {m.home_team?.name ?? '?'}
              </span>
              <div className="text-center flex-shrink-0 min-w-[56px]">
                {played ? (
                  <span className="font-black text-xl text-[#0B1F3A]">{m.home_score} – {m.away_score}</span>
                ) : (
                  <span className="text-sm text-gray-400 font-medium">vs</span>
                )}
              </div>
              <span className="flex-1 min-w-0 font-semibold text-xs sm:text-sm text-[#0B1F3A] truncate">
                {m.away_team?.name ?? '?'} {m.away_team?.flag_emoji}
              </span>
            </div>
            {!played && (
              <div className="text-center mt-2">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Not played yet</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
