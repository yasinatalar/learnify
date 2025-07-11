"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FlashcardsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to German by default for old routes
    router.replace('/de/dashboard/flashcards')
  }, [router])
  
  return null
}