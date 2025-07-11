import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const settingsSchema = z.object({
  // Profile settings
  timezone: z.string().optional(),
  language: z.string().optional(),
  
  // Notification preferences
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  studyReminders: z.boolean().optional(),
  weeklyProgress: z.boolean().optional(),
  newFeatures: z.boolean().optional(),
  
  // Learning preferences
  defaultDifficulty: z.enum(["easy", "medium", "hard", "mixed"]).optional(),
  autoGenerateFlashcards: z.boolean().optional(),
  autoGenerateQuiz: z.boolean().optional(),
  spacedRepetitionEnabled: z.boolean().optional(),
  dailyGoal: z.number().min(5).max(600).optional(),
  preferredStudyTime: z.enum(["morning", "afternoon", "evening", "night"]).optional(),
  
  // Privacy settings
  profileVisible: z.boolean().optional(),
  shareProgress: z.boolean().optional(),
  dataCollection: z.boolean().optional(),
  analytics: z.boolean().optional(),
  
  // Appearance settings
  theme: z.enum(["light", "dark", "system"]).optional(),
  compactMode: z.boolean().optional(),
  animations: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user settings, create default if not exists
    let userSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id }
    })

    if (!userSettings) {
      userSettings = await db.userSettings.create({
        data: {
          userId: session.user.id,
          // Default values are set in the schema
        }
      })
    }

    // Convert to frontend format
    const settings = {
      profile: {
        name: session.user.name || "",
        email: session.user.email || "",
        timezone: userSettings.timezone,
        language: userSettings.language,
      },
      notifications: {
        email: userSettings.emailNotifications,
        push: userSettings.pushNotifications,
        studyReminders: userSettings.studyReminders,
        weeklyProgress: userSettings.weeklyProgress,
        newFeatures: userSettings.newFeatures,
      },
      learning: {
        defaultDifficulty: userSettings.defaultDifficulty,
        autoGenerateFlashcards: userSettings.autoGenerateFlashcards,
        autoGenerateQuiz: userSettings.autoGenerateQuiz,
        spacedRepetitionEnabled: userSettings.spacedRepetitionEnabled,
        dailyGoal: userSettings.dailyGoal,
        preferredStudyTime: userSettings.preferredStudyTime,
      },
      privacy: {
        profileVisible: userSettings.profileVisible,
        shareProgress: userSettings.shareProgress,
        dataCollection: userSettings.dataCollection,
        analytics: userSettings.analytics,
      },
      appearance: {
        theme: userSettings.theme,
        compactMode: userSettings.compactMode,
        animations: userSettings.animations,
      }
    }

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    // Update user settings
    const updatedSettings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
      }
    })

    // Also update user name/email if provided
    if (body.profile?.name !== undefined) {
      await db.user.update({
        where: { id: session.user.id },
        data: { name: body.profile.name }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings
    })
  } catch (error) {
    console.error("Settings update error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid settings data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    )
  }
}