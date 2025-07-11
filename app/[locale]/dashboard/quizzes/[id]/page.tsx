"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Play, 
  BookOpen, 
  Trophy, 
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: string
  questionType: string
  points: number
  tags: string[]
}

interface Quiz {
  id: string
  title: string
  description: string
  difficulty: string
  questionCount: number
  estimatedTime: number
  topics: string[]
  createdAt: string
  attempts: number
  documentId: string
  documentTitle: string
  questions: Question[]
}

interface QuizAttempt {
  questionId: string
  selectedAnswer: number | string
  isCorrect: boolean
  timeSpent: number
  pointsEarned: number
}

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const { locale } = useI18n()
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [taking, setTaking] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<QuizAttempt[]>([])
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null)
  const [results, setResults] = useState<any>(null)
  const [showExplanation, setShowExplanation] = useState(false)

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
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setQuiz(data.quiz)
        } else {
          toast.error(getText('quizzes.generateError', 'Failed to load quiz'))
          router.push(`/${locale}/dashboard/quizzes`)
        }
      } catch (error) {
        console.error('Error fetching quiz:', error)
        toast.error(getText('quizzes.generateError', 'Error loading quiz'))
        router.push(`/${locale}/dashboard/quizzes`)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchQuiz()
    }
  }, [params.id, router, locale, getText])

  const handleStartQuiz = () => {
    setTaking(true)
    setStartTime(new Date())
    setQuestionStartTime(new Date())
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedOption(null)
    setShowExplanation(false)
  }

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex)
  }

  const handleNextQuestion = () => {
    if (!quiz || selectedOption === null || !questionStartTime) return

    const question = quiz.questions[currentQuestion]
    const isCorrect = selectedOption === question.correctAnswer
    const timeSpent = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000)
    const pointsEarned = isCorrect ? question.points : 0

    const newAnswer: QuizAttempt = {
      questionId: question.id,
      selectedAnswer: selectedOption,
      isCorrect,
      timeSpent,
      pointsEarned
    }

    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedOption(null)
      setQuestionStartTime(new Date())
      setShowExplanation(false)
    } else {
      submitQuiz(newAnswers)
    }
  }

  const submitQuiz = async (finalAnswers: QuizAttempt[]) => {
    if (!quiz || !startTime) return

    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: finalAnswers,
          totalTime: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
          startedAt: startTime.toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.attempt)
        setTaking(false)
        toast.success(getText('quizzes.quizComplete', 'Quiz completed!'))
      } else {
        throw new Error('Failed to submit quiz')
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast.error(getText('quizzes.generateError', 'Failed to submit quiz'))
    }
  }

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

  const getOptionIcon = (optionIndex: number, question: Question) => {
    if (selectedOption === null) return null
    
    if (optionIndex === question.correctAnswer) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (optionIndex === selectedOption && selectedOption !== question.correctAnswer) {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
    return null
  }

  const getOptionClassName = (optionIndex: number, question: Question) => {
    if (selectedOption === null) {
      return "border-gray-200 hover:border-gray-300 cursor-pointer"
    }
    
    if (optionIndex === question.correctAnswer) {
      return "border-green-500 bg-green-50 dark:bg-green-900/20"
    } else if (optionIndex === selectedOption && selectedOption !== question.correctAnswer) {
      return "border-red-500 bg-red-50 dark:bg-red-900/20"
    }
    return "border-gray-200"
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

  if (!quiz) {
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
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {getText('quizzes.generateError', 'Quiz not found')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('documents.documentNotFoundDesc', 'The quiz you\'re looking for doesn\'t exist or has been deleted.')}
          </p>
        </div>
      </div>
    )
  }

  // Quiz Results View
  if (results) {
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

        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800 dark:text-green-200">
              <Trophy className="mr-2 h-5 w-5" />
              {getText('quizzes.quizComplete', 'Quiz Complete!')}
            </CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              {getText('quizzes.yourScore', 'Your Score')}: {results.percentage}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {results.correctAnswers}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {getText('quizzes.correctAnswers', 'Correct Answers')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {results.totalQuestions}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {getText('quizzes.totalQuestions', 'Total Questions')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {Math.round(results.accuracy)}%
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {getText('quizzes.accuracy', 'Accuracy')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {Math.round(results.totalTime / 60)}m
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {getText('quizzes.timeElapsed', 'Time Elapsed')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center space-x-4">
          <Button onClick={handleStartQuiz}>
            <Play className="mr-2 h-4 w-4" />
            {getText('quizzes.retakeQuiz', 'Retake Quiz')}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/dashboard/documents/${quiz.documentId}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              {getText('summaries.viewDocument', 'View Document')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Quiz Taking View
  if (taking) {
    const question = quiz.questions[currentQuestion]
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setTaking(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getText('common.back', 'Back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {getText('quizzes.questionNumber', 'Question {current} of {total}').replace('{current}', (currentQuestion + 1).toString()).replace('{total}', quiz.questions.length.toString())}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {quiz.title}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>{getText('common.progress', 'Progress')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{question.question}</CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>
                <Badge variant="outline">
                  {question.points} {getText('quizzes.points', 'points')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg transition-all ${getOptionClassName(index, question)}`}
                  onClick={() => selectedOption === null && handleAnswerSelect(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-gray-900 dark:text-white">{option}</span>
                    </div>
                    {getOptionIcon(index, question)}
                  </div>
                </div>
              ))}
            </div>

            {selectedOption !== null && question.explanation && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-200">
                      {getText('quizzes.explanation', 'Explanation')}
                    </h4>
                    <p className="text-blue-800 dark:text-blue-300 mt-1">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleNextQuestion}
                disabled={selectedOption === null}
              >
                {currentQuestion === quiz.questions.length - 1 
                  ? getText('quizzes.submitQuiz', 'Submit Quiz')
                  : getText('quizzes.nextQuestion', 'Next Question')
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz Overview
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/quizzes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getText('common.back', 'Back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {getText('summaries.from', 'From')}: {quiz.documentTitle}
            </p>
          </div>
        </div>
        <Button onClick={handleStartQuiz} size="lg">
          <Play className="mr-2 h-5 w-5" />
          {getText('quizzes.startQuiz', 'Start Quiz')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('quizzes.totalQuestions', 'Questions')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quiz.questionCount}</div>
            <p className="text-xs text-muted-foreground">
              {getText('quizzes.questions', 'questions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('quizzes.estimatedTime', 'Estimated Time')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quiz.estimatedTime}m</div>
            <p className="text-xs text-muted-foreground">
              {getText('analytics.minutes', 'minutes')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('summaries.difficulty', 'Difficulty')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{quiz.difficulty}</div>
            <p className="text-xs text-muted-foreground">
              {getText('flashcards.difficulty', 'difficulty')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('quizzes.attempts', 'Attempts')}</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quiz.attempts}</div>
            <p className="text-xs text-muted-foreground">
              {getText('quizzes.attempts', 'attempts')}
            </p>
          </CardContent>
        </Card>
      </div>

      {quiz.topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {getText('analytics.topics', 'Topics')}
            </CardTitle>
            <CardDescription>
              {getText('analytics.topicsDesc', 'Topics covered in this quiz')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quiz.topics.map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {getText('quizzes.questionPreview', 'Question Preview')}
          </CardTitle>
          <CardDescription>
            {getText('quizzes.questionPreviewDesc', 'Overview of questions in this quiz')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quiz.questions.slice(0, 3).map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
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
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {question.options.length} {getText('quizzes.options', 'options')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {question.points} {getText('quizzes.points', 'points')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {quiz.questions.length > 3 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {getText('review.andMore', 'And')} {quiz.questions.length - 3} {getText('quizzes.moreQuestions', 'more questions...')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}