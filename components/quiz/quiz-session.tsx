"use client"

import { useState, useEffect } from "react"
import { QuizCard, QuizQuestion, QuizAnswer } from "./quiz-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, Clock, Target, Brain, ArrowLeft, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuizSessionProps {
  questions: QuizQuestion[]
  title: string
  description?: string
  timeLimit?: number // seconds per question
  onComplete: (results: QuizSessionResult) => void
  onExit?: () => void
  className?: string
}

export interface QuizSessionResult {
  answers: QuizAnswer[]
  score: number
  totalPoints: number
  accuracy: number
  totalTime: number
  averageTimePerQuestion: number
  completedAt: Date
}

export function QuizSession({
  questions,
  title,
  description,
  timeLimit,
  onComplete,
  onExit,
  className
}: QuizSessionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [sessionStartTime] = useState<number>(Date.now())
  const [showResult, setShowResult] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [autoAdvanceTimeoutId, setAutoAdvanceTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + (showResult ? 1 : 0)) / questions.length) * 100

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutId) {
        clearTimeout(autoAdvanceTimeoutId)
      }
    }
  }, [autoAdvanceTimeoutId])

  const handleAnswer = (answer: QuizAnswer) => {
    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)
    setShowResult(true)

    // Clear any existing timeout to prevent double advancement
    if (autoAdvanceTimeoutId) {
      clearTimeout(autoAdvanceTimeoutId)
    }

    // Auto-advance after showing result
    const timeoutId = setTimeout(() => {
      if (isLastQuestion) {
        completeQuiz(newAnswers)
      } else {
        setCurrentQuestionIndex(prev => prev + 1)
        setShowResult(false)
      }
      setAutoAdvanceTimeoutId(null)
    }, 3000) // Show result for 3 seconds
    
    setAutoAdvanceTimeoutId(timeoutId)
  }

  const completeQuiz = (finalAnswers: QuizAnswer[]) => {
    const totalTime = Math.round((Date.now() - sessionStartTime) / 1000)
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
    const score = finalAnswers.reduce((sum, a) => sum + a.pointsEarned, 0)
    const accuracy = (finalAnswers.filter(a => a.isCorrect).length / questions.length) * 100

    const result: QuizSessionResult = {
      answers: finalAnswers,
      score,
      totalPoints,
      accuracy,
      totalTime,
      averageTimePerQuestion: totalTime / questions.length,
      completedAt: new Date()
    }

    setQuizComplete(true)
    onComplete(result)
  }

  const handleNext = () => {
    // Clear the auto-advance timeout when manually advancing
    if (autoAdvanceTimeoutId) {
      clearTimeout(autoAdvanceTimeoutId)
      setAutoAdvanceTimeoutId(null)
    }

    if (isLastQuestion) {
      completeQuiz(answers)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowResult(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getSessionStats = () => {
    const currentTime = Math.round((Date.now() - sessionStartTime) / 1000)
    const answeredQuestions = answers.length
    const correctAnswers = answers.filter(a => a.isCorrect).length
    const currentAccuracy = answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0

    return {
      currentTime,
      answeredQuestions,
      correctAnswers,
      currentAccuracy
    }
  }

  const stats = getSessionStats()

  if (quizComplete) {
    return (
      <QuizCompleteScreen
        result={{
          answers,
          score: answers.reduce((sum, a) => sum + a.pointsEarned, 0),
          totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
          accuracy: (answers.filter(a => a.isCorrect).length / questions.length) * 100,
          totalTime: Math.round((Date.now() - sessionStartTime) / 1000),
          averageTimePerQuestion: Math.round((Date.now() - sessionStartTime) / 1000) / questions.length,
          completedAt: new Date()
        }}
        onRetry={() => {
          setCurrentQuestionIndex(0)
          setAnswers([])
          setShowResult(false)
          setQuizComplete(false)
        }}
        onExit={onExit}
        className={className}
      />
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {description}
            </p>
          )}
        </div>
        
        {onExit && (
          <Button variant="outline" onClick={onExit}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Quiz
          </Button>
        )}
      </div>

      {/* Progress and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.correctAnswers}</p>
                <p className="text-xs text-gray-600">Correct</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{Math.round(stats.currentAccuracy)}%</p>
                <p className="text-xs text-gray-600">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-green-600">{formatTime(stats.currentTime)}</p>
                <p className="text-xs text-gray-600">Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.answeredQuestions}/{questions.length}
                </p>
                <p className="text-xs text-gray-600">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Progress value={progress} className="w-full" />

      {/* Quiz Card */}
      <QuizCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        showResult={showResult}
        timeLimit={timeLimit}
      />

      {/* Next Button (only shown after answering) */}
      {showResult && (
        <div className="flex justify-center">
          <Button onClick={handleNext} size="lg">
            {isLastQuestion ? "Complete Quiz" : "Next Question"}
          </Button>
        </div>
      )}
    </div>
  )
}

interface QuizCompleteScreenProps {
  result: QuizSessionResult
  onRetry?: () => void
  onExit?: () => void
  className?: string
}

function QuizCompleteScreen({ result, onRetry, onExit, className }: QuizCompleteScreenProps) {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  const scorePercentage = (result.score / result.totalPoints) * 100

  return (
    <div className={cn("max-w-2xl mx-auto space-y-6", className)}>
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className={cn("text-3xl font-bold", getScoreColor(scorePercentage))}>
                {Math.round(scorePercentage)}%
              </p>
              <p className="text-sm text-gray-600">Score</p>
            </div>
            <div className="text-center">
              <p className={cn("text-3xl font-bold", getScoreColor(scorePercentage))}>
                {getGrade(scorePercentage)}
              </p>
              <p className="text-sm text-gray-600">Grade</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(result.accuracy)}%
              </p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {Math.round(result.averageTimePerQuestion)}s
              </p>
              <p className="text-sm text-gray-600">Avg Time</p>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg">
              You scored <span className="font-bold">{result.score}</span> out of <span className="font-bold">{result.totalPoints}</span> points
            </p>
            <p className="text-sm text-gray-600">
              Completed in {Math.floor(result.totalTime / 60)}m {result.totalTime % 60}s
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Quiz
              </Button>
            )}
            {onExit && (
              <Button onClick={onExit}>
                Back to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}