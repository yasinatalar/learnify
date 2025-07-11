import { ankiExporter, AnkiDeck } from './anki-exporter'
import { pdfExporter, PDFExportData } from './pdf-exporter'
import { csvExporter, ExportableData, CSVExportOptions } from './csv-exporter'
import { jsonExporter, JSONExportData } from './json-exporter'

export type ExportFormat = 'pdf' | 'anki' | 'csv' | 'json'

export interface ExportRequest {
  format: ExportFormat
  items: Array<{
    id: string
    type: 'document' | 'flashcards' | 'quizzes' | 'summaries' | 'analytics'
    title: string
  }>
  options?: {
    includeContent?: boolean
    includeMetadata?: boolean
    dateFormat?: string
    sectioned?: boolean
  }
}

export interface ExportResult {
  success: boolean
  blob?: Blob
  filename: string
  size?: number
  error?: string
}

class ExportManager {
  /**
   * Main export function that coordinates all export types
   */
  async exportData(request: ExportRequest, userData: any): Promise<ExportResult> {
    try {
      switch (request.format) {
        case 'pdf':
          return await this.exportToPDF(request, userData)
        case 'anki':
          return await this.exportToAnki(request, userData)
        case 'csv':
          return await this.exportToCSV(request, userData)
        case 'json':
          return await this.exportToJSON(request, userData)
        default:
          throw new Error(`Unsupported export format: ${request.format}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(request: ExportRequest, userData: any): Promise<ExportResult> {
    const pdfData: PDFExportData = {
      title: this.generateExportTitle(request.items),
      locale: userData.locale || 'en',
      metadata: {
        author: userData.profile?.name || 'LearnifyAI User',
        subject: 'Learning Materials Export',
        keywords: this.extractKeywords(request.items),
        createdAt: new Date().toISOString()
      }
    }

    // Add content based on selected items
    const documentItems = request.items.filter(item => item.type === 'document')
    const flashcardItems = request.items.filter(item => item.type === 'flashcards')
    const quizItems = request.items.filter(item => item.type === 'quizzes')
    const summaryItems = request.items.filter(item => item.type === 'summaries')

    // Add document content
    if (documentItems.length > 0 && userData.documents) {
      const selectedDocs = userData.documents.filter((doc: any) => 
        documentItems.some(item => item.id === doc.id)
      )
      if (selectedDocs.length > 0) {
        pdfData.content = selectedDocs.map((doc: any) => doc.content).join('\n\n---\n\n')
      }
    }

    // Add flashcards
    if (flashcardItems.length > 0 && userData.flashcards) {
      pdfData.flashcards = userData.flashcards.filter((card: any) =>
        flashcardItems.some(item => item.id.includes(card.documentId))
      )
    }

    // Add quizzes
    if (quizItems.length > 0 && userData.quizzes) {
      pdfData.quizzes = userData.quizzes.filter((quiz: any) =>
        quizItems.some(item => item.id === quiz.id)
      )
    }

    // Add summaries
    if (summaryItems.length > 0 && userData.summaries) {
      pdfData.summaries = userData.summaries.filter((summary: any) =>
        summaryItems.some(item => item.id === summary.id)
      )
    }

    const blob = await pdfExporter.generatePDF(pdfData)
    
    return {
      success: true,
      blob,
      filename: `${this.sanitizeFilename(pdfData.title)}.pdf`,
      size: blob.size
    }
  }

  /**
   * Export to Anki format
   */
  private async exportToAnki(request: ExportRequest, userData: any): Promise<ExportResult> {
    const flashcardItems = request.items.filter(item => item.type === 'flashcards')
    
    if (flashcardItems.length === 0) {
      throw new Error('No flashcards selected for Anki export')
    }

    // Collect all flashcards from selected items
    const allFlashcards: any[] = []
    
    flashcardItems.forEach(item => {
      if (userData.flashcards) {
        const cards = userData.flashcards.filter((card: any) => 
          item.id.includes(card.documentId) || item.id === `flashcards_${card.documentId}`
        )
        allFlashcards.push(...cards)
      }
    })

    if (allFlashcards.length === 0) {
      throw new Error('No flashcards found for selected items')
    }

    const deckName = flashcardItems.length === 1 
      ? flashcardItems[0].title 
      : `LearnifyAI Export - ${flashcardItems.length} Sets`

    const ankiDeck = ankiExporter.convertFlashcardsToAnki(allFlashcards, deckName)
    const blob = await ankiExporter.generateAnkiPackage(ankiDeck)

    return {
      success: true,
      blob,
      filename: `${this.sanitizeFilename(deckName)}.apkg`,
      size: blob.size
    }
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(request: ExportRequest, userData: any): Promise<ExportResult> {
    const exportData: ExportableData = {}

    // Collect data based on selected items
    request.items.forEach(item => {
      switch (item.type) {
        case 'document':
          if (!exportData.documents) exportData.documents = []
          const doc = userData.documents?.find((d: any) => d.id === item.id)
          if (doc) exportData.documents.push(doc)
          break
          
        case 'flashcards':
          if (!exportData.flashcards) exportData.flashcards = []
          const cards = userData.flashcards?.filter((c: any) => 
            item.id.includes(c.documentId) || item.id === `flashcards_${c.documentId}`
          )
          if (cards) exportData.flashcards.push(...cards)
          break
          
        case 'quizzes':
          if (!exportData.quizzes) exportData.quizzes = []
          const quiz = userData.quizzes?.find((q: any) => q.id === item.id)
          if (quiz) exportData.quizzes.push(quiz)
          break
          
        case 'summaries':
          if (!exportData.summaries) exportData.summaries = []
          const summary = userData.summaries?.find((s: any) => s.id === item.id)
          if (summary) exportData.summaries.push(summary)
          break
          
        case 'analytics':
          if (userData.analytics) {
            exportData.analytics = userData.analytics.dailyStats
          }
          break
      }
    })

    const options: CSVExportOptions = {
      includeHeaders: true,
      delimiter: ',',
      dateFormat: request.options?.dateFormat || 'iso'
    }

    const blob = await csvExporter.generateCSVPackage(exportData, options)
    
    return {
      success: true,
      blob,
      filename: `learnify_export_${new Date().toISOString().split('T')[0]}.zip`,
      size: blob.size
    }
  }

  /**
   * Export to JSON format
   */
  private async exportToJSON(request: ExportRequest, userData: any): Promise<ExportResult> {
    const exportData: Partial<JSONExportData> = {}

    // Collect data based on selected items
    request.items.forEach(item => {
      switch (item.type) {
        case 'document':
          if (!exportData.documents) exportData.documents = []
          const doc = userData.documents?.find((d: any) => d.id === item.id)
          if (doc) {
            exportData.documents.push({
              ...doc,
              content: request.options?.includeContent !== false ? doc.content : '[Content excluded]'
            })
          }
          break
          
        case 'flashcards':
          if (!exportData.flashcards) exportData.flashcards = []
          const cards = userData.flashcards?.filter((c: any) => 
            item.id.includes(c.documentId) || item.id === `flashcards_${c.documentId}`
          )
          if (cards) exportData.flashcards.push(...cards)
          break
          
        case 'quizzes':
          if (!exportData.quizzes) exportData.quizzes = []
          const quiz = userData.quizzes?.find((q: any) => q.id === item.id)
          if (quiz) exportData.quizzes.push(quiz)
          break
          
        case 'summaries':
          if (!exportData.summaries) exportData.summaries = []
          const summary = userData.summaries?.find((s: any) => s.id === item.id)
          if (summary) exportData.summaries.push(summary)
          break
          
        case 'analytics':
          if (userData.analytics) {
            exportData.analytics = userData.analytics
          }
          break
      }
    })

    // Include user settings if requested
    if (request.options?.includeMetadata && userData.userSettings) {
      exportData.userSettings = userData.userSettings
    }

    const sectioned = request.options?.sectioned || false
    const blob = await jsonExporter.generateJSONPackage(exportData, sectioned)
    
    return {
      success: true,
      blob,
      filename: `learnify_export_${new Date().toISOString().split('T')[0]}.zip`,
      size: blob.size
    }
  }

  /**
   * Generate a descriptive title for the export
   */
  private generateExportTitle(items: ExportRequest['items']): string {
    if (items.length === 1) {
      return items[0].title
    }
    
    const types = [...new Set(items.map(item => item.type))]
    const typeNames = types.map(type => {
      switch (type) {
        case 'document': return 'Documents'
        case 'flashcards': return 'Flashcards'
        case 'quizzes': return 'Quizzes'
        case 'summaries': return 'Summaries'
        case 'analytics': return 'Analytics'
        default: return 'Items'
      }
    })
    
    return `LearnifyAI Export - ${typeNames.join(', ')}`
  }

  /**
   * Extract keywords from export items
   */
  private extractKeywords(items: ExportRequest['items']): string[] {
    const keywords = ['LearnifyAI', 'learning', 'education']
    
    items.forEach(item => {
      keywords.push(item.type)
      // Extract meaningful words from titles
      const titleWords = item.title.split(/\s+/).filter(word => 
        word.length > 3 && !['the', 'and', 'for', 'with'].includes(word.toLowerCase())
      )
      keywords.push(...titleWords)
    })
    
    return [...new Set(keywords)]
  }

  /**
   * Sanitize filename for different operating systems
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 100) // Limit length
  }

  /**
   * Get available export formats for given items
   */
  getAvailableFormats(items: ExportRequest['items']): ExportFormat[] {
    const formats: ExportFormat[] = ['json'] // JSON always available
    
    const hasFlashcards = items.some(item => item.type === 'flashcards')
    const hasDocuments = items.some(item => item.type === 'document')
    const hasQuizzes = items.some(item => item.type === 'quizzes')
    const hasSummaries = items.some(item => item.type === 'summaries')
    
    // PDF available for documents, flashcards, quizzes, and summaries
    if (hasDocuments || hasFlashcards || hasQuizzes || hasSummaries) {
      formats.push('pdf')
    }
    
    // Anki only for flashcards
    if (hasFlashcards) {
      formats.push('anki')
    }
    
    // CSV available for all data types
    formats.push('csv')
    
    return formats
  }

  /**
   * Estimate export file size
   */
  estimateFileSize(request: ExportRequest, userData: any): number {
    let estimatedSize = 0
    
    request.items.forEach(item => {
      switch (item.type) {
        case 'document':
          const doc = userData.documents?.find((d: any) => d.id === item.id)
          if (doc) estimatedSize += doc.content.length * 0.5 // Rough PDF compression
          break
        case 'flashcards':
          const cardCount = userData.flashcards?.filter((c: any) => 
            item.id.includes(c.documentId)
          ).length || 0
          estimatedSize += cardCount * 200 // ~200 bytes per flashcard
          break
        case 'quizzes':
          const quiz = userData.quizzes?.find((q: any) => q.id === item.id)
          if (quiz) estimatedSize += quiz.questions?.length * 300 || 1000
          break
        case 'summaries':
          const summary = userData.summaries?.find((s: any) => s.id === item.id)
          if (summary) estimatedSize += (summary.content?.length || 0) * 0.8 // Summaries are text-heavy
          break
      }
    })
    
    // Add base overhead
    estimatedSize += 10000 // 10KB base overhead
    
    // Format-specific multipliers
    switch (request.format) {
      case 'pdf': return estimatedSize * 2
      case 'anki': return estimatedSize * 1.5
      case 'csv': return estimatedSize * 0.7
      case 'json': return estimatedSize * 1.2
      default: return estimatedSize
    }
  }
}

export const exportManager = new ExportManager()