import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface UsageData {
  documentsProcessed: number
  flashcardsGenerated: number
  quizzesGenerated: number
  quizzesCompleted: number
  summariesGenerated: number
  aiTokensUsed: number
  documentsLimit: number
  flashcardsLimit: number
  quizzesLimit: number
  summariesLimit: number
  aiTokensLimit: number
  lastReset: string
  documentsProgress: number
  flashcardsProgress: number
  quizzesProgress: number
  summariesProgress: number
  tokensProgress: number
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/usage', {
        // Add cache busting to ensure fresh data
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUsage(data.usage)
          setError(null)
        } else {
          setError(data.error || "Failed to load usage data")
        }
      } else {
        setError("Failed to load usage data")
      }
    } catch (error) {
      console.error("Usage fetch error:", error)
      setError("Failed to load usage data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  // Refresh usage data when pathname changes (user navigates)
  useEffect(() => {
    // Only refresh if we already have data (not on initial load)
    if (usage) {
      fetchUsage()
    }
  }, [pathname])

  // Auto-refresh every 30 seconds to catch any updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsage()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    usage,
    loading,
    error,
    refreshUsage: fetchUsage
  }
}