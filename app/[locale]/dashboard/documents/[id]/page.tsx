"use client"

import { useState, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PDFViewer } from "@/components/pdf/pdf-viewer"
import { 
  FileText, 
  ArrowLeft, 
  Download, 
  Brain, 
  Target, 
  Eye,
  Clock,
  FileType,
  Hash,
  Layers,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface Document {
  id: string
  title: string
  content: string
  originalName: string
  fileType: string
  fileSize: number
  status: string
  wordCount?: number
  pageCount?: number
  language?: string
  createdAt: string
  updatedAt: string
  metadata?: any
  flashcards?: Array<{
    id: string
    question: string
    answer: string
    explanation?: string
    difficulty: string
    tags: string
    interval: number
    repetition: number
    efactor: number
    nextReview: string
    createdAt: string
  }>
  quizzes?: Array<{
    id: string
    title: string
    description?: string
    difficulty: string
    timeLimit?: number
    attempts: number
    lastAttemptAt?: string
    questionCount: number
    createdAt: string
  }>
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const { locale } = useI18n()
  const documentId = params.id as string
  
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)

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
    fetchDocument()
  }, [documentId])

  // Auto-refresh if document is still processing
  useEffect(() => {
    if (document?.status === "PROCESSING") {
      const interval = setInterval(() => {
        fetchDocument()
      }, 3000) // Check every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [document?.status])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      if (response.ok) {
        const data = await response.json()
        setDocument(data.document)
      } else if (response.status === 404) {
        toast.error(getText('documents.documentNotFound', 'Document not found'))
      } else {
        console.error('Failed to fetch document')
        toast.error(getText('documents.uploadError', 'Failed to load document'))
      }
    } catch (error) {
      console.error("Error fetching document:", error)
      toast.error(getText('documents.uploadError', 'Failed to load document'))
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateFlashcards = async () => {
    // Prevent multiple simultaneous requests
    if (!document || generatingFlashcards || generatingQuiz) {
      console.log('Flashcard generation blocked - already processing')
      return
    }
    
    console.log('Starting flashcard generation...')
    setGeneratingFlashcards(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: 10,
          difficulty: 'mixed',
          locale: locale // Pass locale for German content generation
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Flashcard generation successful:', data)
        toast.success(data.message || getText('flashcards.generateSuccess', 'Flashcards generated successfully'))
        // Refresh document data to show new flashcards
        await fetchDocument()
      } else {
        const errorData = await response.json()
        console.error('Flashcard generation failed:', errorData)
        toast.error(errorData.error || getText('flashcards.generateError', 'Failed to generate flashcards'))
      }
    } catch (error) {
      console.error('Flashcard generation error:', error)
      toast.error(getText('flashcards.generateError', 'Failed to generate flashcards'))
    } finally {
      console.log('Flashcard generation finished')
      setGeneratingFlashcards(false)
    }
  }

  const handleGenerateQuiz = async () => {
    // Prevent multiple simultaneous requests
    if (!document || generatingQuiz || generatingFlashcards) {
      console.log('Quiz generation blocked - already processing')
      return
    }
    
    console.log('Starting quiz generation...')
    setGeneratingQuiz(true)
    try {
      const response = await fetch(`/api/documents/${documentId}/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionCount: 10,
          difficulty: 'mixed',
          questionTypes: ['MULTIPLE_CHOICE'],
          locale: locale // Pass locale for German content generation
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Quiz generation successful:', data)
        toast.success(data.message || getText('quizzes.generateSuccess', 'Quiz generated successfully'))
        // Refresh document data to show new quiz
        await fetchDocument()
      } else {
        const errorData = await response.json()
        console.error('Quiz generation failed:', errorData)
        toast.error(errorData.error || getText('quizzes.generateError', 'Failed to generate quiz'))
      }
    } catch (error) {
      console.error('Quiz generation error:', error)
      toast.error(getText('quizzes.generateError', 'Failed to generate quiz'))
    } finally {
      console.log('Quiz generation finished')
      setGeneratingQuiz(false)
    }
  }

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return getText('documents.completed', 'Completed')
      case "PROCESSING":
        return getText('documents.processing', 'Processing')
      case "FAILED":
        return getText('documents.failed', 'Failed')
      default:
        return status
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "HARD":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty.toUpperCase()) {
      case "EASY":
        return getText('flashcards.easy', 'Easy')
      case "MEDIUM":
        return getText('flashcards.medium', 'Medium')
      case "HARD":
        return getText('flashcards.hard', 'Hard')
      default:
        return difficulty.toLowerCase()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleStartQuiz = (quizId: string) => {
    router.push(`/${locale}/dashboard/quizzes?start=${quizId}`)
  }

  const handleExportDocument = () => {
    // Navigate to export page with document ID pre-selected
    router.push(`/${locale}/dashboard/export?document=${documentId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 animate-pulse mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{getText('documents.loadingDocument', 'Loading document...')}</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{getText('documents.documentNotFound', 'Document not found')}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {getText('documents.documentNotFoundDesc', 'The document you\'re looking for doesn\'t exist or has been deleted.')}
          </p>
          <Link href={`/${locale}/dashboard/documents`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {getText('documents.backToDocuments', 'Back to Documents')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/dashboard/documents`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {getText('common.back', 'Back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {document.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {document.originalName}
            </p>
          </div>
          <Badge className={getStatusColor(document.status)}>
            {getStatusText(document.status)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportDocument}>
            <Download className="mr-2 h-4 w-4" />
            {getText('common.export', 'Export')}
          </Button>
        </div>
      </div>

      {/* Document Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileType className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium">{formatFileSize(document.fileSize)}</p>
                <p className="text-xs text-gray-600">{getText('documents.fileSize', 'File size')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Hash className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium">{document.wordCount || 0}</p>
                <p className="text-xs text-gray-600">{getText('documents.words', 'Words')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Layers className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <p className="text-sm font-medium">{document.pageCount || 1}</p>
                <p className="text-xs text-gray-600">{getText('documents.pages', 'Pages')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <p className="text-sm font-medium">
                  {new Date(document.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600">{getText('documents.created', 'Created')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Indicator */}
      {document.status === "PROCESSING" && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {getText('documents.processingDocument', 'Processing Document')}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {getText('documents.processingDocumentDesc', 'AI is generating flashcards and learning materials. This page will update automatically when processing is complete.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {getText('documents.content', 'Content')}
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {getText('documents.flashcards', 'Flashcards')} ({document.flashcards?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {getText('documents.quizzes', 'Quizzes')} ({document.quizzes?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="space-y-4">
            {/* PDF Viewer for PDF files */}
            {document.fileType === 'application/pdf' ? (
              <PDFViewer
                documentId={document.id}
                fileName={document.originalName}
                fileType={document.fileType}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{getText('documents.documentContent', 'Document Content')}</CardTitle>
                  <CardDescription>
                    {getText('documents.documentContentDesc', 'The extracted content from your document')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom styling for Markdown elements
                        h1: ({children}) => <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-semibold mb-3 mt-5">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-medium mb-2 mt-4">{children}</h3>,
                        p: ({children}) => <p className="mb-3 text-gray-700 dark:text-gray-300">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                        li: ({children}) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                        hr: () => <hr className="my-6 border-gray-300 dark:border-gray-600" />,
                        strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                        code: ({children}) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{children}</code>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{children}</blockquote>,
                      }}
                    >
                      {document.content}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* For non-PDF files, show the PDFViewer fallback display */}
            {document.fileType !== 'application/pdf' && (
              <PDFViewer
                documentId={document.id}
                fileName={document.originalName}
                fileType={document.fileType}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="flashcards">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{getText('documents.generatedFlashcards', 'Generated Flashcards')}</h3>
              <Button onClick={handleGenerateFlashcards} disabled={generatingFlashcards}>
                <Brain className="mr-2 h-4 w-4" />
                {generatingFlashcards ? getText('documents.generating', 'Generating...') : getText('documents.generateMore', 'Generate More')}
              </Button>
            </div>

            {document.flashcards && document.flashcards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {document.flashcards.map((flashcard) => (
                  <Card key={flashcard.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{flashcard.question}</CardTitle>
                        <Badge className={getDifficultyColor(flashcard.difficulty)}>
                          {getDifficultyText(flashcard.difficulty)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {flashcard.answer}
                      </p>
                      {flashcard.explanation && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">
                          {flashcard.explanation}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {flashcard.tags.split(',').map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {getText('documents.noFlashcardsGenerated', 'No flashcards generated yet')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {getText('documents.noFlashcardsGeneratedDesc', 'Generate flashcards from this document to start learning.')}
                  </p>
                  <Button onClick={handleGenerateFlashcards} disabled={generatingFlashcards}>
                    <Brain className="mr-2 h-4 w-4" />
                    {generatingFlashcards ? getText('documents.generating', 'Generating...') : getText('documents.generateFlashcards', 'Generate Flashcards')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quizzes">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{getText('documents.generatedQuizzes', 'Generated Quizzes')}</h3>
              <Button onClick={handleGenerateQuiz} disabled={generatingQuiz}>
                <Target className="mr-2 h-4 w-4" />
                {generatingQuiz ? getText('documents.generating', 'Generating...') : getText('documents.generateQuiz', 'Generate Quiz')}
              </Button>
            </div>

            {document.quizzes && document.quizzes.length > 0 ? (
              <div className="space-y-3">
                {document.quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{quiz.title}</h4>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{quiz.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <span>{quiz.questionCount} {getText('documents.questionCount', 'questions')}</span>
                            <Badge className={getDifficultyColor(quiz.difficulty)}>
                              {getDifficultyText(quiz.difficulty)}
                            </Badge>
                            {quiz.timeLimit && <span>{quiz.timeLimit}s per question</span>}
                            <span>{getText('documents.created', 'Created')} {new Date(quiz.createdAt).toLocaleDateString()}</span>
                            {quiz.attempts > 0 && <span>{quiz.attempts} {getText('documents.attempts', 'attempts')}</span>}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleStartQuiz(quiz.id)}>
                          {getText('documents.startQuiz', 'Start Quiz')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {getText('documents.noQuizzesGenerated', 'No quizzes generated yet')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {getText('documents.noQuizzesGeneratedDesc', 'Generate quizzes from this document to test your knowledge.')}
                  </p>
                  <Button onClick={handleGenerateQuiz} disabled={generatingQuiz}>
                    <Target className="mr-2 h-4 w-4" />
                    {generatingQuiz ? getText('documents.generating', 'Generating...') : getText('documents.generateQuiz', 'Generate Quiz')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}