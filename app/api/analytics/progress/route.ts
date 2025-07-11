import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { progressTracker } from "@/lib/analytics/progress-tracker"
import { z } from "zod"

const progressQuerySchema = z.object({
  timeframe: z.enum(["week", "month", "all"]).optional().default("all"),
  includeCharts: z.boolean().optional().default(true),
})

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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "all"
    const includeCharts = searchParams.get("includeCharts") !== "false"

    const validatedParams = progressQuerySchema.parse({
      timeframe,
      includeCharts,
    })

    console.log(`Fetching progress data for user ${session.user.id}, timeframe: ${validatedParams.timeframe}`)

    // Get progress data based on timeframe
    let progressData

    if (validatedParams.timeframe === "week") {
      const [metrics, weeklyProgress] = await Promise.all([
        progressTracker.getUserMetrics(session.user.id),
        progressTracker.getWeeklyProgress(session.user.id),
      ])

      progressData = {
        metrics,
        weeklyProgress,
        flashcardProgress: {
          mastered: metrics.masteredFlashcards,
          learning: metrics.learningFlashcards,
          new: Math.max(0, metrics.totalFlashcards - metrics.masteredFlashcards - metrics.learningFlashcards),
          due: metrics.dueFlashcards
        }
      }
    } else if (validatedParams.timeframe === "month") {
      const [metrics, monthlyProgress] = await Promise.all([
        progressTracker.getUserMetrics(session.user.id),
        progressTracker.getMonthlyProgress(session.user.id),
      ])

      progressData = {
        metrics,
        monthlyProgress,
        flashcardProgress: {
          mastered: metrics.masteredFlashcards,
          learning: metrics.learningFlashcards,
          new: Math.max(0, metrics.totalFlashcards - metrics.masteredFlashcards - metrics.learningFlashcards),
          due: metrics.dueFlashcards
        }
      }
    } else {
      // Get full progress data
      progressData = await progressTracker.getFullProgressData(session.user.id)
    }

    console.log(`Successfully retrieved progress data for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      data: progressData,
      timeframe: validatedParams.timeframe,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Progress analytics error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters", details: error.errors },
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
      { success: false, error: "Failed to fetch progress data" },
      { status: 500 }
    )
  }
}

// Get user statistics summary
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

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "update_study_goal":
        // TODO: Implement study goal updates
        return NextResponse.json({
          success: true,
          message: "Study goal feature coming soon",
        })

      case "get_achievements":
        // TODO: Implement achievements system
        const achievements = [
          {
            id: "first_document",
            title: "Getting Started",
            description: "Upload your first document",
            earned: true,
            earnedAt: new Date().toISOString(),
          },
          {
            id: "streak_7",
            title: "Week Warrior",
            description: "Study for 7 consecutive days",
            earned: false,
          },
          {
            id: "cards_100",
            title: "Card Master",
            description: "Review 100 flashcards",
            earned: false,
          }
        ]

        return NextResponse.json({
          success: true,
          achievements,
        })

      case "export_data":
        // TODO: Implement data export
        return NextResponse.json({
          success: true,
          message: "Data export feature coming soon",
        })

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error("Progress action error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    )
  }
}