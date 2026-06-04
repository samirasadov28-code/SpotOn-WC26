import Image from 'next/image'
import Link from 'next/link'
import { ASADOV_STACK } from '@/lib/asadov-stack'

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Predict',
    desc: 'Enter scores for all 72 group matches and build your full knockout bracket before the tournament locks.',
  },
  {
    step: '2',
    title: 'Compete',
    desc: 'Earn points for exact scores, correct goal differences, right outcomes, and accurate bracket advancement.',
  },
  {
    step: '3',
    title: 'Win',
    desc: 'Climb the live leaderboard and claim glory — and maybe something extra — as the tournament unfolds.',
  },
]

const SCORING_HIGHLIGHTS = [
  { label: 'Exact score', pts: '3 pts' },
  { label: 'Correct goal difference', pts: '2 pts' },
  { label: 'Correct outcome', pts: '1 pt' },
  { label: 'Knockout bracket advancement', pts: 'up to 16 pts / team' },
]

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-navy text-white py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <Image
              src="/Logo 512x512.png"
              alt="SpotOn WC26"
              width={120}
              height={120}
              className="rounded-xl shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            PREDICT. COMPETE. WIN.
          </h1>
          <p className="text-lg text-white/80 mb-6">
            The ultimate World Cup 2026 prediction game for friends
          </p>

          {/* Prize banner */}
          <div className="bg-yellow-400 text-navy font-bold rounded-xl py-3 px-5 mb-8 text-base sm:text-lg shadow-lg inline-block">
            🏆 Fantastic prize coming soon
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/login"
              className="bg-brand-green hover:bg-green-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition-colors shadow"
            >
              Join with Email
            </Link>
            <Link
              href="/rules"
              className="border border-white/30 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-xl text-base transition-colors"
            >
              How Scoring Works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-navy dark:text-white mb-10">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center"
              >
                <div className="w-12 h-12 bg-navy text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-navy dark:text-white">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring overview */}
      <section className="py-14 px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-navy dark:text-white mb-8">
            Scoring at a Glance
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {SCORING_HIGHLIGHTS.map((row, i) => (
              <div
                key={row.label}
                className={`flex justify-between items-center px-5 py-3 text-sm ${
                  i !== 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
                <span className="font-bold text-brand-green">{row.pts}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/rules" className="text-sm text-navy dark:text-blue-400 underline">
              View full rules →
            </Link>
          </div>
        </div>
      </section>

      {/* Asadov-stack cross-promo */}
      <section className="bg-navy text-white py-10 px-4 text-center">
        <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Part of</p>
        <p className="text-xl font-bold">{ASADOV_STACK.name}</p>
        <p className="text-white/60 text-sm mt-1">{ASADOV_STACK.tagline}</p>
      </section>
    </div>
  )
}
