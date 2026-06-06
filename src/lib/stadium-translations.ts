export interface StadiumTranslation {
  desc: string
  facts: string[]
  note?: string
  matches: string
}

// Keyed by language code → stadium slug → translation
export const STADIUM_TRANSLATIONS: Record<string, Record<string, StadiumTranslation>> = {
  // Translations will be added here — falls back to English content in StaticStadium
}
