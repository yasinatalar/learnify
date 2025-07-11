import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { flashcardGenerator } from "@/lib/ai/flashcard-generator"
import { SM2Algorithm } from "@/lib/spaced-repetition/sm2-algorithm"
import { z } from "zod"

const generateRequestSchema = z.object({
  documentId: z.string().cuid(),
  count: z.number().min(1).max(50).default(20),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  focusAreas: z.array(z.string()).optional(),
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
    const validatedData = generateRequestSchema.parse(body)

    // Check if document exists and belongs to user
    const document = await db.document.findFirst({
      where: {
        id: validatedData.documentId,
        userId: session.user.id,
        status: "COMPLETED", // Only generate flashcards for completed documents
      },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found or not ready for processing" },
        { status: 404 }
      )
    }

    // Check user limits
    const userUsage = await db.userUsage.findUnique({
      where: { userId: session.user.id },
    })

    if (userUsage && userUsage.flashcardsGenerated >= userUsage.flashcardsLimit) {
      return NextResponse.json(
        { success: false, error: "Flashcard generation limit reached for this month" },
        { status: 403 }
      )
    }

    // Check if flashcards already exist for this document
    const existingFlashcards = await db.flashcard.findMany({
      where: { documentId: validatedData.documentId },
      take: 1,
    })

    if (existingFlashcards.length > 0) {
      return NextResponse.json(
        { success: false, error: "Flashcards already exist for this document" },
        { status: 400 }
      )
    }

    // Generate flashcards using AI
    console.log(`Generating ${validatedData.count} flashcards for document ${validatedData.documentId}`)
    
    const generatedFlashcards = await flashcardGenerator.generateFlashcards(
      document.content,
      {
        documentId: validatedData.documentId,
        count: validatedData.count,
        difficulty: validatedData.difficulty,
        focusAreas: validatedData.focusAreas,
      }
    )

    if (generatedFlashcards.length === 0) {
      return NextResponse.json(
        { success: false, error: "No flashcards could be generated from this content" },
        { status: 422 }
      )
    }

    // Create flashcards in database with SM-2 initialization
    const flashcardsToCreate = generatedFlashcards.map(flashcard => {
      const sm2Data = SM2Algorithm.createNewCard()
      
      return {
        documentId: validatedData.documentId,
        question: flashcard.question,
        answer: flashcard.answer,
        explanation: flashcard.explanation || null,
        difficulty: flashcard.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
        tags: (flashcard.tags || []).join(','),
        interval: sm2Data.interval,
        repetition: sm2Data.repetition,
        efactor: sm2Data.efactor,
        nextReview: sm2Data.nextReview,
      }
    })

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Create flashcards
      const createdFlashcards = await tx.flashcard.createMany({
        data: flashcardsToCreate,
      })

      // Update user usage
      await tx.userUsage.update({
        where: { userId: session.user.id },
        data: {
          flashcardsGenerated: {
            increment: generatedFlashcards.length,
          },
        },
      })

      // Update document status to indicate flashcards are ready
      await tx.document.update({
        where: { id: validatedData.documentId },
        data: {
          metadata: {
            ...((document.metadata as any) || {}),
            flashcardsGenerated: true,
            flashcardsCount: generatedFlashcards.length,
            lastFlashcardGeneration: new Date().toISOString(),
          },
        },
      })

      return createdFlashcards
    })

    console.log(`Successfully created ${result.count} flashcards for document ${validatedData.documentId}`)

    // Fetch the created flashcards to return to client
    const flashcards = await db.flashcard.findMany({
      where: { documentId: validatedData.documentId },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      success: true,
      flashcards,
      count: flashcards.length,
      message: `Generated ${flashcards.length} flashcards successfully`,
    })

  } catch (error) {
    console.error("Flashcard generation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Check for specific AI-related errors
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { success: false, error: "AI service rate limit exceeded. Please try again later." },
          { status: 429 }
        )
      }

      if (error.message.includes("API key")) {
        return NextResponse.json(
          { success: false, error: "AI service configuration error" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate flashcards" },
      { status: 500 }
    )
  }
}