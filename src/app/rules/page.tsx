'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function RulesPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">{t('rules_title')}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {t('rules_subtitle')}
      </p>

      {/* Lock */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-3">{t('rules_lock_title')}</h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-300">
          <strong>{t('rules_lock_1')}</strong> {t('rules_lock_2')}
        </div>
      </section>

      {/* Group stage */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-4">{t('rules_group_scoring')}</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
          {([
            [t('rules_exact'), t('rules_3pts')],
            [t('rules_gd'), t('rules_2pts')],
            [t('rules_outcome'), t('rules_1pt')],
            [t('rules_wrong'), t('rules_0pts')],
          ] as [string, string][]).map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('rules_draw_title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('rules_draw_desc')}
        </p>

        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('rules_worked')}</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <div>{t('rules_example_predict')}</div>
          <div>{t('rules_example_actual')}</div>
          <div>{t('rules_example_gd')}</div>
        </div>
      </section>

      {/* Advancement */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-4">{t('rules_ko_title')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('rules_ko_desc')}
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
          {([
            [t('rules_r32'), '1 pt'],
            [t('rules_r16'), '+2 pts (cumulative: 3)'],
            [t('rules_qf'), '+4 pts (cumulative: 7)'],
            [t('rules_sf'), '+8 pts (cumulative: 15)'],
            [t('rules_final'), '+12 pts (cumulative: 27)'],
            [t('rules_win'), '+16 pts (cumulative: 43)'],
          ] as [string, string][]).map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('rules_worked')}</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          <p>You predict <strong>England to win the tournament</strong>.</p>
          <p>England actually reaches the <strong>Quarterfinals</strong> and is eliminated.</p>
          <p className="mt-2">You earn for every stage up to QF (the minimum of predicted vs actual):</p>
          <p className="font-bold mt-1">R32 (1) + R16 (2) + QF (4) = <span className="text-brand-green">7 pts</span></p>
        </div>

        <h3 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">{t('rules_3rd_title')}</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {([
            [t('rules_3rd_plays'), '4 pts'],
            [t('rules_3rd_wins'), '8 pts'],
          ] as [string, string][]).map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Knockout match scoring */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-4">{t('rules_ko_match')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {t('rules_ko_match_desc')}
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-4">
          {([
            [t('rules_exact'), t('rules_3pts')],
            [t('rules_gd'), t('rules_2pts')],
            [t('rules_outcome'), t('rules_1pt')],
            [t('rules_wrong'), t('rules_0pts')],
          ] as [string, string][]).map(([label, pts], i) => (
            <div key={i} className={`flex justify-between px-5 py-3 text-sm ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
              <span className="text-gray-700 dark:text-gray-300">{label}</span>
              <span className="font-bold text-brand-green">{pts}</span>
            </div>
          ))}
        </div>
        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('rules_pens_title')}</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          {t('rules_pens_desc')}
        </div>
      </section>

      {/* Tiebreak */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-navy dark:text-white mb-3">{t('rules_tiebreak_title')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('rules_tiebreak_desc')}
        </p>
      </section>

      <div className="text-center">
        <Link
          href="/predictions/groups"
          className="inline-block bg-navy text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-900 transition-colors"
        >
          {t('rules_start')}
        </Link>
      </div>
    </div>
  )
}
