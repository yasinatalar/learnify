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

    // Get user's available data
    const [documents, flashcards, quizzes, summaries] = await Promise.all([
      db.document.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, status: true }
      }),
      db.flashcard.findMany({
        where: { document: { userId: session.user.id } },
        select: { documentId: true },
        distinct: ['documentId']
      }),
      db.quiz.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true }
      }),
      db.summary.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, document: { select: { title: true } } }
      })
    ])

    const items = [
      ...documents.filter(doc => doc.status === 'COMPLETED').map(doc => ({
        id: doc.id,
        type: 'document' as const,
        title: doc.title,
        selected: false
      })),
      ...flashcards.map(fc => ({
        id: `flashcards_${fc.documentId}`,
        type: 'flashcards' as const,
        title: `Flashcards from ${documents.find(d => d.id === fc.documentId)?.title || 'Document'}`,
        selected: false
      })),
      ...quizzes.map(quiz => ({
        id: quiz.id,
        type: 'quizzes' as const,
        title: quiz.title,
        selected: false
      })),
      ...summaries.map(summary => ({
        id: summary.id,
        type: 'summaries' as const,
        title: summary.title,
        selected: false
      }))
    ]

    // Add analytics if user has activity
    const hasActivity = documents.length > 0 || flashcards.length > 0 || quizzes.length > 0 || summaries.length > 0
    if (hasActivity) {
      items.push({
        id: 'analytics',
        type: 'analytics' as const,
        title: 'Learning Analytics Data',
        selected: false
      })
    }

    return NextResponse.json({
      success: true,
      items
    })

  } catch (error) {
    console.error("Error fetching export items:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch export items" },
      { status: 500 }
    )
  }
}