import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || request.ip || '127.0.0.1'
    
    // In development, return a default country
    if (ip === '127.0.0.1' || ip === '::1' || process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        country: 'US', // Default to US in development
        ip: ip,
        source: 'development' 
      })
    }

    // Use CloudFlare headers if available (common in production)
    const cfCountry = request.headers.get('cf-ipcountry')
    if (cfCountry && cfCountry !== 'XX') {
      return NextResponse.json({ 
        country: cfCountry, 
        ip: ip,
        source: 'cloudflare' 
      })
    }

    // Use Vercel headers if available
    const vercelCountry = request.headers.get('x-vercel-ip-country')
    if (vercelCountry && vercelCountry !== 'XX') {
      return NextResponse.json({ 
        country: vercelCountry, 
        ip: ip,
        source: 'vercel' 
      })
    }

    // Fallback: Try to use a free IP geolocation service
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}`, {
        timeout: 3000 // 3 second timeout
      })
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        if (geoData.status === 'success' && geoData.countryCode) {
          return NextResponse.json({ 
            country: geoData.countryCode, 
            ip: ip,
            source: 'ip-api' 
          })
        }
      }
    } catch (error) {
      console.warn('IP geolocation service failed:', error)
    }

    // Final fallback
    return NextResponse.json({ 
      country: 'US', // Default country
      ip: ip,
      source: 'fallback' 
    })

  } catch (error) {
    console.error('Geolocation error:', error)
    return NextResponse.json({ 
      country: 'US', 
      ip: 'unknown',
      source: 'error' 
    })
  }
}