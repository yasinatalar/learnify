export interface JSONExportData {
  exportInfo: {
    timestamp: string
    version: string
    source: string
    userId?: string
    exportType: 'full' | 'partial'
    itemCounts: {
      documents: number
      flashcards: number
      quizzes: number
      quizAttempts: number
      summaries: number
      analytics: number
    }
  }
  documents?: Array<{
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
    metadata?: any
    createdAt: string
    updatedAt: string
  }>
  flashcards?: Array<{
    id: string
    documentId: string
    question: string
    answer: string
    explanation?: string
    difficulty: string
    tags: string[]
    interval: number
    repetition: number
    efactor: number
    nextReview: string
    reviews?: Array<{
      id: string
      rating: number
      timeSpent?: number
      createdAt: string
    }>
    createdAt: string
    updatedAt: string
  }>
  quizzes?: Array<{
    id: string
    documentId?: string
    title: string
    description?: string
    difficulty: string
    timeLimit?: number
    attempts: number
    lastAttemptAt?: string
    metadata?: any
    questions: Array<{
      id: string
      question: string
      options: string[]
      correctAnswer: number
      explanation?: string
      difficulty: string
      questionType: string
      points: number
      order: number
      tags: string[]
    }>
    createdAt: string
    updatedAt: string
  }>
  quizAttempts?: Array<{
    id: string
    quizId: string
    score: number
    totalPoints: number
    accuracy: number
    totalTime?: number
    startedAt: string
    completedAt: string
    answers: Array<{
      questionId: string
      selectedAnswer: number | string
      isCorrect: boolean
      timeSpent: number
      pointsEarned: number
    }>
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
    documentId: string
    aiProvider: string
    model: string
    tokensUsed: number
    generationTime: number
    createdAt: string
    updatedAt: string
  }>
  analytics?: {
    summary: {
      totalDocuments: number
      totalFlashcards: number
      totalQuizzes: number
      totalStudyTime: number
      averageScore: number
      streakDays: number
      masteredFlashcards: number
      learningFlashcards: number
    }
    dailyStats: Array<{
      date: string
      flashcardsReviewed: number
      quizzesCompleted: number
      studyTime: number
      averageScore: number
    }>
    topicDistribution: Array<{
      topic: string
      count: number
      mastery: number
    }>
    performanceTrends: Array<{
      date: string
      accuracy: number
      speed: number
    }>
  }
  userSettings?: {
    profile: any
    notifications: any
    learning: any
    privacy: any
    appearance: any
  }
}

class JSONExporter {
  /**
   * Export data to JSON format with full structure and metadata
   */
  exportToJSON(data: Partial<JSONExportData>): string {
    const exportData: JSONExportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'LearnifyAI',
        exportType: 'full',
        itemCounts: {
          documents: data.documents?.length || 0,
          flashcards: data.flashcards?.length || 0,
          quizzes: data.quizzes?.length || 0,
          quizAttempts: data.quizAttempts?.length || 0,
          summaries: data.summaries?.length || 0,
          analytics: data.analytics?.dailyStats?.length || 0
        }
      },
      ...data
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Export individual sections to separate JSON files
   */
  exportSections(data: Partial<JSONExportData>): { [key: string]: string } {
    const results: { [key: string]: string } = {}

    // Export info file
    results['export_info.json'] = JSON.stringify({
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'LearnifyAI',
        exportType: 'sectioned',
        itemCounts: {
          documents: data.documents?.length || 0,
          flashcards: data.flashcards?.length || 0,
          quizzes: data.quizzes?.length || 0,
          quizAttempts: data.quizAttempts?.length || 0,
          summaries: data.summaries?.length || 0,
          analytics: data.analytics?.dailyStats?.length || 0
        }
      }
    }, null, 2)

    // Export documents
    if (data.documents && data.documents.length > 0) {
      results['documents.json'] = JSON.stringify({
        documents: data.documents,
        count: data.documents.length
      }, null, 2)
    }

    // Export flashcards
    if (data.flashcards && data.flashcards.length > 0) {
      results['flashcards.json'] = JSON.stringify({
        flashcards: data.flashcards,
        count: data.flashcards.length
      }, null, 2)
    }

    // Export quizzes
    if (data.quizzes && data.quizzes.length > 0) {
      results['quizzes.json'] = JSON.stringify({
        quizzes: data.quizzes,
        count: data.quizzes.length
      }, null, 2)
    }

    // Export quiz attempts
    if (data.quizAttempts && data.quizAttempts.length > 0) {
      results['quiz_attempts.json'] = JSON.stringify({
        quizAttempts: data.quizAttempts,
        count: data.quizAttempts.length
      }, null, 2)
    }

    // Export summaries
    if (data.summaries && data.summaries.length > 0) {
      results['summaries.json'] = JSON.stringify({
        summaries: data.summaries,
        count: data.summaries.length
      }, null, 2)
    }

    // Export analytics
    if (data.analytics) {
      results['analytics.json'] = JSON.stringify({
        analytics: data.analytics
      }, null, 2)
    }

    // Export user settings
    if (data.userSettings) {
      results['user_settings.json'] = JSON.stringify({
        userSettings: data.userSettings
      }, null, 2)
    }

    return results
  }

  /**
   * Generate ZIP file with JSON exports
   */
  async generateJSONPackage(data: Partial<JSONExportData>, sectioned: boolean = false): Promise<Blob> {
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()

    if (sectioned) {
      // Export as separate JSON files
      const sections = this.exportSections(data)
      Object.entries(sections).forEach(([filename, content]) => {
        zip.file(filename, content)
      })
    } else {
      // Export as single comprehensive JSON file
      const fullExport = this.exportToJSON(data)
      zip.file('learnify_export.json', fullExport)
    }

    // Add schema documentation
    const schema = this.generateJSONSchema()
    zip.file('schema.json', JSON.stringify(schema, null, 2))

    // Add README
    const readme = this.generateJSONReadme()
    zip.file('README.md', readme)

    return await zip.generateAsync({ type: 'blob' })
  }

  /**
   * Generate backup format optimized for re-import
   */
  generateBackupFormat(data: Partial<JSONExportData>): string {
    const backup = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      source: 'LearnifyAI',
      checksum: this.generateChecksum(data),
      data: {
        documents: data.documents?.map(doc => ({
          ...doc,
          // Remove processed content for smaller file size
          content: doc.content.length > 10000 ? doc.content.substring(0, 10000) + '...[truncated]' : doc.content
        })),
        flashcards: data.flashcards,
        quizzes: data.quizzes,
        analytics: data.analytics?.summary
      }
    }

    return JSON.stringify(backup, null, 2)
  }

  /**
   * Convert to API-compatible format
   */
  toAPIFormat(data: Partial<JSONExportData>): any {
    return {
      meta: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        itemCount: (data.documents?.length || 0) + (data.flashcards?.length || 0) + (data.quizzes?.length || 0)
      },
      documents: data.documents?.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.fileType,
        size: doc.fileSize,
        status: doc.status,
        createdAt: doc.createdAt
      })),
      flashcards: data.flashcards?.map(card => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        tags: card.tags,
        sm2: {
          interval: card.interval,
          repetition: card.repetition,
          efactor: card.efactor,
          nextReview: card.nextReview
        }
      })),
      analytics: data.analytics ? {
        summary: data.analytics.summary,
        trends: data.analytics.performanceTrends?.slice(-30) // Last 30 days
      } : undefined
    }
  }

  private generateChecksum(data: any): string {
    // Simple checksum for data integrity
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private generateJSONSchema(): any {
    return {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "LearnifyAI Export Schema",
      "version": "1.0.0",
      "type": "object",
      "properties": {
        "exportInfo": {
          "type": "object",
          "properties": {
            "timestamp": { "type": "string", "format": "date-time" },
            "version": { "type": "string" },
            "source": { "type": "string" },
            "exportType": { "enum": ["full", "partial"] }
          }
        },
        "documents": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "title": { "type": "string" },
              "content": { "type": "string" },
              "fileType": { "type": "string" },
              "status": { "enum": ["UPLOADED", "PROCESSING", "COMPLETED", "FAILED"] }
            }
          }
        },
        "flashcards": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "question": { "type": "string" },
              "answer": { "type": "string" },
              "difficulty": { "enum": ["EASY", "MEDIUM", "HARD"] },
              "interval": { "type": "number" },
              "repetition": { "type": "number" },
              "efactor": { "type": "number" }
            }
          }
        }
      }
    }
  }

  private generateJSONReadme(): string {
    return `# JSON Export from LearnifyAI

This package contains your learning data exported in JSON format, designed for developers and advanced users who need structured data access.

## Files Included

### learnify_export.json (Full Export)
Complete export of all your data in a single JSON file with the following structure:

\`\`\`json
{
  "exportInfo": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0",
    "source": "LearnifyAI",
    "exportType": "full"
  },
  "documents": [...],
  "flashcards": [...],
  "quizzes": [...],
  "summaries": [...],
  "analytics": {...}
}
\`\`\`

### Sectioned Export (if applicable)
- \`export_info.json\` - Export metadata
- \`documents.json\` - Document data
- \`flashcards.json\` - Flashcard data with spaced repetition info
- \`quizzes.json\` - Quiz data with questions and answers
- \`quiz_attempts.json\` - Performance history
- \`summaries.json\` - AI-generated document summaries
- \`analytics.json\` - Learning analytics and progress data
- \`user_settings.json\` - Your preferences and settings

### schema.json
JSON Schema definition for validation and documentation of the data structure.

## Data Structure

### Documents
Each document contains:
- Basic metadata (title, type, size, status)
- Full text content
- Processing information
- Timestamps

### Flashcards
Each flashcard includes:
- Question and answer text
- Spaced repetition data (SM-2 algorithm)
- Difficulty level and tags
- Review history

### Quizzes
Each quiz contains:
- Quiz metadata
- Complete question set with options
- Correct answers and explanations
- Attempt history

### Summaries
Each AI-generated summary includes:
- Comprehensive content analysis
- Key points and main concepts
- Examples and takeaways
- Metadata (AI model, tokens used, generation time)
- Difficulty level and estimated read time

### Analytics
Comprehensive learning analytics:
- Daily study statistics
- Performance trends
- Topic distribution
- Progress summaries

## API Integration

This JSON format is designed to be API-compatible. You can use this data to:
- Integrate with other learning platforms
- Build custom analytics dashboards
- Create backup and sync solutions
- Develop third-party applications

## Data Validation

Use the included \`schema.json\` file to validate the exported data:

\`\`\`javascript
const Ajv = require('ajv');
const schema = require('./schema.json');
const data = require('./learnify_export.json');

const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(data);

if (!valid) {
  console.log(validate.errors);
}
\`\`\`

## Privacy and Security

- This export contains your complete learning data
- Store securely and follow data protection best practices
- Consider encrypting sensitive exports
- Be cautious when sharing or uploading to third-party services

## Re-importing Data

This format is designed for potential re-import into LearnifyAI or compatible systems. The structured format preserves:
- Spaced repetition progress
- Learning analytics
- Quiz performance history
- Document processing metadata

## Development

For developers building on this data:
- All timestamps are in ISO 8601 format
- IDs are consistent across related objects
- Metadata is preserved for full context
- Arrays maintain order where relevant

Generated on: ${new Date().toLocaleString()}
Export Version: 1.0.0
Source: LearnifyAI
`
  }
}

export const jsonExporter = new JSONExporter()