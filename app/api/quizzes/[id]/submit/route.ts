import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const answerSchema = z.object({
  questionId: z.string(),
  selectedAnswer: z.union([z.number(), z.string()]),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0),
  pointsEarned: z.number().min(0),
})

const submitSchema = z.object({
  answers: z.array(answerSchema),
  totalTime: z.number().min(0),
  startedAt: z.string().datetime(),
})

export async function POST(
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
    const body = await request.json()
    const { answers, totalTime, startedAt } = submitSchema.parse(body)

    // Verify quiz exists and belongs to user
    const quiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id,
      },
      include: {
        questions: true,
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: "Quiz not found" },
        { status: 404 }
      )
    }

    // Calculate score and statistics
    const score = answers.reduce((sum, answer) => sum + answer.pointsEarned, 0)
    const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0)
    const correctAnswers = answers.filter(a => a.isCorrect).length
    const accuracy = (correctAnswers / answers.length) * 100

    // Create quiz attempt in transaction
    const result = await db.$transaction(async (tx) => {
      // Create quiz attempt
      const quizAttempt = await tx.quizAttempt.create({
        data: {
          quizId,
          userId: session.user.id,
          score,
          totalPoints,
          accuracy,
          totalTime,
          startedAt: new Date(startedAt),
          completedAt: new Date(),
          answers: JSON.stringify(answers),
        },
      })

      // Update quiz attempt count
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      })

      // Update user usage
      await tx.userUsage.update({
        where: { userId: session.user.id },
        data: {
          quizzesCompleted: { increment: 1 },
        },
      })

      return quizAttempt
    })

    return NextResponse.json({
      success: true,
      attempt: {
        id: result.id,
        score,
        totalPoints,
        accuracy,
        totalTime,
        correctAnswers,
        totalQuestions: answers.length,
        completedAt: result.completedAt,
        percentage: Math.round((score / totalPoints) * 100),
      },
      message: "Quiz submitted successfully",
    })

  } catch (error) {
    console.error("Error submitting quiz:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid submission data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to submit quiz" },
      { status: 500 }
    )
  }
}