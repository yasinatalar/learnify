"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Search, Filter, Clock, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/i18n/context"

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

interface FlashcardListProps {
  flashcards: Flashcard[]
  onStartReview: (flashcards: Flashcard[]) => void
  onEditFlashcard?: (flashcard: Flashcard) => void
  className?: string
}

export function FlashcardList({ 
  flashcards, 
  onStartReview, 
  onEditFlashcard,
  className 
}: FlashcardListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
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

  // Filter flashcards
  const filteredFlashcards = flashcards.filter(card => {
    const matchesSearch = card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDifficulty = difficultyFilter === "all" || card.difficulty === difficultyFilter.toUpperCase()
    
    const now = new Date()
    const isDue = new Date(card.nextReview) <= now
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "due" && isDue) ||
                         (statusFilter === "learning" && card.repetition < 3) ||
                         (statusFilter === "mastered" && card.repetition >= 3 && !isDue)

    return matchesSearch && matchesDifficulty && matchesStatus
  })

  // Categorize flashcards
  const now = new Date()
  const dueCards = flashcards.filter(card => new Date(card.nextReview) <= now)
  const learningCards = flashcards.filter(card => card.repetition < 3)
  const masteredCards = flashcards.filter(card => card.repetition >= 3 && new Date(card.nextReview) > now)

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

  const getStatusBadge = (card: Flashcard) => {
    const isDue = new Date(card.nextReview) <= now
    
    if (isDue) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{getText('search.due', 'Due')}</Badge>
    } else if (card.repetition < 3) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{getText('flashcards.learning', 'Learning')}</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{getText('flashcards.mastered', 'Mastered')}</Badge>
    }
  }

  const formatNextReview = (date: Date) => {
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} ${getText('flashcards.daysOverdue', 'days overdue')}`
    } else if (diffDays === 0) {
      return getText('flashcards.today', 'Today')
    } else if (diffDays === 1) {
      return getText('flashcards.tomorrow', 'Tomorrow')
    } else if (diffDays < 7) {
      return `${getText('flashcards.inDays', 'In')} ${diffDays} ${getText('analytics.days', 'days')}`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{getText('flashcards.noFlashcards', 'No flashcards yet')}</h3>
        <p className="text-gray-600 dark:text-gray-300">
          {getText('flashcards.generateToStart', 'Generate some flashcards from your documents to start learning!')}
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-red-600">{dueCards.length}</p>
                <p className="text-xs text-gray-600">{getText('analytics.dueForReview', 'Due for review')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{learningCards.length}</p>
                <p className="text-xs text-gray-600">{getText('flashcards.learning', 'Learning')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <RotateCcw className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-green-600">{masteredCards.length}</p>
                <p className="text-xs text-gray-600">{getText('flashcards.mastered', 'Mastered')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{flashcards.length}</p>
                <p className="text-xs text-gray-600">{getText('flashcards.totalCards', 'Total cards')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onStartReview(dueCards)} disabled={dueCards.length === 0}>
          {getText('flashcards.reviewDueCards', 'Review Due Cards')} ({dueCards.length})
        </Button>
        <Button variant="outline" onClick={() => onStartReview(learningCards)} disabled={learningCards.length === 0}>
          {getText('flashcards.studyLearningCards', 'Study Learning Cards')} ({learningCards.length})
        </Button>
        <Button variant="outline" onClick={() => onStartReview(flashcards)}>
          {getText('flashcards.reviewAllCards', 'Review All Cards')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={getText('flashcards.searchPlaceholder', 'Search flashcards...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getText('flashcards.allDifficulty', 'All Difficulty')}</SelectItem>
            <SelectItem value="easy">{getText('flashcards.easy', 'Easy')}</SelectItem>
            <SelectItem value="medium">{getText('flashcards.medium', 'Medium')}</SelectItem>
            <SelectItem value="hard">{getText('flashcards.hard', 'Hard')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{getText('documents.allStatus', 'All Status')}</SelectItem>
            <SelectItem value="due">{getText('search.due', 'Due')}</SelectItem>
            <SelectItem value="learning">{getText('flashcards.learning', 'Learning')}</SelectItem>
            <SelectItem value="mastered">{getText('flashcards.mastered', 'Mastered')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Flashcards List */}
      <div className="space-y-3">
        {filteredFlashcards.map((card) => (
          <Card key={card.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(card)}
                    <Badge className={getDifficultyColor(card.difficulty)}>
                      {card.difficulty.toLowerCase()}
                    </Badge>
                    {card.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                    {card.question}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {card.answer}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{getText('flashcards.nextReview', 'Next review')}: {formatNextReview(new Date(card.nextReview))}</span>
                    <span>{getText('flashcards.repetitions', 'Repetitions')}: {card.repetition}</span>
                    <span>{getText('flashcards.interval', 'Interval')}: {card.interval} {getText('analytics.days', 'days')}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStartReview([card])}
                  >
                    {getText('nav.review', 'Review')}
                  </Button>
                  {onEditFlashcard && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditFlashcard(card)}
                    >
                      {getText('common.edit', 'Edit')}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFlashcards.length === 0 && flashcards.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            {getText('flashcards.noMatches', 'No flashcards match your current filters.')}
          </p>
        </div>
      )}
    </div>
  )
}