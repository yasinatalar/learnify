export interface CSVExportOptions {
  includeHeaders?: boolean
  delimiter?: string
  encoding?: string
  dateFormat?: string
}

export interface ExportableData {
  documents?: Array<{
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
  }>
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
    questionCount: number
    attempts: number
    createdAt: string
  }>
  quizAttempts?: Array<{
    id: string
    quizId: string
    quizTitle: string
    score: number
    totalPoints: number
    accuracy: number
    totalTime: number
    completedAt: string
  }>
  summaries?: Array<{
    id: string
    title: string
    overview: string
    mainConcepts: string
    keyPoints: string | string[]
    examples: string
    takeaways: string
    prerequisites: string
    methodology: string
    applications: string
    limitations: string
    futureDirections: string
    criticalAnalysis: string
    furtherReading: string
    difficulty: string
    estimatedReadTime: number
    wordCount: number
    tags: string | string[]
    aiProvider: string
    model: string
    tokensUsed: number
    generationTime: number
    createdAt: string
    updatedAt: string
  }>
  analytics?: Array<{
    date: string
    flashcardsReviewed: number
    quizzesCompleted: number
    studyTime: number
    averageScore: number
  }>
}

class CSVExporter {
  /**
   * Export data to CSV format
   */
  exportToCSV(data: ExportableData, options: CSVExportOptions = {}): { [key: string]: string } {
    const {
      includeHeaders = true,
      delimiter = ',',
      dateFormat = 'iso'
    } = options

    const results: { [key: string]: string } = {}

    // Export documents
    if (data.documents && data.documents.length > 0) {
      results['documents.csv'] = this.generateDocumentsCSV(data.documents, { includeHeaders, delimiter, dateFormat })
    }

    // Export flashcards
    if (data.flashcards && data.flashcards.length > 0) {
      results['flashcards.csv'] = this.generateFlashcardsCSV(data.flashcards, { includeHeaders, delimiter, dateFormat })
    }

    // Export quizzes
    if (data.quizzes && data.quizzes.length > 0) {
      results['quizzes.csv'] = this.generateQuizzesCSV(data.quizzes, { includeHeaders, delimiter, dateFormat })
    }

    // Export quiz attempts
    if (data.quizAttempts && data.quizAttempts.length > 0) {
      results['quiz_attempts.csv'] = this.generateQuizAttemptsCSV(data.quizAttempts, { includeHeaders, delimiter, dateFormat })
    }

    // Export summaries
    if (data.summaries && data.summaries.length > 0) {
      results['summaries.csv'] = this.generateSummariesCSV(data.summaries, { includeHeaders, delimiter, dateFormat })
    }

    // Export analytics
    if (data.analytics && data.analytics.length > 0) {
      results['analytics.csv'] = this.generateAnalyticsCSV(data.analytics, { includeHeaders, delimiter, dateFormat })
    }

    return results
  }

  /**
   * Generate ZIP file with multiple CSV files
   */
  async generateCSVPackage(data: ExportableData, options: CSVExportOptions = {}): Promise<Blob> {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    
    const csvFiles = this.exportToCSV(data, options)
    
    // Add each CSV file to the zip
    Object.entries(csvFiles).forEach(([filename, content]) => {
      zip.file(filename, content)
    })

    // Add README with field descriptions
    const readme = this.generateCSVReadme()
    zip.file('README.md', readme)

    // Generate the zip file
    return await zip.generateAsync({ type: 'blob' })
  }

  private generateDocumentsCSV(documents: ExportableData['documents'], options: { includeHeaders: boolean, delimiter: string, dateFormat: string }): string {
    const headers = [
      'ID',
      'Title',
      'Original Name',
      'File Type',
      'File Size (bytes)',
      'Status',
      'Word Count',
      'Page Count',
      'Created At',
      'Updated At'
    ]

    const rows: string[] = []
    
    if (options.includeHeaders) {
      rows.push(headers.join(options.delimiter))
    }

    documents!.forEach(doc => {
      const row = [
        this.escapeCSV(doc.id),
        this.escapeCSV(doc.title),
        this.escapeCSV(doc.originalName),
        this.escapeCSV(doc.fileType),
        doc.fileSize.toString(),
        this.escapeCSV(doc.status),
        (doc.wordCount || 0).toString(),
        (doc.pageCount || 0).toString(),
        this.formatDate(doc.createdAt, options.dateFormat),
        this.formatDate(doc.updatedAt, options.dateFormat)
      ]
      rows.push(row.join(options.delimiter))
    })

    return rows.join('\n')
  }

  private generateFlashcardsCSV(flashcards: ExportableData['flashcards'], options: { includeHeaders: boolean, delimiter: string, dateFormat: string }): string {
    const headers = [
      'ID',
      'Question',
      'Answer',
      'Explanation',
      'Difficulty',
      'Tags',
      'Interval (days)',
      'Repetition Count',
      'E-Factor',
      'Next Review',
      'Created At'
    ]

    const rows: string[] = []
    
    if (options.includeHeaders) {
      rows.push(headers.join(options.delimiter))
    }

    flashcards!.forEach(card => {
      const row = [
        this.escapeCSV(card.id),
        this.escapeCSV(card.question),
        this.escapeCSV(card.answer),
        this.escapeCSV(card.explanation || ''),
        this.escapeCSV(card.difficulty),
        this.escapeCSV(card.tags),
        card.interval.toString(),
        card.repetition.toString(),
        card.efactor.toString(),
        this.formatDate(card.nextReview, options.dateFormat),
        this.formatDate(card.createdAt, options.dateFormat)
      ]
      rows.push(row.join(options.delimiter))
    })

    return rows.join('\n')
  }

  private generateQuizzesCSV(quizzes: ExportableData['quizzes'], options: { includeHeaders: boolean, delimiter: string, dateFormat: string }): string {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Difficulty',
      'Question Count',
      'Total Attempts',
      'Created At'
    ]

    const rows: string[] = []
    
    if (options.includeHeaders) {
      rows.push(headers.join(options.delimiter))
    }

    quizzes!.forEach(quiz => {
      const row = [
        this.escapeCSV(quiz.id),
        this.escapeCSV(quiz.title),
        this.escapeCSV(quiz.description || ''),
        this.escapeCSV(quiz.difficulty),
        quiz.questionCount.toString(),
        quiz.attempts.toString(),
        this.formatDate(quiz.createdAt, options.dateFormat)
      ]
      rows.push(row.join(options.delimiter))
    })

    return rows.join('\n')
  }

  private generateQuizAttemptsCSV(attempts: ExportableData['quizAttempts'], options: { includeHeaders: boolean, delimiter: string, dateFormat: string }): string {
    const headers = [
      'ID',
      'Quiz ID',
      'Quiz Title',
      'Score',
      'Total Points',
      'Accuracy (%)',
      'Total Time (seconds)',
      'Completed At'
    ]

    const rows: string[] = []
    
    if (options.includeHeaders) {
      rows.push(headers.join(options.delimiter))
    }

    attempts!.forEach(attempt => {
      const row = [
        this.escapeCSV(attempt.id),
        this.escapeCSV(attempt.quizId),
        this.escapeCSV(attempt.quizTitle),
        attempt.score.toString(),
        attempt.totalPoints.toString(),
        attempt.accuracy.toFixed(2),
        attempt.totalTime.toString(),
        this.formatDate(attempt.completedAt, options.dateFormat)
      ]
      rows.push(row.join(options.delimiter))
    })

    return rows.join('\n')
  }

  private generateSummariesCSV(summaries: ExportableData['summaries'], options: { includeHeaders: boolean, delimiter: string, dateFormat: string }): string {
    const headers = [
      'ID',
      'Title',
      'Overview',
      'Main Concepts',
      'Key Points',
      'Examples',
      'Takeaways',
      'Prerequisites',
      'Methodology',
      'Applications',
      'Limitations',
      'Future Directions',
      'Critical Analysis',
      'Further Reading',
      'Difficulty',
      'Estimated Read Time (minutes)',
      'Word Count',
      'Tags',
      'AI Provider',
      'AI Model',
      'Tokens Used',
      'Generation Time (seconds)',
      'Created At',
      'Updated At'
    ]

    const rows: string[] = []
    
    if (options.includeHeaders) {
      rows.push(headers.join(options.delimiter))
    }

    summaries!.forEach(summary => {
      // Handle keyPoints - could be string or array
      let keyPointsStr = ''
      try {
        if (typeof summary.keyPoints === 'string') {
          const keyPointsArray = JSON.parse(summary.keyPoints)
          keyPointsStr = keyPointsArray.join('; ')
        } else if (Array.isArray(summary.keyPoints)) {
          keyPointsStr = summary.keyPoints.join('; ')
        }
      } catch (e) {
        keyPointsStr = summary.keyPoints || ''
      }

      // Handle tags - could be string or array
      let tagsStr = ''
      try {
        if (typeof summary.tags === 'string') {
          tagsStr = summary.tags
        } else if (Array.isArray(summary.tags)) {
          tagsStr = summary.tags.join(', ')
        }
      } catch (e) {
        tagsStr = summary.tags || ''
      }

      const row = [
        this.escapeCSV(summary.id),
        this.escapeCSV(summary.title),
        this.escapeCSV(summary.overview || ''),
        this.escapeCSV(summary.mainConcepts || ''),
        this.escapeCSV(keyPointsStr),
        this.escapeCSV(summary.examples || ''),
        this.escapeCSV(summary.takeaways || ''),
        this.escapeCSV(summary.prerequisites || ''),
        this.escapeCSV(summary.methodology || ''),
        this.escapeCSV(summary.applications || ''),
        this.escapeCSV(summary.limitations || ''),
        this.escapeCSV(summary.futureDirections || ''),
        this.escapeCSV(summary.criticalAnalysis || ''),
        this.escapeCSV(summary.furtherReading || ''),
        this.escapeCSV(summary.difficulty),
        summary.estimatedReadTime.toString(),
        summary.wordCount.toString(),
        this.escapeCSV(tagsStr),
        this.escapeCSV(summary.aiProvider),
        this.escapeCSV(summary.model),
        summary.tokensUsed.toString(),
        summary.generationTime.toString(),
        this.formatDate(summary.createdAt, options.dateFormat),
        this.formatDate(summary.updatedAt, options.dateFormat)
      ]
      rows.push(row.join(options.delimiter))
    })

    return rows.join('\n')
  }

  private generateAnalyticsCSV(analytics: ExportableData['analytics'], options: { includeHeaders: boolean, delimiter: string, dateFormat: string }): string {
    const headers = [
      'Date',
      'Flashcards Reviewed',
      'Quizzes Completed',
      'Study Time (minutes)',
      'Average Score (%)'
    ]

    const rows: string[] = []
    
    if (options.includeHeaders) {
      rows.push(headers.join(options.delimiter))
    }

    analytics!.forEach(entry => {
      const row = [
        this.formatDate(entry.date, options.dateFormat),
        entry.flashcardsReviewed.toString(),
        entry.quizzesCompleted.toString(),
        entry.studyTime.toString(),
        entry.averageScore.toFixed(2)
      ]
      rows.push(row.join(options.delimiter))
    })

    return rows.join('\n')
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Format date according to specified format
   */
  private formatDate(dateString: string, format: string): string {
    const date = new Date(dateString)
    
    switch (format) {
      case 'iso':
        return date.toISOString()
      case 'local':
        return date.toLocaleString()
      case 'date-only':
        return date.toLocaleDateString()
      case 'timestamp':
        return date.getTime().toString()
      default:
        return date.toISOString()
    }
  }

  /**
   * Generate README file explaining the CSV structure
   */
  private generateCSVReadme(): string {
    return `# CSV Export from LearnifyAI

This package contains your learning data exported in CSV format for analysis and backup purposes.

## Files Included

### documents.csv
Contains information about all your uploaded documents:
- ID: Unique identifier
- Title: Document title
- Original Name: Original filename
- File Type: MIME type of the file
- File Size: Size in bytes
- Status: Processing status (UPLOADED, PROCESSING, COMPLETED, FAILED)
- Word Count: Number of words in the document
- Page Count: Number of pages
- Created At / Updated At: Timestamps

### flashcards.csv
Contains all your flashcards with spaced repetition data:
- ID: Unique identifier
- Question: The question text
- Answer: The answer text
- Explanation: Additional explanation (if any)
- Difficulty: EASY, MEDIUM, or HARD
- Tags: Comma-separated tags
- Interval: Days until next review (SM-2 algorithm)
- Repetition Count: Number of times reviewed
- E-Factor: Ease factor for spaced repetition
- Next Review: When the card is due for review
- Created At: When the card was created

### quizzes.csv
Contains information about your quizzes:
- ID: Unique identifier
- Title: Quiz title
- Description: Quiz description
- Difficulty: Overall difficulty level
- Question Count: Number of questions in the quiz
- Total Attempts: How many times the quiz has been taken
- Created At: When the quiz was created

### quiz_attempts.csv
Contains your quiz performance history:
- ID: Unique identifier for the attempt
- Quiz ID: Reference to the quiz
- Quiz Title: Title of the quiz taken
- Score: Points earned
- Total Points: Maximum possible points
- Accuracy: Percentage of correct answers
- Total Time: Time spent in seconds
- Completed At: When the attempt was finished

### summaries.csv
Contains comprehensive information about your AI-generated summaries:
- ID: Unique identifier
- Title: Summary title
- Overview: Brief overview of the summary
- Main Concepts: Detailed explanation of core concepts
- Key Points: Structured key points from the summary
- Examples: Practical examples and case studies
- Takeaways: Actionable insights and conclusions
- Prerequisites: Background knowledge needed
- Methodology: Methods, processes, and approaches used
- Applications: Real-world applications and use cases
- Limitations: Constraints, challenges, and boundaries
- Future Directions: Future implications and developments
- Critical Analysis: Thoughtful evaluation and analysis
- Further Reading: Additional resources and references
- Difficulty: Summary difficulty level (EASY, MEDIUM, HARD)
- Estimated Read Time: Reading time in minutes
- Word Count: Total word count of the summary
- Tags: Comma-separated tags
- AI Provider: AI service used (openai, anthropic)
- AI Model: Specific model used
- Tokens Used: Number of tokens consumed
- Generation Time: Time taken to generate in seconds
- Created At / Updated At: Timestamps

### analytics.csv
Contains daily learning analytics:
- Date: The date of the activity
- Flashcards Reviewed: Number of flashcards reviewed
- Quizzes Completed: Number of quizzes completed
- Study Time: Total study time in minutes
- Average Score: Average quiz score for the day

## Data Analysis Tips

1. **Progress Tracking**: Use the analytics.csv to track your learning progress over time
2. **Flashcard Performance**: Analyze E-Factor and repetition counts to identify difficult concepts
3. **Quiz Analysis**: Compare quiz attempts to see improvement in accuracy and speed
4. **Study Patterns**: Use timestamps to identify your most productive study times

## Importing into Excel/Google Sheets

1. Open your spreadsheet application
2. Import/Open the CSV files
3. Choose appropriate delimiters (comma)
4. Set date columns to date format
5. Set numeric columns to number format

## Data Privacy

This export contains your personal learning data. Please store it securely and follow appropriate data protection practices.

Exported on: ${new Date().toLocaleString()}
Generated by: LearnifyAI
`
  }
}

export const csvExporter = new CSVExporter()