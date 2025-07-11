import OpenAI from "openai"
import { RateLimitError, AIProcessingError } from "@/types"

export class OpenAIClient {
  private readonly client: OpenAI
  private requestCount: number = 0
  private lastResetTime: number = Date.now()
  private readonly MAX_REQUESTS_PER_MINUTE = 20
  private readonly RESET_INTERVAL = 60 * 1000 // 1 minute

  constructor() {
    console.log('🔑 Initializing OpenAI client...')
    console.log('🔍 API key present:', !!process.env.OPENAI_API_KEY)
    console.log('🔍 API key prefix:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...')
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured")
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 60000, // 60 seconds
    })
    
    console.log('✅ OpenAI client initialized successfully')
  }

  private checkRateLimit(): void {
    const now = Date.now()
    
    // Reset counter every minute
    if (now - this.lastResetTime > this.RESET_INTERVAL) {
      this.requestCount = 0
      this.lastResetTime = now
    }

    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const retryAfter = Math.ceil((this.RESET_INTERVAL - (now - this.lastResetTime)) / 1000)
      throw new RateLimitError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`, retryAfter)
    }

    this.requestCount++
  }

  private countTokens(text: string): number {
    // More accurate estimation for GPT-4 models
    // Based on OpenAI's tokenizer patterns:
    // - 1 token ≈ 4 characters for English text
    // - Punctuation and special characters use more tokens
    // - Code and technical content uses more tokens
    
    const baseTokens = Math.ceil(text.length / 4)
    
    // Adjust for punctuation density
    const punctuationMatches = text.match(/[^\w\s]/g) || []
    const punctuationAdjustment = punctuationMatches.length * 0.2
    
    // Adjust for technical content (numbers, code, etc.)
    const technicalMatches = text.match(/\b\d+\b|[A-Z]{2,}|[_-]+/g) || []
    const technicalAdjustment = technicalMatches.length * 0.1
    
    return Math.ceil(baseTokens + punctuationAdjustment + technicalAdjustment)
  }

  async generateCompletion(
    prompt: string,
    options: {
      model?: string
      maxTokens?: number
      temperature?: number
      systemPrompt?: string
    } = {}
  ): Promise<{
    content: string
    tokensUsed: number
    model: string
  }> {
    this.checkRateLimit()

    const {
      model = "gpt-4.1-2025-04-14",
      maxTokens = model.includes("gpt-4o") ? 8000 : 2000, // Larger response limit for GPT-4o
      temperature = 0.7,
      systemPrompt = "You are a helpful AI assistant.",
    } = options

    // Check input token count - GPT-4o has 128k context window
    const inputTokens = this.countTokens(prompt + systemPrompt)
    const maxInputTokens = model.includes("gpt-4o") ? 120000 : 8000 // Leave room for response
    
    if (inputTokens > maxInputTokens) {
      throw new AIProcessingError(`Input too large. Maximum context length exceeded. (${inputTokens}/${maxInputTokens} tokens)`, "CONTEXT_LENGTH_EXCEEDED")
    }

    try {
      console.log('📤 Making OpenAI API request...')
      console.log('🤖 Model:', model)
      console.log('📊 Input tokens (estimated):', inputTokens)
      console.log('🎯 Max tokens:', maxTokens)
      
      const messages: Array<{ role: "system" | "user"; content: string }> = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ]

      const response = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })
      
      console.log('✅ OpenAI API response received')
      console.log('📊 Tokens used:', response.usage?.total_tokens || 'unknown')

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new AIProcessingError("No content generated from AI response", "EMPTY_RESPONSE")
      }

      return {
        content,
        tokensUsed: response.usage?.total_tokens || this.countTokens(content + prompt),
        model: response.model,
      }
    } catch (error: any) {
      if (error.status === 429) {
        throw new RateLimitError("OpenAI API rate limit exceeded", 60)
      } else if (error.status === 401) {
        throw new AIProcessingError("Invalid OpenAI API key", "INVALID_API_KEY")
      } else if (error.status === 400) {
        throw new AIProcessingError("Invalid request to OpenAI API", "INVALID_REQUEST")
      } else if (error.status === 503) {
        throw new AIProcessingError("OpenAI API temporarily unavailable", "SERVICE_UNAVAILABLE")
      }

      console.error("OpenAI API error:", error)
      throw new AIProcessingError(
        `OpenAI API error: ${error.message || "Unknown error"}`,
        "API_ERROR"
      )
    }
  }

  async generateWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error = new Error("Unknown error")

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error

        // Don't retry on certain error types
        if (
          error instanceof AIProcessingError &&
          error.code &&
          ["INVALID_API_KEY", "CONTEXT_LENGTH_EXCEEDED", "INVALID_REQUEST"].includes(error.code)
        ) {
          throw error
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        console.warn(`AI operation failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`, error.message)
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  // Helper method for structured JSON responses
  async generateStructuredResponse<T>(
    prompt: string,
    schema: string,
    options: {
      model?: string
      temperature?: number
      systemPrompt?: string
    } = {}
  ): Promise<T> {
    const systemPrompt = `${options.systemPrompt || "You are a helpful AI assistant."}\n\nYou must respond with valid JSON that matches this schema:\n${schema}\n\nIMPORTANT: Return ONLY the JSON response, no additional text, no markdown formatting, no explanations.`

    const result = await this.generateCompletion(prompt, {
      ...options,
      systemPrompt,
      temperature: options.temperature || 0.3, // Lower temperature for structured responses
    })

    try {
      const cleanedContent = this.cleanJsonResponse(result.content)
      console.log('🧹 Cleaned JSON response length:', cleanedContent.length)
      console.log('🧹 Original content length:', result.content.length)
      
      if (cleanedContent.length < result.content.length) {
        console.log('🔧 JSON was cleaned/repaired')
      }
      
      // Try to parse the cleaned content
      try {
        return JSON.parse(cleanedContent) as T
      } catch (parseError) {
        console.log('🔧 First parse attempt failed, trying fallback extraction...')
        // Fallback: try to extract JSON more aggressively
        const fallbackJson = this.extractJsonFallback(result.content)
        console.log('🔧 Fallback extraction length:', fallbackJson.length)
        return JSON.parse(fallbackJson) as T
      }
    } catch (error) {
      console.error('❌ JSON parsing failed. Raw content length:', result.content.length)
      console.error('❌ Raw content preview:', result.content.substring(0, 1000))
      console.error('❌ Raw content ending:', result.content.substring(Math.max(0, result.content.length - 500)))
      console.error('❌ JSON parsing error:', error)
      throw new AIProcessingError(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`, "INVALID_JSON_RESPONSE")
    }
  }

  private cleanJsonResponse(content: string): string {
    console.log('🧹 Starting JSON cleaning...')
    
    // Remove common markdown formatting
    let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // Remove any text before the first { or [
    const jsonStart = Math.max(cleaned.indexOf('{'), cleaned.indexOf('['))
    if (jsonStart > 0) {
      console.log(`🔧 Removing ${jsonStart} characters before JSON start`)
      cleaned = cleaned.substring(jsonStart)
    }
    
    // Find the complete JSON structure more carefully
    const jsonEnd = this.findJsonEnd(cleaned)
    
    if (jsonEnd > -1) {
      console.log(`🔧 JSON ends at position ${jsonEnd}, total length: ${cleaned.length}`)
      if (jsonEnd + 1 < cleaned.length) {
        console.log(`🔧 Removing ${cleaned.length - jsonEnd - 1} characters after JSON end`)
        console.log(`🔧 Removed content: "${cleaned.substring(jsonEnd + 1, Math.min(jsonEnd + 101, cleaned.length))}..."`)
      }
      cleaned = cleaned.substring(0, jsonEnd + 1)
    } else {
      // If we can't find a complete structure, try to fix common truncation issues
      console.log('🔧 Attempting to repair incomplete JSON...')
      cleaned = this.attemptJsonRepair(cleaned)
      console.log('🔧 Repair complete, new length:', cleaned.length)
    }
    
    // Remove any trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')
    
    // Trim whitespace
    cleaned = cleaned.trim()
    
    console.log('🧹 JSON cleaning complete')
    return cleaned
  }

  private findJsonEnd(content: string): number {
    let braceCount = 0
    let bracketCount = 0
    let inString = false
    let escapeNext = false
    let lastCompleteJsonEnd = -1
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\' && inString) {
        escapeNext = true
        continue
      }
      
      if (char === '"') {
        inString = !inString
        continue
      }
      
      if (inString) continue
      
      if (char === '{') {
        braceCount++
      } else if (char === '}') {
        braceCount--
        // When we reach the end of the outermost object
        if (braceCount === 0 && bracketCount === 0) {
          lastCompleteJsonEnd = i
          // Don't break here - continue to see if there are more complete structures
        }
      } else if (char === '[') {
        bracketCount++
      } else if (char === ']') {
        bracketCount--
        // When we reach the end of the outermost array
        if (bracketCount === 0 && braceCount === 0) {
          lastCompleteJsonEnd = i
          // Don't break here - continue to see if there are more complete structures
        }
      }
    }
    
    return lastCompleteJsonEnd
  }

  private extractJsonFallback(content: string): string {
    // Try multiple approaches to extract valid JSON
    let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // Find the start of JSON
    const jsonStart = Math.max(cleaned.indexOf('{'), cleaned.indexOf('['))
    if (jsonStart > 0) {
      cleaned = cleaned.substring(jsonStart)
    }
    
    // Try to find all possible JSON end points and test each one
    const potentialEnds: number[] = []
    
    // Look for closing braces/brackets
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === '}' || cleaned[i] === ']') {
        potentialEnds.push(i)
      }
    }
    
    // Sort potential ends from longest to shortest
    potentialEnds.sort((a, b) => b - a)
    
    // Try each potential end point
    for (const endPos of potentialEnds) {
      const candidate = cleaned.substring(0, endPos + 1)
      try {
        JSON.parse(candidate)
        console.log(`🔧 Fallback found valid JSON ending at position ${endPos}`)
        return candidate
      } catch {
        // Continue to next candidate
      }
    }
    
    // If no valid JSON found, try repair
    console.log('🔧 Fallback: attempting repair...')
    return this.attemptJsonRepair(cleaned)
  }

  private attemptJsonRepair(content: string): string {
    let repaired = content.trim()
    
    // Count open vs closed braces and brackets
    const openBraces = (repaired.match(/{/g) || []).length
    const closeBraces = (repaired.match(/}/g) || []).length
    const openBrackets = (repaired.match(/\[/g) || []).length
    const closeBrackets = (repaired.match(/]/g) || []).length
    
    // Add missing closing braces
    const missingBraces = openBraces - closeBraces
    if (missingBraces > 0) {
      // Remove any incomplete trailing content that might be causing issues
      repaired = repaired.replace(/,\s*"[^"]*\s*$/, '') // Remove incomplete key
      repaired = repaired.replace(/:\s*"[^"]*\s*$/, ':"incomplete"') // Complete incomplete value
      repaired = repaired.replace(/:\s*\[\s*"[^"]*\s*$/, ':["incomplete"]') // Complete incomplete array
      
      // Add missing closing braces
      repaired += '}' .repeat(missingBraces)
    }
    
    // Add missing closing brackets
    const missingBrackets = openBrackets - closeBrackets
    if (missingBrackets > 0) {
      repaired += ']'.repeat(missingBrackets)
    }
    
    return repaired
  }
}

// Singleton instance
export const openaiClient = new OpenAIClient()