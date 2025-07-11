import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get overall stats
    const [
      documentsCount,
      flashcardsCount,
      quizzesCount,
      summariesCount,
      recentDocuments,
      dueFlashcards,
      userUsage
    ] = await Promise.all([
      // Total documents
      db.document.count({
        where: { userId: session.user.id }
      }),
      
      // Total flashcards
      db.flashcard.count({
        where: { 
          document: { userId: session.user.id }
        }
      }),
      
      // Total quizzes
      db.quiz.count({
        where: { 
          document: { userId: session.user.id }
        }
      }),
      
      // Total summaries
      db.summary.count({
        where: { userId: session.user.id }
      }),
      
      // Recent documents
      db.document.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              flashcards: true,
              quizzes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      }),
      
      // Due flashcards
      db.flashcard.count({
        where: {
          document: { userId: session.user.id },
          nextReview: {
            lte: new Date()
          }
        }
      }),
      
      // User usage stats
      db.userUsage.findUnique({
        where: { userId: session.user.id }
      })
    ])

    // Calculate quiz score (average from recent quiz attempts)
    const recentQuizAttempts = await db.quizAttempt.findMany({
      where: {
        quiz: {
          document: { userId: session.user.id }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const averageScore = recentQuizAttempts.length > 0
      ? Math.round(recentQuizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentQuizAttempts.length)
      : 0

    // Calculate study streak (simplified - days with flashcard reviews)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const recentReviews = await db.flashcardReview.findMany({
      where: {
        flashcard: {
          document: { userId: session.user.id }
        },
        createdAt: {
          gte: oneWeekAgo
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Count consecutive days with reviews
    const reviewDates = [...new Set(
      recentReviews.map(review => 
        review.createdAt.toISOString().split('T')[0]
      )
    )].sort().reverse()

    let studyStreak = 0
    const today = new Date().toISOString().split('T')[0]
    
    for (let i = 0; i < reviewDates.length; i++) {
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]
      
      if (reviewDates[i] === expectedDateStr) {
        studyStreak++
      } else {
        break
      }
    }

    // Weekly progress stats
    const weeklyReviews = await db.flashcardReview.count({
      where: {
        flashcard: {
          document: { userId: session.user.id }
        },
        createdAt: {
          gte: oneWeekAgo
        }
      }
    })

    const correctReviews = await db.flashcardReview.count({
      where: {
        flashcard: {
          document: { userId: session.user.id }
        },
        createdAt: {
          gte: oneWeekAgo
        },
        rating: {
          gte: 3
        }
      }
    })

    const accuracyRate = weeklyReviews > 0 ? Math.round((correctReviews / weeklyReviews) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: {
        documents: documentsCount,
        flashcards: flashcardsCount,
        quizzes: quizzesCount,
        summaries: summariesCount,
        averageQuizScore: averageScore,
        studyStreak,
        dueFlashcards,
        weeklyProgress: {
          cardsReviewed: weeklyReviews,
          accuracyRate,
          studyTime: Math.round(weeklyReviews * 0.5) // Estimate 30 seconds per card
        }
      },
      recentDocuments: recentDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        createdAt: doc.createdAt,
        flashcardsCount: doc._count.flashcards,
        quizzesCount: doc._count.quizzes
      })),
      usage: userUsage
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}