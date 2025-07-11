import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/defaults"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Simple admin check - you can enhance this with a proper admin role system
    const isAdmin = session.user.email === process.env.ADMIN_EMAIL

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      )
    }

    // Find all users who don't have settings yet
    const usersWithoutSettings = await db.user.findMany({
      where: {
        settings: null
      },
      select: {
        id: true,
        email: true,
        name: true,
      }
    })

    console.log(`Found ${usersWithoutSettings.length} users without settings`)

    // Initialize settings for each user
    const results = []
    for (const user of usersWithoutSettings) {
      try {
        await db.userSettings.create({
          data: {
            userId: user.id,
            ...DEFAULT_USER_SETTINGS,
          }
        })
        results.push({ userId: user.id, email: user.email, status: "success" })
        console.log(`✅ Initialized settings for user: ${user.email}`)
      } catch (error) {
        console.error(`❌ Failed to initialize settings for user: ${user.email}`, error)
        results.push({ userId: user.id, email: user.email, status: "error", error: error.message })
      }
    }

    const successCount = results.filter(r => r.status === "success").length
    const errorCount = results.filter(r => r.status === "error").length

    return NextResponse.json({
      success: true,
      message: `Settings initialization completed`,
      stats: {
        total: usersWithoutSettings.length,
        success: successCount,
        errors: errorCount,
      },
      results
    })
  } catch (error) {
    console.error("Settings initialization error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to initialize settings" },
      { status: 500 }
    )
  }
}