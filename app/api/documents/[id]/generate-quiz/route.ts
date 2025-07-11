import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const generateQuizSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  questionCount: z.number().min(3).max(25).default(10),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  timeLimit: z.number().min(30).max(3600).optional(), // seconds per question
  questionTypes: z.array(z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"])).default(["MULTIPLE_CHOICE"]),
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
    const validatedData = generateQuizSchema.parse(body)

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

    if (userUsage && userUsage.quizzesGenerated >= userUsage.quizzesLimit) {
      return NextResponse.json(
        { success: false, error: "Quiz generation limit reached for this month" },
        { status: 403 }
      )
    }

    // Generate quiz using AI
    const { quizGenerator } = await import('@/lib/ai/quiz-generator')
    
    const generatedQuiz = await quizGenerator.generateQuiz(
      document.content,
      {
        documentId: document.id,
        count: validatedData.questionCount,
        difficulty: validatedData.difficulty,
        timeLimit: validatedData.timeLimit,
        questionTypes: validatedData.questionTypes.map(type => type.toLowerCase() as any),
      }
    )

    if (!generatedQuiz || !Array.isArray(generatedQuiz) || generatedQuiz.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to generate quiz" },
        { status: 500 }
      )
    }

    // Create quiz in database
    const quiz = await db.quiz.create({
      data: {
        userId: session.user.id,
        documentId: document.id,
        title: validatedData.title || `${document.title} Quiz`,
        description: validatedData.description || `Quiz generated from ${document.title}`,
        difficulty: validatedData.difficulty.toUpperCase(),
        timeLimit: validatedData.timeLimit,
        attempts: 0,
        metadata: JSON.stringify({
          generatedAt: new Date().toISOString(),
          questionTypes: validatedData.questionTypes,
          originalWordCount: document.wordCount,
        }),
      }
    })

    // Create quiz questions - generatedQuiz is already an array of questions
    const questionsToCreate = generatedQuiz.map((question, index) => ({
      quizId: quiz.id,
      question: question.question,
      options: JSON.stringify(question.options),
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || null,
      difficulty: question.difficulty?.toUpperCase() || "MEDIUM",
      questionType: question.questionType?.toUpperCase() || "MULTIPLE_CHOICE",
      points: question.points || 1,
      order: index + 1,
      tags: (question.tags || []).join(','),
    }))

    await db.quizQuestion.createMany({
      data: questionsToCreate,
    })

    // Update user usage
    if (userUsage) {
      await db.userUsage.update({
        where: { userId: session.user.id },
        data: {
          quizzesGenerated: {
            increment: 1,
          },
        },
      })
    }

    // Get the complete quiz with questions
    const completeQuiz = await db.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            questions: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      quiz: {
        id: completeQuiz!.id,
        title: completeQuiz!.title,
        description: completeQuiz!.description,
        difficulty: completeQuiz!.difficulty,
        timeLimit: completeQuiz!.timeLimit,
        attempts: completeQuiz!.attempts,
        lastAttemptAt: completeQuiz!.lastAttemptAt,
        questionCount: completeQuiz!._count.questions,
        createdAt: completeQuiz!.createdAt,
        questions: completeQuiz!.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          questionType: q.questionType,
          points: q.points,
          order: q.order,
          tags: q.tags,
        }))
      },
      message: `Generated quiz with ${generatedQuiz.length} questions successfully`,
    })
  } catch (error) {
    console.error("Quiz generation error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate quiz" },
      { status: 500 }
    )
  }
}