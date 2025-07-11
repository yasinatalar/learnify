import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const quizId = params.id

    const quiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id,
      },
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
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      )
    }

    const transformedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty.toLowerCase(),
      questionCount: quiz.questions.length,
      estimatedTime: quiz.timeLimit ? Math.ceil(quiz.questions.length * quiz.timeLimit / 60) : 20,
      topics: quiz.questions.flatMap(q => q.tags ? q.tags.split(',').filter(Boolean) : []),
      createdAt: quiz.createdAt,
      attempts: quiz.attempts,
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

    return NextResponse.json({
      success: true,
      quiz: transformedQuiz,
    })

  } catch (error) {
    console.error("Error fetching quiz:", error)

    return NextResponse.json(
      { success: false, error: "Failed to fetch quiz" },
      { status: 500 }
    )
  }
}