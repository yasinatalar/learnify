import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const querySchema = z.object({
  documentId: z.string().optional(),
  dueOnly: z.string().optional().transform(val => val === "true"),
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
    const { documentId, dueOnly, limit } = querySchema.parse(Object.fromEntries(searchParams))

    const where: {
      document: { userId: string }
      documentId?: string
      nextReview?: { lte: Date }
    } = {
      document: {
        userId: session.user.id,
      },
    }

    if (documentId) {
      where.documentId = documentId
    }

    if (dueOnly) {
      where.nextReview = {
        lte: new Date(),
      }
    }

    const flashcards = await db.flashcard.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { nextReview: "asc" },
        { createdAt: "desc" },
      ],
      take: limit,
    })

    const transformedFlashcards = flashcards.map(card => ({
      id: card.id,
      question: card.question,
      answer: card.answer,
      explanation: card.explanation,
      difficulty: card.difficulty as "EASY" | "MEDIUM" | "HARD",
      tags: card.tags ? card.tags.split(',').filter(Boolean) : [],
      nextReview: card.nextReview,
      interval: card.interval,
      repetition: card.repetition,
      efactor: card.efactor,
      documentId: card.documentId,
      documentTitle: card.document.title,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      flashcards: transformedFlashcards,
      count: transformedFlashcards.length,
    })

  } catch (error) {
    console.error("Error fetching flashcards:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch flashcards" },
      { status: 500 }
    )
  }
}