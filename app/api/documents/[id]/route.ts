import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: documentId } = await params

    // Get document with flashcards and quizzes
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id, // Ensure user can only access their own documents
      },
      include: {
        flashcards: {
          select: {
            id: true,
            question: true,
            answer: true,
            explanation: true,
            difficulty: true,
            tags: true,
            interval: true,
            repetition: true,
            efactor: true,
            nextReview: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            timeLimit: true,
            attempts: true,
            lastAttemptAt: true,
            createdAt: true,
            _count: {
              select: {
                questions: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    // Parse metadata if it exists
    let metadata = null
    if (document.metadata) {
      try {
        metadata = JSON.parse(document.metadata)
      } catch (error) {
        console.error("Failed to parse document metadata:", error)
      }
    }

    // Transform the data for frontend
    const transformedDocument = {
      id: document.id,
      title: document.title,
      content: document.content,
      originalName: document.originalName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      status: document.status,
      wordCount: document.wordCount,
      pageCount: document.pageCount,
      language: document.language,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      metadata,
      flashcards: document.flashcards.map(fc => ({
        id: fc.id,
        question: fc.question,
        answer: fc.answer,
        explanation: fc.explanation,
        difficulty: fc.difficulty,
        tags: fc.tags,
        interval: fc.interval,
        repetition: fc.repetition,
        efactor: fc.efactor,
        nextReview: fc.nextReview,
        createdAt: fc.createdAt,
      })),
      quizzes: document.quizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        timeLimit: quiz.timeLimit,
        attempts: quiz.attempts,
        lastAttemptAt: quiz.lastAttemptAt,
        questionCount: quiz._count.questions,
        createdAt: quiz.createdAt,
      }))
    }

    return NextResponse.json({
      success: true,
      document: transformedDocument,
    })
  } catch (error) {
    console.error("Document fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch document" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: documentId } = await params

    // Check if document exists and belongs to user
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      }
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    // Delete document (cascading deletes will handle flashcards and quizzes)
    await db.document.delete({
      where: {
        id: documentId,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Document delete error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    )
  }
}