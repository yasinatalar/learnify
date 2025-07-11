import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const setupSchema = z.object({
  // Profile
  fullName: z.string().min(1, "Full name is required").max(100, "Full name too long"),
  timezone: z.string().optional(),
  language: z.string().optional(),
  
  // Learning preferences
  defaultDifficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  autoGenerateFlashcards: z.boolean(),
  autoGenerateQuiz: z.boolean(),
  spacedRepetitionEnabled: z.boolean(),
  dailyGoal: z.number().min(5).max(600),
  preferredStudyTime: z.enum(["morning", "afternoon", "evening", "night"]),
  
  // Notifications
  emailNotifications: z.boolean(),
  studyReminders: z.boolean(),
  weeklyProgress: z.boolean(),
  
  // Privacy
  dataCollection: z.boolean(),
  analytics: z.boolean(),
  
  // Appearance
  theme: z.enum(["light", "dark", "system"]),
  animations: z.boolean(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = setupSchema.parse(body)

    // Extract full name from validated data
    const { fullName, ...settingsData } = validatedData

    // Update user's full name
    await db.user.update({
      where: { id: session.user.id },
      data: { name: fullName }
    })

    // Update user settings with setup data and mark setup as completed
    await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...settingsData,
        setupCompleted: true,
      },
      create: {
        userId: session.user.id,
        ...settingsData,
        setupCompleted: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully"
    })
  } catch (error) {
    console.error("Setup completion error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid setup data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to complete setup" },
      { status: 500 }
    )
  }
}