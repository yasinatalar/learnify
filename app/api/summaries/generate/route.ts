import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { generateSummary, AIProvider, AIModel, AIProviders } from "@/lib/ai-providers"

const generateSchema = z.object({
  documentId: z.string().cuid(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().default("MEDIUM"),
  includeExamples: z.boolean().optional().default(true),
  focusAreas: z.array(z.string()).optional().default([]),
  aiProvider: z.enum(["openai", "anthropic"]).optional().default("openai"),
  model: z.string().optional().default("gpt-4o"),
  language: z.string().optional().default("en"),
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
    const { documentId, difficulty, includeExamples, focusAreas, aiProvider, model, language } = generateSchema.parse(body)

    // Validate the model for the selected provider
    if (!AIProviders.isValidModel(aiProvider as AIProvider, model)) {
      return NextResponse.json(
        { success: false, error: `Invalid model '${model}' for provider '${aiProvider}'` },
        { status: 400 }
      )
    }

    // Get the document
    const document = await db.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      )
    }

    // Check if summary already exists
    const existingSummary = await db.summary.findFirst({
      where: {
        documentId: documentId,
        userId: session.user.id,
      },
    })

    if (existingSummary) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Summary already exists for this document", 
          details: "Each document can only have one summary. Please select a different document or delete the existing summary first." 
        },
        { status: 409 }
      )
    }

    // Check user usage limits
    const userUsage = await db.userUsage.findFirst({
      where: { userId: session.user.id },
    })

    if (userUsage && userUsage.summariesGenerated >= userUsage.summariesLimit) {
      return NextResponse.json(
        { success: false, error: "Monthly summary limit reached" },
        { status: 429 }
      )
    }

    // Generate summary using selected AI provider
    const startTime = Date.now()
    
    const aiResponse = await generateSummary({
      provider: aiProvider as AIProvider,
      model: model as AIModel,
      documentTitle: document.title,
      documentContent: document.content,
      difficulty,
      includeExamples,
      focusAreas,
      language,
    })

    const generationTime = Math.round((Date.now() - startTime) / 1000)

    let summaryData
    try {
      // Clean the response content - remove markdown code blocks if present
      let cleanContent = aiResponse.content.trim()
      
      // Remove markdown code blocks (```json and ```)
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // Remove any text before the first { and after the last }
      const firstBrace = cleanContent.indexOf('{')
      const lastBrace = cleanContent.lastIndexOf('}')
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1)
      }
      
      summaryData = JSON.parse(cleanContent)
      
      // Validate required fields
      if (!summaryData.title || !summaryData.overview || !summaryData.mainConcepts) {
        console.error("Missing required fields in AI response:", summaryData)
        return NextResponse.json(
          { success: false, error: "AI response missing required fields" },
          { status: 500 }
        )
      }
      
      // Ensure keyPoints is an array
      if (!Array.isArray(summaryData.keyPoints)) {
        summaryData.keyPoints = []
      }
      
      // Ensure tags is an array
      if (!Array.isArray(summaryData.tags)) {
        summaryData.tags = []
      }
      
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      console.error("Raw content:", aiResponse.content)
      return NextResponse.json(
        { success: false, error: "Invalid response format from AI" },
        { status: 500 }
      )
    }

    // Helper function to convert data to string
    const toStringField = (data: any): string => {
      if (typeof data === 'string') return data
      if (typeof data === 'object' && data !== null) {
        // Convert object to readable text
        return Object.entries(data)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n\n')
      }
      return String(data || '')
    }

    // Helper function to convert array data to string
    const arrayToString = (data: any): string => {
      if (Array.isArray(data)) {
        return data.map(item => String(item)).join('\n')
      }
      return toStringField(data)
    }

    // Process the summary data to ensure proper string format
    const processedTitle = summaryData.title || `Summary of ${document.title}`
    const processedOverview = toStringField(summaryData.overview)
    const processedMainConcepts = toStringField(summaryData.mainConcepts)
    const processedExamples = toStringField(summaryData.examples)
    const processedTakeaways = arrayToString(summaryData.takeaways)
    const processedPrerequisites = toStringField(summaryData.prerequisites)
    const processedMethodology = toStringField(summaryData.methodology)
    const processedApplications = toStringField(summaryData.applications)
    const processedLimitations = toStringField(summaryData.limitations)
    const processedFutureDirections = toStringField(summaryData.futureDirections)
    const processedCriticalAnalysis = toStringField(summaryData.criticalAnalysis)
    const processedFurtherReading = toStringField(summaryData.furtherReading)
    
    // Calculate word count from main concepts
    const wordCount = processedMainConcepts.split(/\s+/).filter(word => word.length > 0).length

    // Create summary in database
    const summary = await db.summary.create({
      data: {
        documentId: documentId,
        userId: session.user.id,
        title: processedTitle,
        content: processedMainConcepts,
        keyPoints: JSON.stringify(summaryData.keyPoints || []),
        overview: processedOverview,
        mainConcepts: processedMainConcepts,
        examples: processedExamples,
        takeaways: processedTakeaways,
        prerequisites: processedPrerequisites,
        methodology: processedMethodology,
        applications: processedApplications,
        limitations: processedLimitations,
        futureDirections: processedFutureDirections,
        criticalAnalysis: processedCriticalAnalysis,
        furtherReading: processedFurtherReading,
        wordCount: wordCount,
        difficulty: difficulty,
        estimatedReadTime: typeof summaryData.estimatedReadTime === 'number' ? summaryData.estimatedReadTime : 20,
        tags: Array.isArray(summaryData.tags) ? summaryData.tags.join(',') : (typeof summaryData.tags === 'string' ? summaryData.tags : ''),
        aiProvider: aiProvider,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed,
        generationTime: generationTime,
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            originalName: true,
            fileType: true,
            createdAt: true,
          },
        },
      },
    })

    // Update user usage
    await db.userUsage.upsert({
      where: { userId: session.user.id },
      update: {
        summariesGenerated: { increment: 1 },
        aiTokensUsed: { increment: aiResponse.tokensUsed },
      },
      create: {
        userId: session.user.id,
        summariesGenerated: 1,
        aiTokensUsed: aiResponse.tokensUsed,
      },
    })

    // Transform response
    const transformedSummary = {
      id: summary.id,
      title: summary.title,
      content: summary.content,
      keyPoints: summary.keyPoints ? JSON.parse(summary.keyPoints) : [],
      overview: summary.overview,
      mainConcepts: summary.mainConcepts,
      examples: summary.examples,
      takeaways: summary.takeaways,
      prerequisites: summary.prerequisites,
      methodology: summary.methodology,
      applications: summary.applications,
      limitations: summary.limitations,
      futureDirections: summary.futureDirections,
      criticalAnalysis: summary.criticalAnalysis,
      furtherReading: summary.furtherReading,
      wordCount: summary.wordCount,
      difficulty: summary.difficulty,
      estimatedReadTime: summary.estimatedReadTime,
      tags: summary.tags ? summary.tags.split(',').filter(Boolean) : [],
      documentId: summary.documentId,
      document: summary.document,
      tokensUsed: summary.tokensUsed,
      generationTime: summary.generationTime,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    }

    return NextResponse.json({
      success: true,
      summary: transformedSummary,
      message: "Summary generated successfully",
    })

  } catch (error) {
    console.error("Error generating summary:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && (error.message.includes('OpenAI') || error.message.includes('Anthropic'))) {
      return NextResponse.json(
        { success: false, error: "AI service error", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: "Failed to generate summary" },
      { status: 500 }
    )
  }
}