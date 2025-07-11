"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Target, Plus, Play, Trophy, Clock, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface Quiz {
  id: string
  title: string
  documentTitle: string
  questionCount: number
  difficulty: string
  bestScore: number
  attempts: number
  lastAttempt?: string
  createdAt: string
}

export default function QuizzesPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

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
    const fetchQuizzes = async () => {
      try {
        const response = await fetch('/api/quizzes')
        if (response.ok) {
          const data = await response.json()
          setQuizzes(data.quizzes || [])
        } else {
          toast.error(getText('quizzes.generateError', 'Failed to load quizzes'))
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error)
        toast.error(getText('quizzes.generateError', 'Error loading quizzes'))
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [t])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('quizzes.title', 'Quizzes')}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {getText('quizzes.subtitle', 'Test your knowledge with AI-generated quizzes')}
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{getText('common.loading', 'Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('quizzes.title', 'Quizzes')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('quizzes.subtitle', 'Test your knowledge with AI-generated quizzes')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/upload`}>
            <Plus className="mr-2 h-4 w-4" />
            {getText('quizzes.generateQuiz', 'Generate Quiz')}
          </Link>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {getText('quizzes.noQuizzes', 'No quizzes yet')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {getText('quizzes.createFirst', 'Generate your first quiz!')}
              </p>
              <Button className="mt-4" asChild>
                <Link href={`/${locale}/dashboard/upload`}>
                  <Plus className="mr-2 h-4 w-4" />
                  {getText('quizzes.generateQuiz', 'Generate Quiz')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {quiz.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {quiz.questionCount} {getText('quizzes.questions', 'questions')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {getText('summaries.from', 'From')}: {quiz.documentTitle}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Trophy className="mr-1 h-3 w-3" />
                        {getText('quizzes.bestScore', 'Best')}: {quiz.bestScore}%
                      </span>
                      <span className="flex items-center">
                        <BarChart3 className="mr-1 h-3 w-3" />
                        {quiz.attempts} {getText('quizzes.attempts', 'attempts')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {getText('quizzes.lastAttempt', 'Last')}: {quiz.lastAttempt ? new Date(quiz.lastAttempt).toLocaleDateString() : getText('quizzes.never', 'Never')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" asChild>
                      <Link href={`/${locale}/dashboard/quizzes/${quiz.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        {getText('quizzes.startQuiz', 'Start Quiz')}
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/${locale}/dashboard/quizzes/${quiz.id}/results`}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {getText('quizzes.viewResults', 'Results')}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}