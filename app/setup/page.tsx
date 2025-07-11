"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SetupWizard } from "@/components/setup/setup-wizard"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Loader2 } from "lucide-react"

interface SetupStatus {
  setupCompleted: boolean
  isNewUser: boolean
  user: {
    id: string
    name: string
    email: string
  }
}

export default function SetupPage() {
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
        
        // If setup is already completed, redirect to dashboard
        if (data.setupCompleted) {
          router.push('/dashboard')
          return
        }
      } else {
        // If unauthorized, redirect to login
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Setup status check error:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-blue-600 mb-4" />
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Loading setup...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!setupStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-blue-600 mb-4" />
            <p className="text-muted-foreground">Failed to load setup. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <SetupWizard
      onComplete={handleSetupComplete}
      userEmail={setupStatus.user.email}
      userName={setupStatus.user.name || 'User'}
    />
  )
}