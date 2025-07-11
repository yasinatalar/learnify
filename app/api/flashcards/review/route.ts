import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SM2Algorithm } from "@/lib/spaced-repetition/sm2-algorithm"
import { z } from "zod"

const reviewSchema = z.object({
  flashcardId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  timeSpent: z.number().min(0).optional(),
})

const batchReviewSchema = z.object({
  reviews: z.array(reviewSchema),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reviews } = batchReviewSchema.parse(body)

    if (reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: "No reviews provided" },
        { status: 400 }
      )
    }

    // Process reviews in a transaction
    const result = await db.$transaction(async (tx) => {
      const updatedFlashcards = []
      
      for (const review of reviews) {
        // Get the flashcard
        const flashcard = await tx.flashcard.findFirst({
          where: {
            id: review.flashcardId,
            document: {
              userId: session.user.id,
            },
          },
        })

        if (!flashcard) {
          throw new Error(`Flashcard ${review.flashcardId} not found`)
        }

        // Calculate new SM-2 values
        const currentData = {
          interval: flashcard.interval,
          repetition: flashcard.repetition,
          efactor: flashcard.efactor,
          nextReview: flashcard.nextReview,
        }

        const newData = SM2Algorithm.calculateNext(currentData, review.rating)

        // Update flashcard
        const updatedFlashcard = await tx.flashcard.update({
          where: { id: review.flashcardId },
          data: {
            interval: newData.interval,
            repetition: newData.repetition,
            efactor: newData.efactor,
            nextReview: newData.nextReview,
            updatedAt: new Date(),
          },
        })

        // Record the review
        await tx.flashcardReview.create({
          data: {
            flashcardId: review.flashcardId,
            userId: session.user.id,
            rating: review.rating,
            timeSpent: review.timeSpent,
          },
        })

        updatedFlashcards.push({
          ...updatedFlashcard,
          rating: review.rating // Add the rating to the response
        })
      }

      return updatedFlashcards
    })

    return NextResponse.json({
      success: true,
      message: `Successfully reviewed ${reviews.length} flashcards`,
      updatedCards: result.map(card => ({
        id: card.id,
        question: card.question,
        nextReview: card.nextReview.toISOString(),
        interval: card.interval,
        repetition: card.repetition,
        efactor: card.efactor,
        rating: card.rating,
      })),
    })

  } catch (error) {
    console.error("Error processing flashcard reviews:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid review data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to process reviews" },
      { status: 500 }
    )
  }
}