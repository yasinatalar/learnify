import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { detectLocaleFromCountry, dachCountries } from '@/lib/i18n'

export default async function RootPage() {
  const headersList = await headers()
  
  // Try to detect locale from headers
  const cfCountry = headersList.get('cf-ipcountry')
  const vercelCountry = headersList.get('x-vercel-ip-country')
  
  // Determine the appropriate locale
  const country = cfCountry || vercelCountry
  const locale = country && dachCountries.includes(country.toUpperCase()) ? 'de' : 'en'
  
  // Redirect to the appropriate locale
  redirect(`/${locale}`)
}