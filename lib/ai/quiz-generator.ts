import { openaiClient } from "./openai-client"
import { z } from "zod"

const QuizQuestionSchema = z.object({
  question: z.string().min(10, "Question must be at least 10 characters"),
  options: z.array(z.string()).min(2).max(6),
  correctAnswer: z.number().min(0),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z.array(z.string()).optional(),
  questionType: z.enum(["multiple_choice", "true_false", "fill_blank"]),
  points: z.number().min(1).max(10).default(1),
})

const QuizGenerationResultSchema = z.object({
  questions: z.array(QuizQuestionSchema),
  metadata: z.object({
    totalQuestions: z.number(),
    estimatedTime: z.number(),
    difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
    topics: z.array(z.string()),
  }),
})

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>
export type QuizGenerationResult = z.infer<typeof QuizGenerationResultSchema>

export interface QuizGenerationOptions {
  documentId: string
  count: number
  difficulty: "easy" | "medium" | "hard" | "mixed"
  questionTypes?: ("multiple_choice" | "true_false" | "fill_blank")[]
  focusAreas?: string[]
  timeLimit?: number
}

class QuizGenerator {
  private readonly MAX_CONTENT_LENGTH = 100000 // Much larger limit for GPT-4o
  private readonly MAX_TOKENS_PER_CHUNK = 80000 // Leave room for system prompt and response

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

  private distributeQuestionsAcrossChunks(totalCount: number, chunkCount: number): number[] {
    const baseCount = Math.floor(totalCount / chunkCount)
    const remainder = totalCount % chunkCount
    
    const distribution: number[] = []
    for (let i = 0; i < chunkCount; i++) {
      distribution.push(baseCount + (i < remainder ? 1 : 0))
    }
    
    return distribution
  }

  private generatePrompt(content: string, options: QuizGenerationOptions): string {
    const difficultyInstructions = {
      easy: "Create straightforward questions that test basic understanding and recall of key concepts.",
      medium: "Create questions that require understanding and application of concepts with some analytical thinking.",
      hard: "Create challenging questions that require deep analysis, synthesis, and critical thinking.",
      mixed: "Create a mix of easy, medium, and hard questions to provide varied difficulty levels."
    }

    const typeInstructions = {
      multiple_choice: "Multiple choice questions with 4 options where only one is correct.",
      true_false: "True/false questions that test specific facts or concepts.",
      fill_blank: "Fill-in-the-blank questions where key terms or concepts are missing."
    }

    const questionTypes = options.questionTypes || ["multiple_choice", "true_false", "fill_blank"]
    const typeDescriptions = questionTypes.map(type => typeInstructions[type]).join(" ")

    return `You are an expert educational content creator. Generate ${options.count} quiz questions from the following content.

CONTENT TO ANALYZE:
${content}

REQUIREMENTS:
- Difficulty: ${options.difficulty} - ${difficultyInstructions[options.difficulty]}
- Question Types: ${typeDescriptions}
- Focus Areas: ${options.focusAreas?.join(", ") || "All content areas"}
- Each question must be clear, unambiguous, and test important concepts
- Provide detailed explanations for correct answers
- Ensure questions are directly based on the provided content
- Avoid trick questions or overly specific details
- Make incorrect options plausible but clearly wrong

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "questions": [
    {
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"],
      "questionType": "multiple_choice|true_false|fill_blank",
      "points": 1
    }
  ],
  "metadata": {
    "totalQuestions": ${options.count},
    "estimatedTime": 120,
    "difficulty": "${options.difficulty}",
    "topics": ["topic1", "topic2"]
  }
}

QUESTION TYPE SPECIFIC INSTRUCTIONS:
- Multiple Choice: Provide exactly 4 options, with correctAnswer being the index (0-3)
- True/False: Provide exactly 2 options ["True", "False"], with correctAnswer being 0 or 1
- Fill Blank: Format as "The ____ is responsible for..." with options being possible answers

CRITICAL: Return ONLY valid JSON. No additional text, no markdown, no explanations outside the JSON.

Rules for JSON response:
- Use double quotes for all strings
- No trailing commas
- Ensure all brackets and braces are properly closed
- Do not include any text before or after the JSON object
- correctAnswer must be a valid index (0-based) for the options array
- All required fields must be present

Generate high-quality, educational quiz questions now:`
  }

  async generateQuiz(content: string, options: QuizGenerationOptions): Promise<QuizQuestion[]> {
    try {
      console.log(`Generating ${options.count} quiz questions with difficulty: ${options.difficulty}`)
      
      // Check if content needs to be chunked
      const estimatedTokens = this.estimateTokens(content)
      console.log(`Content size: ${content.length} chars, ~${estimatedTokens} tokens`)

      if (estimatedTokens > this.MAX_TOKENS_PER_CHUNK) {
        console.log("Content too large, chunking required")
        return this.generateQuizFromChunks(content, options)
      }

      // Process single chunk
      return this.generateQuizFromSingleChunk(content, options)
    } catch (error) {
      console.error("Quiz generation error:", error)
      
      if (error instanceof z.ZodError) {
        throw new Error(`Quiz validation failed: ${error.errors.map(e => e.message).join(", ")}`)
      }
      
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON response from AI service")
      }
      
      throw error
    }
  }

  private async generateQuizFromSingleChunk(
    content: string, 
    options: QuizGenerationOptions,
    retryCount: number = 0
  ): Promise<QuizQuestion[]> {
    const prompt = this.generatePrompt(content, options)
      
    try {
      const response = await openaiClient.generateStructuredResponse<any>(
        prompt,
        JSON.stringify(QuizGenerationResultSchema),
        {
          model: "gpt-4o-2024-11-20",
          temperature: retryCount > 0 ? 0.3 : 0.7, // Lower temperature on retry
          maxTokens: 8000, // Higher limit for quiz generation
          systemPrompt: "You are an expert educational content creator specializing in quiz generation. Always respond with valid JSON matching the exact format requested. Do not include any text outside the JSON structure."
        }
      )

      // Log the raw response for debugging
      console.log('📋 Raw AI response received:', JSON.stringify(response, null, 2))
      
      // Normalize and validate the response
      const normalizedResponse = this.normalizeQuizResponse(response)
      
      // Use Zod to validate the normalized response
      const validatedResult = QuizGenerationResultSchema.parse(normalizedResponse)
      
      // Additional validation
      if (validatedResult.questions.length === 0) {
        throw new Error("No quiz questions were generated")
      }

      // Validate each question's options and correct answer
      validatedResult.questions.forEach((question, index) => {
        if (question.correctAnswer >= question.options.length) {
          throw new Error(`Question ${index + 1}: correctAnswer index ${question.correctAnswer} is out of range for ${question.options.length} options`)
        }
        
        if (question.questionType === "true_false" && question.options.length !== 2) {
          throw new Error(`Question ${index + 1}: True/false questions must have exactly 2 options`)
        }
        
        if (question.questionType === "multiple_choice" && question.options.length < 3) {
          throw new Error(`Question ${index + 1}: Multiple choice questions must have at least 3 options`)
        }
      })

      console.log(`Successfully generated ${validatedResult.questions.length} quiz questions`)
      return validatedResult.questions
      
    } catch (error) {
      console.error("Quiz generation error:", error)
      
      // Retry once with lower temperature and more explicit instructions
      if (retryCount === 0 && error instanceof Error && error.message.includes("JSON")) {
        console.log("Retrying quiz generation with stricter JSON formatting...")
        await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay
        return this.generateQuizFromSingleChunk(content, options, 1)
      }
      
      throw error
    }
  }

  private async generateQuizFromChunks(content: string, options: QuizGenerationOptions): Promise<QuizQuestion[]> {
    const chunks = this.chunkContent(content)
    console.log(`Split content into ${chunks.length} chunks`)

    // Distribute question count across chunks
    const questionDistribution = this.distributeQuestionsAcrossChunks(options.count, chunks.length)
    console.log(`Question distribution: ${questionDistribution.join(', ')}`)

    const allQuestions: QuizQuestion[] = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkQuestionCount = questionDistribution[i]
      
      if (chunkQuestionCount === 0) continue

      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunkQuestionCount} questions)`)
      
      const chunkOptions: QuizGenerationOptions = {
        ...options,
        count: chunkQuestionCount,
      }

      try {
        const chunkQuestions = await this.generateQuizFromSingleChunk(chunks[i], chunkOptions)
        allQuestions.push(...chunkQuestions)
        
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

    if (allQuestions.length === 0) {
      throw new Error("No quiz questions could be generated from any chunk")
    }

    // Remove duplicates based on question similarity
    const uniqueQuestions = this.removeDuplicateQuestions(allQuestions)
    
    // Limit to requested count
    return uniqueQuestions.slice(0, options.count)
  }

  private normalizeQuizResponse(response: any): any {
    // If response is null or undefined, return empty structure
    if (!response || typeof response !== 'object') {
      console.log('🔧 Response is null/undefined, creating empty structure')
      return {
        questions: [],
        metadata: {
          totalQuestions: 0,
          estimatedTime: 0,
          difficulty: "medium",
          topics: []
        }
      }
    }

    // Handle case where response is directly an array of questions
    if (Array.isArray(response)) {
      console.log('🔧 Response is array, wrapping in proper structure')
      return {
        questions: response,
        metadata: {
          totalQuestions: response.length,
          estimatedTime: response.length * 2, // 2 minutes per question
          difficulty: "medium",
          topics: []
        }
      }
    }

    // Normalize the questions array
    let questions = response.questions || []
    if (!Array.isArray(questions)) {
      console.log('🔧 Questions is not an array, converting to array')
      questions = []
    }

    // Normalize each question
    questions = questions.map((q: any, index: number) => {
      if (!q || typeof q !== 'object') {
        console.log(`🔧 Question ${index} is invalid, skipping`)
        return null
      }

      return {
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) ? q.options : ["Option 1", "Option 2"],
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        tags: Array.isArray(q.tags) ? q.tags : [],
        questionType: q.questionType || 'multiple_choice',
        points: typeof q.points === 'number' ? q.points : 1
      }
    }).filter(Boolean) // Remove null questions

    // Normalize metadata
    const metadata = {
      totalQuestions: questions.length,
      estimatedTime: response.metadata?.estimatedTime || questions.length * 2,
      difficulty: response.metadata?.difficulty || 'medium',
      topics: Array.isArray(response.metadata?.topics) ? response.metadata.topics : []
    }

    console.log(`🔧 Normalized ${questions.length} questions`)
    return { questions, metadata }
  }

  private removeDuplicateQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    const unique: QuizQuestion[] = []
    const seenQuestions = new Set<string>()

    for (const question of questions) {
      const normalizedQuestion = question.question.toLowerCase().trim()
      
      if (!seenQuestions.has(normalizedQuestion)) {
        seenQuestions.add(normalizedQuestion)
        unique.push(question)
      }
    }

    return unique
  }

  async generateQuizFromFlashcards(flashcards: any[], options: Omit<QuizGenerationOptions, 'documentId'>): Promise<QuizQuestion[]> {
    const content = flashcards.map(fc => `Q: ${fc.question}\nA: ${fc.answer}\n${fc.explanation ? `Explanation: ${fc.explanation}\n` : ''}`).join('\n---\n')
    
    return this.generateQuiz(content, {
      ...options,
      documentId: 'flashcards'
    })
  }
}

export const quizGenerator = new QuizGenerator()