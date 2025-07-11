"use client"

import { useState, useEffect } from "react"
import { FlashcardReview } from "@/components/flashcards/flashcard-review"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Clock, Target, Trophy, RefreshCw, FileText } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useTranslations, useI18n } from "@/lib/i18n/context"

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
  documentId: string
  documentTitle: string
}

interface ReviewResult {
  flashcardId: string
  rating: number
  timeSpent: number
}

interface ReviewStats {
  totalReviewed: number
  correctAnswers: number
  avgRating: number
  timeSpent: number
  updatedCards?: Array<{
    id: string
    question: string
    nextReview: string
    interval: number
    repetition: number
    rating: number
  }>
}

interface Document {
  id: string
  title: string
  flashcardCount: number
  dueCount: number
}

export default function ReviewPage() {
  const router = useRouter()
  const t = useTranslations()
  const { locale } = useI18n()
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([])
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [studyStreak, setStudyStreak] = useState(0)
  const [reviewMode, setReviewMode] = useState<'due' | 'all'>('due')
  const [currentReviewCards, setCurrentReviewCards] = useState<Flashcard[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<string>('all')

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

  useEffect(() => {
    fetchDocuments()
    fetchFlashcards()
  }, [])

  useEffect(() => {
    fetchFlashcards()
  }, [selectedDocument])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      if (data.success) {
        // Add document flashcard counts
        const documentsWithCounts = await Promise.all(
          data.documents.map(async (doc: any) => {
            const allResponse = await fetch(`/api/flashcards?documentId=${doc.id}`)
            const dueResponse = await fetch(`/api/flashcards?documentId=${doc.id}&dueOnly=true`)
            
            const allData = allResponse.ok ? await allResponse.json() : { flashcards: [] }
            const dueData = dueResponse.ok ? await dueResponse.json() : { flashcards: [] }
            
            return {
              id: doc.id,
              title: doc.title,
              flashcardCount: allData.flashcards?.length || 0,
              dueCount: dueData.flashcards?.length || 0
            }
          })
        )
        setDocuments(documentsWithCounts)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchFlashcards = async () => {
    try {
      setLoading(true)
      
      const documentParam = selectedDocument === 'all' ? '' : `&documentId=${selectedDocument}`
      
      // Fetch due flashcards
      const dueResponse = await fetch(`/api/flashcards?dueOnly=true${documentParam}`)
      if (!dueResponse.ok) {
        throw new Error('Failed to fetch due flashcards')
      }
      const dueData = await dueResponse.json()
      
      // Fetch all flashcards
      const allResponse = await fetch(`/api/flashcards${documentParam ? `?${documentParam.slice(1)}` : ''}`)
      if (!allResponse.ok) {
        throw new Error('Failed to fetch all flashcards')
      }
      const allData = await allResponse.json()
      
      if (dueData.success && allData.success) {
        const dueCards = dueData.flashcards.map((card: any) => ({
          ...card,
          nextReview: new Date(card.nextReview)
        }))
        const allCards = allData.flashcards.map((card: any) => ({
          ...card,
          nextReview: new Date(card.nextReview)
        }))
        
        setDueFlashcards(dueCards)
        setAllFlashcards(allCards)
      } else {
        toast.error(getText('review.loadError', 'Failed to load flashcards'))
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error)
      toast.error(getText('review.loadError', 'Failed to load flashcards'))
    } finally {
      setLoading(false)
    }
  }

  const handleStartReview = () => {
    const cardsToReview = reviewMode === 'due' ? dueFlashcards : allFlashcards
    
    if (cardsToReview.length === 0) {
      const errorMessage = reviewMode === 'due' 
        ? getText('review.noCardsDue', 'No flashcards are due for review')
        : getText('review.noCardsAvailable', 'No flashcards available for review')
      toast.error(errorMessage)
      return
    }
    
    setCurrentReviewCards(cardsToReview)
    setReviewing(true)
    setReviewStats(null)
  }

  const handleReviewComplete = async (results: ReviewResult[]) => {
    try {
      // Calculate stats
      const totalReviewed = results.length
      const correctAnswers = results.filter(r => r.rating >= 3).length
      const avgRating = results.reduce((sum, r) => sum + r.rating, 0) / results.length
      const timeSpent = results.reduce((sum, r) => sum + r.timeSpent, 0)

      const stats: ReviewStats = {
        totalReviewed,
        correctAnswers,
        avgRating,
        timeSpent,
      }

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

      // Store the updated flashcard data with next review times
      setReviewStats({
        ...stats,
        updatedCards: data.updatedCards || []
      })
      setReviewing(false)
      
      // Refresh flashcards
      await fetchFlashcards()
      
      // Update study streak (simplified logic)
      setStudyStreak(prev => prev + 1)

      const successMessage = getText('review.reviewComplete', `Review completed! ${correctAnswers}/${totalReviewed} correct`)
      toast.success(successMessage)
    } catch (error) {
      console.error("Error saving review results:", error)
      toast.error(getText('review.saveError', 'Failed to save review results'))
    }
  }

  const handleBackToReview = () => {
    setReviewing(false)
    setReviewStats(null)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'HARD': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return getText('flashcards.easy', 'Easy')
      case "MEDIUM":
        return getText('flashcards.medium', 'Medium')
      case "HARD":
        return getText('flashcards.hard', 'Hard')
      default:
        return difficulty.toLowerCase()
    }
  }

  const getEstimatedTime = (cardCount: number) => {
    const avgTimePerCard = 1.5 // minutes
    return Math.ceil(cardCount * avgTimePerCard)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100'
    if (rating === 3) return 'text-blue-600 bg-blue-100'
    return 'text-red-600 bg-red-100'
  }

  const getRatingText = (rating: number) => {
    switch(rating) {
      case 1: return getText('review.again', 'Again')
      case 2: return getText('review.hard', 'Hard')
      case 3: return getText('review.good', 'Good')
      case 4: return getText('review.easy', 'Easy')
      case 5: return getText('review.perfect', 'Perfect')
      default: return getText('review.unknown', 'Unknown')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-gray-400 animate-pulse mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{getText('review.loadingSession', 'Loading your review session...')}</p>
        </div>
      </div>
    )
  }

  if (reviewing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getText('review.reviewSession', 'Review Session')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {getText('review.reviewingCards', 'Reviewing')} {currentReviewCards.length} {getText('review.flashcard', 'flashcard')}{currentReviewCards.length !== 1 ? getText('review.plural', 's') : ''} ({reviewMode === 'due' ? getText('review.dueCards', 'Due Cards') : getText('review.allCards', 'All Cards')})
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToReview}>
            {getText('review.backToReview', 'Back to Review')}
          </Button>
        </div>

        <FlashcardReview
          flashcards={currentReviewCards}
          onComplete={handleReviewComplete}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {getText('review.reviewSession', 'Review Session')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('review.subtitle', 'Review flashcards that are due for spaced repetition')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={fetchFlashcards}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {getText('review.refresh', 'Refresh')}
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/dashboard/flashcards`)}
            variant="outline"
          >
            {getText('review.allFlashcards', 'All Flashcards')}
          </Button>
        </div>
      </div>

      {/* Review Stats (after completing a session) */}
      {reviewStats && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center text-green-800 dark:text-green-200">
                <Trophy className="mr-2 h-5 w-5" />
                {getText('review.sessionComplete', 'Review Session Complete!')}
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                {getText('review.sessionCompleteDesc', 'Excellent work! Keep up the momentum with consistent reviews.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {reviewStats.totalReviewed}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">{getText('review.cardsReviewed', 'Cards Reviewed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {Math.round((reviewStats.correctAnswers / reviewStats.totalReviewed) * 100)}%
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">{getText('review.accuracy', 'Accuracy')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {reviewStats.avgRating.toFixed(1)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">{getText('review.avgRating', 'Avg Rating')}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {Math.round(reviewStats.timeSpent / 60)}m
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">{getText('review.timeSpent', 'Time Spent')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Review Schedule */}
          {reviewStats.updatedCards && reviewStats.updatedCards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {getText('review.nextReviewSchedule', 'Next Review Schedule')}
                </CardTitle>
                <CardDescription>
                  {getText('review.nextReviewScheduleDesc', 'Based on your performance, here\'s when you\'ll see these cards again')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewStats.updatedCards.map((card) => {
                    const nextReview = new Date(card.nextReview)
                    const now = new Date()
                    const daysDiff = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <div key={card.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                            {card.question}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`text-xs ${getRatingColor(card.rating)}`}>
                              {getRatingText(card.rating)}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {getText('review.rep', 'Rep')}: {card.repetition}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {daysDiff === 0 ? getText('review.today', 'Today') : 
                             daysDiff === 1 ? getText('review.tomorrow', 'Tomorrow') : 
                             daysDiff < 7 ? `${daysDiff} ${getText('review.days', 'days')}` :
                             daysDiff < 30 ? `${Math.ceil(daysDiff / 7)} ${getText('review.weeks', 'weeks')}` :
                             `${Math.ceil(daysDiff / 30)} ${getText('review.months', 'months')}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {nextReview.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 {getText('review.howItWorks', 'How it works')}:</strong> {getText('review.howItWorksDesc', 'Cards you rated "Again" or "Hard" will appear sooner, while cards you found "Easy" or "Perfect" will have longer intervals. This is spaced repetition working!')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Document Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            {getText('review.chooseDocument', 'Choose Document')}
          </CardTitle>
          <CardDescription>
            {getText('review.chooseDocumentDesc', 'Select which document\'s flashcards you want to review')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* All Documents Option */}
            <Button
              variant={selectedDocument === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedDocument('all')}
              className="flex flex-col h-auto py-4 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span className="font-medium">{getText('review.allDocuments', 'All Documents')}</span>
              </div>
              <div className="text-sm text-center">
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {documents.reduce((sum, doc) => sum + doc.flashcardCount, 0)} {getText('review.total', 'total')}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {documents.reduce((sum, doc) => sum + doc.dueCount, 0)} {getText('review.due', 'due')}
                  </Badge>
                </div>
              </div>
            </Button>
            
            {/* Individual Documents */}
            {documents.slice(0, 5).map((doc) => (
              <Button
                key={doc.id}
                variant={selectedDocument === doc.id ? 'default' : 'outline'}
                onClick={() => setSelectedDocument(doc.id)}
                className="flex flex-col h-auto py-4 space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-sm truncate max-w-[120px]">{doc.title}</span>
                </div>
                <div className="text-sm text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {doc.flashcardCount} {getText('review.total', 'total')}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {doc.dueCount} {getText('review.due', 'due')}
                    </Badge>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          {/* Show remaining documents in a dropdown if there are more than 5 */}
          {documents.length > 5 && (
            <div className="mt-4">
              <Select 
                value={selectedDocument} 
                onValueChange={setSelectedDocument}
                disabled={documents.length <= 5}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getText('review.moreDocuments', 'More documents...')} />
                </SelectTrigger>
                <SelectContent>
                  {documents.slice(5).map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{doc.title}</span>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {doc.flashcardCount} {getText('review.total', 'total')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {doc.dueCount} {getText('review.due', 'due')}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>💡 {getText('review.documentSelection', 'Document Selection')}:</strong> {selectedDocument === 'all' ? getText('review.reviewFromAll', 'Review flashcards from all your documents') : getText('review.reviewFromSelected', `Review flashcards from "${documents.find(d => d.id === selectedDocument)?.title || 'Selected Document'}"`)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Review Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            {getText('review.chooseReviewMode', 'Choose Review Mode')}
          </CardTitle>
          <CardDescription>
            {getText('review.chooseReviewModeDesc', 'Select which flashcards you want to review')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={reviewMode === 'due' ? 'default' : 'outline'}
              onClick={() => setReviewMode('due')}
              className="flex flex-col h-auto py-4 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{getText('review.dueCardsOnly', 'Due Cards Only')}</span>
              </div>
              <div className="text-sm text-center">
                <p className="text-2xl font-bold">{dueFlashcards.length}</p>
                <p className="text-xs opacity-75">{getText('review.cardsReadyForReview', 'Cards ready for review')}</p>
              </div>
            </Button>
            
            <Button
              variant={reviewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setReviewMode('all')}
              className="flex flex-col h-auto py-4 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span className="font-medium">{getText('review.allCards', 'All Cards')}</span>
              </div>
              <div className="text-sm text-center">
                <p className="text-2xl font-bold">{allFlashcards.length}</p>
                <p className="text-xs opacity-75">{getText('review.allFlashcards', 'All flashcards')}</p>
              </div>
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {reviewMode === 'due' ? (
                <><strong>💡 {getText('review.dueCards', 'Due Cards')}:</strong> {getText('review.dueCardsDesc', 'Review only flashcards that are scheduled for today based on spaced repetition.')}</>
              ) : (
                <><strong>💡 {getText('review.allCards', 'All Cards')}:</strong> {getText('review.allCardsDesc', 'Review any flashcard regardless of schedule. Great for extra practice or before exams.')}</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Study Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{reviewMode === 'due' ? getText('review.dueToday', 'Due Today') : getText('review.totalCards', 'Total Cards')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewMode === 'due' ? dueFlashcards.length : allFlashcards.length}</div>
            <p className="text-xs text-muted-foreground">
              {reviewMode === 'due' 
                ? (dueFlashcards.length === 0 ? getText('review.allCaughtUp', 'All caught up!') : getText('review.readyForReview', 'Ready for review'))
                : getText('review.availableForReview', 'Available for review')
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('review.estimatedTime', 'Estimated Time')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getEstimatedTime(reviewMode === 'due' ? dueFlashcards.length : allFlashcards.length)}m</div>
            <p className="text-xs text-muted-foreground">
              {getText('review.basedOnCards', 'Based on')} {reviewMode === 'due' ? dueFlashcards.length : allFlashcards.length} {getText('review.cards', 'cards')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('review.studyStreak', 'Study Streak')}</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studyStreak}</div>
            <p className="text-xs text-muted-foreground">
              {getText('review.daysInARow', 'Days in a row')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flashcards for Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            {reviewMode === 'due' ? getText('review.dueFlashcards', 'Due Flashcards') : getText('review.allFlashcards', 'All Flashcards')}
          </CardTitle>
          <CardDescription>
            {reviewMode === 'due' 
              ? getText('review.dueFlashcardsDesc', 'These flashcards are ready for review based on spaced repetition scheduling')
              : getText('review.allFlashcardsDesc', 'All available flashcards for review practice')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(reviewMode === 'due' ? dueFlashcards : allFlashcards).length === 0 ? (
            <div className="text-center py-12">
              <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {reviewMode === 'due' ? getText('review.noFlashcardsDue', 'No flashcards due for review') : getText('review.noFlashcardsAvailable', 'No flashcards available')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {reviewMode === 'due' 
                  ? getText('review.allCaughtUpDesc', 'You\'re all caught up! Check back later or create more flashcards.')
                  : getText('review.createFlashcardsFirst', 'Create some flashcards first to start reviewing.')
                }
              </p>
              <Button onClick={() => router.push(`/${locale}/dashboard/flashcards`)}>
                {getText('review.viewAllFlashcards', 'View All Flashcards')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {(reviewMode === 'due' ? dueFlashcards : allFlashcards).length} {getText('review.flashcard', 'flashcard')}{(reviewMode === 'due' ? dueFlashcards : allFlashcards).length !== 1 ? getText('review.plural', 's') : ''} {getText('review.readyForReview', 'ready for review')}
                </p>
                <Button onClick={handleStartReview}>
                  {getText('review.startReviewSession', 'Start Review Session')}
                </Button>
              </div>

              <div className="grid gap-4">
                {(reviewMode === 'due' ? dueFlashcards : allFlashcards).slice(0, 5).map((card) => (
                  <div
                    key={card.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {card.question}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {getText('review.from', 'From')}: {card.documentTitle}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getDifficultyColor(card.difficulty)}>
                            {getDifficultyText(card.difficulty)}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getText('review.interval', 'Interval')}: {card.interval} {getText('review.day', 'day')}{card.interval !== 1 ? getText('review.plural', 's') : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(reviewMode === 'due' ? dueFlashcards : allFlashcards).length > 5 && (
                  <div className="text-center pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {getText('review.andMore', 'And')} {(reviewMode === 'due' ? dueFlashcards : allFlashcards).length - 5} {getText('review.moreFlashcards', 'more flashcards...')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}