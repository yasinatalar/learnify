import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { exportManager, ExportRequest } from "@/lib/export/export-manager"
import { z } from "zod"

const exportRequestSchema = z.object({
  format: z.enum(["pdf", "anki", "csv", "json"]),
  items: z.array(z.object({
    id: z.string(),
    type: z.enum(["document", "flashcards", "quizzes", "summaries", "analytics"]),
    title: z.string()
  })),
  options: z.object({
    includeContent: z.boolean().optional().default(true),
    includeMetadata: z.boolean().optional().default(true),
    dateFormat: z.enum(["iso", "local", "date-only"]).optional().default("iso"),
    sectioned: z.boolean().optional().default(false)
  }).optional(),
  locale: z.enum(["en", "de"]).optional().default("en")
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    console.log('Export request body:', JSON.stringify(body, null, 2))
    const validatedData = exportRequestSchema.parse(body)

    console.log(`Processing export request for user ${session.user.id}:`, {
      format: validatedData.format,
      itemCount: validatedData.items.length,
      types: [...new Set(validatedData.items.map(item => item.type))]
    })

    // Check user permissions and limits
    const userUsage = await db.userUsage.findUnique({
      where: { userId: session.user.id }
    })

    if (!userUsage) {
      return NextResponse.json(
        { success: false, error: "User usage data not found" },
        { status: 404 }
      )
    }

    // Gather user data based on requested items
    const userData = await gatherUserData(session.user.id, validatedData.items, validatedData.locale)

    // Validate that user owns the requested data
    const validationResult = validateUserOwnership(userData, validatedData.items, session.user.id)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 403 }
      )
    }

    // Generate export
    const exportResult = await exportManager.exportData(validatedData, userData)

    if (!exportResult.success) {
      return NextResponse.json(
        { success: false, error: exportResult.error },
        { status: 500 }
      )
    }

    // Log export activity
    console.log(`Export completed for user ${session.user.id}:`, {
      format: validatedData.format,
      filename: exportResult.filename,
      size: exportResult.size
    })

    // Convert blob to base64 for JSON response
    const arrayBuffer = await exportResult.blob!.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // For large files, we might want to use a different approach (e.g., signed URLs)
    if (buffer.length > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json(
        { success: false, error: "Export file too large. Please select fewer items or contact support." },
        { status: 413 }
      )
    }

    return NextResponse.json({
      success: true,
      filename: exportResult.filename,
      size: exportResult.size,
      mimeType: getMimeType(validatedData.format),
      data: buffer.toString('base64'),
      message: `Successfully exported ${validatedData.items.length} items as ${validatedData.format.toUpperCase()}`
    })

  } catch (error) {
    console.error("Export error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to process export request" },
      { status: 500 }
    )
  }
}

// Get available export formats for user's data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's available data
    const [documents, flashcards, quizzes, summaries] = await Promise.all([
      db.document.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, status: true }
      }),
      db.flashcard.findMany({
        where: { document: { userId: session.user.id } },
        select: { documentId: true },
        distinct: ['documentId']
      }),
      db.quiz.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true }
      }),
      db.summary.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, document: { select: { title: true } } }
      })
    ])

    const availableItems = [
      ...documents.filter(doc => doc.status === 'COMPLETED').map(doc => ({
        id: doc.id,
        type: 'document' as const,
        title: doc.title
      })),
      ...flashcards.map(fc => ({
        id: `flashcards_${fc.documentId}`,
        type: 'flashcards' as const,
        title: `Flashcards from ${documents.find(d => d.id === fc.documentId)?.title || 'Document'}`
      })),
      ...quizzes.map(quiz => ({
        id: quiz.id,
        type: 'quizzes' as const,
        title: quiz.title
      })),
      ...summaries.map(summary => ({
        id: summary.id,
        type: 'summaries' as const,
        title: summary.title
      }))
    ]

    // Add analytics if user has activity
    const hasActivity = documents.length > 0 || flashcards.length > 0 || quizzes.length > 0 || summaries.length > 0
    if (hasActivity) {
      availableItems.push({
        id: 'analytics',
        type: 'analytics' as const,
        title: 'Learning Analytics Data'
      })
    }

    const availableFormats = exportManager.getAvailableFormats(availableItems)

    return NextResponse.json({
      success: true,
      availableItems,
      availableFormats,
      itemCounts: {
        documents: documents.filter(d => d.status === 'COMPLETED').length,
        flashcards: flashcards.length,
        quizzes: quizzes.length,
        summaries: summaries.length,
        analytics: hasActivity ? 1 : 0
      }
    })

  } catch (error) {
    console.error("Error fetching export options:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch export options" },
      { status: 500 }
    )
  }
}

async function gatherUserData(userId: string, items: ExportRequest['items'], locale: string = 'en') {
  const userData: any = {}
  userData.locale = locale

  const documentIds = items.filter(item => item.type === 'document').map(item => item.id)
  const flashcardDocIds = items
    .filter(item => item.type === 'flashcards')
    .map(item => item.id.replace('flashcards_', ''))
  const quizIds = items.filter(item => item.type === 'quizzes').map(item => item.id)
  const summaryIds = items.filter(item => item.type === 'summaries').map(item => item.id)
  const needsAnalytics = items.some(item => item.type === 'analytics')

  // Fetch documents
  if (documentIds.length > 0) {
    userData.documents = await db.document.findMany({
      where: {
        id: { in: documentIds },
        userId: userId
      }
    })
  }

  // Fetch flashcards
  if (flashcardDocIds.length > 0) {
    userData.flashcards = await db.flashcard.findMany({
      where: {
        documentId: { in: flashcardDocIds },
        document: { userId: userId }
      },
      include: {
        reviews: {
          select: {
            id: true,
            rating: true,
            timeSpent: true,
            createdAt: true
          }
        }
      }
    })
  }

  // Fetch quizzes
  if (quizIds.length > 0) {
    userData.quizzes = await db.quiz.findMany({
      where: {
        id: { in: quizIds },
        userId: userId
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    })
  }

  // Fetch summaries
  if (summaryIds.length > 0) {
    userData.summaries = await db.summary.findMany({
      where: {
        id: { in: summaryIds },
        userId: userId
      },
      include: {
        document: {
          select: {
            title: true,
            originalName: true,
            fileType: true
          }
        }
      }
    })
  }

  // Fetch analytics data
  if (needsAnalytics) {
    const [flashcardReviews, quizAttempts] = await Promise.all([
      db.flashcardReview.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100 // Last 100 reviews
      }),
      db.quizAttempt.findMany({
        where: { userId: userId },
        orderBy: { completedAt: 'desc' },
        take: 50 // Last 50 attempts
      })
    ])

    // Process analytics data into daily stats
    userData.analytics = processAnalyticsData(flashcardReviews, quizAttempts)
  }

  return userData
}

function validateUserOwnership(userData: any, items: ExportRequest['items'], userId: string): { isValid: boolean, error?: string } {
  // Check if user owns all requested documents
  const requestedDocIds = items.filter(item => item.type === 'document').map(item => item.id)
  const userDocIds = userData.documents?.map((doc: any) => doc.id) || []
  
  const missingDocs = requestedDocIds.filter(id => !userDocIds.includes(id))
  if (missingDocs.length > 0) {
    return { isValid: false, error: `Access denied to documents: ${missingDocs.join(', ')}` }
  }

  // Similar checks for other data types...
  return { isValid: true }
}

function processAnalyticsData(reviews: any[], attempts: any[]) {
  // Group by date and calculate daily stats
  const dailyStats: { [date: string]: any } = {}

  reviews.forEach(review => {
    const date = review.createdAt.toISOString().split('T')[0]
    if (!dailyStats[date]) {
      dailyStats[date] = { flashcardsReviewed: 0, quizzesCompleted: 0, studyTime: 0, scores: [] }
    }
    dailyStats[date].flashcardsReviewed++
    dailyStats[date].studyTime += review.timeSpent || 0
  })

  attempts.forEach(attempt => {
    const date = attempt.completedAt.toISOString().split('T')[0]
    if (!dailyStats[date]) {
      dailyStats[date] = { flashcardsReviewed: 0, quizzesCompleted: 0, studyTime: 0, scores: [] }
    }
    dailyStats[date].quizzesCompleted++
    dailyStats[date].studyTime += attempt.totalTime || 0
    dailyStats[date].scores.push(attempt.accuracy)
  })

  return {
    dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      flashcardsReviewed: stats.flashcardsReviewed,
      quizzesCompleted: stats.quizzesCompleted,
      studyTime: Math.round(stats.studyTime / 60), // Convert to minutes
      averageScore: stats.scores.length > 0 
        ? stats.scores.reduce((sum: number, score: number) => sum + score, 0) / stats.scores.length 
        : 0
    }))
  }
}

function getMimeType(format: string): string {
  switch (format) {
    case 'pdf': return 'application/pdf'
    case 'anki': return 'application/zip'
    case 'csv': return 'application/zip'
    case 'json': return 'application/zip'
    default: return 'application/octet-stream'
  }
}