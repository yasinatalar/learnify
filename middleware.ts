import NextAuth from "next-auth"
import authConfig from "@/auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { db } from "@/lib/db"

const { auth } = NextAuth(authConfig)

// DACH region country codes for German locale
const dachCountries = ['DE', 'AT', 'CH']

function detectLocaleFromCountry(country?: string): 'en' | 'de' {
  if (!country) return 'en'
  return dachCountries.includes(country.toUpperCase()) ? 'de' : 'en'
}

function detectLocaleFromHeaders(acceptLanguage?: string): 'en' | 'de' {
  if (!acceptLanguage) return 'en'
  
  const languages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase())
  
  for (const lang of languages) {
    if (lang.startsWith('de')) return 'de'
  }
  
  return 'en'
}

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Handle locale detection for non-API routes
  if (!nextUrl.pathname.startsWith('/api/') && 
      !nextUrl.pathname.startsWith('/_next/') && 
      !nextUrl.pathname.includes('.')) {
    
    // Check if path already has a locale
    const pathSegments = nextUrl.pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    
    if (!['en', 'de'].includes(firstSegment)) {
      // Detect user's locale with priority order:
      // 1. User's saved language preference (from database)
      // 2. CloudFlare country header  
      // 3. Accept-Language header
      let detectedLocale: 'en' | 'de' = 'en'
      
      // First, check if user is logged in and has a saved language preference
      if (isLoggedIn && req.auth?.user?.id) {
        try {
          const userSettings = await db.userSettings.findUnique({
            where: { userId: req.auth.user.id },
            select: { language: true }
          })
          
          if (userSettings?.language && ['en', 'de'].includes(userSettings.language)) {
            detectedLocale = userSettings.language as 'en' | 'de'
          } else {
            // No saved preference, use geo-detection
            const cfCountry = req.headers.get('cf-ipcountry')
            if (cfCountry) {
              detectedLocale = detectLocaleFromCountry(cfCountry)
            } else {
              const acceptLanguage = req.headers.get('accept-language')
              detectedLocale = detectLocaleFromHeaders(acceptLanguage)
            }
          }
        } catch (error) {
          console.error('Error fetching user language preference:', error)
          // Fallback to geo-detection if database query fails
          const cfCountry = req.headers.get('cf-ipcountry')
          if (cfCountry) {
            detectedLocale = detectLocaleFromCountry(cfCountry)
          } else {
            const acceptLanguage = req.headers.get('accept-language')
            detectedLocale = detectLocaleFromHeaders(acceptLanguage)
          }
        }
      } else {
        // User not logged in, use geo/browser detection
        const cfCountry = req.headers.get('cf-ipcountry')
        if (cfCountry) {
          detectedLocale = detectLocaleFromCountry(cfCountry)
        } else {
          const acceptLanguage = req.headers.get('accept-language')
          detectedLocale = detectLocaleFromHeaders(acceptLanguage)
        }
      }
      
      // Redirect to localized path
      const newUrl = new URL(`/${detectedLocale}${nextUrl.pathname}${nextUrl.search}`, req.url)
      return NextResponse.redirect(newUrl)
    }
  }

  // Remove locale from path for route matching
  let pathname = nextUrl.pathname
  if (pathname.match(/^\/(en|de)($|\/)/)) {
    pathname = pathname.replace(/^\/(en|de)/, '') || '/'
  }

  // Define protected routes
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
                          pathname.startsWith('/documents') ||
                          pathname.startsWith('/flashcards') ||
                          pathname.startsWith('/quiz') ||
                          pathname.startsWith('/profile') ||
                          pathname.startsWith('/settings')

  // Define auth routes
  const isAuthRoute = pathname.startsWith('/auth')

  // Redirect to dashboard if logged in and on auth route
  if (isLoggedIn && isAuthRoute) {
    const locale = nextUrl.pathname.match(/^\/(en|de)/)?.[1] || 'en'
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl))
  }

  // Redirect to signin if not logged in and on protected route
  if (!isLoggedIn && isProtectedRoute) {
    const locale = nextUrl.pathname.match(/^\/(en|de)/)?.[1] || 'en'
    return NextResponse.redirect(new URL(`/${locale}/auth/signin`, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}