"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink, FileText } from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "@/lib/i18n/context"
import { PDFDocument } from "./pdf-document"
import { PDFPage } from "./pdf-page"

interface PDFViewerProps {
  documentId: string
  fileName: string
  fileType: string
  className?: string
}

export function PDFViewer({ documentId, fileName, fileType, className }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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

  const fileUrl = `/api/documents/${documentId}/file`

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error)
    setError(getText('pdf.failedToLoad', 'Failed to load PDF'))
    setLoading(false)
  }, [getText])

  const changePage = useCallback((offset: number, event?: React.MouseEvent) => {
    // Prevent default behavior if called from a click event
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // Store current scroll position
    const currentScrollY = window.scrollY
    
    // Temporarily prevent scroll restoration during page change
    const originalScrollBehavior = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'auto'
    
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset
      const finalPageNumber = Math.max(1, Math.min(newPageNumber, numPages))
      
      // Use a more aggressive approach with interval checking
      let attempts = 0
      const maxAttempts = 50 // Check for 500ms
      
      const restoreInterval = setInterval(() => {
        if (window.scrollY !== currentScrollY) {
          window.scrollTo(0, currentScrollY)
        }
        
        attempts++
        if (attempts >= maxAttempts) {
          clearInterval(restoreInterval)
          document.documentElement.style.scrollBehavior = originalScrollBehavior
        }
      }, 10)
      
      // Also restore after a delay
      setTimeout(() => {
        clearInterval(restoreInterval)
        window.scrollTo(0, currentScrollY)
        document.documentElement.style.scrollBehavior = originalScrollBehavior
      }, 500)
      
      return finalPageNumber
    })
  }, [numPages])

  const changeScale = useCallback((scaleChange: number) => {
    setScale(prevScale => {
      const newScale = prevScale + scaleChange
      return Math.max(0.5, Math.min(newScale, 2.0))
    })
  }, [])

  const downloadFile = useCallback(() => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(getText('pdf.downloadStarted', 'Download started'))
  }, [fileUrl, fileName])

  const openInNewTab = useCallback(() => {
    window.open(fileUrl, '_blank')
  }, [fileUrl])

  // For PDF files, use react-pdf
  if (fileType === 'application/pdf') {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {getText('pdf.pdfDocument', 'PDF Document')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeScale(-0.1)}
                disabled={scale <= 0.5}
                title={getText('pdf.zoomOut', 'Zoom out')}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeScale(0.1)}
                disabled={scale >= 2.0}
                title={getText('pdf.zoomIn', 'Zoom in')}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                title={getText('pdf.openInNewTab', 'Open in new tab')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadFile}
                title={getText('pdf.downloadPDF', 'Download PDF')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={containerRef} className="flex flex-col items-center space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">{getText('pdf.loadingPDF', 'Loading PDF...')}</p>
                </div>
              </div>
            )}
            
            {error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      {getText('common.retry', 'Retry')}
                    </Button>
                    <Button variant="outline" onClick={downloadFile}>
                      {getText('pdf.downloadInstead', 'Download Instead')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* PDF Document */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                  <PDFDocument
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                  >
                    <PDFPage
                      pageNumber={pageNumber}
                      scale={scale}
                    />
                  </PDFDocument>
                </div>

                {/* Navigation Controls */}
                {numPages > 1 && (
                  <div className="flex items-center justify-between w-full max-w-md">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => changePage(-1, e)}
                      disabled={pageNumber <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      {getText('common.previous', 'Previous')}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getText('pdf.pageOf', 'Page')} {pageNumber} {getText('pdf.of', 'of')} {numPages}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => changePage(1, e)}
                      disabled={pageNumber >= numPages}
                    >
                      {getText('common.next', 'Next')}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // For other file types (DOCX, TXT, etc.), show a file preview card
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {getText('pdf.documentFile', 'Document File')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadFile}
              title={getText('pdf.downloadFile', 'Download file')}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {fileName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? getText('pdf.wordDocument', 'Word Document') :
               fileType === 'text/plain' ? getText('pdf.textDocument', 'Text Document') :
               fileType === 'text/markdown' ? getText('pdf.markdownDocument', 'Markdown Document') :
               getText('pdf.document', 'Document')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              {getText('pdf.contentExtracted', 'Content has been extracted and is available in the tabs above.')}
            </p>
            <Button onClick={downloadFile} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {getText('pdf.downloadOriginalFile', 'Download Original File')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}