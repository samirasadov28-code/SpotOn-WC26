import Link from 'next/link'

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Rules & Scoring</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Everything you need to know about how SpotOn WC26 works.
      </p>

      {/* Lock */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-3">Lock & Privacy</h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-300">
          <strong>Global lock: June 11, 2026 at 13:00 UTC</strong> (2 hours before the opening match).
          All predictions — group scores and the full knockout bracket — must be submitted before this time.
          After the lock, everyone can see each other&apos;s predictions.
        </div>
      </section>

      {/* Group stage */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-4">Group Stage Scoring</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
          {[
            ['Exact score (e.g. predicted 2-1, actual 2-1)', '3 pts'],
            ['Correct goal difference (e.g. predicted 2-0, actual 3-1)', '2 pts'],
            ['Correct outcome only (e.g. predicted 1-0, actual 3-1)', '1 pt'],
            ['Wrong outcome', '0 pts'],
          ].map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Draw Rule</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          A correctly predicted draw always scores at least 2 pts because both goal differences are 0.
          <br />
          Example: predicted 1-1, actual 2-2 → both GD = 0 → <strong>2 pts</strong>.
          Predicted 2-2, actual 2-2 → exact score → <strong>3 pts</strong>.
        </p>

        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Worked Example</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <div>You predict <strong>Germany 3–1 Ivory Coast</strong></div>
          <div>Actual result: <strong>Germany 2–0 Ivory Coast</strong></div>
          <div>GD: predicted +2, actual +2 → <strong>Correct GD → 2 pts</strong></div>
        </div>
      </section>

      {/* Advancement */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-4">Knockout Advancement Scoring</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Points accumulate for each stage a team you predicted correctly reaches.
          You earn up to the minimum of what you predicted and what the team actually achieved.
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
          {[
            ['Reaches Round of 32', '1 pt'],
            ['Reaches Round of 16', '+2 pts (cumulative: 3)'],
            ['Reaches Quarterfinals', '+4 pts (cumulative: 7)'],
            ['Reaches Semifinals', '+8 pts (cumulative: 15)'],
            ['Reaches Final', '+12 pts (cumulative: 27)'],
            ['Wins the tournament', '+16 pts (cumulative: 43)'],
          ].map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Worked Example</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          <p>You predict <strong>England to win the tournament</strong>.</p>
          <p>England actually reaches the <strong>Quarterfinals</strong> and is eliminated.</p>
          <p className="mt-2">You earn for every stage up to QF (the minimum of predicted vs actual):</p>
          <p className="font-bold mt-1">R32 (1) + R16 (2) + QF (4) = <span className="text-brand-green">7 pts</span></p>
        </div>

        <h3 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Third-Place Match</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {[
            ['Predicted team plays in third-place match', '4 pts'],
            ['Predicted team wins third-place match', '8 pts'],
          ].map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Knockout match scoring */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-4">Knockout Match Scoring</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          For each knockout match, you predict a decisive score (no draws — you must pick a winner).
          Both teams must be in the fixture for your prediction to score.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
          {[
            ['Exact score', '3 pts'],
            ['Correct goal difference + correct winner', '2 pts'],
            ['Correct winner only', '1 pt'],
            ['Wrong winner', '0 pts'],
          ].map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>
        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Penalty Shootout Special</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          If a match goes to penalties and you correctly predicted the advancing team,
          you automatically score <strong className="text-brand-green">3 pts</strong> — regardless of your predicted score.
        </div>
      </section>

      {/* Tiebreak */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-3">Leaderboard Tiebreak</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Players with the same total points share the same rank number.
          Within shared ranks, players are listed alphabetically. There is no tiebreaker for prizes
          — any tie will be resolved by the organizers.
        </p>
      </section>

      <div className="text-center">
        <Link
          href="/predictions/groups"
          className="inline-block bg-navy text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-900 transition-colors"
        >
          Start predicting →
        </Link>
      </div>
    </div>
  )
}
