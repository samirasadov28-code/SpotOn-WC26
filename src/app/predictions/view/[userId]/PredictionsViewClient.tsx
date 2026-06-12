'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { flagUrl } from '@/lib/flag-map'
import { getTeamName } from '@/lib/team-name'
import { useTranslation } from '@/lib/i18n/LanguageContext'
import { simulateBracket } from '@/lib/bracket-sim'
import type { TeamInfo, MatchInfo } from '@/lib/bracket-sim'

interface Team extends TeamInfo {
  flag_emoji: string | null
}

interface MatchRow {
  id: string
  stage: string
  group_letter: string | null
  bracket_slot: number | null
  ko_stage: string | null
  kickoff_at: string | null
  actual_home_score: number | null
  actual_away_score: number | null
  home_team_id: string | null
  away_team_id: string | null
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

const KO_STAGE_ORDER = ['r32', 'r16', 'qf', 'sf', 'third', 'final']
const KO_STAGE_KEY: Record<string, string> = {
  r32: 'pv_ko_r32', r16: 'pv_ko_r16', qf: 'pv_ko_qf',
  sf: 'pv_ko_sf', third: 'pv_ko_third', final: 'pv_ko_final',
}

const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-GB', uk: 'uk', az: 'az', fr: 'fr-FR', es: 'es-ES', de: 'de-DE',
  pt: 'pt-BR', it: 'it-IT', nl: 'nl-NL', tr: 'tr-TR', zh: 'zh-CN',
  ar: 'ar-SA', hi: 'hi-IN', ru: 'ru-RU', bn: 'bn-BD', ja: 'ja-JP', id: 'id-ID',
}

function toCDTDate(iso: string) {
  return new Date(new Date(iso).getTime() - 6 * 3600_000).toISOString().slice(0, 10)
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

function MatchCard({ m, pred, lang, noPick }: { m: MatchRow; pred: GroupPred | undefined; lang: string; noPick: string }) {
  const hasPred = pred && pred.pred_home_score !== null
  const hasResult = m.actual_home_score !== null && m.actual_away_score !== null
  const ph = hasPred ? pred.pred_home_score! : null
  const pa = hasPred ? pred.pred_away_score! : null
  const pts = (hasPred && hasResult) ? matchPts(ph!, pa!, m.actual_home_score!, m.actual_away_score!) : null
  const ptsBg = pts === 3 ? 'border-green-200 bg-green-50/50' : pts === 2 ? 'border-blue-200 bg-blue-50/50' : pts === 1 ? 'border-yellow-200 bg-yellow-50/50' : pts === 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white'

  return (
    <div className={`rounded-xl shadow-sm p-3 border ${ptsBg} transition-all`}>
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
          ) : <span className="text-[10px] text-gray-300 italic">{noPick}</span>}
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

interface GroupStanding {
  team: Team
  played: number; won: number; drawn: number; lost: number
  gf: number; ga: number; pts: number
}

function GroupStandingsTable({ groupLetter, matches, preds, teamById, lang, groupTableLabel }: {
  groupLetter: string; matches: MatchRow[]; preds: Map<string, GroupPred>
  teamById: Map<string, Team>; lang: string; groupTableLabel: string
}) {
  const standings = new Map<string, GroupStanding>()
  const teams = new Set<string>()
  for (const m of matches) {
    if (m.home_team) teams.add(m.home_team.id)
    if (m.away_team) teams.add(m.away_team.id)
  }
  for (const tid of teams) {
    const t = teamById.get(tid)
    if (t) standings.set(tid, { team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 })
  }
  for (const m of matches) {
    const pred = preds.get(m.id)
    const hScore = pred?.pred_home_score ?? null
    const aScore = pred?.pred_away_score ?? null
    if (hScore === null || aScore === null) continue
    const hS = standings.get(m.home_team?.id ?? '')
    const aS = standings.get(m.away_team?.id ?? '')
    if (!hS || !aS) continue
    hS.played++; aS.played++
    hS.gf += hScore; hS.ga += aScore
    aS.gf += aScore; aS.ga += hScore
    if (hScore > aScore) { hS.won++; hS.pts += 3; aS.lost++ }
    else if (hScore < aScore) { aS.won++; aS.pts += 3; hS.lost++ }
    else { hS.drawn++; hS.pts++; aS.drawn++; aS.pts++ }
  }
  const sorted = [...standings.values()].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)

  return (
    <div className="mb-5">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
        <span className="border-b border-gray-200 flex-1" />
        <span>{groupTableLabel.replace('{g}', groupLetter)}</span>
        <span className="border-b border-gray-200 flex-1" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <th className="py-1.5 px-3 text-left font-medium">#</th>
              <th className="py-1.5 px-3 text-left font-medium">Team</th>
              <th className="py-1.5 px-2 text-center font-medium">P</th>
              <th className="py-1.5 px-2 text-center font-medium">W</th>
              <th className="py-1.5 px-2 text-center font-medium">D</th>
              <th className="py-1.5 px-2 text-center font-medium">L</th>
              <th className="py-1.5 px-2 text-center font-medium">GD</th>
              <th className="py-1.5 px-2 text-center font-bold text-[#0B1F3A]">Pts</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr key={s.team.id} className={`border-t border-gray-50 ${i < 2 ? 'bg-green-50/40' : ''}`}>
                <td className="py-1.5 px-3 text-gray-400">{i + 1}</td>
                <td className="py-1.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <img src={flagUrl(s.team.fifa_code, 40)} alt="" className="w-5 h-auto rounded-sm" />
                    <span className="font-medium text-[#0B1F3A]">{getTeamName(s.team.fifa_code, lang) ?? s.team.name}</span>
                    {i < 2 && <span className="text-[9px] text-green-600 font-bold ml-1">ADV</span>}
                  </div>
                </td>
                <td className="py-1.5 px-2 text-center text-gray-500">{s.played}</td>
                <td className="py-1.5 px-2 text-center text-gray-500">{s.won}</td>
                <td className="py-1.5 px-2 text-center text-gray-500">{s.drawn}</td>
                <td className="py-1.5 px-2 text-center text-gray-500">{s.lost}</td>
                <td className="py-1.5 px-2 text-center text-gray-500">{s.gf - s.ga > 0 ? '+' : ''}{s.gf - s.ga}</td>
                <td className="py-1.5 px-2 text-center font-bold text-[#0B1F3A]">{s.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KOMatchCard({ m, pred, teamById, lang, noPick }: { m: MatchRow; pred: KOPred | undefined; teamById: Map<string, Team>; lang: string; noPick: string }) {
  const homeTeam = m.home_team
  const awayTeam = m.away_team
  const hasPred = pred && pred.pred_home_score !== null
  const hasResult = m.actual_home_score !== null && m.actual_away_score !== null
  const ph = hasPred ? pred.pred_home_score! : null
  const pa = hasPred ? pred.pred_away_score! : null
  const pts = (hasPred && hasResult) ? matchPts(ph!, pa!, m.actual_home_score!, m.actual_away_score!) : null
  const ptsBg = pts === 3 ? 'border-green-200 bg-green-50/50' : pts === 2 ? 'border-blue-200 bg-blue-50/50' : pts === 1 ? 'border-yellow-200 bg-yellow-50/50' : pts === 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-white'

  return (
    <div className={`rounded-xl shadow-sm p-3 border ${ptsBg}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className="font-semibold text-xs text-[#0B1F3A] truncate">
            {homeTeam ? (getTeamName(homeTeam.fifa_code, lang) ?? homeTeam.name) : 'TBD'}
          </span>
          {homeTeam?.fifa_code && <img src={flagUrl(homeTeam.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
        </div>
        <div className="flex flex-col items-center min-w-[90px] gap-0.5 flex-shrink-0">
          {hasResult ? (
            <span className="font-black text-base text-[#0B1F3A]">{m.actual_home_score} – {m.actual_away_score}</span>
          ) : (
            <span className="text-[10px] text-gray-400">
              {m.kickoff_at ? new Date(m.kickoff_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
            </span>
          )}
          {hasPred ? (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${hasResult ? (pts === 3 ? 'bg-green-100 text-green-700' : pts === 2 ? 'bg-blue-100 text-blue-700' : pts === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600') : 'bg-gray-100 text-gray-500'}`}>
              {ph}–{pa}{pts !== null && <PtsChip pts={pts} />}
            </span>
          ) : <span className="text-[10px] text-gray-300 italic">{noPick}</span>}
        </div>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {awayTeam?.fifa_code && <img src={flagUrl(awayTeam.fifa_code, 40)} alt="" className="w-6 h-auto rounded-sm flex-shrink-0" />}
          <span className="font-semibold text-xs text-[#0B1F3A] truncate">
            {awayTeam ? (getTeamName(awayTeam.fifa_code, lang) ?? awayTeam.name) : 'TBD'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function PredictionsViewClient({ userId }: { userId: string }) {
  const { lang, t } = useTranslation()
  const [tab, setTab] = useState<'groups' | 'standings' | 'knockout'>('groups')
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [groupPreds, setGroupPreds] = useState<GroupPred[]>([])
  const [koPreds, setKoPreds] = useState<KOPred[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [champTeam, setChampTeam] = useState<Team | null>(null)

  useEffect(() => {
    if (!userId) return
    fetch('/api/userpreds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).then(r => r.json()).then(data => {
      setDisplayName(data.displayName ?? 'Unknown player')

      const teamData = (data.teams ?? []) as Team[]
      const tById = new Map(teamData.map((t: Team) => [t.id, t]))
      const matchData = (data.matches ?? []).map((m: any) => ({
        ...m,
        home_team: m.home_team_id ? (tById.get(m.home_team_id) ?? null) : null,
        away_team: m.away_team_id ? (tById.get(m.away_team_id) ?? null) : null,
      })) as MatchRow[]
      const gp: GroupPred[] = data.groupPreds ?? []
      const kp: KOPred[] = data.koPreds ?? []

      setMatches(matchData)
      setTeams(teamData)
      setGroupPreds(gp)
      setKoPreds(kp)

      try {
        const groupMatchInfos = matchData
          .filter(m => m.stage === 'group')
          .map(m => ({ id: m.id, group_letter: m.group_letter, home_team_id: m.home_team_id, away_team_id: m.away_team_id }))
        const teamInfos = teamData.map(t => ({
          id: t.id, name: t.name, fifa_code: t.fifa_code, group_letter: t.group_letter, flag_emoji: t.flag_emoji,
        }))
        const gpMap = new Map(gp.filter(p => p.pred_home_score !== null).map(p => [p.match_id, { h: p.pred_home_score!, a: p.pred_away_score! }]))
        const kpMap = new Map(kp.filter(p => p.pred_home_score !== null).map(p => [p.bracket_slot, { h: p.pred_home_score!, a: p.pred_away_score! }]))
        const result = simulateBracket(gpMap, kpMap, groupMatchInfos, teamInfos)
        if (result.champion) {
          const fullTeam = teamData.find(t => t.fifa_code === result.champion!.fifa_code) ?? null
          setChampTeam(fullTeam)
        }
      } catch (_) { /* simulation failed */ }

      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const groupPredsMap = new Map(groupPreds.map(p => [p.match_id, p]))
  const koPredsMap = new Map(koPreds.map(p => [p.bracket_slot, p]))
  const teamById = new Map(teams.map(t => [t.id, t]))

  const groupMatches = matches.filter(m => m.stage === 'group')
  const koMatches = matches.filter(m => m.stage !== 'group').sort((a, b) => (a.bracket_slot ?? 0) - (b.bracket_slot ?? 0))

  const byDay = new Map<string, MatchRow[]>()
  for (const m of groupMatches) {
    const day = m.kickoff_at ? toCDTDate(m.kickoff_at) : 'unknown'
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(m)
  }
  const days = Array.from(byDay.keys()).sort()
  const groupLetters = [...new Set(groupMatches.map(m => m.group_letter).filter(Boolean) as string[])].sort()

  const groupPredCount = groupPreds.filter(p => p.pred_home_score !== null).length
  const koPredCount = koPreds.filter(p => p.pred_home_score !== null).length

  const locale = LANG_TO_LOCALE[lang] ?? 'en-GB'

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-3 pt-20">
        <div className="w-8 h-8 border-[3px] border-[#0B1F3A] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">{t('loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">{t('pv_back')}</Link>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">{displayName} — {t('pv_predictions')}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="text-sm text-gray-400">{groupPredCount} {t('pv_group_picks')} · {koPredCount} {t('pv_ko_picks')}</span>
          {champTeam && (
            <span className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">
              {t('pv_predicted_champ')}:
              <img src={flagUrl(champTeam.fifa_code, 40)} alt="" className="w-4 h-auto rounded-sm" />
              {getTeamName(champTeam.fifa_code, lang) ?? champTeam.name}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {[
          { key: 'groups', label: t('pv_tab_groups') },
          { key: 'standings', label: t('pv_tab_standings') },
          { key: 'knockout', label: t('pv_tab_knockout') },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === key ? 'border-[#0B1F3A] text-[#0B1F3A]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px] mb-5">
        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{t('pv_legend_exact')}</span>
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{t('pv_legend_gd')}</span>
        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{t('pv_legend_outcome')}</span>
        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{t('pv_legend_wrong')}</span>
      </div>

      {tab === 'groups' && (
        <div className="flex flex-col gap-6">
          {days.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No group matches found.</p>}
          {days.map(day => {
            const dayMatchList = byDay.get(day)!
            const dateLabel = new Date(day + 'T12:00:00Z').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
            return (
              <div key={day}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="border-b border-gray-200 flex-1" />
                  <span className="shrink-0">{dateLabel}</span>
                  <span className="border-b border-gray-200 flex-1" />
                </div>
                <div className="flex flex-col gap-2">
                  {dayMatchList.map(m => (
                    <MatchCard key={m.id} m={m} pred={groupPredsMap.get(m.id)} lang={lang} noPick={t('pv_no_pick')} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'standings' && (
        <div>
          <p className="text-xs text-gray-400 mb-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            {t('pv_standings_note')}
          </p>
          {groupLetters.map(g => (
            <GroupStandingsTable key={g} groupLetter={g}
              matches={groupMatches.filter(m => m.group_letter === g)}
              preds={groupPredsMap} teamById={teamById} lang={lang}
              groupTableLabel={t('pv_group_table')}
            />
          ))}
        </div>
      )}

      {tab === 'knockout' && (
        <div className="flex flex-col gap-1">
          {koMatches.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">{t('pv_ko_none')}</p>
          ) : (() => {
            const stageGroups = new Map<string, MatchRow[]>()
            for (const m of koMatches) {
              const s = m.ko_stage ?? 'other'
              if (!stageGroups.has(s)) stageGroups.set(s, [])
              stageGroups.get(s)!.push(m)
            }
            return KO_STAGE_ORDER.filter(s => stageGroups.has(s)).map(stage => (
              <div key={stage} className="mb-5">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="border-b border-gray-200 flex-1" />
                  <span className="shrink-0">{t(KO_STAGE_KEY[stage] ?? stage)}</span>
                  <span className="border-b border-gray-200 flex-1" />
                </div>
                <div className="flex flex-col gap-2">
                  {stageGroups.get(stage)!.map(m => (
                    <KOMatchCard key={m.id} m={m} pred={koPredsMap.get(m.bracket_slot!)} teamById={teamById} lang={lang} noPick={t('pv_no_pick')} />
                  ))}
                </div>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
