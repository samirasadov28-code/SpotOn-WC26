import { createClient } from '@/lib/supabase/server'
import { flagUrl } from '@/lib/flag-map'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const CONF_COLORS: Record<string, string> = {
  UEFA: 'bg-blue-100 text-blue-800',
  CONMEBOL: 'bg-yellow-100 text-yellow-800',
  CONCACAF: 'bg-red-100 text-red-800',
  CAF: 'bg-green-100 text-green-800',
  AFC: 'bg-purple-100 text-purple-800',
  OFC: 'bg-teal-100 text-teal-800',
}

const POS_ORDER = ['GK', 'DEF', 'MID', 'FWD']
const POS_LABEL: Record<string, string> = {
  GK: '🧤 Goalkeepers',
  DEF: '🛡️ Defenders',
  MID: '⚙️ Midfielders',
  FWD: '⚡ Forwards',
}

export default async function TeamPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!team) notFound()

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', params.id)
    .eq('is_active', true)
    .order('shirt_number')

  const playersByPos = POS_ORDER.reduce((acc, pos) => {
    acc[pos] = (players ?? []).filter((p: any) => p.position === pos)
    return acc
  }, {} as Record<string, any[]>)

  const hasSquad = (players ?? []).length > 0
  const t = team as any
  const imgUrl = flagUrl(t.fifa_code, 640)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/teams" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B1F3A] mb-6 transition-colors">
        ← Back to all teams
      </Link>

      {/* Header card */}
      <div className="rounded-3xl overflow-hidden shadow-xl mb-8 bg-[#0B1F3A] text-white">
        <div className="relative h-48 sm:h-64 w-full">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={`${t.name} flag`}
              fill
              className="object-cover opacity-60"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">{t.flag_emoji}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end gap-4">
              <span className="text-6xl drop-shadow-lg">{t.flag_emoji}</span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black leading-tight">{t.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CONF_COLORS[t.confederation] ?? 'bg-white/20 text-white'}`}>
                    {t.confederation}
                  </span>
                  <span className="text-white/50 text-sm">Group {t.group_letter} · {t.fifa_code}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blurb */}
      {t.blurb && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black text-[#0B1F3A] mb-2">About</h2>
          <p className="text-gray-700 leading-relaxed">{t.blurb}</p>
        </div>
      )}

      {/* Stars to watch */}
      {t.stars && t.stars.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-black text-[#0B1F3A] mb-3">⭐ Stars to Watch</h2>
          <div className="flex flex-wrap gap-3">
            {t.stars.map((star: string) => (
              <div key={star} className="flex items-center gap-2 bg-[#0B1F3A] text-white rounded-xl px-4 py-2 text-sm font-semibold shadow-sm">
                <span>⚽</span>
                <span>{star}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Squad */}
      <div>
        <h2 className="text-lg font-black text-[#0B1F3A] mb-4">
          {hasSquad ? '👕 Official Squad' : '👕 Squad'}
        </h2>
        {hasSquad ? (
          <div className="space-y-6">
            {POS_ORDER.map((pos) => {
              const group = playersByPos[pos]
              if (!group.length) return null
              return (
                <div key={pos}>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{POS_LABEL[pos]}</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {group.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <div className="w-8 h-8 bg-[#0B1F3A] text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                          {p.shirt_number ?? '—'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0B1F3A] text-sm truncate">
                            {p.name}
                            {t.stars?.includes(p.name) && <span className="ml-1 text-yellow-500">⭐</span>}
                          </p>
                          {p.club && <p className="text-xs text-gray-400 truncate">{p.club}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-400">
            <p className="text-3xl mb-2">🔄</p>
            <p className="font-semibold">Squad data loading</p>
            <p className="text-sm mt-1">Final 26-man squads are confirmed June 2 — check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
