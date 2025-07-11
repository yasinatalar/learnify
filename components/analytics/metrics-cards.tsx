"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  Award, 
  Flame,
  BarChart3,
  FileText
} from "lucide-react"
import { LearningMetrics } from "@/lib/analytics/progress-tracker"
import { useTranslations } from "@/lib/i18n/context"

interface MetricsCardsProps {
  metrics: LearningMetrics
  className?: string
}

export function MetricsCards({ metrics, className }: MetricsCardsProps) {
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
  const getStreakColor = (days: number) => {
    if (days >= 30) return "text-purple-600"
    if (days >= 14) return "text-blue-600"
    if (days >= 7) return "text-green-600"
    if (days >= 3) return "text-yellow-600"
    return "text-gray-600"
  }

  const getStreakBadge = (days: number) => {
    if (days >= 30) return { label: getText('analytics.streakLegend', 'Legend'), color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" }
    if (days >= 14) return { label: getText('analytics.streakChampion', 'Champion'), color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" }
    if (days >= 7) return { label: getText('analytics.streakWarrior', 'Warrior'), color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
    if (days >= 3) return { label: getText('analytics.streakStarter', 'Starter'), color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" }
    return { label: getText('analytics.streakBeginner', 'Beginner'), color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" }
  }

  const completionRate = metrics.totalFlashcards > 0 
    ? (metrics.masteredFlashcards / metrics.totalFlashcards) * 100 
    : 0

  const streakBadge = getStreakBadge(metrics.streakDays)

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Total Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('analytics.documentsProcessed', 'Documents')}</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalDocuments}</div>
          <p className="text-xs text-muted-foreground">
            +{metrics.documentsProcessedThisWeek} {getText('analytics.thisWeek', 'this week')}
          </p>
        </CardContent>
      </Card>

      {/* Total Flashcards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('nav.flashcards', 'Flashcards')}</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalFlashcards}</div>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={completionRate} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {Math.round(completionRate)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.masteredFlashcards} {getText('flashcards.mastered', 'mastered')}
          </p>
        </CardContent>
      </Card>

      {/* Total Summaries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('nav.summaries', 'Summaries')}</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalSummaries}</div>
          <p className="text-xs text-muted-foreground">
            +{metrics.summariesGeneratedThisWeek} {getText('analytics.thisWeek', 'this week')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.averageSummaryReadTime}{getText('summaries.minutes', 'min')} {getText('analytics.avgReadTime', 'avg read time')}
          </p>
        </CardContent>
      </Card>

      {/* Study Streak */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('analytics.studyStreak', 'Study Streak')}</CardTitle>
          <Flame className={`h-4 w-4 ${getStreakColor(metrics.streakDays)}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getStreakColor(metrics.streakDays)}`}>
            {metrics.streakDays}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={streakBadge.color}>
              {streakBadge.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getText('analytics.consecutive', 'consecutive')} {getText('analytics.days', 'days')}
          </p>
        </CardContent>
      </Card>

      {/* Study Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('dashboard.studyTime', 'Study Time')}</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(metrics.totalStudyTime / 60)}h {metrics.totalStudyTime % 60}m
          </div>
          <p className="text-xs text-muted-foreground">
            {getText('analytics.totalTimeInvested', 'total time invested')}
          </p>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('analytics.quizAverage', 'Quiz Average')}</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageQuizScore}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.quizzesCompletedThisWeek} {getText('analytics.completedThisWeek', 'completed this week')}
          </p>
        </CardContent>
      </Card>

      {/* Flashcard Rating */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('analytics.cardRating', 'Card Rating')}</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.averageFlashcardRating}/5
          </div>
          <p className="text-xs text-muted-foreground">
            {getText('analytics.avgDifficultyRating', 'average difficulty rating')}
          </p>
        </CardContent>
      </Card>

      {/* Due Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('analytics.dueForReview', 'Due for Review')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {metrics.dueFlashcards}
          </div>
          <p className="text-xs text-muted-foreground">
            {getText('analytics.cardsNeedAttention', 'cards need attention')}
          </p>
        </CardContent>
      </Card>

      {/* Learning Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{getText('analytics.inProgress', 'In Progress')}</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.learningFlashcards}
          </div>
          <p className="text-xs text-muted-foreground">
            {getText('analytics.cardsBeingLearned', 'cards being learned')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}