"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, TrendingUp, Clock, Target, Brain, FileText, Calendar, Download } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface AnalyticsData {
  overview: {
    totalStudyTime: number
    averageScore: number
    studyStreak: number
    documentsProcessed: number
    flashcardsReviewed: number
    quizzesCompleted: number
  }
  weeklyProgress: {
    cardsReviewed: number
    accuracyRate: number
    studyTime: number
  }
  monthlyTrends: {
    studyDays: number
    avgSessionLength: number
    improvementRate: number
  }
}

export default function AnalyticsPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
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
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data.analytics || {
            overview: {
              totalStudyTime: 0,
              averageScore: 0,
              studyStreak: 0,
              documentsProcessed: 0,
              flashcardsReviewed: 0,
              quizzesCompleted: 0
            },
            weeklyProgress: {
              cardsReviewed: 0,
              accuracyRate: 0,
              studyTime: 0
            },
            monthlyTrends: {
              studyDays: 0,
              avgSessionLength: 0,
              improvementRate: 0
            }
          })
        } else {
          toast.error(getText('dashboard.errorLoading', 'Failed to load analytics'))
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
        toast.error(getText('dashboard.errorLoading', 'Error loading analytics'))
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [t])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('analytics.title', 'Analytics')}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {getText('analytics.subtitle', 'Track your learning progress and performance')}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('analytics.title', 'Analytics')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('analytics.subtitle', 'Track your learning progress and performance')}
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {getText('analytics.generateReport', 'Generate Report')}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('analytics.totalStudyTime', 'Total Study Time')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor((analytics?.overview.totalStudyTime || 0) / 60)}h</div>
            <p className="text-xs text-muted-foreground">
              {getText('analytics.hours', 'hours')} {getText('analytics.thisMonth', 'this month')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('analytics.averageScore', 'Average Score')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {getText('analytics.acrossAllQuizzes', 'across all quizzes')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('analytics.studyStreak', 'Study Streak')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.studyStreak || 0}</div>
            <p className="text-xs text-muted-foreground">
              {getText('analytics.days', 'days')} {getText('analytics.consecutive', 'consecutive')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('analytics.documentsProcessed', 'Documents Processed')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.documentsProcessed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {getText('analytics.totalDocuments', 'total documents')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('analytics.flashcardsReviewed', 'Flashcards Reviewed')}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.flashcardsReviewed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {getText('analytics.totalReviews', 'total reviews')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{getText('analytics.quizzesCompleted', 'Quizzes Completed')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.overview.quizzesCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">
              {getText('analytics.totalQuizzes', 'total quizzes')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{getText('analytics.weeklyProgress', 'Weekly Progress')}</CardTitle>
          <CardDescription>
            {getText('analytics.weeklyProgressDesc', 'Your learning activity this week')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{getText('analytics.cardsReviewed', 'Cards Reviewed')}</h4>
              <div className="text-2xl font-bold">{analytics?.weeklyProgress.cardsReviewed || 0}</div>
              <p className="text-xs text-muted-foreground">{getText('analytics.thisWeek', 'this week')}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{getText('analytics.accuracyRate', 'Accuracy Rate')}</h4>
              <div className="text-2xl font-bold">{analytics?.weeklyProgress.accuracyRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {(analytics?.weeklyProgress.accuracyRate || 0) >= 80 ? getText('dashboard.greatJob', 'Great job!') : getText('dashboard.keepPracticing', 'Keep practicing!')}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{getText('analytics.studyTime', 'Study Time')}</h4>
              <div className="text-2xl font-bold">{Math.floor((analytics?.weeklyProgress.studyTime || 0) / 60)}h</div>
              <p className="text-xs text-muted-foreground">{getText('analytics.thisWeek', 'this week')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>{getText('analytics.monthlyTrends', 'Monthly Trends')}</CardTitle>
          <CardDescription>
            {getText('analytics.monthlyTrendsDesc', 'Your learning patterns this month')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{getText('analytics.studyDays', 'Study Days')}</h4>
              <div className="text-2xl font-bold">{analytics?.monthlyTrends.studyDays || 0}</div>
              <p className="text-xs text-muted-foreground">{getText('analytics.daysThisMonth', 'days this month')}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{getText('analytics.avgSessionLength', 'Avg Session Length')}</h4>
              <div className="text-2xl font-bold">{analytics?.monthlyTrends.avgSessionLength || 0}m</div>
              <p className="text-xs text-muted-foreground">{getText('analytics.minutes', 'minutes')}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{getText('analytics.improvementRate', 'Improvement Rate')}</h4>
              <div className="text-2xl font-bold">+{analytics?.monthlyTrends.improvementRate || 0}%</div>
              <p className="text-xs text-muted-foreground">{getText('analytics.vsLastMonth', 'vs last month')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Data State */}
      {analytics?.overview.documentsProcessed === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {getText('analytics.noData', 'No data available')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {getText('analytics.startLearning', 'Start learning to see your analytics!')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}