"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to German by default for old routes
    router.replace('/de/dashboard/review')
  }, [router])
  
  return null
}