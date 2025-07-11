"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Clock, CheckCircle, XCircle, ArrowRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  difficulty: "easy" | "medium" | "hard"
  tags?: string[]
  questionType: "multiple_choice" | "true_false" | "fill_blank"
  points: number
}

export interface QuizAnswer {
  questionId: string
  selectedAnswer: number | string
  isCorrect: boolean
  timeSpent: number
  pointsEarned: number
}

interface QuizCardProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer: (answer: QuizAnswer) => void
  showResult?: boolean
  selectedAnswer?: number | string
  timeLimit?: number
  className?: string
}

export function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  showResult = false,
  selectedAnswer,
  timeLimit,
  className
}: QuizCardProps) {
  const [currentAnswer, setCurrentAnswer] = useState<string>("")
  const [timeLeft, setTimeLeft] = useState<number>(timeLimit || 60)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [hasAnswered, setHasAnswered] = useState(false)

  // Reset state when question changes
  useEffect(() => {
    setCurrentAnswer("")
    setHasAnswered(false)
    setTimeLeft(timeLimit || 60)
    setStartTime(Date.now())
  }, [question.id, timeLimit])

  // Timer effect
  useEffect(() => {
    if (timeLimit && timeLeft > 0 && !hasAnswered) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - auto submit
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeLeft, hasAnswered, timeLimit])

  const handleSubmit = () => {
    if (hasAnswered) {
      console.warn("Already answered this question, ignoring duplicate submission")
      return
    }

    console.log("Submitting answer for question:", question.id)
    
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    let selectedAnswerIndex: number
    let isCorrect: boolean

    if (question.questionType === "fill_blank") {
      // For fill-in-the-blank, check if the answer matches any of the options
      selectedAnswerIndex = question.options.findIndex(option => 
        option.toLowerCase().trim() === currentAnswer.toLowerCase().trim()
      )
      isCorrect = selectedAnswerIndex === question.correctAnswer
    } else {
      // For multiple choice and true/false
      selectedAnswerIndex = parseInt(currentAnswer)
      isCorrect = selectedAnswerIndex === question.correctAnswer
    }

    const pointsEarned = isCorrect ? question.points : 0

    const answer: QuizAnswer = {
      questionId: question.id,
      selectedAnswer: question.questionType === "fill_blank" ? currentAnswer : selectedAnswerIndex,
      isCorrect,
      timeSpent,
      pointsEarned
    }

    setHasAnswered(true)
    onAnswer(answer)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((questionNumber - 1) / totalQuestions) * 100
  const isTimeRunningOut = timeLimit && timeLeft <= 10

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Question {questionNumber} of {totalQuestions}
            </Badge>
            <Badge className={getDifficultyColor(question.difficulty)}>
              {question.difficulty}
            </Badge>
            <Badge variant="outline">{question.points} point{question.points !== 1 ? 's' : ''}</Badge>
          </div>
          
          {timeLimit && (
            <div className={cn(
              "flex items-center gap-2 text-sm",
              isTimeRunningOut ? "text-red-600 animate-pulse" : "text-gray-600"
            )}>
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
        
        <Progress value={progress} className="w-full" />
        
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {question.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <CardTitle className="text-lg leading-relaxed">
          {question.question}
        </CardTitle>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.questionType === "fill_blank" ? (
            <div className="space-y-2">
              <Label htmlFor="fill-blank-answer">Your Answer:</Label>
              <Input
                id="fill-blank-answer"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                disabled={hasAnswered}
                className="text-lg"
              />
            </div>
          ) : (
            <RadioGroup
              value={currentAnswer}
              onValueChange={setCurrentAnswer}
              disabled={hasAnswered}
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className={cn(
                      "flex-1 cursor-pointer p-3 rounded-lg border transition-colors",
                      currentAnswer === index.toString() && !hasAnswered
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800",
                      hasAnswered && showResult && index === question.correctAnswer
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        : hasAnswered && showResult && index.toString() === currentAnswer && index !== question.correctAnswer
                        ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {hasAnswered && showResult && (
                        <div className="flex items-center">
                          {index === question.correctAnswer ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : index.toString() === currentAnswer ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>

        {/* Result and Explanation */}
        {hasAnswered && showResult && question.explanation && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Explanation
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!hasAnswered && (
          <Button
            onClick={handleSubmit}
            disabled={!currentAnswer || hasAnswered}
            className="w-full"
            size="lg"
          >
            Submit Answer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Time's Up Message */}
        {timeLimit && timeLeft === 0 && !hasAnswered && (
          <div className="text-center text-red-600 font-medium">
            Time's up! Answer submitted automatically.
          </div>
        )}
      </CardContent>
    </Card>
  )
}