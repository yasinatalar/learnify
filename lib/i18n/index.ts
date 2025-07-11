export type Locale = 'en' | 'de'

export const locales: Locale[] = ['en', 'de']
export const defaultLocale: Locale = 'en'

// DACH region country codes (Germany, Austria, Switzerland)
export const dachCountries = ['DE', 'AT', 'CH']

export function detectLocaleFromHeaders(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return defaultLocale
  
  const languages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase())
  
  // Check for German language variants
  for (const lang of languages) {
    if (lang.startsWith('de')) return 'de'
  }
  
  return defaultLocale
}

export function detectLocaleFromCountry(country?: string): Locale {
  if (!country) return defaultLocale
  return dachCountries.includes(country.toUpperCase()) ? 'de' : defaultLocale
}

export function getOppositeLocale(locale: Locale): Locale {
  return locale === 'en' ? 'de' : 'en'
}

export function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: locale === 'de' ? 'EUR' : 'USD'
  }).format(amount)
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

export function formatNumber(num: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US').format(num)
}