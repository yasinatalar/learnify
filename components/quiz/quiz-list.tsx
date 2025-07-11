"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Search, Filter, Clock, Target, Trophy, Plus, Play } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Quiz {
  id: string
  title: string
  description?: string
  questionCount: number
  difficulty: "easy" | "medium" | "hard" | "mixed"
  estimatedTime: number
  topics: string[]
  createdAt: Date
  lastAttempt?: {
    score: number
    totalPoints: number
    accuracy: number
    completedAt: Date
  }
  attempts: number
  bestScore?: number
}

interface QuizListProps {
  quizzes: Quiz[]
  onStartQuiz: (quiz: Quiz) => void
  onCreateQuiz?: () => void
  onEditQuiz?: (quiz: Quiz) => void
  className?: string
}

export function QuizList({
  quizzes,
  onStartQuiz,
  onCreateQuiz,
  onEditQuiz,
  className
}: QuizListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

  // Filter and sort quizzes
  const filteredQuizzes = quizzes
    .filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          quiz.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesDifficulty = difficultyFilter === "all" || quiz.difficulty === difficultyFilter
      
      return matchesSearch && matchesDifficulty
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "difficulty":
          const difficultyOrder = { "easy": 1, "medium": 2, "hard": 3, "mixed": 4 }
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
        case "score":
          return (b.bestScore || 0) - (a.bestScore || 0)
        default:
          return 0
      }
    })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "mixed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const formatTime = (minutes: number): string => {
    return `${minutes}m`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No quizzes yet</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Create your first quiz to start testing your knowledge!
        </p>
        {onCreateQuiz && (
          <Button onClick={onCreateQuiz}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Actions */}
      <div className="flex justify-end items-center">
        {onCreateQuiz && (
          <Button onClick={onCreateQuiz}>
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search quizzes..."
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
            <SelectItem value="all">All Difficulty</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="difficulty">Difficulty</SelectItem>
            <SelectItem value="score">Best Score</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quiz Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
                  {quiz.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge className={getDifficultyColor(quiz.difficulty)}>
                  {quiz.difficulty}
                </Badge>
                {quiz.topics.slice(0, 2).map((topic) => (
                  <Badge key={topic} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
                {quiz.topics.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{quiz.topics.length - 2} more
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Quiz Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span>{quiz.questionCount} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>{formatTime(quiz.estimatedTime)}</span>
                </div>
              </div>

              {/* Last Attempt */}
              {quiz.lastAttempt && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Last Attempt</span>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Score:</span>
                    <span className={cn("font-medium", getScoreColor(
                      (quiz.lastAttempt.score / quiz.lastAttempt.totalPoints) * 100
                    ))}>
                      {Math.round((quiz.lastAttempt.score / quiz.lastAttempt.totalPoints) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Accuracy:</span>
                    <span className="font-medium">{Math.round(quiz.lastAttempt.accuracy)}%</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => onStartQuiz(quiz)} className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Start Quiz
                </Button>
                {onEditQuiz && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditQuiz(quiz)}
                  >
                    Edit
                  </Button>
                )}
              </div>
              
              {/* Attempts */}
              <div className="text-center text-xs text-gray-500">
                {quiz.attempts} attempt{quiz.attempts !== 1 ? 's' : ''}
                {quiz.bestScore && (
                  <span> • Best: {quiz.bestScore}%</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuizzes.length === 0 && quizzes.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No quizzes match your current filters.
          </p>
        </div>
      )}
    </div>
  )
}