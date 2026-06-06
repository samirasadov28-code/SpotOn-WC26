import { UK_STADIUM_TRANSLATIONS } from './stadium-translations-uk'
import { AZ_STADIUM_TRANSLATIONS } from './stadium-translations-az'
import { FR_STADIUM_TRANSLATIONS } from './stadium-translations-fr'
import { ES_STADIUM_TRANSLATIONS } from './stadium-translations-es'
import { TR_STADIUM_TRANSLATIONS } from './stadium-translations-tr'

export interface StadiumTranslation {
  desc: string
  facts: string[]
  note?: string
  matches: string
}

// Keyed by language code → stadium slug → translation
export const STADIUM_TRANSLATIONS: Record<string, Record<string, StadiumTranslation>> = {
  uk: UK_STADIUM_TRANSLATIONS,
  az: AZ_STADIUM_TRANSLATIONS,
  fr: FR_STADIUM_TRANSLATIONS,
  es: ES_STADIUM_TRANSLATIONS,
  tr: TR_STADIUM_TRANSLATIONS,
}
