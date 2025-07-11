import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface SetupStatus {
  setupCompleted: boolean
  isNewUser: boolean
  user: {
    id: string
    name: string
    email: string
  }
}

export function useSetupStatus() {
  const router = useRouter()
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/status')
      if (response.ok) {
        const data = await response.json()
        setSetupStatus(data)
        
        // If user is new and hasn't completed setup, redirect to setup
        if (data.isNewUser && !data.setupCompleted) {
          router.push('/setup')
          return
        }
      } else if (response.status === 401) {
        // If unauthorized, redirect to login
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Setup status check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const requireSetup = () => {
    if (!loading && setupStatus?.isNewUser && !setupStatus?.setupCompleted) {
      router.push('/setup')
      return true
    }
    return false
  }

  return {
    setupStatus,
    loading,
    requireSetup,
    needsSetup: setupStatus?.isNewUser && !setupStatus?.setupCompleted,
  }
}