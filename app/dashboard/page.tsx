"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to German by default for old routes
    router.replace('/de/dashboard')
  }, [router])
  
  return null
}