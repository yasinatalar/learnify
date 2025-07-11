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

    // Get user usage data
    const usage = await db.userUsage.findUnique({
      where: { userId: session.user.id },
      select: {
        documentsProcessed: true,
        flashcardsGenerated: true,
        quizzesGenerated: true,
        quizzesCompleted: true,
        summariesGenerated: true,
        aiTokensUsed: true,
        documentsLimit: true,
        flashcardsLimit: true,
        quizzesLimit: true,
        summariesLimit: true,
        aiTokensLimit: true,
        lastReset: true,
      }
    })

    if (!usage) {
      // Create usage record if it doesn't exist (edge case)
      const newUsage = await db.userUsage.create({
        data: {
          userId: session.user.id,
          documentsProcessed: 0,
          flashcardsGenerated: 0,
          quizzesGenerated: 0,
          quizzesCompleted: 0,
          summariesGenerated: 0,
          aiTokensUsed: 0,
          documentsLimit: 5, // FREE tier default
          flashcardsLimit: 100,
          quizzesLimit: 10,
          summariesLimit: 10,
          aiTokensLimit: 50000,
        },
        select: {
          documentsProcessed: true,
          flashcardsGenerated: true,
          quizzesGenerated: true,
          quizzesCompleted: true,
          summariesGenerated: true,
          aiTokensUsed: true,
          documentsLimit: true,
          flashcardsLimit: true,
          quizzesLimit: true,
          summariesLimit: true,
          aiTokensLimit: true,
          lastReset: true,
        }
      })
      
      const documentsProgress = Math.round((newUsage.documentsProcessed / newUsage.documentsLimit) * 100)
      const flashcardsProgress = Math.round((newUsage.flashcardsGenerated / newUsage.flashcardsLimit) * 100)
      const quizzesProgress = Math.round((newUsage.quizzesGenerated / newUsage.quizzesLimit) * 100)
      const summariesProgress = Math.round((newUsage.summariesGenerated / newUsage.summariesLimit) * 100)
      const tokensProgress = Math.round((newUsage.aiTokensUsed / newUsage.aiTokensLimit) * 100)

      return NextResponse.json({
        success: true,
        usage: {
          ...newUsage,
          documentsProgress,
          flashcardsProgress,
          quizzesProgress,
          summariesProgress,
          tokensProgress,
        }
      })
    }

    // Calculate percentages for progress bars
    const documentsProgress = Math.round((usage.documentsProcessed / usage.documentsLimit) * 100)
    const flashcardsProgress = Math.round((usage.flashcardsGenerated / usage.flashcardsLimit) * 100)
    const quizzesProgress = Math.round((usage.quizzesGenerated / usage.quizzesLimit) * 100)
    const summariesProgress = Math.round((usage.summariesGenerated / usage.summariesLimit) * 100)
    const tokensProgress = Math.round((usage.aiTokensUsed / usage.aiTokensLimit) * 100)

    return NextResponse.json({
      success: true,
      usage: {
        ...usage,
        documentsProgress,
        flashcardsProgress,
        quizzesProgress,
        summariesProgress,
        tokensProgress,
      }
    })
  } catch (error) {
    console.error("Usage fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch usage data" },
      { status: 500 }
    )
  }
}