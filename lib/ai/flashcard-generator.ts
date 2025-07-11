import { openaiClient } from "./openai-client"
import { FlashcardData, FlashcardGenerationRequest } from "@/types"
import { z } from "zod"

const FlashcardSchema = z.object({
  question: z.string().min(10).max(500),
  answer: z.string().min(5).max(1000),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).optional(),
})

const FlashcardsResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema),
})

type FlashcardsResponse = z.infer<typeof FlashcardsResponseSchema>

export class FlashcardGenerator {
  private readonly MAX_CONTENT_LENGTH = 100000 // Much larger limit for GPT-4o
  private readonly MAX_TOKENS_PER_CHUNK = 80000 // Leave room for system prompt and response with GPT-4o

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4)
  }

  private chunkContent(content: string, maxChunkSize: number = this.MAX_CONTENT_LENGTH): string[] {
    if (content.length <= maxChunkSize) {
      return [content]
    }

    const chunks: string[] = []
    const sentences = content.split(/[.!?]+\s/)
    
    let currentChunk = ""
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + sentence + ". "
      
      if (testChunk.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = sentence + ". "
      } else {
        currentChunk = testChunk
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks.length > 0 ? chunks : [content]
  }

  private distributeFlashcardsAcrossChunks(totalCount: number, chunkCount: number): number[] {
    const baseCount = Math.floor(totalCount / chunkCount)
    const remainder = totalCount % chunkCount
    
    const distribution: number[] = []
    for (let i = 0; i < chunkCount; i++) {
      distribution.push(baseCount + (i < remainder ? 1 : 0))
    }
    
    return distribution
  }

  private buildSystemPrompt(): string {
    return `You are an expert educational content creator specializing in creating high-quality flashcards for effective learning.

Your task is to analyze the provided content and generate flashcards that:
1. Cover the most important concepts, facts, and relationships
2. Use varied question types (definitions, applications, comparisons, cause-effect, etc.)
3. Are appropriately challenging but not overwhelming
4. Include clear, concise answers with helpful explanations
5. Follow spaced repetition best practices

Guidelines:
- Questions should be specific and unambiguous
- Answers should be complete but concise
- Avoid trivial or overly complex questions
- Include context when necessary
- Use active recall principles
- Vary difficulty levels as requested`
  }

  private buildFlashcardPrompt(
    content: string,
    options: FlashcardGenerationRequest
  ): string {
    const { count, difficulty, focusAreas = [] } = options

    let prompt = `Analyze the following content and generate exactly ${count} high-quality flashcards.

Content to analyze:
"""
${content}
"""

Requirements:
- Generate exactly ${count} flashcards
- Difficulty level: ${difficulty === "mixed" ? "vary between easy, medium, and hard" : difficulty}
${focusAreas.length > 0 ? `- Focus on these areas: ${focusAreas.join(", ")}` : ""}
- Ensure variety in question types (definitions, applications, examples, comparisons, etc.)
- Each flashcard should test understanding, not just memorization
- Include brief explanations to help with learning

CRITICAL: Return ONLY valid JSON. No additional text, no markdown, no explanations outside the JSON.

Response format - EXACTLY this structure:
{
  "flashcards": [
    {
      "question": "What is the main function of mitochondria in cells?",
      "answer": "To produce ATP (energy) through cellular respiration",
      "explanation": "Mitochondria are often called the 'powerhouses of the cell' because they generate most of the cell's supply of ATP, which is used as energy currency.",
      "difficulty": "medium",
      "tags": ["biology", "cell-biology", "organelles"]
    }
  ]
}

Rules for JSON response:
- Use double quotes for all strings
- No trailing commas
- Ensure all brackets and braces are properly closed
- Do not include any text before or after the JSON object
- The "explanation" field is optional but recommended
- The "tags" field should be an array of strings`

    return prompt
  }

  async generateFlashcards(
    content: string,
    options: FlashcardGenerationRequest
  ): Promise<FlashcardData[]> {
    if (!content || content.trim().length === 0) {
      throw new Error("Content is required for flashcard generation")
    }

    if (options.count < 1 || options.count > 50) {
      throw new Error("Flashcard count must be between 1 and 50")
    }

    // Check if content needs to be chunked
    const estimatedTokens = this.estimateTokens(content)
    console.log(`Content size: ${content.length} chars, ~${estimatedTokens} tokens`)

    if (estimatedTokens > this.MAX_TOKENS_PER_CHUNK) {
      console.log("Content too large, chunking required")
      return this.generateFlashcardsFromChunks(content, options)
    }

    // Process single chunk
    return this.generateFlashcardsFromSingleChunk(content, options)
  }

  private async generateFlashcardsFromSingleChunk(
    content: string,
    options: FlashcardGenerationRequest,
    retryCount: number = 0
  ): Promise<FlashcardData[]> {
    const systemPrompt = this.buildSystemPrompt()
    const prompt = this.buildFlashcardPrompt(content, options)

    try {
      const response = await openaiClient.generateWithRetry(async () => {
        return await openaiClient.generateStructuredResponse<FlashcardsResponse>(
          prompt,
          JSON.stringify(FlashcardsResponseSchema),
          {
            systemPrompt,
            temperature: retryCount > 0 ? 0.3 : 0.8, // Lower temperature on retry for more structured output
            model: "gpt-4o-2024-11-20",
            maxTokens: 6000, // Higher limit for flashcard generation
          }
        )
      })

      // Log the raw response for debugging
      console.log('📋 Raw flashcard AI response received:', JSON.stringify(response, null, 2))
      
      // Normalize and validate the response
      const normalizedResponse = this.normalizeFlashcardResponse(response)
      const validatedResponse = FlashcardsResponseSchema.parse(normalizedResponse)
      
      // Ensure we have the requested number of flashcards
      const flashcards = validatedResponse.flashcards.slice(0, options.count)
      
      if (flashcards.length === 0) {
        throw new Error("No flashcards were generated")
      }

      // Apply difficulty filter if not mixed
      const filteredFlashcards = options.difficulty === "mixed" 
        ? flashcards
        : flashcards.map(card => ({ ...card, difficulty: options.difficulty as "easy" | "medium" | "hard" }))

      return filteredFlashcards

    } catch (error) {
      console.error("Flashcard generation error:", error)
      
      // Retry once with lower temperature and more explicit instructions
      if (retryCount === 0 && (error instanceof Error && error.message.includes("JSON")) || (error instanceof z.ZodError)) {
        console.log("Retrying flashcard generation with stricter JSON formatting...")
        await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay
        return this.generateFlashcardsFromSingleChunk(content, options, 1)
      }
      
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid flashcard format generated: ${JSON.stringify(error.issues, null, 2)}`)
      }
      
      throw error
    }
  }

  private async generateFlashcardsFromChunks(
    content: string,
    options: FlashcardGenerationRequest
  ): Promise<FlashcardData[]> {
    const chunks = this.chunkContent(content)
    console.log(`Split content into ${chunks.length} chunks`)

    // Distribute flashcard count across chunks
    const flashcardDistribution = this.distributeFlashcardsAcrossChunks(options.count, chunks.length)
    console.log(`Flashcard distribution: ${flashcardDistribution.join(', ')}`)

    const allFlashcards: FlashcardData[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkFlashcardCount = flashcardDistribution[i]
      
      if (chunkFlashcardCount === 0) continue

      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunkFlashcardCount} flashcards)`)
      
      const chunkOptions: FlashcardGenerationRequest = {
        ...options,
        count: chunkFlashcardCount,
      }

      try {
        const chunkFlashcards = await this.generateFlashcardsFromSingleChunk(chunks[i], chunkOptions)
        allFlashcards.push(...chunkFlashcards)
        
        // Add a small delay between chunks to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error)
        // Continue with other chunks even if one fails
        continue
      }
    }

    if (allFlashcards.length === 0) {
      throw new Error("No flashcards could be generated from any chunk")
    }

    // Remove duplicates based on question similarity
    const uniqueFlashcards = this.removeDuplicateFlashcards(allFlashcards)
    
    // Limit to requested count
    return uniqueFlashcards.slice(0, options.count)
  }

  private normalizeFlashcardResponse(response: any): any {
    // If response is null or undefined, return empty structure
    if (!response || typeof response !== 'object') {
      console.log('🔧 Flashcard response is null/undefined, creating empty structure')
      return {
        flashcards: []
      }
    }

    // Handle case where response is directly an array of flashcards
    if (Array.isArray(response)) {
      console.log('🔧 Flashcard response is array, wrapping in proper structure')
      return {
        flashcards: response
      }
    }

    // Normalize the flashcards array
    let flashcards = response.flashcards || []
    if (!Array.isArray(flashcards)) {
      console.log('🔧 Flashcards is not an array, converting to array')
      flashcards = []
    }

    // Normalize each flashcard
    flashcards = flashcards.map((card: any, index: number) => {
      if (!card || typeof card !== 'object') {
        console.log(`🔧 Flashcard ${index} is invalid, skipping`)
        return null
      }

      return {
        question: card.question || `Question ${index + 1}`,
        answer: card.answer || `Answer ${index + 1}`,
        explanation: card.explanation || '',
        difficulty: card.difficulty || 'medium',
        tags: Array.isArray(card.tags) ? card.tags : []
      }
    }).filter(Boolean) // Remove null flashcards

    console.log(`🔧 Normalized ${flashcards.length} flashcards`)
    return { flashcards }
  }

  private removeDuplicateFlashcards(flashcards: FlashcardData[]): FlashcardData[] {
    const unique: FlashcardData[] = []
    const seenQuestions = new Set<string>()

    for (const card of flashcards) {
      const normalizedQuestion = card.question.toLowerCase().trim()
      
      if (!seenQuestions.has(normalizedQuestion)) {
        seenQuestions.add(normalizedQuestion)
        unique.push(card)
      }
    }

    return unique
  }

  async generateSingleFlashcard(
    content: string,
    concept: string,
    difficulty: "easy" | "medium" | "hard" = "medium"
  ): Promise<FlashcardData> {
    const prompt = `Create a single flashcard about "${concept}" from this content:

"""
${content}
"""

Focus specifically on: ${concept}
Difficulty level: ${difficulty}

Create a flashcard that tests understanding of this concept with a clear question and comprehensive answer.`

    const systemPrompt = this.buildSystemPrompt()

    const response = await openaiClient.generateStructuredResponse<{ flashcard: FlashcardData }>(
      prompt,
      JSON.stringify({
        type: "object",
        properties: {
          flashcard: FlashcardSchema
        },
        required: ["flashcard"]
      }),
      {
        systemPrompt,
        temperature: 0.7,
        model: "gpt-4.1-2025-04-14",
      }
    )

    return response.flashcard
  }

  validateFlashcards(flashcards: FlashcardData[]): FlashcardData[] {
    return flashcards.filter(card => {
      if (!card.question || !card.answer) {
        console.warn("Skipping invalid flashcard: missing question or answer")
        return false
      }
      
      if (card.question.length < 10 || card.answer.length < 5) {
        console.warn("Skipping flashcard: question or answer too short")
        return false
      }
      
      return true
    })
  }
}

export const flashcardGenerator = new FlashcardGenerator()