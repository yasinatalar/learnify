import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const summary = await db.summary.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
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
    })

    if (!summary) {
      return NextResponse.json(
        { success: false, error: "Summary not found" },
        { status: 404 }
      )
    }

    const transformedSummary = {
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
    }

    return NextResponse.json({
      success: true,
      summary: transformedSummary,
    })

  } catch (error) {
    console.error("Error fetching summary:", error)

    return NextResponse.json(
      { success: false, error: "Failed to fetch summary" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const summary = await db.summary.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!summary) {
      return NextResponse.json(
        { success: false, error: "Summary not found" },
        { status: 404 }
      )
    }

    await db.summary.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Summary deleted successfully",
    })

  } catch (error) {
    console.error("Error deleting summary:", error)

    return NextResponse.json(
      { success: false, error: "Failed to delete summary" },
      { status: 500 }
    )
  }
}