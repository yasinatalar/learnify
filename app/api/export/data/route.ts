import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch all user data
    const [user, documents, flashcards, quizzes, quizAttempts, flashcardReviews, userUsage, userSettings] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          subscriptionTier: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      db.document.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          originalName: true,
          fileType: true,
          fileSize: true,
          status: true,
          wordCount: true,
          pageCount: true,
          language: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      db.flashcard.findMany({
        where: { 
          document: { userId }
        },
        select: {
          id: true,
          question: true,
          answer: true,
          explanation: true,
          difficulty: true,
          tags: true,
          interval: true,
          repetition: true,
          efactor: true,
          nextReview: true,
          createdAt: true,
          updatedAt: true,
          documentId: true,
        }
      }),
      db.quiz.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          timeLimit: true,
          attempts: true,
          lastAttemptAt: true,
          createdAt: true,
          updatedAt: true,
          documentId: true,
        }
      }),
      db.quizAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          quizId: true,
          score: true,
          totalQuestions: true,
          correctAnswers: true,
          timeSpent: true,
          completedAt: true,
          createdAt: true,
        }
      }),
      db.flashcardReview.findMany({
        where: { userId },
        select: {
          id: true,
          flashcardId: true,
          rating: true,
          timeSpent: true,
          createdAt: true,
        }
      }),
      db.userUsage.findUnique({
        where: { userId },
        select: {
          documentsProcessed: true,
          flashcardsGenerated: true,
          quizzesGenerated: true,
          quizzesCompleted: true,
          aiTokensUsed: true,
          documentsLimit: true,
          flashcardsLimit: true,
          quizzesLimit: true,
          aiTokensLimit: true,
          lastReset: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      db.userSettings.findUnique({
        where: { userId },
        select: {
          timezone: true,
          language: true,
          emailNotifications: true,
          pushNotifications: true,
          studyReminders: true,
          weeklyProgress: true,
          newFeatures: true,
          defaultDifficulty: true,
          autoGenerateFlashcards: true,
          autoGenerateQuiz: true,
          spacedRepetitionEnabled: true,
          dailyGoal: true,
          preferredStudyTime: true,
          profileVisible: true,
          shareProgress: true,
          dataCollection: true,
          analytics: true,
          theme: true,
          compactMode: true,
          animations: true,
          createdAt: true,
          updatedAt: true,
        }
      })
    ])

    // Prepare export data
    const exportData = {
      exportInfo: {
        userId,
        exportedAt: new Date().toISOString(),
        version: "1.0",
        format: "JSON"
      },
      user,
      documents,
      flashcards,
      quizzes,
      quizAttempts,
      flashcardReviews,
      userUsage,
      userSettings,
      statistics: {
        totalDocuments: documents.length,
        totalFlashcards: flashcards.length,
        totalQuizzes: quizzes.length,
        totalQuizAttempts: quizAttempts.length,
        totalFlashcardReviews: flashcardReviews.length,
        averageQuizScore: quizAttempts.length > 0 
          ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
          : 0,
        totalStudyTime: flashcardReviews.reduce((sum, review) => sum + (review.timeSpent || 0), 0) +
                       quizAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0),
      }
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `learnify-data-export-${timestamp}.json`

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Data export error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to export data" },
      { status: 500 }
    )
  }
}