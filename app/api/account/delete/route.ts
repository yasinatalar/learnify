import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const deleteAccountSchema = z.object({
  confirmText: z.string().refine(val => val === "DELETE MY ACCOUNT", {
    message: "You must type 'DELETE MY ACCOUNT' to confirm deletion"
  }),
  password: z.string().min(1, "Password is required for account deletion"),
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
    const validatedData = deleteAccountSchema.parse(body)

    // TODO: Add password verification here
    // For now, we'll skip password verification since NextAuth handles OAuth
    // In a production app, you'd want to verify the password for security

    const userId = session.user.id

    // Start a transaction to delete all user data
    await db.$transaction(async (tx) => {
      // Delete in correct order to respect foreign key constraints
      
      // Delete flashcard reviews first
      await tx.flashcardReview.deleteMany({
        where: { userId }
      })
      
      // Delete quiz attempts
      await tx.quizAttempt.deleteMany({
        where: { userId }
      })
      
      // Delete quiz questions (cascade from quizzes)
      const userQuizzes = await tx.quiz.findMany({
        where: { userId },
        select: { id: true }
      })
      
      for (const quiz of userQuizzes) {
        await tx.quizQuestion.deleteMany({
          where: { quizId: quiz.id }
        })
      }
      
      // Delete quizzes
      await tx.quiz.deleteMany({
        where: { userId }
      })
      
      // Delete flashcards
      await tx.flashcard.deleteMany({
        where: { 
          document: { userId }
        }
      })
      
      // Delete documents
      await tx.document.deleteMany({
        where: { userId }
      })
      
      // Delete user usage
      await tx.userUsage.deleteMany({
        where: { userId }
      })
      
      // Delete user settings
      await tx.userSettings.deleteMany({
        where: { userId }
      })
      
      // Delete user sessions
      await tx.session.deleteMany({
        where: { userId }
      })
      
      // Delete user accounts
      await tx.account.deleteMany({
        where: { userId }
      })
      
      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    })
  } catch (error) {
    console.error("Account deletion error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid confirmation data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete account" },
      { status: 500 }
    )
  }
}