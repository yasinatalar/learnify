"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2,
  Plus,
  Clock,
  Brain,
  Target
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface Document {
  id: string
  title: string
  originalName: string
  fileType: string
  fileSize: number
  status: string
  wordCount?: number
  pageCount?: number
  createdAt: string
  updatedAt: string
  flashcardsCount?: number
  quizzesCount?: number
}

export default function DocumentsPage() {
  const router = useRouter()
  const t = useTranslations()
  const { locale } = useI18n()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")

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

  // Fetch real documents from API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents')
        if (response.ok) {
          const data = await response.json()
          setDocuments(data.documents || [])
        } else {
          console.error('Failed to fetch documents')
          toast.error(getText('documents.uploadError', 'Failed to load documents'))
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
        toast.error(getText('documents.uploadError', 'Error loading documents'))
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [t])

  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "name":
          return a.title.localeCompare(b.title)
        case "size":
          return b.fileSize - a.fileSize
        default:
          return 0
      }
    })

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
        <FileText className="h-4 w-4 text-red-600" />
      </div>
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
        <FileText className="h-4 w-4 text-blue-600" />
      </div>
    } else {
      return <div className="w-8 h-8 bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center">
        <FileText className="h-4 w-4 text-gray-600" />
      </div>
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
        toast.success(getText('documents.documentDeleted', 'Document deleted successfully'))
      } else {
        toast.error(getText('documents.uploadError', 'Failed to delete document'))
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(getText('documents.uploadError', 'Error deleting document'))
    }
  }

  const handleExportDocument = (documentId: string) => {
    // Navigate to export page with document ID pre-selected
    router.push(`/${locale}/dashboard/export?document=${documentId}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('documents.title', 'Documents')}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {getText('documents.subtitle', 'Manage your uploaded documents and generated content')}
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{getText('documents.loading', 'Loading documents...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('documents.title', 'Documents')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('documents.subtitle', 'Manage your uploaded documents and generated content')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/dashboard/upload`}>
            <Plus className="mr-2 h-4 w-4" />
            {getText('documents.uploadDocument', 'Upload Document')}
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={getText('documents.searchPlaceholder', 'Search documents...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{getText('documents.allStatus', 'All Status')}</SelectItem>
                  <SelectItem value="COMPLETED">{getText('documents.completed', 'Completed')}</SelectItem>
                  <SelectItem value="PROCESSING">{getText('documents.processing', 'Processing')}</SelectItem>
                  <SelectItem value="FAILED">{getText('documents.failed', 'Failed')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{getText('documents.newest', 'Newest')}</SelectItem>
                  <SelectItem value="oldest">{getText('documents.oldest', 'Oldest')}</SelectItem>
                  <SelectItem value="name">{getText('documents.name', 'Name')}</SelectItem>
                  <SelectItem value="size">{getText('documents.size', 'Size')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {documents.length === 0 ? getText('documents.noDocuments', 'No documents yet') : getText('documents.noMatches', 'No documents match your filters')}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {documents.length === 0 
                  ? getText('documents.uploadFirst', 'Get started by uploading your first document.')
                  : getText('documents.adjustFilters', 'Try adjusting your search or filter criteria.')
                }
              </p>
              {documents.length === 0 && (
                <Button className="mt-4" asChild>
                  <Link href={`/${locale}/dashboard/upload`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {getText('documents.uploadFirst', 'Upload Your First Document')}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  {getFileTypeIcon(document.fileType)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {document.title}
                      </h3>
                      <Badge className={getStatusColor(document.status)}>
                        {getStatusText(document.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {document.originalName}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{formatFileSize(document.fileSize)}</span>
                      {document.wordCount && <span>{document.wordCount.toLocaleString()} {getText('documents.words', 'words')}</span>}
                      {document.pageCount && <span>{document.pageCount} {getText('documents.pages', 'pages')}</span>}
                      <span className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(document.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {document.status === "COMPLETED" && (
                      <div className="flex items-center space-x-4 mt-2">
                        {(document.flashcardsCount || 0) > 0 && (
                          <span className="flex items-center text-xs text-blue-600">
                            <Brain className="mr-1 h-3 w-3" />
                            {document.flashcardsCount} {getText('documents.flashcards', 'flashcards')}
                          </span>
                        )}
                        {(document.quizzesCount || 0) > 0 && (
                          <span className="flex items-center text-xs text-green-600">
                            <Target className="mr-1 h-3 w-3" />
                            {document.quizzesCount} {getText('documents.quizzes', 'quizzes')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/${locale}/dashboard/documents/${document.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        {getText('common.view', 'View')}
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportDocument(document.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      {getText('common.export', 'Export')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteDocument(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}