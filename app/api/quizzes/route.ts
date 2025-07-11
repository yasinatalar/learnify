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

    const quizzes = await db.quiz.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
          },
        },
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            correctAnswer: true,
            explanation: true,
            difficulty: true,
            questionType: true,
            points: true,
            order: true,
            tags: true,
          },
          orderBy: { order: "asc" },
        },
        quizAttempts: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            score: true,
            totalPoints: true,
            accuracy: true,
            totalTime: true,
            completedAt: true,
          },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    const transformedQuizzes = quizzes.map(quiz => {
      const lastAttempt = quiz.quizAttempts[0]
      
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty.toLowerCase(),
        questionCount: quiz.questions.length,
        estimatedTime: quiz.timeLimit ? Math.ceil(quiz.questions.length * quiz.timeLimit / 60) : 20,
        topics: quiz.questions.flatMap(q => q.tags ? q.tags.split(',').filter(Boolean) : []),
        createdAt: quiz.createdAt,
        attempts: quiz.attempts,
        bestScore: quiz.quizAttempts.length > 0 ? Math.max(...quiz.quizAttempts.map(a => Math.round((a.score / a.totalPoints) * 100))) : undefined,
        lastAttempt: lastAttempt ? {
          score: lastAttempt.score,
          totalPoints: lastAttempt.totalPoints,
          accuracy: lastAttempt.accuracy,
          completedAt: lastAttempt.completedAt,
        } : undefined,
        documentId: quiz.documentId,
        documentTitle: quiz.document?.title,
        questions: quiz.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: JSON.parse(q.options),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty.toLowerCase(),
          questionType: q.questionType.toLowerCase(),
          points: q.points,
          tags: q.tags ? q.tags.split(',').filter(Boolean) : [],
        })),
      }
    })

    return NextResponse.json({
      success: true,
      quizzes: transformedQuizzes,
      count: transformedQuizzes.length,
    })

  } catch (error) {
    console.error("Error fetching quizzes:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch quizzes" },
      { status: 500 }
    )
  }
}