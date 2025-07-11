"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { BookOpen, Plus, Eye, Download, Clock, Trash2, FileText, Brain } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface Document {
  id: string
  title: string
  originalName: string
  fileType: string
  createdAt: string
}

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

export default function SummariesPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    summary: { id: string; title: string } | null
  }>({
    open: false,
    summary: null
  })
  const [generateDialog, setGenerateDialog] = useState(false)
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [generating, setGenerating] = useState(false)
  const [generateOptions, setGenerateOptions] = useState({
    documentId: '',
    difficulty: 'MEDIUM',
    includeExamples: true,
    aiProvider: 'openai',
    model: 'gpt-4o'
  })

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
    const fetchSummaries = async () => {
      try {
        const response = await fetch('/api/summaries')
        if (response.ok) {
          const data = await response.json()
          setSummaries(data.summaries || [])
        } else {
          toast.error(getText('summaries.generateError', 'Failed to load summaries'))
        }
      } catch (error) {
        console.error('Error fetching summaries:', error)
        toast.error(getText('summaries.generateError', 'Error loading summaries'))
      } finally {
        setLoading(false)
      }
    }

    fetchSummaries()
  }, [t])

  const handleDeleteClick = (summaryId: string, summaryTitle: string) => {
    setDeleteDialog({
      open: true,
      summary: { id: summaryId, title: summaryTitle }
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.summary) return

    const summaryId = deleteDialog.summary.id
    setDeleting(summaryId)
    setDeleteDialog({ open: false, summary: null })

    try {
      const response = await fetch(`/api/summaries/${summaryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSummaries(prev => prev.filter(summary => summary.id !== summaryId))
        toast.success(getText('summaries.deleteSuccess', 'Summary deleted successfully'))
      } else {
        const data = await response.json()
        toast.error(data.error || getText('summaries.deleteError', 'Failed to delete summary'))
      }
    } catch (error) {
      console.error('Error deleting summary:', error)
      toast.error(getText('summaries.deleteError', 'Error deleting summary'))
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, summary: null })
  }

  const fetchAvailableDocuments = async () => {
    try {
      const response = await fetch('/api/documents?withoutSummaries=true')
      if (response.ok) {
        const data = await response.json()
        setAvailableDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching available documents:', error)
    }
  }

  const handleGenerateClick = () => {
    setGenerateDialog(true)
    fetchAvailableDocuments()
  }

  const handleGenerateSummary = async () => {
    if (!generateOptions.documentId) {
      toast.error(getText('summaries.selectDocument', 'Please select a document'))
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/summaries/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generateOptions,
          language: locale
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSummaries(prev => [data.summary, ...prev])
        setGenerateDialog(false)
        setGenerateOptions(prev => ({ ...prev, documentId: '' }))
        toast.success(getText('summaries.generateSuccess', 'Summary generated successfully'))
      } else {
        toast.error(data.error || getText('summaries.generateError', 'Failed to generate summary'))
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      toast.error(getText('summaries.generateError', 'Error generating summary'))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('summaries.title', 'Summaries')}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {getText('summaries.subtitle', 'AI-generated summaries for quick understanding')}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('summaries.title', 'Summaries')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('summaries.subtitle', 'AI-generated summaries for quick understanding')}
          </p>
        </div>
        <Button onClick={handleGenerateClick}>
          <Plus className="mr-2 h-4 w-4" />
          {getText('summaries.generateSummary', 'Generate Summary')}
        </Button>
      </div>

      {summaries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {getText('summaries.noSummaries', 'No summaries yet')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {getText('summaries.createFirst', 'Generate your first summary!')}
              </p>
              <Button className="mt-4" onClick={handleGenerateClick}>
                <Plus className="mr-2 h-4 w-4" />
                {getText('summaries.generateSummary', 'Generate Summary')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {summaries.map((summary) => (
            <Card key={summary.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {summary.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {getText('summaries.from', 'From')}: {summary.document.title}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(summary.createdAt).toLocaleDateString()}
                      </span>
                      <span>{getText('summaries.difficulty', 'Difficulty')}: {summary.difficulty}</span>
                      <span>{summary.wordCount} words</span>
                      <span>{summary.estimatedReadTime} {getText('summaries.minutes', 'min')} {getText('summaries.readTime', 'read')}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/${locale}/dashboard/summaries/${summary.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {getText('common.view', 'View')}
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      {getText('common.export', 'Export')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteClick(summary.id, summary.title)}
                      disabled={deleting === summary.id}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleting === summary.id ? getText('common.deleting', 'Deleting...') : getText('common.delete', 'Delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Summary Dialog */}
      <Dialog open={generateDialog} onOpenChange={setGenerateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-blue-500" />
              {getText('summaries.generateSummary', 'Generate Summary')}
            </DialogTitle>
            <DialogDescription>
              {getText('summaries.generateSummaryDesc', 'Create an AI-generated summary from one of your documents')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Document Selection */}
            <div className="space-y-2">
              <Label htmlFor="document">{getText('summaries.selectDocument', 'Select Document')}</Label>
              <Select 
                value={generateOptions.documentId} 
                onValueChange={(value) => setGenerateOptions(prev => ({ ...prev, documentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={getText('summaries.chooseDocument', 'Choose a document...')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDocuments.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      {getText('summaries.noDocumentsAvailable', 'No documents available')}
                    </div>
                  ) : (
                    availableDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{doc.title}</span>
                          <span className="text-xs text-gray-500">({doc.fileType.toUpperCase()})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">{getText('summaries.difficulty', 'Difficulty Level')}</Label>
              <Select 
                value={generateOptions.difficulty} 
                onValueChange={(value) => setGenerateOptions(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">{getText('summaries.easy', 'Easy')}</SelectItem>
                  <SelectItem value="MEDIUM">{getText('summaries.medium', 'Medium')}</SelectItem>
                  <SelectItem value="HARD">{getText('summaries.hard', 'Hard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Examples */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeExamples"
                checked={generateOptions.includeExamples}
                onCheckedChange={(checked) => setGenerateOptions(prev => ({ ...prev, includeExamples: checked as boolean }))}
              />
              <Label htmlFor="includeExamples">
                {getText('summaries.includeExamples', 'Include examples and case studies')}
              </Label>
            </div>

            {/* AI Provider */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">{getText('summaries.aiProvider', 'AI Provider')}</Label>
                <Select 
                  value={generateOptions.aiProvider} 
                  onValueChange={(value) => setGenerateOptions(prev => ({ ...prev, aiProvider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">{getText('summaries.model', 'Model')}</Label>
                <Select 
                  value={generateOptions.model} 
                  onValueChange={(value) => setGenerateOptions(prev => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {generateOptions.aiProvider === 'openai' ? (
                      <>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                        <SelectItem value="claude-opus-4-20250514">Claude 4 Opus</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialog(false)}>
              {getText('common.cancel', 'Cancel')}
            </Button>
            <Button 
              onClick={handleGenerateSummary} 
              disabled={generating || !generateOptions.documentId}
            >
              {generating ? getText('summaries.generating', 'Generating...') : getText('summaries.generateSummary', 'Generate Summary')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getText('summaries.deleteSummary', 'Delete Summary')}</AlertDialogTitle>
            <AlertDialogDescription>
              {getText('summaries.confirmDelete', 'Are you sure you want to delete this summary? This action cannot be undone.')}
              {deleteDialog.summary && (
                <span className="mt-2 block font-medium text-gray-900 dark:text-white">
                  "{deleteDialog.summary.title}"
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              {getText('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {getText('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}