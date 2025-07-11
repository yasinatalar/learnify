import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]

const uploadSchema = z.object({
  title: z.string().nullable().optional(),
  processingOptions: z.object({
    generateFlashcards: z.boolean().default(true),
    generateQuiz: z.boolean().default(true),
    flashcardCount: z.number().min(5).max(50).default(20),
    quizQuestionCount: z.number().min(5).max(25).default(10),
    difficulty: z.enum(["easy", "medium", "hard", "mixed"]).default("mixed"),
  }).optional(),
})

// Background AI processing function
async function processDocumentAI(
  documentId: string, 
  content: string, 
  processingOptions: any, 
  userId: string
) {
  try {
    const { flashcardGenerator } = await import('@/lib/ai/flashcard-generator')
    const { quizGenerator } = await import('@/lib/ai/quiz-generator')
    const { SM2Algorithm } = await import('@/lib/spaced-repetition/sm2-algorithm')
    
    const difficulty = processingOptions?.difficulty || 'mixed'
    
    // Generate flashcards if requested
    if (processingOptions?.generateFlashcards !== false) {
      console.log('🧠 Generating flashcards...')
      const flashcardCount = processingOptions?.flashcardCount || 15
      
      try {
        const generatedFlashcards = await flashcardGenerator.generateFlashcards(
          content,
          {
            documentId: documentId,
            count: flashcardCount,
            difficulty,
            focusAreas: processingOptions?.focusAreas,
          }
        )

        // Create flashcards in database
        if (generatedFlashcards.length > 0) {
          const flashcardsToCreate = generatedFlashcards.map(flashcard => {
            const sm2Data = SM2Algorithm.createNewCard()
            return {
              documentId: documentId,
              question: flashcard.question,
              answer: flashcard.answer,
              explanation: flashcard.explanation || null,
              difficulty: flashcard.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
              tags: (flashcard.tags || []).join(','),
              interval: sm2Data.interval,
              repetition: sm2Data.repetition,
              efactor: sm2Data.efactor,
              nextReview: sm2Data.nextReview,
            }
          })

          await db.flashcard.createMany({
            data: flashcardsToCreate,
          })

          // Update user usage
          await db.userUsage.update({
            where: { userId: userId },
            data: {
              flashcardsGenerated: {
                increment: generatedFlashcards.length,
              },
            },
          })
          
          console.log(`✅ Generated ${generatedFlashcards.length} flashcards`)
        }
      } catch (error) {
        console.error('Flashcard generation error:', error)
        // Don't fail the entire upload if only flashcard generation fails
        // Just log the error and continue
      }
    }

    // Generate quiz if requested
    if (processingOptions?.generateQuiz !== false) {
      console.log('🎯 Generating quiz...')
      const quizQuestionCount = processingOptions?.quizQuestionCount || 10
      
      try {
        const generatedQuiz = await quizGenerator.generateQuiz(
          content,
          {
            documentId: documentId,
            count: quizQuestionCount,
            difficulty,
            questionTypes: ['multiple_choice', 'true_false'],
          }
        )

        // Create quiz in database
        if (generatedQuiz && generatedQuiz.length > 0) {
          // Get document title for quiz title
          const document = await db.document.findUnique({
            where: { id: documentId },
            select: { title: true }
          })
          
          const quiz = await db.quiz.create({
            data: {
              userId: userId,
              documentId: documentId,
              title: document?.title || `Document Quiz`,
              description: `Auto-generated quiz with ${generatedQuiz.length} questions`,
              difficulty: difficulty.toUpperCase(),
              timeLimit: 60, // 60 seconds per question default
              attempts: 0,
              metadata: JSON.stringify({
                generatedAt: new Date().toISOString(),
                generatedDuringUpload: true,
                questionTypes: ['multiple_choice', 'true_false'],
              }),
            }
          })

          // Create quiz questions
          const questionsToCreate = generatedQuiz.map((question, index) => ({
            quizId: quiz.id,
            question: question.question,
            options: JSON.stringify(question.options),
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || null,
            difficulty: question.difficulty?.toUpperCase() || "MEDIUM",
            questionType: question.questionType?.toUpperCase() || "MULTIPLE_CHOICE",
            points: question.points || 1,
            order: index + 1,
            tags: (question.tags || []).join(','),
          }))

          await db.quizQuestion.createMany({
            data: questionsToCreate,
          })

          // Update user usage
          await db.userUsage.update({
            where: { userId: userId },
            data: {
              quizzesGenerated: {
                increment: 1,
              },
            },
          })
          
          console.log(`✅ Generated quiz with ${generatedQuiz.length} questions`)
        }
      } catch (error) {
        console.error('Quiz generation error:', error)
        // Don't fail the entire upload if only quiz generation fails
        // Just log the error and continue
      }
    }

    // Mark document as completed
    await db.document.update({
      where: { id: documentId },
      data: { status: "COMPLETED" }
    })

    console.log(`✅ Background processing completed for document ${documentId}`)
  } catch (error) {
    console.error(`❌ Background processing failed for document ${documentId}:`, error)
    throw error
  }
}

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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const processingOptionsRaw = formData.get("processingOptions") as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "File type not supported" },
        { status: 400 }
      )
    }

    // Parse processing options
    let processingOptions
    try {
      processingOptions = processingOptionsRaw 
        ? JSON.parse(processingOptionsRaw)
        : {}
    } catch {
      processingOptions = {}
    }

    // Validate processing options
    const validatedOptions = uploadSchema.parse({
      title,
      processingOptions,
    })

    // Ensure user exists and get/create usage record
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { usage: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Please sign in again." },
        { status: 401 }
      )
    }

    let userUsage = user.usage

    if (!userUsage) {
      // Create user usage record if it doesn't exist
      try {
        userUsage = await db.userUsage.create({
          data: {
            userId: session.user.id,
            documentsProcessed: 0,
            flashcardsGenerated: 0,
            quizzesGenerated: 0,
            quizzesCompleted: 0,
            aiTokensUsed: 0,
            documentsLimit: 5, // FREE tier default
            flashcardsLimit: 100,
            quizzesLimit: 10,
            aiTokensLimit: 50000,
          },
        })
      } catch (error) {
        // Handle race condition - another request might have created it
        userUsage = await db.userUsage.findUnique({
          where: { userId: session.user.id },
        })
        if (!userUsage) {
          throw error // Re-throw if it's a different error
        }
      }
    }

    if (userUsage.documentsProcessed >= userUsage.documentsLimit) {
      return NextResponse.json(
        { success: false, error: "Document limit reached for this month" },
        { status: 403 }
      )
    }

    // Check quiz generation limit if quiz generation is requested
    if (validatedOptions.processingOptions?.generateQuiz !== false) {
      if (userUsage.quizzesGenerated >= userUsage.quizzesLimit) {
        return NextResponse.json(
          { success: false, error: "Quiz generation limit reached for this month" },
          { status: 403 }
        )
      }
    }

    // Parse document using proper parsers
    const { DocumentParserFactory } = await import('@/lib/parsers')
    console.log(file);
    const parsedDocument = await DocumentParserFactory.parseFile(file)

    // Store original file data for PDF viewing
    const fileBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(fileBuffer)

    // Create document record with PROCESSING status
    const document = await db.document.create({
      data: {
        userId: session.user.id,
        title: validatedOptions.title || parsedDocument.title,
        content: parsedDocument.content,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: fileData, // Store original file data
        status: "PROCESSING", // Start as processing, will be updated when AI generation completes
        wordCount: parsedDocument.wordCount,
        pageCount: parsedDocument.pageCount,
        language: parsedDocument.language,
        metadata: JSON.stringify({
          processingOptions: validatedOptions.processingOptions,
          uploadedAt: new Date().toISOString(),
          parsingMetadata: parsedDocument.metadata,
        }),
      },
    })

    // Update usage
    await db.userUsage.update({
      where: { userId: session.user.id },
      data: {
        documentsProcessed: {
          increment: 1,
        },
      },
    })

    // Start background AI processing (don't wait for it)
    const shouldProcessAI = validatedOptions.processingOptions?.generateFlashcards !== false || 
                           validatedOptions.processingOptions?.generateQuiz !== false
    
    if (shouldProcessAI) {
      // Process AI generation in the background
      processDocumentAI(document.id, parsedDocument.content, validatedOptions.processingOptions, session.user.id)
        .catch(error => {
          console.error('Background AI processing failed:', error)
          // Update document status to FAILED if AI processing fails
          db.document.update({
            where: { id: document.id },
            data: { status: "FAILED" }
          }).catch(console.error)
        })
    } else {
      // If no AI processing requested, mark as completed immediately
      await db.document.update({
        where: { id: document.id },
        data: { status: "COMPLETED" }
      })
    }
    return NextResponse.json({
      success: true,
      documentId: document.id,
      status: "completed",
      message: "Document uploaded and processed successfully",
      flashcardsGenerated: validatedOptions.processingOptions?.generateFlashcards !== false,
      quizGenerated: validatedOptions.processingOptions?.generateQuiz !== false,
    })
  } catch (error) {
    console.error("Upload error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}