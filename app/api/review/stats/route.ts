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

    // Get flashcards due for review
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [flashcards, reviewsToday, recentReviews] = await Promise.all([
      db.flashcard.findMany({
        where: {
          document: { userId }
        },
        select: {
          id: true,
          nextReview: true,
          createdAt: true
        }
      }),
      db.flashcardReview.findMany({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      db.flashcardReview.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ])

    // Calculate due cards
    const dueToday = flashcards.filter(card => 
      card.nextReview && card.nextReview <= now
    ).length

    const dueThisWeek = flashcards.filter(card => 
      card.nextReview && card.nextReview <= weekFromNow
    ).length

    // Calculate study streak
    const streak = calculateStudyStreak(recentReviews)

    // Count reviews today
    const reviewedToday = reviewsToday.length

    const stats = {
      dueToday,
      dueThisWeek,
      streak,
      reviewedToday
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error("Error fetching review stats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch review stats" },
      { status: 500 }
    )
  }
}

function calculateStudyStreak(reviews: any[]): number {
  if (reviews.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  const reviewDates = [...new Set(reviews.map(r => {
    const date = new Date(r.createdAt)
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  }))].sort((a, b) => b - a)

  for (let i = 0; i < reviewDates.length; i++) {
    if (reviewDates[i] === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (reviewDates[i] < currentDate.getTime()) {
      break
    }
  }

  return streak
}