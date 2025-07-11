"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Trophy, 
  BarChart3,
  TrendingUp,
  CheckCircle,
  XCircle,
  Play,
  Calendar,
  Award,
  Brain
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface QuizAttempt {
  id: string
  score: number
  totalPoints: number
  accuracy: number
  totalTime: number
  completedAt: string
  answers: any[]
  percentage: number
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: string
  points: number
  tags: string[]
}

interface Quiz {
  id: string
  title: string
  description: string
  difficulty: string
  questionCount: number
  documentId: string
  documentTitle: string
  questions: QuizQuestion[]
  attempts: number
}

interface QuizResults {
  quiz: Quiz
  attempts: QuizAttempt[]
  averageScore: number
  bestScore: number
  totalAttempts: number
  improvementRate: number
  strongAreas: string[]
  weakAreas: string[]
}

export default function QuizResultsPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const { locale } = useI18n()
  
  const [results, setResults] = useState<QuizResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null)

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
    const fetchQuizResults = async () => {
      try {
        // Get the quiz details with attempts from the existing API
        const quizResponse = await fetch(`/api/quizzes/${params.id}`)
        if (!quizResponse.ok) {
          throw new Error('Failed to fetch quiz')
        }
        const quizData = await quizResponse.json()
        
        // Get all attempts for this quiz from the main quizzes API
        const attemptsResponse = await fetch(`/api/quizzes?documentId=${quizData.quiz.documentId}`)
        const attemptsData = attemptsResponse.ok ? await attemptsResponse.json() : { quizzes: [] }
        
        // Find the current quiz and extract its attempts
        const currentQuiz = attemptsData.quizzes?.find((q: any) => q.id === params.id)
        const attempts = currentQuiz?.quizAttempts || []
        
        // Transform attempts to match our interface
        const transformedAttempts = attempts.map((attempt: any) => ({
          id: attempt.id,
          score: attempt.score,
          totalPoints: attempt.totalPoints,
          accuracy: attempt.accuracy,
          totalTime: attempt.totalTime,
          completedAt: attempt.completedAt,
          answers: attempt.answers ? JSON.parse(attempt.answers) : [],
          percentage: Math.round((attempt.score / attempt.totalPoints) * 100),
        }))
        
        // Calculate statistics
        const scores = transformedAttempts.map((a: QuizAttempt) => a.percentage)
        const averageScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0
        const bestScore = scores.length > 0 ? Math.max(...scores) : 0
        const improvementRate = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0
        
        // Analyze question performance (mock data for now)
        const strongAreas = ['Fundamentals', 'Core Concepts']
        const weakAreas = ['Advanced Topics', 'Applications']
        
        const resultsData: QuizResults = {
          quiz: quizData.quiz,
          attempts: transformedAttempts,
          averageScore,
          bestScore,
          totalAttempts: transformedAttempts.length,
          improvementRate,
          strongAreas,
          weakAreas
        }
        
        setResults(resultsData)
        if (transformedAttempts.length > 0) {
          setSelectedAttempt(transformedAttempts[0]) // Select most recent attempt
        }
      } catch (error) {
        console.error('Error fetching quiz results:', error)
        toast.error(getText('quizzes.generateError', 'Failed to load quiz results'))
        router.push(`/${locale}/dashboard/quizzes`)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQuizResults()
    }
  }, [params.id, router, locale, getText])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/quizzes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getText('common.back', 'Back')}
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{getText('common.loading', 'Loading...')}</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/quizzes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getText('common.back', 'Back')}
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {getText('quizzes.generateError', 'Quiz results not found')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('documents.documentNotFoundDesc', 'The quiz results you\'re looking for don\'t exist.')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/quizzes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getText('common.back', 'Back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {getText('quizzes.viewResults', 'Quiz Results')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {results.quiz.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href={`/${locale}/dashboard/quizzes/${results.quiz.id}`}>
              <Play className="mr-2 h-4 w-4" />
              {getText('quizzes.retakeQuiz', 'Retake Quiz')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('quizzes.bestScore', 'Best Score')}</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(results.bestScore)}`}>
              {Math.round(results.bestScore)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getText('quizzes.highestScore', 'Highest achieved')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('quizzes.averageScore', 'Average Score')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(results.averageScore)}`}>
              {Math.round(results.averageScore)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getText('quizzes.acrossAttempts', 'Across all attempts')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('quizzes.totalAttempts', 'Total Attempts')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              {getText('quizzes.attempts', 'attempts')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('analytics.improvementRate', 'Improvement')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${results.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {results.improvementRate >= 0 ? '+' : ''}{Math.round(results.improvementRate)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {getText('quizzes.sinceFirst', 'Since first attempt')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attempts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attempts">{getText('quizzes.attempts', 'Attempts')}</TabsTrigger>
          <TabsTrigger value="analysis">{getText('analytics.analysis', 'Analysis')}</TabsTrigger>
          <TabsTrigger value="review">{getText('quizzes.reviewAnswers', 'Review Answers')}</TabsTrigger>
        </TabsList>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {getText('quizzes.attemptHistory', 'Attempt History')}
              </CardTitle>
              <CardDescription>
                {getText('quizzes.attemptHistoryDesc', 'Your quiz performance over time')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.attempts.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    {getText('quizzes.noAttempts', 'No attempts yet')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.attempts.map((attempt, index) => (
                    <div
                      key={attempt.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAttempt?.id === attempt.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAttempt(attempt)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <span className="text-sm font-medium">#{results.attempts.length - index}</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${getScoreColor(attempt.percentage)}`}>
                                {attempt.percentage}%
                              </span>
                              <Badge className={getDifficultyColor(results.quiz.difficulty)}>
                                {results.quiz.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {new Date(attempt.completedAt).toLocaleDateString()} at {new Date(attempt.completedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(attempt.totalTime)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{Math.round(attempt.accuracy)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  {getText('analytics.strongAreas', 'Strong Areas')}
                </CardTitle>
                <CardDescription>
                  {getText('analytics.strongAreasDesc', 'Topics you perform well in')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.strongAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="font-medium text-green-800 dark:text-green-200">{area}</span>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-orange-600" />
                  {getText('analytics.improvementAreas', 'Areas for Improvement')}
                </CardTitle>
                <CardDescription>
                  {getText('analytics.improvementAreasDesc', 'Topics that need more practice')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.weakAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <span className="font-medium text-orange-800 dark:text-orange-200">{area}</span>
                      <XCircle className="h-4 w-4 text-orange-600" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{getText('analytics.performanceOverTime', 'Performance Over Time')}</CardTitle>
              <CardDescription>
                {getText('analytics.performanceOverTimeDesc', 'Your score progression across attempts')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.attempts.map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-500">
                      #{results.attempts.length - index}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{attempt.percentage}%</span>
                        <span className="text-sm text-gray-500">
                          {new Date(attempt.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Progress value={attempt.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {selectedAttempt ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {getText('quizzes.reviewAnswers', 'Review Answers')}
                </CardTitle>
                <CardDescription>
                  {getText('quizzes.reviewAnswersDesc', 'Detailed review of your selected attempt')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {getText('quizzes.attempt', 'Attempt')} #{results.attempts.findIndex(a => a.id === selectedAttempt.id) + 1}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(selectedAttempt.completedAt).toLocaleDateString()} - {selectedAttempt.percentage}%
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(selectedAttempt.totalTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>{Math.round(selectedAttempt.accuracy)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {results.quiz.questions.map((question, index) => {
                      const userAnswer = selectedAttempt.answers[index]
                      const isCorrect = userAnswer?.selectedAnswer === question.correctAnswer
                      
                      return (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm font-medium text-gray-500">
                                  {getText('quizzes.question', 'Question')} {index + 1}
                                </span>
                                <Badge className={getDifficultyColor(question.difficulty)}>
                                  {question.difficulty}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                {question.question}
                              </h4>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <span className="text-sm font-medium">
                                {isCorrect ? question.points : 0}/{question.points}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => {
                              const isUserAnswer = userAnswer?.selectedAnswer === optionIndex
                              const isCorrectAnswer = optionIndex === question.correctAnswer
                              
                              let className = "p-2 border rounded text-sm"
                              if (isCorrectAnswer) {
                                className += " border-green-500 bg-green-50 dark:bg-green-900/20"
                              } else if (isUserAnswer && !isCorrectAnswer) {
                                className += " border-red-500 bg-red-50 dark:bg-red-900/20"
                              } else {
                                className += " border-gray-200"
                              }
                              
                              return (
                                <div key={optionIndex} className={className}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">
                                        {String.fromCharCode(65 + optionIndex)}.
                                      </span>
                                      <span>{option}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      {isUserAnswer && (
                                        <Badge variant="outline" className="text-xs">
                                          {getText('quizzes.yourAnswer', 'Your answer')}
                                        </Badge>
                                      )}
                                      {isCorrectAnswer && (
                                        <Badge variant="outline" className="text-xs">
                                          {getText('quizzes.correct', 'Correct')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {question.explanation && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>{getText('quizzes.explanation', 'Explanation')}:</strong> {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    {getText('quizzes.selectAttempt', 'Select an attempt from the history to review answers')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}