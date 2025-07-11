import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const quizAnswerSchema = z.object({
  questionId: z.string().cuid(),
  selectedAnswer: z.union([z.number(), z.string()]),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0),
  pointsEarned: z.number().min(0),
})

const submitQuizAttemptSchema = z.object({
  answers: z.array(quizAnswerSchema),
  totalTime: z.number().min(0),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Parse and validate request
    const body = await request.json()
    const validatedData = submitQuizAttemptSchema.parse(body)
    const quizId = params.id

    // Verify quiz exists and belongs to user or is accessible
    const quiz = await db.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id,
      },
      include: {
        questions: {
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

    // Validate answers against quiz questions
    const answersByQuestionId = validatedData.answers.reduce((acc, answer) => {
      acc[answer.questionId] = answer
      return acc
    }, {} as Record<string, typeof validatedData.answers[0]>)

    const questionsById = quiz.questions.reduce((acc, question) => {
      acc[question.id] = question
      return acc
    }, {} as Record<string, typeof quiz.questions[0]>)

    // Verify all questions are answered
    const missingAnswers = quiz.questions.filter(q => !answersByQuestionId[q.id])
    if (missingAnswers.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing answers for ${missingAnswers.length} questions` },
        { status: 400 }
      )
    }

    // Calculate scores and verify answer correctness
    let totalScore = 0
    let totalPossiblePoints = 0
    let correctAnswers = 0

    const processedAnswers = validatedData.answers.map(answer => {
      const question = questionsById[answer.questionId]
      if (!question) {
        throw new Error(`Question ${answer.questionId} not found in quiz`)
      }

      totalPossiblePoints += question.points

      // Verify answer correctness
      let isActuallyCorrect = false
      
      if (question.questionType === "FILL_BLANK") {
        // For fill-in-the-blank, check if the answer matches the correct option
        const correctOption = question.options[question.correctAnswer]
        isActuallyCorrect = typeof answer.selectedAnswer === "string" && 
          answer.selectedAnswer.toLowerCase().trim() === correctOption.toLowerCase().trim()
      } else {
        // For multiple choice and true/false
        isActuallyCorrect = typeof answer.selectedAnswer === "number" && 
          answer.selectedAnswer === question.correctAnswer
      }

      if (isActuallyCorrect) {
        correctAnswers++
        totalScore += question.points
      }

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect: isActuallyCorrect,
        timeSpent: answer.timeSpent,
        pointsEarned: isActuallyCorrect ? question.points : 0,
      }
    })

    const accuracy = quiz.questions.length > 0 ? (correctAnswers / quiz.questions.length) * 100 : 0
    const scorePercentage = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0

    // Create quiz attempt in database
    const quizAttempt = await db.quizAttempt.create({
      data: {
        quizId: quizId,
        userId: session.user.id,
        score: totalScore,
        totalPoints: totalPossiblePoints,
        accuracy: accuracy,
        totalTime: validatedData.totalTime,
        startedAt: new Date(validatedData.startedAt),
        completedAt: new Date(validatedData.completedAt),
        answers: processedAnswers,
      },
    })

    // Update quiz statistics
    await db.quiz.update({
      where: { id: quizId },
      data: {
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    })

    // Update user quiz statistics
    await db.userUsage.update({
      where: { userId: session.user.id },
      data: {
        quizzesCompleted: { increment: 1 },
      },
    })

    console.log(`Quiz attempt completed: ${quizAttempt.id}, Score: ${totalScore}/${totalPossiblePoints} (${Math.round(scorePercentage)}%)`)

    return NextResponse.json({
      success: true,
      attempt: {
        id: quizAttempt.id,
        score: totalScore,
        totalPoints: totalPossiblePoints,
        accuracy: accuracy,
        scorePercentage: scorePercentage,
        totalTime: validatedData.totalTime,
        correctAnswers: correctAnswers,
        totalQuestions: quiz.questions.length,
        completedAt: quizAttempt.completedAt,
      },
      message: `Quiz completed! Score: ${totalScore}/${totalPossiblePoints} (${Math.round(scorePercentage)}%)`,
    })

  } catch (error) {
    console.error("Quiz attempt submission error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to submit quiz attempt" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const quizId = params.id

    // Get quiz attempts for this user
    const attempts = await db.quizAttempt.findMany({
      where: {
        quizId: quizId,
        userId: session.user.id,
      },
      orderBy: { completedAt: "desc" },
      take: 10, // Last 10 attempts
    })

    return NextResponse.json({
      success: true,
      attempts: attempts.map(attempt => ({
        id: attempt.id,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        accuracy: attempt.accuracy,
        scorePercentage: attempt.totalPoints > 0 ? (attempt.score / attempt.totalPoints) * 100 : 0,
        totalTime: attempt.totalTime,
        completedAt: attempt.completedAt,
      })),
    })

  } catch (error) {
    console.error("Error fetching quiz attempts:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch quiz attempts" },
      { status: 500 }
    )
  }
}