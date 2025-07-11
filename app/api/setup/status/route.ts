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

    // Check if user has completed setup
    const userSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        setupCompleted: true,
        createdAt: true,
      }
    })

    const setupCompleted = userSettings?.setupCompleted ?? false

    return NextResponse.json({
      success: true,
      setupCompleted,
      isNewUser: !userSettings || !setupCompleted,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      }
    })
  } catch (error) {
    console.error("Setup status check error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to check setup status" },
      { status: 500 }
    )
  }
}