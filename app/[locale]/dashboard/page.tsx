"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FileText, Brain, Target, TrendingUp, Upload, Clock, BookOpen } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface DashboardStats {
  documents: number
  flashcards: number
  quizzes: number
  summaries: number
  averageQuizScore: number
  studyStreak: number
  dueFlashcards: number
  weeklyProgress: {
    cardsReviewed: number
    accuracyRate: number
    studyTime: number
  }
}

interface RecentDocument {
  id: string
  title: string
  status: string
  createdAt: string
  flashcardsCount: number
  quizzesCount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [loading, setLoading] = useState(true)
  const { isLoading: i18nLoading, locale } = useI18n()
  const t = useTranslations()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setRecentDocuments(data.recentDocuments)
        } else {
          console.error('Failed to fetch dashboard stats')
          toast.error(t.dashboard.failedToLoad)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error(t.dashboard.errorLoading)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [t])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t.dashboard.subtitle}
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.dashboard.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/upload`}>
            <Upload className="mr-2 h-4 w-4" />
            {t.dashboard.uploadDocument}
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.documents}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.documents || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.totalDocuments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.flashcards}</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.flashcards || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.totalFlashcards}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.summaries}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.summaries || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.aiSummaries}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.dashboard.studyStreak}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.studyStreak || 0} {t.dashboard.days}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.studyStreak ? t.dashboard.keepItUp : t.dashboard.startStreak}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.recentDocuments}</CardTitle>
            <CardDescription>
              {t.dashboard.recentDocumentsDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {t.dashboard.noDocuments}
                </p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href={`/${locale}/dashboard/upload`}>
                    <Upload className="mr-2 h-4 w-4" />
                    {t.dashboard.uploadDocument}
                  </Link>
                </Button>
              </div>
            ) : (
              recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium">{doc.title}</h4>
                      <Badge className={getStatusColor(doc.status)} variant="secondary">
                        {doc.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {doc.status === "COMPLETED" 
                        ? `${doc.flashcardsCount} ${t.dashboard.flashcardsLower} • ${doc.quizzesCount} ${t.dashboard.quizzesLower}`
                        : doc.status === "PROCESSING"
                        ? t.dashboard.processing
                        : t.dashboard.processingFailed
                      }
                    </p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/${locale}/dashboard/documents/${doc.id}`}>{t.common.view}</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Study Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.studySchedule}</CardTitle>
            <CardDescription>
              {t.dashboard.studyScheduleDesc}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.dueFlashcards ? (
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">{t.dashboard.dueNow}</h4>
                  <p className="text-xs text-muted-foreground">{stats.dueFlashcards} {t.dashboard.flashcardsLower}</p>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/${locale}/dashboard/review`}>{t.dashboard.reviewNow}</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {t.dashboard.noFlashcardsDue}
                </p>
                <p className="text-xs text-gray-500">
                  {t.dashboard.uploadToGenerate}
                </p>
              </div>
            )}

            <div className="pt-4">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/${locale}/dashboard/quizzes`}>{t.dashboard.takeQuiz}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.learningProgress}</CardTitle>
          <CardDescription>
            {t.dashboard.learningProgressDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t.dashboard.cardsReviewed}</h4>
              <div className="text-2xl font-bold">{stats?.weeklyProgress.cardsReviewed || 0}</div>
              <Progress value={Math.min((stats?.weeklyProgress.cardsReviewed || 0) / 2, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">{t.dashboard.thisWeek}</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t.dashboard.accuracyRate}</h4>
              <div className="text-2xl font-bold">{stats?.weeklyProgress.accuracyRate || 0}%</div>
              <Progress value={stats?.weeklyProgress.accuracyRate || 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {(stats?.weeklyProgress.accuracyRate || 0) >= 80 ? t.dashboard.greatJob : t.dashboard.keepPracticing}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t.dashboard.studyTime}</h4>
              <div className="text-2xl font-bold">{((stats?.weeklyProgress.studyTime || 0) / 60).toFixed(1)}h</div>
              <Progress value={Math.min((stats?.weeklyProgress.studyTime || 0) / 12, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">{t.dashboard.thisWeek}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}