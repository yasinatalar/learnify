"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Download, 
  FileText, 
  Database, 
  FileSpreadsheet,
  Image,
  Package,
  Brain,
  Target,
  Settings,
  CheckCircle,
  BookOpen
} from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface ExportFormat {
  id: string
  name: string
  description: string
  icon: React.ElementType
  fileType: string
  features: string[]
  available: boolean
}

interface ExportItem {
  id: string
  type: "document" | "flashcards" | "quizzes" | "summaries" | "analytics"
  title: string
  count?: number
  lastUpdated: string
  selected: boolean
}

export default function ExportPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const searchParams = useSearchParams()
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf")
  const [exportItems, setExportItems] = useState<ExportItem[]>([])
  const [exporting, setExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string
    format: string
    items: string[]
    createdAt: string
    status: "completed" | "failed"
    downloadUrl?: string
  }>>([])

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

  const exportFormats: ExportFormat[] = [
    {
      id: "pdf",
      name: getText('export.formats.pdf', 'PDF Document'),
      description: getText('export.formats.pdfDesc', 'Export as a formatted PDF document with content and study materials'),
      icon: FileText,
      fileType: ".pdf",
      features: [
        getText('export.features.formattedLayout', 'Formatted layout'),
        getText('export.features.imagesAndTables', 'Images and tables'),
        getText('export.features.studyMaterials', 'Study materials included'),
        getText('export.features.printReady', 'Print-ready')
      ],
      available: true
    },
    {
      id: "anki",
      name: getText('export.formats.anki', 'Anki Deck'),
      description: getText('export.formats.ankiDesc', 'Export flashcards as an Anki deck for spaced repetition learning'),
      icon: Package,
      fileType: ".apkg",
      features: [
        getText('export.features.spacedRepetition', 'Spaced repetition ready'),
        getText('export.features.importToAnki', 'Import to Anki'),
        getText('export.features.cardStatistics', 'Card statistics'),
        getText('export.features.tagsPreserved', 'Tags preserved')
      ],
      available: true
    },
    {
      id: "csv",
      name: getText('export.formats.csv', 'CSV Spreadsheet'),
      description: getText('export.formats.csvDesc', 'Export data in CSV format for analysis and backup'),
      icon: FileSpreadsheet,
      fileType: ".csv",
      features: [
        getText('export.features.dataAnalysis', 'Data analysis'),
        getText('export.features.backupPurposes', 'Backup purposes'),
        getText('export.features.importToExcel', 'Import to Excel'),
        getText('export.features.customFormatting', 'Custom formatting')
      ],
      available: true
    },
    {
      id: "json",
      name: getText('export.formats.json', 'JSON Data'),
      description: getText('export.formats.jsonDesc', 'Export raw data in JSON format for developers'),
      icon: Database,
      fileType: ".json",
      features: [
        getText('export.features.rawData', 'Raw data'),
        getText('export.features.developerFriendly', 'Developer friendly'),
        getText('export.features.completeMetadata', 'Complete metadata'),
        getText('export.features.apiCompatible', 'API compatible')
      ],
      available: true
    },
    {
      id: "images",
      name: getText('export.formats.images', 'Image Cards'),
      description: getText('export.formats.imagesDesc', 'Export flashcards as individual image files'),
      icon: Image,
      fileType: ".zip",
      features: [
        getText('export.features.visualCards', 'Visual cards'),
        getText('export.features.socialSharing', 'Social sharing'),
        getText('export.features.printReady', 'Print ready'),
        getText('export.features.customStyling', 'Custom styling')
      ],
      available: false // Coming soon
    }
  ]

  useEffect(() => {
    fetchAvailableItems()
  }, [])

  const fetchAvailableItems = async () => {
    try {
      const response = await fetch('/api/export/items', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          const documentId = searchParams.get('document')
          const items: ExportItem[] = data.items.map((item: any) => ({
            id: item.id,
            type: item.type,
            title: item.title,
            count: item.itemCount,
            lastUpdated: new Date().toISOString(),
            selected: documentId ? (item.type === 'document' && item.id === documentId) : false
          }))
          setExportItems(items)
        } else {
          toast.error(getText('export.exportError', 'Failed to load export items'))
        }
      } else {
        toast.error(getText('export.exportError', 'Failed to load export items'))
      }
    } catch (error) {
      console.error('Failed to fetch available items:', error)
      toast.error(getText('export.exportError', 'Error loading export items'))
      setExportItems([])
    }
  }

  const selectedFormatObj = exportFormats.find(f => f.id === selectedFormat)
  const selectedItems = exportItems.filter(item => item.selected)

  const handleItemToggle = (itemId: string) => {
    setExportItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ))
  }

  const handleSelectAll = (type?: string) => {
    setExportItems(prev => prev.map(item => ({
      ...item,
      selected: type ? item.type === type : true
    })))
  }

  const handleDeselectAll = () => {
    setExportItems(prev => prev.map(item => ({ ...item, selected: false })))
  }

  const handleExport = async () => {
    if (selectedItems.length === 0) {
      toast.error(getText('export.noItemsSelected', 'Please select at least one item to export'))
      return
    }

    if (!selectedFormatObj) {
      toast.error(getText('export.selectFormatError', 'Please select an export format'))
      return
    }

    setExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: selectedFormat,
          items: selectedItems.map(item => ({
            id: item.id,
            type: item.type,
            title: item.title
          })),
          options: {
            includeContent: true,
            includeMetadata: true,
            dateFormat: 'iso',
            sectioned: false
          },
          locale: locale
        })
      })

      const result = await response.json()

      if (result.success) {
        // Convert base64 data to blob
        const binaryString = atob(result.data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: result.mimeType })

        // Create download link
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        const newExport = {
          id: `exp_${Date.now()}`,
          format: selectedFormat,
          items: selectedItems.map(item => item.title),
          createdAt: new Date().toISOString(),
          status: "completed" as const,
          downloadUrl: url
        }

        setExportHistory(prev => [newExport, ...prev])
        toast.success(result.message || getText('export.exportSuccess', `Successfully exported ${selectedItems.length} items as ${selectedFormatObj.name}`))
      } else {
        toast.error(result.error || getText('export.exportError', 'Export failed'))
      }
    } catch (error) {
      toast.error(getText('export.exportError', 'Export failed. Please try again.'))
    } finally {
      setExporting(false)
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "document": return FileText
      case "flashcards": return Brain
      case "quizzes": return Target
      case "summaries": return BookOpen
      case "analytics": return Settings
      default: return FileText
    }
  }

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "document": return getText('nav.documents', 'Documents')
      case "flashcards": return getText('nav.flashcards', 'Flashcards')
      case "quizzes": return getText('nav.quizzes', 'Quizzes')
      case "summaries": return getText('nav.summaries', 'Summaries')
      case "analytics": return getText('nav.analytics', 'Analytics')
      default: return getText('export.item', 'Item')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('export.title', 'Export')}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          {getText('export.subtitle', 'Export your learning materials and data in various formats')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{getText('export.exportFormat', 'Export Format')}</CardTitle>
              <CardDescription>
                {getText('export.exportFormatDesc', 'Choose the format for your exported data')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportFormats.map((format) => {
                  const Icon = format.icon
                  return (
                    <div
                      key={format.id}
                      className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                        selectedFormat === format.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                      } ${!format.available ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => format.available && setSelectedFormat(format.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <h3 className="font-medium">{format.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {format.features.slice(0, 2).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {format.features.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{format.features.length - 2} {getText('export.more', 'more')}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!format.available && (
                        <Badge className="absolute top-2 right-2">
                          {getText('export.comingSoon', 'Coming Soon')}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{getText('export.selectItems', 'Select Items to Export')}</CardTitle>
              <CardDescription>
                {getText('export.selectItemsDesc', 'Choose which items you want to include in your export')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selection Controls */}
              <div className="flex items-center gap-2 text-sm">
                <Button variant="outline" size="sm" onClick={() => handleSelectAll()}>
                  {getText('common.selectAll', 'Select All')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  {getText('export.deselectAll', 'Deselect All')}
                </Button>
                <div className="text-gray-600">
                  {selectedItems.length} {getText('export.itemsSelected', 'items selected')}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {exportItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      {getText('export.noItems', 'No items available for export')}
                    </p>
                  </div>
                ) : (
                  exportItems.map((item) => {
                    const Icon = getItemIcon(item.type)
                    return (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <Checkbox
                          id={item.id}
                          checked={item.selected}
                          onCheckedChange={() => handleItemToggle(item.id)}
                        />
                        <Icon className="h-4 w-4 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={item.id} className="font-medium cursor-pointer">
                            {item.title}
                          </Label>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="outline">{getItemTypeLabel(item.type)}</Badge>
                            {item.count && <span>{item.count} {getText('export.items', 'items')}</span>}
                            <span>{getText('export.updated', 'Updated')} {new Date(item.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Summary & History */}
        <div className="space-y-6">
          {/* Export Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{getText('export.summary', 'Export Summary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{getText('export.format', 'Format')}:</span>
                  <span className="font-medium">
                    {selectedFormatObj?.name || getText('export.noneSelected', 'None selected')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{getText('export.items', 'Items')}:</span>
                  <span className="font-medium">{selectedItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{getText('export.fileType', 'File type')}:</span>
                  <span className="font-medium">
                    {selectedFormatObj?.fileType || "N/A"}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleExport}
                disabled={exporting || selectedItems.length === 0 || !selectedFormatObj?.available}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? getText('export.exporting', 'Exporting...') : getText('export.exportSelectedItems', 'Export Selected Items')}
              </Button>

              {selectedFormatObj && selectedFormatObj.features.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">{getText('export.formatFeatures', 'Format Features')}</h4>
                  <ul className="space-y-1">
                    {selectedFormatObj.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export History */}
          <Card>
            <CardHeader>
              <CardTitle>{getText('export.recentExports', 'Recent Exports')}</CardTitle>
              <CardDescription>
                {getText('export.exportHistoryDesc', 'Your export history and downloads')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportHistory.length > 0 ? (
                <div className="space-y-3">
                  {exportHistory.map((exportRecord) => (
                    <div
                      key={exportRecord.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {exportRecord.format.toUpperCase()}
                          </Badge>
                          <Badge 
                            className={
                              exportRecord.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }
                          >
                            {exportRecord.status === "completed" ? getText('export.completed', 'completed') : getText('export.failed', 'failed')}
                          </Badge>
                        </div>
                        {exportRecord.status === "completed" && exportRecord.downloadUrl && (
                          <Button size="sm" variant="ghost" asChild>
                            <a href={exportRecord.downloadUrl} download>
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>{exportRecord.items.join(", ")}</div>
                        <div className="mt-1">
                          {new Date(exportRecord.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {getText('export.noExports', 'No exports yet')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}