"use client"

import { useState, useEffect } from "react"
import { FlashcardList } from "@/components/flashcards/flashcard-list"
import { FlashcardReview } from "@/components/flashcards/flashcard-review"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft, Trophy, Plus } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useI18n } from "@/lib/i18n/context"
import Link from "next/link"

interface Flashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  tags: string[]
  nextReview: Date
  interval: number
  repetition: number
  efactor: number
}

interface ReviewResult {
  flashcardId: string
  rating: number
  timeSpent: number
}

export default function FlashcardsPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewFlashcards, setReviewFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewStats, setReviewStats] = useState<{
    totalReviewed: number
    correctAnswers: number
    avgRating: number
    timeSpent: number
  } | null>(null)

  // Safe accessor function
  const getText = (path: string, fallback: string = '') => {
    const keys = path.split('.')
    let current: any = t
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return fallback
      }
    }
    
    return typeof current === 'string' ? current : fallback
  }

  // Fetch flashcards from API
  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await fetch('/api/flashcards')
        if (!response.ok) {
          throw new Error('Failed to fetch flashcards')
        }
        const data = await response.json()
        if (data.success) {
          setFlashcards(data.flashcards || [])
        } else {
          toast.error(data.error || getText('flashcards.generateError', 'Failed to load flashcards'))
        }
      } catch (error) {
        console.error('Error fetching flashcards:', error)
        toast.error(getText('flashcards.generateError', 'Failed to load flashcards'))
      } finally {
        setLoading(false)
      }
    }

    fetchFlashcards()
  }, [t])

  const handleStartReview = (cards: Flashcard[]) => {
    if (cards.length === 0) {
      toast.error(getText('flashcards.noCardsToReview', 'No flashcards to review'))
      return
    }
    
    setReviewFlashcards(cards)
    setReviewMode(true)
    setReviewStats(null)
  }

  const handleReviewComplete = async (results: ReviewResult[]) => {
    try {
      // Calculate stats
      const totalReviewed = results.length
      const correctAnswers = results.filter(r => r.rating >= 3).length
      const avgRating = results.reduce((sum, r) => sum + r.rating, 0) / results.length
      const timeSpent = results.reduce((sum, r) => sum + r.timeSpent, 0)

      setReviewStats({
        totalReviewed,
        correctAnswers,
        avgRating,
        timeSpent,
      })

      // Send results to API to update flashcard intervals
      const response = await fetch('/api/flashcards/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviews: results.map(r => ({
            flashcardId: r.flashcardId,
            rating: r.rating,
            timeSpent: r.timeSpent,
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save review results')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to save review results')
      }

      const successMessage = getText('flashcards.reviewCompleteSuccess', `Review completed! ${correctAnswers}/${totalReviewed} correct`)
      toast.success(successMessage)
    } catch (error) {
      console.error("Error saving review results:", error)
      toast.error(getText('flashcards.reviewSaveError', 'Failed to save review results'))
    }
  }

  const handleBackToList = () => {
    setReviewMode(false)
    setReviewFlashcards([])
    // Optionally refresh flashcards to get updated intervals
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-gray-400 animate-pulse mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{getText('flashcards.loadingFlashcards', 'Loading your flashcards...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {reviewMode ? getText('flashcards.reviewSession', 'Review Session') : getText('flashcards.title', 'Flashcards')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {reviewMode 
              ? `${getText('flashcards.reviewing', 'Reviewing')} ${reviewFlashcards.length} ${getText('flashcards.flashcard', 'flashcard')}${reviewFlashcards.length !== 1 ? getText('flashcards.plural', 's') : ''}`
              : getText('flashcards.subtitle', 'Practice and review your learning materials')
            }
          </p>
        </div>
        
        {reviewMode && (
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getText('flashcards.backToList', 'Back to List')}
          </Button>
        )}
      </div>

      {/* Review Stats (after completing a session) */}
      {reviewStats && !reviewMode && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800 dark:text-green-200">
              <Trophy className="mr-2 h-5 w-5" />
              {getText('flashcards.reviewComplete', 'Review Complete!')}
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              {getText('flashcards.reviewCompleteDesc', 'Great job on completing your review session')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {reviewStats.totalReviewed}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">{getText('flashcards.cardsReviewed', 'Cards Reviewed')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {Math.round((reviewStats.correctAnswers / reviewStats.totalReviewed) * 100)}%
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">{getText('flashcards.accuracy', 'Accuracy')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {reviewStats.avgRating.toFixed(1)}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">{getText('flashcards.avgRating', 'Avg Rating')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {Math.round(reviewStats.timeSpent / 60)}m
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">{getText('flashcards.timeSpent', 'Time Spent')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {reviewMode ? (
        <FlashcardReview
          flashcards={reviewFlashcards}
          onComplete={handleReviewComplete}
        />
      ) : (
        <FlashcardList
          flashcards={flashcards}
          onStartReview={handleStartReview}
          onEditFlashcard={(flashcard) => {
            // TODO: Implement edit functionality
            console.log("Edit flashcard:", flashcard)
            toast.info(getText('flashcards.editComingSoon', 'Edit functionality coming soon!'))
          }}
        />
      )}
    </div>
  )
}