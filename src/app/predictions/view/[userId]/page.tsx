'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { flagUrl } from '@/lib/flag-map'
import { getTeamName } from '@/lib/team-name'
import { useTranslation } from '@/lib/i18n/LanguageContext'

interface Team {
  id: string
  name: string
  fifa_code: string
  group_letter: string | null
  flag_emoji: string | null
}

interface MatchRow {
  id: string
  stage: string
  group_letter: string | null
  bracket_slot: number | null
  kickoff_at: string | null
  actual_home_score: number | null
  actual_away_score: number | null
  home_team: Team | null
  away_team: Team | null
}

interface GroupPred {
  match_id: string
  pred_home_score: number | null
  pred_away_score: number | null
}

interface KOPred {
  bracket_slot: number
  pred_home_score: number | null
  pred_away_score: number | null
}

const KO_STAGE_LABEL: Record<number, string> = {
  1:'R32',2:'R32',3:'R32',4:'R32',5:'R32',6:'R32',7:'R32',8:'R32',
  9:'R32',10:'R32',11:'R32',12:'R32',13:'R32',14:'R32',15:'R32',16:'R32',
  17:'R16',18:'R16',19:'R16',20:'R16',21:'R16',22:'R16',23:'R16',24:'R16',
  25:'QF',26:'QF',27:'QF',28:'QF',
  29:'SF',30:'SF',
  31:'3rd Place',32:'Final',
}

function matchPts(ph: number, pa: number, ah: number, aa: number) {
  if (ph === ah && pa === aa) return 3
  if ((ph - pa) === (ah - aa)) return 2
  if (Math.sign(ph - pa) === Math.sign(ah - aa)) return 1
  return 0
}

function PtsChip({ pts }: { pts: number | null }) {
  if (pts === null) return null
  const cls = pts === 3 ? 'bg-green-100 text-green-700' : pts === 2 ? 'bg-blue-100 text-blue-700' : pts === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
  return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 ${cls}`}>{pts}pt{pts !== 1 ? 's' : ''}</span>
}

function MatchCard({ m, pred, lang }: { m: MatchRow; pred: GroupPred | KOPred | undefined; lang: string; stageLabel?: string }) {
  const hasPred = pred && (pred as GroupPred).pred_home_score !== null
  const hasResult = m.actual_home_score !== null && m.actual_away_score !== null
  const ph = hasPred ? (pred as GroupPred).pred_home_score! : null
  const pa = hasPred ? (pred as GroupPred).pred_away_score! : null
  const pts = (hasPred && hasResult) ? matchPts(ph!, pa!, m.actual_home_score!, m.actual_away_score!) : null

  return (
    <div className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className="font-semibold text-xs text-[#0B1F3A] truncate">
            {m.home_team ? (getTeamName(m.home_team.fifa_code, lang) ?? m.home_team.name) : 'TBD'}
          </span>
          {m.home_team?.fifa_code && <img src={flagUrl(m.home_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
        </div>

        <div className="flex flex-col items-center min-w-[90px] gap-0.5 flex-shrink-0">
          {hasResult ? (
            <span className="font-black text-base text-[#0B1F3A] leading-none">{m.actual_home_score} – {m.actual_away_score}</span>
          ) : (
            <span className="text-xs text-gray-400 font-medium">
              {m.kickoff_at ? new Date(m.kickoff_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : 'TBD'}
            </span>
          )}
          {hasPred ? (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${hasResult ? (pts === 3 ? 'bg-green-100 text-green-700' : pts === 2 ? 'bg-blue-100 text-blue-700' : pts === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600') : 'bg-gray-100 text-gray-500'}`}>
              {ph}–{pa}{pts !== null && <PtsChip pts={pts} />}
            </span>
          ) : (
            <span className="text-[10px] text-gray-300 italic">no pick</span>
          )}
        </div>

        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {m.away_team?.fifa_code && <img src={flagUrl(m.away_team.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
          <span className="font-semibold text-xs text-[#0B1F3A] truncate">
            {m.away_team ? (getTeamName(m.away_team.fifa_code, lang) ?? m.away_team.name) : 'TBD'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function UserPredictionsPage() {
  const { userId } = useParams<{ userId: string }>()
  const { lang } = useTranslation()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [groupPreds, setGroupPreds] = useState<Map<string, GroupPred>>(new Map())
  const [koPreds, setKoPreds] = useState<Map<number, KOPred>>(new Map())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'day' | 'knockout'>('day')

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    Promise.all([
      supabase.from('users').select('display_name').eq('id', userId).single(),
      supabase.from('matches')
        .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
        .order('kickoff_at'),
      supabase.from('predictions_group').select('match_id, pred_home_score, pred_away_score').eq('user_id', userId),
      supabase.from('predictions_knockout').select('bracket_slot, pred_home_score, pred_away_score').eq('user_id', userId),
    ]).then(([userRes, matchRes, gpRes, kpRes]) => {
      setDisplayName((userRes.data as any)?.display_name ?? 'Unknown player')
      setMatches((matchRes.data as MatchRow[]) ?? [])
      setGroupPreds(new Map((gpRes.data ?? []).map((p: GroupPred) => [p.match_id, p])))
      setKoPreds(new Map((kpRes.data ?? []).map((p: KOPred) => [p.bracket_slot, p])))
      setLoading(false)
    })
  }, [userId])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] text-gray-500">Loading…</div>
  )

  const groupMatches = matches.filter(m => m.stage === 'group')
  const koMatches = matches.filter(m => m.stage !== 'group').sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0))

  // Group group-stage matches by UTC date
  const byDay = new Map<string, MatchRow[]>()
  for (const m of groupMatches) {
    const day = m.kickoff_at ? m.kickoff_at.slice(0, 10) : 'unknown'
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(m)
  }
  const days = Array.from(byDay.keys()).sort()

  const groupPredCount = [...groupPreds.values()].filter(p => p.pred_home_score !== null).length
  const koPredCount = [...koPreds.values()].filter(p => p.pred_home_score !== null).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">← Leaderboard</Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">{displayName}&apos;s Predictions</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {groupPredCount} group picks · {koPredCount} knockout picks
          <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            Predicted score shown · actual result when played
          </span>
        </p>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button onClick={() => setTab('day')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'day' ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Group Stage · By Day
        </button>
        <button onClick={() => setTab('knockout')} className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${tab === 'knockout' ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Knockout
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px] mb-5">
        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">3pts — exact score</span>
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">2pts — goal diff</span>
        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">1pt — outcome</span>
        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">0pts — wrong</span>
      </div>

      {tab === 'day' && (
        <div className="flex flex-col gap-6">
          {days.map(day => {
            const dayMatches = byDay.get(day)!
            const dateLabel = new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })
            return (
              <div key={day}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="border-b border-gray-200 flex-1" />
                  <span className="shrink-0">{dateLabel}</span>
                  <span className="border-b border-gray-200 flex-1" />
                </div>
                <div className="flex flex-col gap-2">
                  {dayMatches.map(m => (
                    <MatchCard key={m.id} m={m} pred={groupPreds.get(m.id)} lang={lang} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'knockout' && (
        <div className="flex flex-col gap-2">
          {koMatches.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">Knockout matches not scheduled yet</p>
          ) : (
            (() => {
              const stageGroups = new Map<string, MatchRow[]>()
              for (const m of koMatches) {
                const label = m.bracket_slot ? (KO_STAGE_LABEL[m.bracket_slot] ?? 'Other') : 'Other'
                if (!stageGroups.has(label)) stageGroups.set(label, [])
                stageGroups.get(label)!.push(m)
              }
              const stageOrder = ['R32','R16','QF','SF','3rd Place','Final']
              return stageOrder.filter(s => stageGroups.has(s)).map(stage => (
                <div key={stage} className="mb-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="border-b border-gray-200 flex-1" />
                    <span className="shrink-0">{stage}</span>
                    <span className="border-b border-gray-200 flex-1" />
                  </div>
                  <div className="flex flex-col gap-2">
                    {stageGroups.get(stage)!.map(m => (
                      <MatchCard key={m.id} m={m} pred={koPreds.get(m.bracket_slot!)} lang={lang} />
                    ))}
                  </div>
                </div>
              ))
            })()
          )}
        </div>
      )}
    </div>
  )
}
