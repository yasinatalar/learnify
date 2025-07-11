import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check for withoutSummaries parameter
    const { searchParams } = new URL(request.url)
    const withoutSummaries = searchParams.get('withoutSummaries') === 'true'

    // Build where clause
    const whereClause: any = {
      userId: session.user.id,
    }

    // If withoutSummaries is true, exclude documents that have summaries
    if (withoutSummaries) {
      whereClause.summaries = {
        none: {}
      }
    }

    // Get documents for the user
    const documents = await db.document.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        originalName: true,
        fileType: true,
        fileSize: true,
        status: true,
        wordCount: true,
        pageCount: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            flashcards: true,
            quizzes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the data to include flashcard and quiz counts
    const transformedDocuments = documents.map(doc => ({
      ...doc,
      flashcardsCount: doc._count.flashcards,
      quizzesCount: doc._count.quizzes,
      // Remove the _count field
      _count: undefined,
    }))

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
    })
  } catch (error) {
    console.error("Documents fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}