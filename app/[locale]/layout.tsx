import { notFound } from 'next/navigation'
import { I18nProvider } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params
  
  // Validate locale
  if (!['en', 'de'].includes(locale)) {
    notFound()
  }

  return (
    <I18nProvider initialLocale={locale}>
      {children}
    </I18nProvider>
  )
}

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' }
  ]
}