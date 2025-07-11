"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Download, 
  Eye, 
  Brain,
  Target,
  Lightbulb,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Search,
  Zap
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface Summary {
  id: string
  title: string
  content: string
  keyPoints: string[]
  overview: string
  mainConcepts: string
  examples: string
  takeaways: string
  prerequisites: string
  methodology: string
  applications: string
  limitations: string
  futureDirections: string
  criticalAnalysis: string
  furtherReading: string
  wordCount: number
  difficulty: string
  estimatedReadTime: number
  tags: string[]
  documentId: string
  document: {
    id: string
    title: string
    originalName: string
    fileType: string
    createdAt: string
  }
  aiProvider: string
  model: string
  tokensUsed: number
  generationTime: number
  createdAt: string
  updatedAt: string
}

export default function SummaryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const { locale } = useI18n()
  const [summary, setSummary] = useState<Summary | null>(null)
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
    const fetchSummary = async () => {
      try {
        const response = await fetch(`/api/summaries/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setSummary(data.summary)
        } else {
          toast.error(getText('summaries.generateError', 'Failed to load summary'))
          router.push(`/${locale}/dashboard/summaries`)
        }
      } catch (error) {
        console.error('Error fetching summary:', error)
        toast.error(getText('summaries.generateError', 'Error loading summary'))
        router.push(`/${locale}/dashboard/summaries`)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchSummary()
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

  const handleExport = async () => {
    try {
      // TODO: Implement export functionality
      toast.success(getText('summaries.generateSuccess', 'Export started'))
    } catch (error) {
      toast.error(getText('summaries.generateError', 'Export failed'))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/summaries`}>
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

  if (!summary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/summaries`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getText('common.back', 'Back')}
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {getText('summaries.documentNotFound', 'Summary not found')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('summaries.documentNotFoundDesc', 'The summary you\'re looking for doesn\'t exist or has been deleted.')}
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
            <Link href={`/${locale}/dashboard/summaries`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {getText('common.back', 'Back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {getText('summaries.from', 'From')}: {summary.document.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {getText('common.export', 'Export')}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/dashboard/documents/${summary.documentId}`}>
              <Eye className="h-4 w-4 mr-2" />
              {getText('summaries.viewDocument', 'View Document')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary metadata */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {summary.estimatedReadTime} {getText('summaries.minutes', 'min')} {getText('summaries.readTime', 'read')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {summary.wordCount} words
                </span>
              </div>
              <Badge className={getDifficultyColor(summary.difficulty)}>
                {summary.difficulty}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              {getText('summaries.created', 'Created')}: {new Date(summary.createdAt).toLocaleDateString()}
            </div>
          </div>
          {summary.tags.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {summary.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content */}
      <div className="grid gap-6">
        {/* Overview */}
        {summary.overview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {getText('summaries.overview', 'Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.overview}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Points */}
        {summary.keyPoints && summary.keyPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {getText('summaries.keyPoints', 'Key Points')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Main Concepts */}
        {summary.mainConcepts && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                {getText('summaries.mainConcepts', 'Main Concepts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.mainConcepts}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Examples */}
        {summary.examples && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                {getText('summaries.examples', 'Examples')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.examples}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Takeaways */}
        {summary.takeaways && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {getText('summaries.takeaways', 'Key Takeaways')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.takeaways}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prerequisites */}
        {summary.prerequisites && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {getText('summaries.prerequisites', 'Prerequisites')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.prerequisites}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Methodology */}
        {summary.methodology && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {getText('summaries.methodology', 'Methodology')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.methodology}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications */}
        {summary.applications && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {getText('summaries.applications', 'Applications')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.applications}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Limitations */}
        {summary.limitations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {getText('summaries.limitations', 'Limitations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.limitations}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Future Directions */}
        {summary.futureDirections && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {getText('summaries.futureDirections', 'Future Directions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.futureDirections}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Critical Analysis */}
        {summary.criticalAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {getText('summaries.criticalAnalysis', 'Critical Analysis')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.criticalAnalysis}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Further Reading */}
        {summary.furtherReading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {getText('summaries.furtherReading', 'Further Reading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {summary.furtherReading}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Generation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {getText('summaries.aiProvider', 'AI Generation Details')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {getText('summaries.aiProvider', 'AI Provider')}:
                </span>
                <p className="text-gray-600 dark:text-gray-400">{summary.aiProvider}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {getText('summaries.model', 'Model')}:
                </span>
                <p className="text-gray-600 dark:text-gray-400">{summary.model}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {getText('summaries.tokensUsed', 'Tokens Used')}:
                </span>
                <p className="text-gray-600 dark:text-gray-400">{summary.tokensUsed?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {getText('summaries.generationTime', 'Generation Time')}:
                </span>
                <p className="text-gray-600 dark:text-gray-400">{summary.generationTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}