'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LangCode, translations, LANGUAGES } from './translations'

interface LanguageContextType {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  languages: typeof LANGUAGES
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  languages: LANGUAGES,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en')

  useEffect(() => {
    const saved = localStorage.getItem('spoton-lang') as LangCode
    if (saved && translations[saved]) setLangState(saved)
  }, [])

  const setLang = (l: LangCode) => {
    setLangState(l)
    localStorage.setItem('spoton-lang', l)
  }

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let str = translations[lang]?.[key] ?? translations['en']?.[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
