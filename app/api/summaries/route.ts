import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const querySchema = z.object({
  documentId: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : undefined),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { documentId, limit } = querySchema.parse(Object.fromEntries(searchParams))

    const where: {
      userId: string
      documentId?: string
    } = {
      userId: session.user.id,
    }

    if (documentId) {
      where.documentId = documentId
    }

    const summaries = await db.summary.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            originalName: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
      ],
      take: limit,
    })

    const transformedSummaries = summaries.map(summary => ({
      id: summary.id,
      title: summary.title,
      content: summary.content,
      keyPoints: summary.keyPoints ? JSON.parse(summary.keyPoints) : [],
      overview: summary.overview,
      mainConcepts: summary.mainConcepts,
      examples: summary.examples,
      takeaways: summary.takeaways,
      prerequisites: summary.prerequisites,
      methodology: summary.methodology,
      applications: summary.applications,
      limitations: summary.limitations,
      futureDirections: summary.futureDirections,
      criticalAnalysis: summary.criticalAnalysis,
      furtherReading: summary.furtherReading,
      wordCount: summary.wordCount,
      difficulty: summary.difficulty,
      estimatedReadTime: summary.estimatedReadTime,
      tags: summary.tags ? summary.tags.split(',').filter(Boolean) : [],
      documentId: summary.documentId,
      document: summary.document,
      aiProvider: summary.aiProvider,
      model: summary.model,
      tokensUsed: summary.tokensUsed,
      generationTime: summary.generationTime,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      summaries: transformedSummaries,
      count: transformedSummaries.length,
    })

  } catch (error) {
    console.error("Error fetching summaries:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch summaries" },
      { status: 500 }
    )
  }
}