"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "@/lib/i18n/context"

interface PDFPageProps {
  pageNumber: number
  scale: number
}

export function PDFPage({ pageNumber, scale }: PDFPageProps) {
  const [Page, setPage] = useState<any>(null)
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
          const { Page: PdfPage } = await import('react-pdf')
          setPage(() => PdfPage)
        } catch (error) {
          console.error('Failed to load PDF.js Page:', error)
        }
      }
    }

    loadPdfJs()
  }, [])

  if (!Page) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Page
      pageNumber={pageNumber}
      scale={scale}
      loading={
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      }
      error={
        <div className="flex items-center justify-center py-8 text-red-600">
          {getText('pdf.failedToLoadPage', 'Failed to load page')}
        </div>
      }
    />
  )
}