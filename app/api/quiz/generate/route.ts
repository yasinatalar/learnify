import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { quizGenerator } from "@/lib/ai/quiz-generator"
import { z } from "zod"

const generateQuizRequestSchema = z.object({
  documentId: z.string().cuid().optional(),
  flashcardIds: z.array(z.string().cuid()).optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  count: z.number().min(5).max(50).default(20),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  questionTypes: z.array(z.enum(["multiple_choice", "true_false", "fill_blank"])).optional(),
  focusAreas: z.array(z.string()).optional(),
  timeLimit: z.number().min(30).max(300).optional(), // seconds per question
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
    const validatedData = generateQuizRequestSchema.parse(body)

    // Check user limits
    const userUsage = await db.userUsage.findUnique({
      where: { userId: session.user.id },
    })

    if (userUsage && userUsage.quizzesGenerated >= userUsage.quizzesLimit) {
      return NextResponse.json(
        { success: false, error: "Quiz generation limit reached for this month" },
        { status: 403 }
      )
    }

    let content = ""
    let sourceType = ""

    // Generate quiz from document
    if (validatedData.documentId) {
      const document = await db.document.findFirst({
        where: {
          id: validatedData.documentId,
          userId: session.user.id,
          status: "COMPLETED",
        },
      })

      if (!document) {
        return NextResponse.json(
          { success: false, error: "Document not found or not ready for processing" },
          { status: 404 }
        )
      }

      content = document.content
      sourceType = "document"
    }
    // Generate quiz from flashcards
    else if (validatedData.flashcardIds && validatedData.flashcardIds.length > 0) {
      const flashcards = await db.flashcard.findMany({
        where: {
          id: { in: validatedData.flashcardIds },
          document: {
            userId: session.user.id,
          },
        },
        include: {
          document: {
            select: { id: true, title: true }
          }
        }
      })

      if (flashcards.length === 0) {
        return NextResponse.json(
          { success: false, error: "No valid flashcards found" },
          { status: 404 }
        )
      }

      // Convert flashcards to content
      content = flashcards.map(fc => 
        `Q: ${fc.question}\nA: ${fc.answer}\n${fc.explanation ? `Explanation: ${fc.explanation}\n` : ''}`
      ).join('\n---\n')
      sourceType = "flashcards"
    }
    else {
      return NextResponse.json(
        { success: false, error: "Either documentId or flashcardIds must be provided" },
        { status: 400 }
      )
    }

    // Generate quiz questions using AI
    console.log(`Generating ${validatedData.count} quiz questions from ${sourceType}`)
    
    const generatedQuestions = await quizGenerator.generateQuiz(content, {
      documentId: validatedData.documentId || "",
      count: validatedData.count,
      difficulty: validatedData.difficulty,
      questionTypes: validatedData.questionTypes,
      focusAreas: validatedData.focusAreas,
      timeLimit: validatedData.timeLimit,
    })

    if (generatedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No quiz questions could be generated from this content" },
        { status: 422 }
      )
    }

    // Use transaction to create quiz and update usage
    const result = await db.$transaction(async (tx) => {
      // Create quiz
      const quiz = await tx.quiz.create({
        data: {
          userId: session.user.id,
          documentId: validatedData.documentId || null,
          title: validatedData.title,
          description: validatedData.description,
          difficulty: validatedData.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD" | "MIXED",
          timeLimit: validatedData.timeLimit,
          metadata: JSON.stringify({
            sourceType,
            questionTypes: validatedData.questionTypes || ["multiple_choice", "true_false", "fill_blank"],
            focusAreas: validatedData.focusAreas || [],
            flashcardIds: validatedData.flashcardIds || [],
          }),
        },
      })

      // Create quiz questions
      const questionsToCreate = generatedQuestions.map((question, index) => ({
        quizId: quiz.id,
        question: question.question,
        options: JSON.stringify(question.options),
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: question.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
        questionType: question.questionType.toUpperCase() as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK",
        points: question.points,
        order: index + 1,
        tags: (question.tags || []).join(','),
      }))

      await tx.quizQuestion.createMany({
        data: questionsToCreate,
      })

      // Update user usage
      await tx.userUsage.update({
        where: { userId: session.user.id },
        data: {
          quizzesGenerated: {
            increment: 1,
          },
        },
      })

      return quiz
    })

    console.log(`Successfully created quiz ${result.id} with ${generatedQuestions.length} questions`)

    // Fetch the created quiz with questions
    const createdQuiz = await db.quiz.findUnique({
      where: { id: result.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({
      success: true,
      quiz: createdQuiz,
      questionCount: generatedQuestions.length,
      message: `Generated quiz with ${generatedQuestions.length} questions successfully`,
    })

  } catch (error) {
    console.error("Quiz generation error:", error)

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

      if (error.message.includes("Quiz validation failed")) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 422 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate quiz" },
      { status: 500 }
    )
  }
}