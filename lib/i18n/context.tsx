"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from './index'
import { en } from './locales/en'
import { de } from './locales/de'
import { detectLocaleFromHeaders, detectLocaleFromCountry, defaultLocale } from './index'

const translations = { en, de }

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: typeof en
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: React.ReactNode
  initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Detect locale on initial load
  useEffect(() => {
    const detectLocale = async () => {
      if (initialLocale) {
        setLocaleState(initialLocale)
        setIsLoading(false)
        return
      }

      try {
        // Try to get user's country from IP geolocation
        const response = await fetch('/api/geolocation')
        if (response.ok) {
          const { country } = await response.json()
          const detectedLocale = detectLocaleFromCountry(country)
          setLocaleState(detectedLocale)
        } else {
          // Fallback to browser language detection
          const browserLocale = detectLocaleFromHeaders(navigator.language)
          setLocaleState(browserLocale)
        }
      } catch (error) {
        console.warn('Locale detection failed, using default:', error)
        setLocaleState(defaultLocale)
      } finally {
        setIsLoading(false)
      }
    }

    detectLocale()
  }, [initialLocale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    
    // Store preference in localStorage
    localStorage.setItem('preferred-locale', newLocale)
    
    // For App Router with [locale] structure, redirect to the appropriate locale URL
    const currentPath = window.location.pathname
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
    const newPath = `/${newLocale}${pathWithoutLocale}`
    
    if (currentPath !== newPath) {
      router.push(newPath)
    }
  }

  // Get stored preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('preferred-locale') as Locale
      if (storedLocale && storedLocale !== locale && !initialLocale) {
        setLocaleState(storedLocale)
      }
    }
  }, [locale, initialLocale])

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
    isLoading
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslations() {
  const { t } = useI18n()
  return t
}