import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const generateFlashcardsSchema = z.object({
  count: z.number().min(1).max(50).default(10),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  focusAreas: z.array(z.string()).optional(),
})

export async function POST(
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
    const body = await request.json()
    const validatedData = generateFlashcardsSchema.parse(body)

    // Get document and verify ownership
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

    // Check user usage limits
    const userUsage = await db.userUsage.findUnique({
      where: { userId: session.user.id }
    })

    if (userUsage && userUsage.flashcardsGenerated >= userUsage.flashcardsLimit) {
      return NextResponse.json(
        { success: false, error: "Flashcard generation limit reached for this month" },
        { status: 403 }
      )
    }

    // Generate flashcards using AI
    console.log('🧠 Starting flashcard generation for document:', document.id)
    console.log('📝 Content length:', document.content.length)
    console.log('⚙️ Generation options:', { count: validatedData.count, difficulty: validatedData.difficulty })
    
    const { flashcardGenerator } = await import('@/lib/ai/flashcard-generator')
    const { SM2Algorithm } = await import('@/lib/spaced-repetition/sm2-algorithm')
    
    console.log('📦 Modules imported successfully')
    
    const generatedFlashcards = await flashcardGenerator.generateFlashcards(
      document.content,
      {
        documentId: document.id,
        count: validatedData.count,
        difficulty: validatedData.difficulty,
        focusAreas: validatedData.focusAreas,
      }
    )
    
    console.log('✅ Flashcards generated:', generatedFlashcards.length)

    if (generatedFlashcards.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to generate flashcards" },
        { status: 500 }
      )
    }

    // Create flashcards in database
    const flashcardsToCreate = generatedFlashcards.map(flashcard => {
      const sm2Data = SM2Algorithm.createNewCard()
      return {
        documentId: document.id,
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

    const createdFlashcards = await db.flashcard.createMany({
      data: flashcardsToCreate,
    })

    // Update user usage
    if (userUsage) {
      await db.userUsage.update({
        where: { userId: session.user.id },
        data: {
          flashcardsGenerated: {
            increment: generatedFlashcards.length,
          },
        },
      })
    }

    // Get the newly created flashcards with their IDs
    const newFlashcards = await db.flashcard.findMany({
      where: {
        documentId: document.id,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: generatedFlashcards.length
    })

    return NextResponse.json({
      success: true,
      flashcards: newFlashcards,
      message: `Generated ${generatedFlashcards.length} flashcards successfully`,
    })
  } catch (error) {
    console.error("Flashcard generation error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate flashcards" },
      { status: 500 }
    )
  }
}