import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth.config'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        documents: [], 
        flashcards: [], 
        quizzes: [],
        total: 0 
      })
    }

    const searchTerm = query.trim().toLowerCase()

    // Search documents
    const documents = await db.document.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { title: { contains: searchTerm } },
          { originalName: { contains: searchTerm } },
          { content: { contains: searchTerm } }
        ]
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        status: true,
        fileType: true,
        createdAt: true,
        updatedAt: true
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })

    // Search flashcards
    const flashcards = await db.flashcard.findMany({
      where: {
        document: { userId: session.user.id },
        OR: [
          { question: { contains: searchTerm } },
          { answer: { contains: searchTerm } },
          { tags: { contains: searchTerm } }
        ]
      },
      select: {
        id: true,
        question: true,
        answer: true,
        difficulty: true,
        tags: true,
        nextReview: true,
        document: {
          select: {
            id: true,
            title: true
          }
        }
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })

    // Search quizzes
    const quizzes = await db.quiz.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } }
        ]
      },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        attempts: true,
        lastAttemptAt: true,
        document: {
          select: {
            id: true,
            title: true
          }
        },
        _count: {
          select: { questions: true }
        }
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })

    // Search quiz questions for more comprehensive search
    const quizQuestions = await db.quizQuestion.findMany({
      where: {
        quiz: { userId: session.user.id },
        OR: [
          { question: { contains: searchTerm } },
          { tags: { contains: searchTerm } }
        ]
      },
      select: {
        id: true,
        question: true,
        quiz: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            document: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      take: limit,
      orderBy: { updatedAt: 'desc' }
    })

    // Combine quiz results with question matches
    const allQuizzes = [...quizzes]
    for (const question of quizQuestions) {
      const existingQuiz = allQuizzes.find(q => q.id === question.quiz.id)
      if (!existingQuiz) {
        allQuizzes.push({
          id: question.quiz.id,
          title: question.quiz.title,
          description: `Contains: "${question.question.substring(0, 100)}..."`,
          difficulty: question.quiz.difficulty,
          attempts: 0,
          lastAttemptAt: null,
          document: question.quiz.document,
          _count: { questions: 0 }
        })
      }
    }

    const total = documents.length + flashcards.length + allQuizzes.length

    return NextResponse.json({
      documents,
      flashcards,
      quizzes: allQuizzes.slice(0, limit),
      total
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}