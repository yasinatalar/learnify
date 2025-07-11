import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { dachCountries } from '@/lib/i18n'

export default async function SignInRedirectPage() {
  const headersList = await headers()
  
  // Try to detect locale from headers
  const cfCountry = headersList.get('cf-ipcountry')
  const vercelCountry = headersList.get('x-vercel-ip-country')
  
  // Determine the appropriate locale
  const country = cfCountry || vercelCountry
  const locale = country && dachCountries.includes(country.toUpperCase()) ? 'de' : 'en'
  
  // Redirect to the appropriate locale
  redirect(`/${locale}/auth/signin`)
}