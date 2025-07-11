"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { StudySession } from "@/lib/analytics/progress-tracker"
import { BarChart3, TrendingUp, Target, Clock } from "lucide-react"
import { useTranslations } from "@/lib/i18n/context"

interface ProgressChartsProps {
  weeklyProgress: StudySession[]
  monthlyProgress: StudySession[]
  flashcardProgress: {
    mastered: number
    learning: number
    new: number
    due: number
  }
  topicDistribution: Array<{
    topic: string
    count: number
    mastery: number
  }>
  performanceTrends: Array<{
    date: string
    accuracy: number
    speed: number
  }>
  className?: string
}

export function ProgressCharts({
  weeklyProgress,
  monthlyProgress,
  flashcardProgress,
  topicDistribution,
  performanceTrends,
  className
}: ProgressChartsProps) {
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
  const totalFlashcards = flashcardProgress.mastered + flashcardProgress.learning + 
                         flashcardProgress.new + flashcardProgress.due
  
  const maxWeeklyStudyTime = Math.max(...weeklyProgress.map(s => s.studyTime), 1)
  const maxMonthlyStudyTime = Math.max(...monthlyProgress.map(s => s.studyTime), 1)
  
  const averageWeeklyAccuracy = weeklyProgress.filter(s => s.averageScore > 0)
    .reduce((sum, s) => sum + s.averageScore, 0) / 
    Math.max(weeklyProgress.filter(s => s.averageScore > 0).length, 1)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (mastery >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    if (mastery >= 40) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {getText('analytics.weeklyProgress', 'Weekly Progress')}
          </CardTitle>
          <CardDescription>
            {getText('analytics.weeklyActivityDesc', 'Your study activity over the last 7 days')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyProgress.map((session, index) => {
              const date = new Date(session.date)
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = date.toDateString() === new Date().toDateString()
              
              return (
                <div key={session.date} className="flex items-center gap-4">
                  <div className={`w-12 text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                    {dayName}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium">
                        {session.studyTime}m
                      </div>
                      {session.averageScore > 0 && (
                        <Badge variant="outline" className={getScoreColor(session.averageScore)}>
                          {Math.round(session.averageScore)}%
                        </Badge>
                      )}
                    </div>
                    <Progress 
                      value={(session.studyTime / maxWeeklyStudyTime) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {session.flashcardsReviewed} {getText('analytics.cards', 'cards')} • {session.quizzesCompleted} {getText('analytics.quizzes', 'quizzes')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{getText('analytics.weeklyAverage', 'Weekly Average')}</span>
              <span className={`font-medium ${getScoreColor(averageWeeklyAccuracy)}`}>
                {Math.round(averageWeeklyAccuracy)}% {getText('analytics.accuracy', 'accuracy')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {getText('analytics.monthlyTrends', 'Monthly Trends')}
          </CardTitle>
          <CardDescription>
            {getText('analytics.monthlyProgressDesc', 'Your progress over the last 6 months')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {monthlyProgress.map((session) => (
              <div key={session.date} className="flex items-center gap-4">
                <div className="w-16 text-sm text-gray-600">
                  {session.date}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-sm font-medium">
                      {session.studyTime}m
                    </div>
                    {session.averageScore > 0 && (
                      <Badge variant="outline" className={getScoreColor(session.averageScore)}>
                        {Math.round(session.averageScore)}%
                      </Badge>
                    )}
                  </div>
                  <Progress 
                    value={(session.studyTime / maxMonthlyStudyTime) * 100} 
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {session.flashcardsReviewed} {getText('analytics.cards', 'cards')} • {session.quizzesCompleted} {getText('analytics.quizzes', 'quizzes')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flashcard Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {getText('analytics.flashcardMastery', 'Flashcard Mastery')}
          </CardTitle>
          <CardDescription>
            {getText('analytics.flashcardDistribution', 'Distribution of your flashcard learning progress')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-600">{getText('flashcards.mastered', 'Mastered')}</span>
                <span className="text-sm">{flashcardProgress.mastered}</span>
              </div>
              <Progress 
                value={totalFlashcards > 0 ? (flashcardProgress.mastered / totalFlashcards) * 100 : 0}
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-600">{getText('flashcards.learning', 'Learning')}</span>
                <span className="text-sm">{flashcardProgress.learning}</span>
              </div>
              <Progress 
                value={totalFlashcards > 0 ? (flashcardProgress.learning / totalFlashcards) * 100 : 0}
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-orange-600">{getText('analytics.due', 'Due')}</span>
                <span className="text-sm">{flashcardProgress.due}</span>
              </div>
              <Progress 
                value={totalFlashcards > 0 ? (flashcardProgress.due / totalFlashcards) * 100 : 0}
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">{getText('flashcards.newCards', 'New')}</span>
                <span className="text-sm">{flashcardProgress.new}</span>
              </div>
              <Progress 
                value={totalFlashcards > 0 ? (flashcardProgress.new / totalFlashcards) * 100 : 0}
                className="h-2"
              />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {totalFlashcards > 0 ? Math.round((flashcardProgress.mastered / totalFlashcards) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">{getText('analytics.overallMastery', 'Overall Mastery')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {getText('analytics.topicMastery', 'Topic Mastery')}
          </CardTitle>
          <CardDescription>
            {getText('analytics.topicMasteryDesc', 'Your progress across different topics')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topicDistribution.slice(0, 8).map((topic) => (
              <div key={topic.topic} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="font-medium text-sm min-w-0 flex-1 truncate">
                    {topic.topic}
                  </div>
                  <Badge className={getMasteryColor(topic.mastery)}>
                    {topic.mastery}%
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 ml-3">
                  {topic.count} {getText('analytics.cards', 'cards')}
                </div>
              </div>
            ))}
            
            {topicDistribution.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                {getText('analytics.noTopicsYet', 'No topics available yet. Create some flashcards to see your progress!')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      {performanceTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {getText('analytics.performanceTrends', 'Performance Trends')}
            </CardTitle>
            <CardDescription>
              {getText('analytics.performanceTrendsDesc', 'Your quiz accuracy over the last 30 days')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceTrends.slice(-7).map((trend, index) => {
                const date = new Date(trend.date)
                const isRecent = index >= performanceTrends.length - 7
                
                return (
                  <div key={trend.date} className="flex items-center gap-4">
                    <div className="w-16 text-sm text-gray-600">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`text-sm font-medium ${getScoreColor(trend.accuracy)}`}>
                          {Math.round(trend.accuracy)}%
                        </div>
                        {trend.speed > 0 && (
                          <span className="text-xs text-gray-500">
                            {Math.round(trend.speed)}s/q
                          </span>
                        )}
                      </div>
                      <Progress 
                        value={trend.accuracy} 
                        className="h-2"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  {getText('analytics.recentAverage', 'Recent Average')}: <span className={`font-medium ${getScoreColor(
                    performanceTrends.slice(-7).reduce((sum, t) => sum + t.accuracy, 0) / 
                    Math.max(performanceTrends.slice(-7).length, 1)
                  )}`}>
                    {Math.round(
                      performanceTrends.slice(-7).reduce((sum, t) => sum + t.accuracy, 0) / 
                      Math.max(performanceTrends.slice(-7).length, 1)
                    )}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}