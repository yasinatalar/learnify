"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Check, X, Clock, Brain, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/context"

interface Flashcard {
  id: string
  question: string
  answer: string
  explanation?: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  tags: string[]
}

interface FlashcardReviewProps {
  flashcards: Flashcard[]
  onComplete: (results: Array<{ flashcardId: string; rating: number; timeSpent: number }>) => void
  className?: string
}

interface ReviewResult {
  flashcardId: string
  rating: number
  timeSpent: number
}

export function FlashcardReview({ flashcards, onComplete, className }: FlashcardReviewProps) {
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>(flashcards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<ReviewResult[]>([])
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set())
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [sessionStartTime] = useState<number>(Date.now())
  const t = useTranslations()

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

  const currentCard = reviewQueue[currentIndex]
  const totalOriginalCards = flashcards.length
  const progress = (completedCards.size / totalOriginalCards) * 100
  const isLastCard = currentIndex === reviewQueue.length - 1 && completedCards.size === totalOriginalCards

  const handleFlip = () => {
    setIsFlipped(true)
  }

  const handleRating = (rating: 1 | 2 | 3 | 4 | 5) => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    
    const result: ReviewResult = {
      flashcardId: currentCard.id,
      rating,
      timeSpent,
    }

    const newResults = [...results, result]
    setResults(newResults)

    // Handle different rating behaviors
    if (rating <= 2) {
      // Hard or Again - add card back to queue for immediate repetition
      const newQueue = [...reviewQueue]
      // Add the card back after a few positions to avoid immediate repetition
      const insertPosition = Math.min(currentIndex + 3, newQueue.length)
      newQueue.splice(insertPosition, 0, currentCard)
      setReviewQueue(newQueue)
    } else if (rating >= 4) {
      // Easy or Perfect - mark as completed
      const newCompletedCards = new Set(completedCards)
      newCompletedCards.add(currentCard.id)
      setCompletedCards(newCompletedCards)
    } else {
      // Good (rating 3) - mark as completed normally
      const newCompletedCards = new Set(completedCards)
      newCompletedCards.add(currentCard.id)
      setCompletedCards(newCompletedCards)
    }

    // Check if session is complete
    const updatedCompletedCards = rating >= 3 ? new Set([...completedCards, currentCard.id]) : completedCards
    const isSessionComplete = updatedCompletedCards.size === totalOriginalCards

    if (isSessionComplete) {
      // Session complete - all original cards have been rated 3 or higher at least once
      onComplete(newResults)
    } else {
      // Move to next card
      if (currentIndex + 1 < reviewQueue.length) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // If we've reached the end but still have uncompleted cards, restart from beginning
        setCurrentIndex(0)
      }
      setIsFlipped(false)
      setStartTime(Date.now())
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "HARD":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const totalSessionTime = Math.round((Date.now() - sessionStartTime) / 1000)

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{getText('flashcards.noFlashcardsToReview', 'No flashcards to review')}</h3>
        <p className="text-gray-600 dark:text-gray-300">{getText('flashcards.allCaughtUp', 'All caught up!')}</p>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{getText('flashcards.sessionComplete', 'Review session complete')}</h3>
        <p className="text-gray-600 dark:text-gray-300">{getText('flashcards.processingResults', 'Processing your results...')}</p>
      </div>
    )
  }

  return (
    <div className={cn("max-w-2xl mx-auto space-y-6", className)}>
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getText('flashcards.completed', 'Completed')}: {completedCards.size}/{totalOriginalCards} {getText('flashcards.cards', 'cards')}
          </span>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>{formatTime(totalSessionTime)}</span>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Flashcard */}
      <Card className="relative min-h-[400px]">
        <CardContent className="p-8">
          {/* Card metadata */}
          <div className="flex items-center justify-between mb-6">
            <Badge className={getDifficultyColor(currentCard.difficulty)}>
              {currentCard.difficulty.toLowerCase()}
            </Badge>
            {currentCard.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentCard.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Question side */}
          {!isFlipped && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {getText('flashcards.question', 'Question')}
                </h3>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {currentCard.question}
                </p>
              </div>
              
              <div className="flex justify-center pt-8">
                <Button onClick={handleFlip} size="lg">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {getText('flashcards.showAnswer', 'Show Answer')}
                </Button>
              </div>
            </div>
          )}

          {/* Answer side */}
          {isFlipped && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                  {getText('flashcards.answer', 'Answer')}
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {currentCard.answer}
                  </p>
                </div>

                {currentCard.explanation && (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      {getText('flashcards.explanation', 'Explanation')}
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                      {currentCard.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Rating buttons */}
              <div className="space-y-4">
                <h4 className="text-center font-medium text-gray-900 dark:text-white">
                  {getText('flashcards.howWellKnow', 'How well did you know this?')}
                </h4>
                
                <div className="grid grid-cols-5 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(1)}
                    className="flex flex-col h-auto py-3 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mb-1" />
                    <span className="text-xs">{getText('flashcards.again', 'Again')}</span>
                    <span className="text-xs text-gray-500">{getText('flashcards.willRepeat', 'Will repeat')}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(2)}
                    className="flex flex-col h-auto py-3 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <span className="text-lg mb-1">😟</span>
                    <span className="text-xs">{getText('flashcards.hard', 'Hard')}</span>
                    <span className="text-xs text-gray-500">{getText('flashcards.willRepeat', 'Will repeat')}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(3)}
                    className="flex flex-col h-auto py-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <span className="text-lg mb-1">🤔</span>
                    <span className="text-xs">{getText('flashcards.good', 'Good')}</span>
                    <span className="text-xs text-gray-500">{getText('flashcards.complete', 'Complete')}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(4)}
                    className="flex flex-col h-auto py-3 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <span className="text-lg mb-1">😊</span>
                    <span className="text-xs">{getText('flashcards.easy', 'Easy')}</span>
                    <span className="text-xs text-gray-500">{getText('flashcards.complete', 'Complete')}</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRating(5)}
                    className="flex flex-col h-auto py-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <Check className="h-4 w-4 mb-1" />
                    <span className="text-xs">{getText('flashcards.perfect', 'Perfect')}</span>
                    <span className="text-xs text-gray-500">{getText('flashcards.complete', 'Complete')}</span>
                  </Button>
                </div>
                
                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  <p className="mb-1">{getText('flashcards.chooseHowWell', 'Choose how well you knew the answer')}</p>
                  <p className="text-orange-600">
                    <strong>{getText('flashcards.againHard', 'Again/Hard')}:</strong> {getText('flashcards.willRepeatSession', 'Will repeat in this session')} • <strong>{getText('flashcards.goodEasyPerfect', 'Good/Easy/Perfect')}:</strong> {getText('flashcards.complete', 'Complete')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session info */}
      <div className="text-center space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>
            {getText('flashcards.reviews', 'Reviews')}: {results.length} • {getText('flashcards.queue', 'Queue')}: {reviewQueue.length} • {getText('flashcards.remaining', 'Remaining')}: {totalOriginalCards - completedCards.size}
          </p>
        </div>
        {completedCards.has(currentCard.id) && (
          <div className="inline-flex items-center space-x-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
            <RefreshCw className="h-3 w-3" />
            <span>{getText('flashcards.reviewingAgain', 'Reviewing again')}</span>
          </div>
        )}
      </div>
    </div>
  )
}