"use client"

import { useState, useEffect, useRef } from "react"
import { Search, FileText, Brain, HelpCircle, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useI18n, useTranslations } from "@/lib/i18n/context"

interface SearchResult {
  documents: {
    id: string
    title: string
    originalName: string
    status: string
    fileType: string
    createdAt: string
    updatedAt: string
  }[]
  flashcards: {
    id: string
    question: string
    answer: string
    difficulty: string
    tags: string
    nextReview: string
    document: {
      id: string
      title: string
    }
  }[]
  quizzes: {
    id: string
    title: string
    description: string | null
    difficulty: string
    attempts: number
    lastAttemptAt: string | null
    document: {
      id: string
      title: string
    } | null
    _count: {
      questions: number
    }
  }[]
  total: number
}

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { locale } = useI18n()
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

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query)
      } else {
        setResults(null)
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultClick = (type: 'document' | 'flashcard' | 'quiz', id: string) => {
    setShowResults(false)
    setQuery("")
    
    switch (type) {
      case 'document':
        router.push(`/${locale}/dashboard/documents/${id}`)
        break
      case 'flashcard':
        router.push(`/${locale}/dashboard/flashcards?highlight=${id}`)
        break
      case 'quiz':
        router.push(`/${locale}/dashboard/quizzes/${id}`)
        break
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'uploaded': return 'bg-gray-100 text-gray-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={getText('search.placeholder', 'Search documents, flashcards, quizzes...')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 w-80"
          onFocus={() => {
            if (results && query.trim().length >= 2) {
              setShowResults(true)
            }
          }}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {results.total === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {getText('search.noResults', 'No results found for')} "{query}"
            </div>
          ) : (
            <div className="p-2">
              {/* Documents Section */}
              {results.documents.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FileText className="h-4 w-4" />
                    {getText('search.documents', 'Documents')} ({results.documents.length})
                  </div>
                  {results.documents.map((doc) => (
                    <Button
                      key={doc.id}
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto mb-1"
                      onClick={() => handleResultClick('document', doc.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.originalName} • {formatDate(doc.updatedAt)}
                          </div>
                        </div>
                        <Badge className={cn("text-xs", getStatusColor(doc.status))}>
                          {doc.status}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* Flashcards Section */}
              {results.flashcards.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Brain className="h-4 w-4" />
                    {getText('search.flashcards', 'Flashcards')} ({results.flashcards.length})
                  </div>
                  {results.flashcards.map((card) => (
                    <Button
                      key={card.id}
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto mb-1"
                      onClick={() => handleResultClick('flashcard', card.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <div className="flex-1 text-left">
                          <div className="font-medium line-clamp-1">{card.question}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <span>{getText('search.from', 'from')} {card.document.title}</span>
                            <Clock className="h-3 w-3" />
                            <span>{getText('search.due', 'Due')} {formatDate(card.nextReview)}</span>
                          </div>
                        </div>
                        <Badge className={cn("text-xs", getDifficultyColor(card.difficulty))}>
                          {card.difficulty}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* Quizzes Section */}
              {results.quizzes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <HelpCircle className="h-4 w-4" />
                    {getText('search.quizzes', 'Quizzes')} ({results.quizzes.length})
                  </div>
                  {results.quizzes.map((quiz) => (
                    <Button
                      key={quiz.id}
                      variant="ghost"
                      className="w-full justify-start p-2 h-auto mb-1"
                      onClick={() => handleResultClick('quiz', quiz.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <HelpCircle className="h-4 w-4 text-green-500" />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{quiz.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {quiz.description || (quiz.document ? `${getText('search.from', 'from')} ${quiz.document.title}` : getText('search.standaloneQuiz', 'Standalone quiz'))}
                            {quiz._count.questions > 0 && ` • ${quiz._count.questions} ${getText('search.questions', 'questions')}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", getDifficultyColor(quiz.difficulty))}>
                            {quiz.difficulty}
                          </Badge>
                          {quiz.attempts > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {quiz.attempts} {getText('search.attempts', 'attempts')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {/* View All Results */}
              {results.total > 8 && (
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      router.push(`/${locale}/dashboard/search?q=${encodeURIComponent(query)}`)
                      setShowResults(false)
                      setQuery("")
                    }}
                  >
                    {getText('search.viewAll', 'View all')} {results.total} {getText('search.results', 'results')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}