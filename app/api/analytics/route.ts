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

    // Get overview stats
    const [
      documentsCount,
      flashcardsCount,
      quizzesCount,
      summariesCount,
      flashcardReviews,
      quizAttempts,
      userUsage
    ] = await Promise.all([
      db.document.count({
        where: { userId, status: 'COMPLETED' }
      }),
      db.flashcard.count({
        where: { document: { userId } }
      }),
      db.quiz.count({
        where: { userId }
      }),
      db.summary.count({
        where: { userId }
      }),
      db.flashcardReview.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      db.quizAttempt.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 50
      }),
      db.userUsage.findUnique({
        where: { userId }
      })
    ])

    // Calculate total study time (in minutes)
    const totalStudyTime = [
      ...flashcardReviews.map(r => r.timeSpent || 0),
      ...quizAttempts.map(a => a.totalTime || 0)
    ].reduce((sum, time) => sum + time, 0)

    // Calculate average quiz score
    const validAttempts = quizAttempts.filter(a => a.accuracy !== null && a.accuracy !== undefined)
    const averageScore = validAttempts.length > 0 
      ? validAttempts.reduce((sum, attempt) => sum + (attempt.accuracy || 0), 0) / validAttempts.length
      : 0

    // Calculate study streak
    const studyStreak = calculateStudyStreak(flashcardReviews, quizAttempts)

    // Weekly progress (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklyReviews = flashcardReviews.filter(r => r.createdAt >= weekAgo)
    const weeklyAttempts = quizAttempts.filter(a => a.completedAt >= weekAgo)
    
    const weeklyProgress = {
      cardsReviewed: weeklyReviews.length,
      accuracyRate: weeklyAttempts.length > 0 
        ? weeklyAttempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / weeklyAttempts.length
        : 0,
      studyTime: [...weeklyReviews.map(r => r.timeSpent || 0), ...weeklyAttempts.map(a => a.totalTime || 0)]
        .reduce((sum, time) => sum + time, 0)
    }

    // Monthly trends (last 30 days)
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const monthlyReviews = flashcardReviews.filter(r => r.createdAt >= monthAgo)
    const monthlyAttempts = quizAttempts.filter(a => a.completedAt >= monthAgo)
    
    const studyDays = new Set([
      ...monthlyReviews.map(r => r.createdAt.toDateString()),
      ...monthlyAttempts.map(a => a.completedAt.toDateString())
    ]).size

    const monthlyStudyTime = [...monthlyReviews.map(r => r.timeSpent || 0), ...monthlyAttempts.map(a => a.totalTime || 0)]
      .reduce((sum, time) => sum + time, 0)

    const avgSessionLength = studyDays > 0 ? Math.round(monthlyStudyTime / studyDays) : 0

    // Calculate improvement rate (simplified)
    const improvementRate = calculateImprovementRate(quizAttempts)

    const analytics = {
      overview: {
        totalStudyTime: Math.round(totalStudyTime / 60), // Convert to minutes
        averageScore: Math.round(averageScore),
        studyStreak,
        documentsProcessed: documentsCount,
        flashcardsReviewed: flashcardReviews.length,
        quizzesCompleted: quizAttempts.length
      },
      weeklyProgress,
      monthlyTrends: {
        studyDays,
        avgSessionLength,
        improvementRate
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

function calculateStudyStreak(reviews: any[], attempts: any[]): number {
  const allActivity = [
    ...reviews.map(r => r.createdAt),
    ...attempts.map(a => a.completedAt)
  ].sort((a, b) => b.getTime() - a.getTime())

  if (allActivity.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (let i = 0; i < allActivity.length; i++) {
    const activityDate = new Date(allActivity[i])
    activityDate.setHours(0, 0, 0, 0)

    if (activityDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (activityDate.getTime() < currentDate.getTime()) {
      break
    }
  }

  return streak
}

function calculateImprovementRate(attempts: any[]): number {
  if (attempts.length < 2) return 0

  const recent = attempts.slice(0, Math.min(10, attempts.length))
  const older = attempts.slice(Math.min(10, attempts.length), Math.min(20, attempts.length))

  if (older.length === 0) return 0

  const recentAvg = recent.reduce((sum, a) => sum + (a.accuracy || 0), 0) / recent.length
  const olderAvg = older.reduce((sum, a) => sum + (a.accuracy || 0), 0) / older.length

  return Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
}