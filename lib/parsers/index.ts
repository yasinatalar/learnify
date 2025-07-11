import { ParsedDocument, DocumentMetadata, FileProcessingError } from "@/types"

export interface DocumentParser {
  parse(file: File): Promise<ParsedDocument>
  supports(fileType: string): boolean
}

export class DocumentParserFactory {
  private static _parsers: DocumentParser[] | null = null

  private static get parsers(): DocumentParser[] {
    if (!this._parsers) {
      this._parsers = [
        new PDFParser(),
        new DOCXParser(),
        new TextParser(),
        new MarkdownParser(),
      ]
    }
    return this._parsers
  }

  static create(fileType: string): DocumentParser {
    const parser = this.parsers.find(p => p.supports(fileType))
    if (!parser) {
      throw new FileProcessingError(`Unsupported file type: ${fileType}`, fileType)
    }
    return parser
  }

  static async parseFile(file: File): Promise<ParsedDocument> {
    const parser = this.create(file.type)
    return await parser.parse(file)
  }
}

// PDF Parser using pdf-parse
class PDFParser implements DocumentParser {
  supports(fileType: string): boolean {
    return fileType === "application/pdf"
  }

  async parse(file: File): Promise<ParsedDocument> {
    try {
      const PDFParser = require('pdf2json')
      
      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Create a promise-based wrapper for pdf2json
      const parsePDF = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1)
          
          pdfParser.on('pdfParser_dataError', (errData: any) => {
            reject(new Error(errData.parserError))
          })
          
          pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            resolve(pdfData)
          })
          
          // Parse the buffer
          pdfParser.parseBuffer(buffer)
        })
      }
      
      const pdfData = await parsePDF()
      
      // Extract text from pdf2json format and convert to Markdown
      let markdownContent = ''
      let pageCount = 0
      
      if (pdfData.Pages && pdfData.Pages.length > 0) {
        pageCount = pdfData.Pages.length
        
        for (let pageIndex = 0; pageIndex < pdfData.Pages.length; pageIndex++) {
          const page = pdfData.Pages[pageIndex]
          
          if (page.Texts && page.Texts.length > 0) {
            // Group texts by their Y position to preserve line structure
            const textsByLine: Map<number, Array<{
              x: number, 
              text: string, 
              fontSize?: number,
              fontFace?: string,
              color?: string
            }>> = new Map()
            
            for (const textElement of page.Texts) {
              const y = Math.round(textElement.y * 100) // Round Y position for grouping
              
              if (textElement.R && textElement.R.length > 0) {
                for (const run of textElement.R) {
                  if (run.T) {
                    const decodedText = decodeURIComponent(run.T)
                    if (decodedText.trim()) {
                      if (!textsByLine.has(y)) {
                        textsByLine.set(y, [])
                      }
                      textsByLine.get(y)!.push({
                        x: textElement.x || 0,
                        text: decodedText,
                        fontSize: run.TS?.[1] || 12,
                        fontFace: run.TS?.[0] || 'normal',
                        color: run.clr || 0
                      })
                    }
                  }
                }
              }
            }
            
            // Sort lines by Y position (top to bottom)
            const sortedLines = Array.from(textsByLine.entries()).sort((a, b) => a[0] - b[0])
            
            // Calculate average font size for the page to detect headings
            const allTexts = Array.from(textsByLine.values()).flat()
            const avgPageFontSize = allTexts.reduce((sum, t) => sum + (t.fontSize || 12), 0) / allTexts.length
            
            let lastY = -1
            let inList = false
            
            for (const [y, textsInLine] of sortedLines) {
              // Sort texts in line by X position (left to right)
              textsInLine.sort((a, b) => a.x - b.x)
              
              // Calculate line properties
              const yGap = lastY === -1 ? 0 : y - lastY
              const avgLineFontSize = textsInLine.reduce((sum, t) => sum + (t.fontSize || 12), 0) / textsInLine.length
              
              // Combine texts in the line
              let lineText = textsInLine.map(t => t.text).join(' ')
              lineText = lineText.replace(/\s+/g, ' ').trim()
              
              if (lineText) {
                // Detect heading levels based on font size
                const fontSizeRatio = avgLineFontSize / avgPageFontSize
                let headingLevel = 0
                
                if (fontSizeRatio > 1.5 && lineText.length < 80) {
                  headingLevel = 1 // # Main heading
                } else if (fontSizeRatio > 1.3 && lineText.length < 100) {
                  headingLevel = 2 // ## Sub heading
                } else if (fontSizeRatio > 1.1 && lineText.length < 120) {
                  headingLevel = 3 // ### Sub-sub heading
                }
                
                // Detect lists (lines starting with bullet points, numbers, etc.)
                const isListItem = /^[\s]*[\u2022\u2023\u25E6\u2043\u2219\-\*]\s/.test(lineText) || 
                                  /^[\s]*\d+[\.\)]\s/.test(lineText) ||
                                  /^[\s]*[a-zA-Z][\.\)]\s/.test(lineText)
                
                // Add appropriate spacing
                if (yGap > avgLineFontSize * 1.5) {
                  markdownContent += '\n\n'
                  inList = false
                }
                
                // Format the line based on detected type
                if (headingLevel > 0) {
                  markdownContent += '\n\n' + '#'.repeat(headingLevel) + ' ' + lineText + '\n\n'
                  inList = false
                } else if (isListItem) {
                  if (!inList) {
                    markdownContent += '\n'
                  }
                  // Clean up the bullet and format as markdown list
                  const cleanedListItem = lineText
                    .replace(/^[\s]*[\u2022\u2023\u25E6\u2043\u2219\-\*]\s/, '')
                    .replace(/^[\s]*\d+[\.\)]\s/, '')
                    .replace(/^[\s]*[a-zA-Z][\.\)]\s/, '')
                  markdownContent += '- ' + cleanedListItem + '\n'
                  inList = true
                } else {
                  // Regular paragraph
                  if (inList) {
                    markdownContent += '\n'
                    inList = false
                  }
                  
                  // Check if this continues the previous line (same paragraph)
                  if (yGap < avgLineFontSize * 0.8 && !markdownContent.endsWith('\n\n')) {
                    markdownContent += ' ' + lineText
                  } else {
                    markdownContent += lineText + '\n'
                  }
                }
              }
              
              lastY = y
            }
            
            // Add page break between pages
            if (pageIndex < pdfData.Pages.length - 1) {
              markdownContent += '\n\n---\n\n**Page ' + (pageIndex + 2) + '**\n\n'
            }
          }
        }
      }
      
      // Clean up the markdown content
      let content = markdownContent
        .replace(/\n{4,}/g, '\n\n\n')  // Max 3 consecutive newlines
        .replace(/\n\s+\n/g, '\n\n')  // Remove lines with only spaces
        .replace(/(\n#{1,6}\s.+?\n)\n+/g, '$1\n')  // Clean spacing around headings
        .trim()
      
      // If no text was extracted, provide a helpful message
      if (!content || content.length < 10) {
        content = `PDF document "${file.name}" was processed but no readable text could be extracted. This may be due to:
- The PDF contains only images or scanned content
- The PDF has security restrictions
- The text is embedded in a format that cannot be parsed

File information:
- Pages: ${pageCount}
- Size: ${this.formatFileSize(file.size)}

To extract text from image-based PDFs, consider using OCR services.`
      }

      return {
        title: this.extractTitle(file.name),
        content,
        metadata: {
          ...this.createMetadata(file),
          pdfInfo: {
            pages: pageCount,
            formImage: pdfData.Meta?.PDFFormatVersion || 'unknown',
            metadata: pdfData.Meta || {},
          }
        },
        wordCount: this.countWords(content),
        pageCount: pageCount,
        language: this.detectLanguage(content),
      }
    } catch (error) {
      console.error('PDF parsing error:', error)
      throw new FileProcessingError(`Failed to parse PDF: ${(error as Error).message}`, "pdf")
    }
  }

  private extractTitle(fileName: string): string {
    return fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ")
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  private createMetadata(file: File): DocumentMetadata {
    return {
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  private detectLanguage(content: string): string {
    // Simple language detection based on common words
    // In production, you'd use a proper language detection library
    const text = content.toLowerCase().substring(0, 1000) // First 1000 chars
    
    // Common English words
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with']
    const englishCount = englishWords.reduce((count, word) => {
      return count + (text.split(word).length - 1)
    }, 0)
    
    if (englishCount > 5) {
      return 'en'
    }
    
    // Default to English
    return 'en'
  }
}

// DOCX Parser using Mammoth.js
class DOCXParser implements DocumentParser {
  supports(fileType: string): boolean {
    return fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }

  async parse(file: File): Promise<ParsedDocument> {
    try {
      // Dynamic import for mammoth
      const mammoth = await import('mammoth')
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Extract text using mammoth
      const result = await mammoth.extractRawText({ 
        arrayBuffer: arrayBuffer,
      })

      let content = result.value.trim()
      
      if (!content || content.length < 10) {
        throw new Error("No readable text found in DOCX document")
      }

      // Clean up content - remove excessive whitespace but preserve structure
      content = content
        .replace(/\r\n/g, '\n')  // Normalize line endings
        .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
        .replace(/[ \t]+/g, ' ')  // Normalize spaces
        .trim()

      return {
        title: this.extractTitle(file.name),
        content,
        metadata: this.createMetadata(file),
        wordCount: this.countWords(content),
        language: this.detectLanguage(content),
      }
    } catch (error) {
      console.error('DOCX parsing error:', error)
      throw new FileProcessingError(`Failed to parse DOCX: ${(error as Error).message}`, "docx")
    }
  }

  private extractTitle(fileName: string): string {
    return fileName.replace(/\.docx$/i, "").replace(/[-_]/g, " ")
  }

  private createMetadata(file: File): DocumentMetadata {
    return {
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  private detectLanguage(content: string): string {
    // Simple language detection based on common words
    const text = content.toLowerCase().substring(0, 1000) // First 1000 chars
    
    // Common English words
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with']
    const englishCount = englishWords.reduce((count, word) => {
      return count + (text.split(word).length - 1)
    }, 0)
    
    if (englishCount > 5) {
      return 'en'
    }
    
    return 'en'
  }
}

// Text Parser
class TextParser implements DocumentParser {
  supports(fileType: string): boolean {
    return fileType === "text/plain"
  }

  async parse(file: File): Promise<ParsedDocument> {
    try {
      const content = await file.text()
      
      return {
        title: this.extractTitle(content, file.name),
        content,
        metadata: this.createMetadata(file),
        wordCount: this.countWords(content),
        language: this.detectLanguage(content),
      }
    } catch (error) {
      throw new FileProcessingError(`Failed to parse text file: ${(error as Error).message}`, "txt")
    }
  }

  private extractTitle(content: string, fileName: string): string {
    // Try to find the first line as title
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length > 0 && lines[0].length < 100) {
      return lines[0].trim()
    }
    return fileName.replace(/\.txt$/i, "").replace(/[-_]/g, " ")
  }

  private createMetadata(file: File): DocumentMetadata {
    return {
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  private detectLanguage(content: string): string {
    // Simple language detection (would use a proper library in production)
    return "en"
  }
}

// Markdown Parser
class MarkdownParser implements DocumentParser {
  supports(fileType: string): boolean {
    return fileType === "text/markdown"
  }

  async parse(file: File): Promise<ParsedDocument> {
    try {
      const content = await file.text()
      
      return {
        title: this.extractTitle(content, file.name),
        content,
        metadata: this.createMetadata(file),
        wordCount: this.countWords(content),
        language: "en",
      }
    } catch (error) {
      throw new FileProcessingError(`Failed to parse markdown file: ${(error as Error).message}`, "md")
    }
  }

  private extractTitle(content: string, fileName: string): string {
    // Look for the first # heading
    const headingMatch = content.match(/^#\s+(.+)$/m)
    if (headingMatch) {
      return headingMatch[1].trim()
    }
    
    return fileName.replace(/\.md$/i, "").replace(/[-_]/g, " ")
  }

  private createMetadata(file: File): DocumentMetadata {
    return {
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
    }
  }

  private countWords(text: string): number {
    // Remove markdown syntax for accurate word count
    const cleanText = text
      .replace(/#{1,6}\s+/g, "") // Remove headings
      .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.+?)\*/g, "$1") // Remove italic
      .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links
      .replace(/`(.+?)`/g, "$1") // Remove inline code
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    
    return cleanText.trim().split(/\s+/).filter(word => word.length > 0).length
  }
}