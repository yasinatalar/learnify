"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/lib/i18n/context"

interface PDFDocumentProps {
  file: string
  onLoadSuccess: (data: { numPages: number }) => void
  onLoadError: (error: Error) => void
  children: React.ReactNode
}

export function PDFDocument({ file, onLoadSuccess, onLoadError, children }: PDFDocumentProps) {
  const [Document, setDocument] = useState<any>(null)
  const t = useTranslations()

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
    const loadPdfJs = async () => {
      if (typeof window !== 'undefined') {
        try {
          const { Document: PdfDocument, pdfjs } = await import('react-pdf')
          
          // Set up worker
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js'
          
          // Load CSS
          await import('react-pdf/dist/Page/AnnotationLayer.css')
          await import('react-pdf/dist/Page/TextLayer.css')
          
          setDocument(() => PdfDocument)
        } catch (error) {
          console.error('Failed to load PDF.js:', error)
          onLoadError(new Error(getText('pdf.failedToLoad', 'Failed to load PDF')))
        }
      }
    }

    loadPdfJs()
  }, [getText, onLoadError])

  if (!Document) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      loading={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      }
      error={
        <div className="flex items-center justify-center py-12 text-red-600">
          {getText('pdf.failedToLoad', 'Failed to load PDF')}
        </div>
      }
    >
      {children}
    </Document>
  )
}