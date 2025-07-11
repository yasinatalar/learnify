import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export type AIProvider = "openai" | "anthropic"
export type AIModel = "gpt-4o" | "gpt-4" | "claude-sonnet-4-20250514" | "claude-3-5-sonnet-20241022"

export interface AIMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface AIResponse {
  content: string
  tokensUsed: number
  model: string
  provider: AIProvider
}

export interface GenerateOptions {
  provider: AIProvider
  model: AIModel
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
  responseFormat?: "json" | "text"
}

export class AIProviders {
  static async generateCompletion(options: GenerateOptions): Promise<AIResponse> {
    const { provider, model, messages, maxTokens = 16000, temperature = 0.7, responseFormat = "text" } = options

    try {
      if (provider === "openai") {
        return await this.generateOpenAI({
          model,
          messages,
          maxTokens,
          temperature,
          responseFormat,
        })
      } else if (provider === "anthropic") {
        return await this.generateAnthropic({
          model,
          messages,
          maxTokens,
          temperature,
          responseFormat,
        })
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`)
      }
    } catch (error) {
      console.error(`Error generating completion with ${provider}:`, error)
      throw error
    }
  }

  private static async generateOpenAI({
    model,
    messages,
    maxTokens,
    temperature,
    responseFormat,
  }: {
    model: AIModel
    messages: AIMessage[]
    maxTokens: number
    temperature: number
    responseFormat: "json" | "text"
  }): Promise<AIResponse> {
    const completion = await openai.chat.completions.create({
      model: model as string,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: maxTokens,
      temperature,
      response_format: responseFormat === "json" ? { type: "json_object" } : undefined,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error("No content received from OpenAI")
    }

    return {
      content,
      tokensUsed: completion.usage?.total_tokens || 0,
      model: model,
      provider: "openai",
    }
  }

  private static async generateAnthropic({
    model,
    messages,
    maxTokens,
    temperature,
    responseFormat,
  }: {
    model: AIModel
    messages: AIMessage[]
    maxTokens: number
    temperature: number
    responseFormat: "json" | "text"
  }): Promise<AIResponse> {
    // Separate system message from other messages
    const systemMessage = messages.find(msg => msg.role === "system")
    const conversationMessages = messages.filter(msg => msg.role !== "system")

    // Convert messages to Anthropic format
    const anthropicMessages = conversationMessages.map(msg => ({
      role: msg.role === "user" ? "user" as const : "assistant" as const,
      content: msg.content,
    }))

    // Add JSON format instruction if needed
    let systemContent = systemMessage?.content || ""
    if (responseFormat === "json") {
      systemContent += "\n\nIMPORTANT: You must respond with valid JSON only. Do not include any text outside the JSON object. Do not wrap the JSON in markdown code blocks or use ```json. Return the raw JSON object directly."
    }

    const completion = await anthropic.messages.create({
      model: model as string,
      system: systemContent,
      messages: anthropicMessages,
      max_tokens: maxTokens,
      temperature,
    })

    // Extract content from the response
    const content = completion.content
      .filter(block => block.type === "text")
      .map(block => (block as any).text)
      .join("")

    if (!content) {
      throw new Error("No content received from Anthropic")
    }

    return {
      content,
      tokensUsed: completion.usage.input_tokens + completion.usage.output_tokens,
      model: model,
      provider: "anthropic",
    }
  }

  static getAvailableModels(): { provider: AIProvider; model: AIModel; name: string; description: string }[] {
    return [
      {
        provider: "openai",
        model: "gpt-4o",
        name: "GPT-4o",
        description: "Latest OpenAI model with improved reasoning",
      },
      {
        provider: "openai",
        model: "gpt-4",
        name: "GPT-4",
        description: "OpenAI's flagship model for complex tasks",
      },
      {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        description: "Anthropic's latest and most capable model",
      },
      {
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        description: "Anthropic's fast and capable model",
      },
    ]
  }

  static getModelByName(provider: AIProvider, modelName: string): AIModel | null {
    const models = this.getAvailableModels()
    const found = models.find(m => m.provider === provider && (m.model === modelName || m.name === modelName))
    return found?.model || null
  }

  static isValidModel(provider: AIProvider, model: string): boolean {
    const models = this.getAvailableModels()
    return models.some(m => m.provider === provider && m.model === model)
  }
}

// Helper function for summary generation
export async function generateSummary({
  provider,
  model,
  documentTitle,
  documentContent,
  difficulty,
  includeExamples,
  focusAreas,
  language = 'en',
}: {
  provider: AIProvider
  model: AIModel
  documentTitle: string
  documentContent: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  includeExamples: boolean
  focusAreas: string[]
  language?: 'en' | 'de'
}): Promise<AIResponse> {
  const isGerman = language === 'de'
  
  const systemPrompt = isGerman ? 
    `Sie sind ein Experte für die Erstellung von Bildungsinhalten und Lehrplänen. Erstellen Sie eine UMFASSENDE, detaillierte Zusammenfassung des bereitgestellten Dokuments, die für tiefgreifendes Lernen und Beherrschung des Themas geeignet ist.

Anforderungen:
1. Erstellen Sie eine UMFANGREICHE, detaillierte Zusammenfassung mit umfassender Abdeckung aller wichtigen Konzepte
2. Schreiben Sie ausführliche Erklärungen, die Grundlagen, fortgeschrittene Konzepte und Nuancen abdecken
3. Fügen Sie umfassende Beispiele, Fallstudien und praktische Anwendungen hinzu
4. Passen Sie die Komplexität basierend auf dem Schwierigkeitsgrad an: ${difficulty}
5. Konzentrieren Sie sich auf tiefes Verständnis, praktische Anwendung und Relevanz für die reale Welt
6. Decken Sie Hintergrundkontext, historische Entwicklung und zukünftige Implikationen ab
7. Geben Sie detaillierte Erklärungen von Prozessen, Methoden und bewährten Praktiken
8. Behandeln Sie häufige Missverständnisse und bieten Sie Klarstellungen
9. Bieten Sie kritische Analyse und Bewertung, wo angemessen
10. Decken Sie umfassend Beschränkungen und Einschränkungen ab
${focusAreas.length > 0 ? `11. Achten Sie besonders auf diese Bereiche mit zusätzlichen Details: ${focusAreas.join(', ')}` : ''}

UMFASSENDE INHALTSLEITLINIEN:
- overview: Schreiben Sie 4-6 detaillierte Sätze über Umfang, Bedeutung und Kontext
- mainConcepts: Schreiben Sie 4-6 detaillierte Absätze, die alle Kernkonzepte gründlich abdecken
- examples: Bieten Sie mehrere detaillierte Beispiele mit schrittweisen Erklärungen
- takeaways: Fügen Sie umfassende umsetzbare Erkenntnisse und Umsetzungsstrategien hinzu
- keyPoints: Bieten Sie 10-15 detaillierte Kernpunkte, die alle wichtigen Aspekte abdecken
- prerequisites: Detaillieren Sie das benötigte Hintergrundwissen und die Grundkonzepte
- methodology: Erklären Sie Methoden, Prozesse, Frameworks und Ansätze im Detail
- applications: Beschreiben Sie reale Anwendungen, Anwendungsfälle und praktische Umsetzungen
- limitations: Diskutieren Sie gründlich Beschränkungen, Herausforderungen und potenzielle Probleme
- futureDirections: Erkunden Sie zukünftige Implikationen, Entwicklungen und aufkommende Trends
- criticalAnalysis: Bieten Sie durchdachte Bewertung, Stärken, Schwächen und Analyse
- furtherReading: Schlagen Sie zusätzliche Ressourcen, Referenzen und Bereiche für weitere Erforschung vor
- Machen Sie jeden Abschnitt umfangreich und informationsreich

WICHTIG: Formatieren Sie Ihre Antwort als JSON-Objekt mit GENAU diesen Feldern und Datentypen:
{
  "title": "Ein überzeugender, beschreibender Titel für die umfassende Zusammenfassung (STRING)",
  "overview": "Detaillierter Überblick in 4-6 Sätzen über Umfang und Bedeutung (STRING)",
  "mainConcepts": "Umfassende Kernkonzepte, die in umfassenden Details über mehrere Absätze erklärt werden (STRING)",
  "keyPoints": ["Array", "von", "10-15", "detaillierten", "Kernpunkten", "die", "alle", "wichtigen", "Aspekte", "abdecken"],
  "examples": "Mehrere umfassende Beispiele und Fallstudien mit detaillierten Erklärungen (STRING)",
  "takeaways": "Umfassende umsetzbare Erkenntnisse, Umsetzungsstrategien und praktische Schlussfolgerungen (STRING)",
  "prerequisites": "Hintergrundwissen und Grundkonzepte, die zum Verständnis dieses Themas benötigt werden (STRING)",
  "methodology": "Detaillierte Erklärung der verwendeten Methoden, Prozesse, Frameworks und Ansätze (STRING)",
  "applications": "Umfassende reale Anwendungen, Anwendungsfälle und praktische Umsetzungen (STRING)",
  "limitations": "Gründliche Diskussion von Beschränkungen, Herausforderungen, potenziellen Problemen und Grenzen (STRING)",
  "futureDirections": "Zukünftige Implikationen, Entwicklungen, aufkommende Trends und potenzielle Fortschritte (STRING)",
  "criticalAnalysis": "Durchdachte Bewertung, Stärken, Schwächen und analytische Erkenntnisse (STRING)",
  "furtherReading": "Zusätzliche Ressourcen, Referenzen und Bereiche für weitere Erforschung (STRING)",
  "tags": ["Array", "von", "umfassenden", "relevanten", "Tags"],
  "estimatedReadTime": 20
}

KRITISCH:
- ALLE Felder außer keyPoints, tags und estimatedReadTime müssen STRINGS sein (fortlaufender Text)
- keyPoints muss ein ARRAY von Strings sein (10-15 detaillierte Punkte)
- tags muss ein ARRAY von Strings sein
- estimatedReadTime muss eine ZAHL sein (schätzen Sie 15-25 Minuten für umfassende Inhalte)
- Verwenden Sie KEINE verschachtelten Objekte oder komplexe Strukturen
- Schreiben Sie alle Textfelder als fließende, umfassende Absätze
- Machen Sie diese Zusammenfassung extrem detailliert und gründlich - nutzen Sie die volle 16.000-Token-Kapazität für maximale Umfassendheit
- Stellen Sie sicher, dass jeder Abschnitt erheblichen Wert und Tiefe bietet

Machen Sie es umfassend, detailliert und lehrreich - priorisieren Sie maximale Tiefe und Gründlichkeit über Kürze.` :
    `You are an expert educational content creator and curriculum designer. Create a COMPREHENSIVE, in-depth learnable summary of the provided document. This summary should be extremely detailed and thorough, suitable for deep learning and mastery of the subject matter.

Requirements:
1. Create an EXTENSIVE, detailed summary with comprehensive coverage of all important concepts
2. Write in-depth explanations that cover fundamentals, advanced concepts, and nuances
3. Include comprehensive examples, case studies, and practical applications
4. Adjust complexity based on difficulty level: ${difficulty}
5. Focus on deep understanding, practical application, and real-world relevance
6. Cover background context, historical development, and future implications where relevant
7. Include detailed explanations of processes, methodologies, and best practices
8. Address common misconceptions and provide clarifications
9. Provide critical analysis and evaluation where appropriate
10. Include comprehensive coverage of limitations and constraints
${focusAreas.length > 0 ? `11. Pay special attention to these areas with extra detail: ${focusAreas.join(', ')}` : ''}

COMPREHENSIVE CONTENT GUIDELINES:
- overview: Write 4-6 detailed sentences covering scope, significance, and context
- mainConcepts: Write 4-6 detailed paragraphs covering all core concepts thoroughly
- examples: Provide multiple detailed examples with step-by-step explanations
- takeaways: Include comprehensive actionable insights and implementation strategies
- keyPoints: Provide 10-15 detailed key points covering all major aspects
- prerequisites: Detail background knowledge and foundational concepts needed
- methodology: Explain methods, processes, frameworks, and approaches in detail
- applications: Describe real-world applications, use cases, and practical implementations
- limitations: Thoroughly discuss constraints, challenges, and potential issues
- futureDirections: Explore future implications, developments, and emerging trends
- criticalAnalysis: Provide thoughtful evaluation, strengths, weaknesses, and analysis
- furtherReading: Suggest additional resources, references, and areas for exploration
- Make each section substantial and information-rich

IMPORTANT: Format your response as a JSON object with EXACTLY these fields and data types:
{
  "title": "A compelling, descriptive title for the comprehensive summary (STRING)",
  "overview": "Detailed overview in 4-6 sentences covering scope and significance (STRING)",
  "mainConcepts": "Extensive core concepts explained in comprehensive detail across multiple paragraphs (STRING)",
  "keyPoints": ["Array", "of", "10-15", "detailed", "key", "points", "covering", "all", "major", "aspects"],
  "examples": "Multiple comprehensive examples and case studies with detailed explanations (STRING)",
  "takeaways": "Extensive actionable takeaways, implementation strategies, and practical conclusions (STRING)",
  "prerequisites": "Background knowledge and foundational concepts needed to understand this topic (STRING)",
  "methodology": "Detailed explanation of methods, processes, frameworks, and approaches used (STRING)",
  "applications": "Comprehensive real-world applications, use cases, and practical implementations (STRING)",
  "limitations": "Thorough discussion of constraints, challenges, potential issues, and boundaries (STRING)",
  "futureDirections": "Future implications, developments, emerging trends, and potential advancements (STRING)",
  "criticalAnalysis": "Thoughtful evaluation, strengths, weaknesses, and analytical insights (STRING)",
  "furtherReading": "Additional resources, references, and areas for continued exploration (STRING)",
  "tags": ["Array", "of", "comprehensive", "relevant", "tags"],
  "estimatedReadTime": 20
}

CRITICAL: 
- ALL fields except keyPoints, tags, and estimatedReadTime must be STRINGS (continuous text)
- keyPoints must be an ARRAY of strings (10-15 detailed points)
- tags must be an ARRAY of strings  
- estimatedReadTime must be a NUMBER (estimate 15-25 minutes for comprehensive content)
- Do NOT use nested objects or complex structures
- Write all text fields as flowing, comprehensive paragraphs
- Make this summary extremely detailed and thorough - use the full 16,000 token capacity for maximum comprehensiveness
- Ensure each section provides substantial value and depth

Make it comprehensive, detailed, and educational - prioritize maximum depth and thoroughness over brevity.`

  const userPrompt = isGerman ? 
    `Dokumenttitel: ${documentTitle}

Dokumentinhalt:
${documentContent}

Bitte erstellen Sie eine UMFASSENDE, detaillierte Zusammenfassung nach den oben genannten Anforderungen. Analysieren Sie dieses Dokument gründlich und bieten Sie umfassende Abdeckung aller wichtigen Konzepte, Methoden und Anwendungen. ${includeExamples ? 'Fügen Sie mehrere detaillierte Beispiele und umfassende Fallstudien mit schrittweisen Erklärungen hinzu.' : 'Konzentrieren Sie sich auf umfassende Konzepterklärungen ohne detaillierte Beispiele.'} 

Machen Sie diese Zusammenfassung so detailliert und lehrreich wie möglich - nutzen Sie die volle verfügbare 16.000-Token-Kapazität, um maximale umfassende Abdeckung zu bieten, die für fortgeschrittenes Lernen und Beherrschung des Themas geeignet ist.

WICHTIGE ERINNERUNG: Ihre Antwort muss ein gültiges JSON-Objekt mit allen angegebenen Feldern sein. Fügen Sie keinen Text außerhalb des JSON-Objekts hinzu.` :
    `Document Title: ${documentTitle}

Document Content:
${documentContent}

Please create a COMPREHENSIVE, in-depth learnable summary following the requirements above. Analyze this document thoroughly and provide extensive coverage of all important concepts, methodologies, and applications. ${includeExamples ? 'Include multiple detailed examples and comprehensive case studies with step-by-step explanations.' : 'Focus on comprehensive concept explanations without detailed examples.'} 

Make this summary as detailed and educational as possible - use the full available 16,000 token capacity to provide maximum comprehensive coverage that would be suitable for advanced learning and mastery of the subject matter.

CRITICAL REMINDER: Your response must be a valid JSON object with all the specified fields. Do not include any text outside the JSON object.`

  return await AIProviders.generateCompletion({
    provider,
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    maxTokens: 16000, // Increased from 12000 to 16000 for maximum comprehensiveness
    temperature: 0.7,
    responseFormat: "json",
  })
}

// Helper function for flashcard generation
export async function generateFlashcards({
  provider,
  model,
  documentTitle,
  documentContent,
  difficulty,
  numberOfCards = 10,
  language = 'en',
}: {
  provider: AIProvider
  model: AIModel
  documentTitle: string
  documentContent: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  numberOfCards?: number
  language?: 'en' | 'de'
}): Promise<AIResponse> {
  const isGerman = language === 'de'
  
  const systemPrompt = isGerman ? 
    `Sie sind ein Experte für die Erstellung von Bildungsinhalten und Lernkarten. Erstellen Sie hochwertige Karteikarten basierend auf dem bereitgestellten Dokument.

Anforderungen:
1. Erstellen Sie genau ${numberOfCards} Karteikarten
2. Passen Sie die Schwierigkeit an das Niveau ${difficulty} an
3. Erstellen Sie vielfältige Fragetypen (Definitionen, Konzepte, Anwendungen, etc.)
4. Jede Karte sollte fokussiert und spezifisch sein
5. Stellen Sie sicher, dass alle wichtigen Konzepte abgedeckt sind
6. Fügen Sie hilfreiche Erklärungen hinzu
7. Verwenden Sie klare, präzise Sprache
8. Machen Sie Fragen herausfordernd aber fair

Formatieren Sie Ihre Antwort als JSON-Array mit genau dieser Struktur:
{
  "flashcards": [
    {
      "question": "Klar formulierte Frage (STRING)",
      "answer": "Präzise Antwort (STRING)",
      "explanation": "Hilfreiche Erklärung oder zusätzlicher Kontext (STRING)",
      "difficulty": "${difficulty}",
      "tags": ["Array", "von", "relevanten", "Tags"]
    }
  ]
}

WICHTIG: Antworten Sie nur mit gültigem JSON. Kein zusätzlicher Text außerhalb des JSON-Objekts.` :
    `You are an expert educational content creator and flashcard designer. Create high-quality flashcards based on the provided document.

Requirements:
1. Create exactly ${numberOfCards} flashcards
2. Adjust difficulty to ${difficulty} level
3. Create diverse question types (definitions, concepts, applications, etc.)
4. Each card should be focused and specific
5. Ensure all important concepts are covered
6. Include helpful explanations
7. Use clear, precise language
8. Make questions challenging but fair

Format your response as a JSON array with exactly this structure:
{
  "flashcards": [
    {
      "question": "Clear, well-formed question (STRING)",
      "answer": "Precise answer (STRING)",
      "explanation": "Helpful explanation or additional context (STRING)",
      "difficulty": "${difficulty}",
      "tags": ["Array", "of", "relevant", "tags"]
    }
  ]
}

IMPORTANT: Respond only with valid JSON. No additional text outside the JSON object.`

  const userPrompt = isGerman ? 
    `Dokumenttitel: ${documentTitle}

Dokumentinhalt:
${documentContent}

Bitte erstellen Sie ${numberOfCards} hochwertige Karteikarten auf ${difficulty}-Niveau basierend auf diesem Dokument. Stellen Sie sicher, dass die Karten alle wichtigen Konzepte abdecken und für effektives Lernen geeignet sind.` :
    `Document Title: ${documentTitle}

Document Content:
${documentContent}

Please create ${numberOfCards} high-quality flashcards at ${difficulty} level based on this document. Ensure the cards cover all important concepts and are suitable for effective learning.`

  return await AIProviders.generateCompletion({
    provider,
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    maxTokens: 8000,
    temperature: 0.7,
    responseFormat: "json",
  })
}

// Helper function for quiz generation
export async function generateQuiz({
  provider,
  model,
  documentTitle,
  documentContent,
  difficulty,
  numberOfQuestions = 5,
  language = 'en',
}: {
  provider: AIProvider
  model: AIModel
  documentTitle: string
  documentContent: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  numberOfQuestions?: number
  language?: 'en' | 'de'
}): Promise<AIResponse> {
  const isGerman = language === 'de'
  
  const systemPrompt = isGerman ? 
    `Sie sind ein Experte für die Erstellung von Bildungsinhalten und Prüfungen. Erstellen Sie ein hochwertiges Multiple-Choice-Quiz basierend auf dem bereitgestellten Dokument.

Anforderungen:
1. Erstellen Sie genau ${numberOfQuestions} Multiple-Choice-Fragen
2. Passen Sie die Schwierigkeit an das Niveau ${difficulty} an
3. Jede Frage sollte 4 Antwortmöglichkeiten haben
4. Nur eine Antwort ist korrekt
5. Falsche Antworten sollten plausibel aber eindeutig falsch sein
6. Fügen Sie Erklärungen für die richtige Antwort hinzu
7. Decken Sie verschiedene Aspekte des Dokuments ab
8. Stellen Sie sicher, dass Fragen präzise und eindeutig sind

Formatieren Sie Ihre Antwort als JSON-Objekt mit genau dieser Struktur:
{
  "quiz": {
    "title": "Titel des Quiz (STRING)",
    "description": "Kurze Beschreibung des Quiz (STRING)",
    "questions": [
      {
        "question": "Klar formulierte Frage (STRING)",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Erklärung, warum diese Antwort richtig ist (STRING)",
        "difficulty": "${difficulty}",
        "tags": ["Array", "von", "relevanten", "Tags"]
      }
    ]
  }
}

WICHTIG: correctAnswer ist der Index (0-3) der richtigen Antwort im options Array. Antworten Sie nur mit gültigem JSON.` :
    `You are an expert educational content creator and quiz designer. Create a high-quality multiple-choice quiz based on the provided document.

Requirements:
1. Create exactly ${numberOfQuestions} multiple-choice questions
2. Adjust difficulty to ${difficulty} level
3. Each question should have 4 answer options
4. Only one answer is correct
5. Wrong answers should be plausible but clearly incorrect
6. Include explanations for correct answers
7. Cover different aspects of the document
8. Ensure questions are precise and unambiguous

Format your response as a JSON object with exactly this structure:
{
  "quiz": {
    "title": "Quiz title (STRING)",
    "description": "Brief description of the quiz (STRING)",
    "questions": [
      {
        "question": "Clear, well-formed question (STRING)",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Explanation of why this answer is correct (STRING)",
        "difficulty": "${difficulty}",
        "tags": ["Array", "of", "relevant", "tags"]
      }
    ]
  }
}

IMPORTANT: correctAnswer is the index (0-3) of the correct answer in the options array. Respond only with valid JSON.`

  const userPrompt = isGerman ? 
    `Dokumenttitel: ${documentTitle}

Dokumentinhalt:
${documentContent}

Bitte erstellen Sie ein ${numberOfQuestions}-Fragen-Quiz auf ${difficulty}-Niveau basierend auf diesem Dokument. Stellen Sie sicher, dass das Quiz alle wichtigen Konzepte testet und für effektives Lernen geeignet ist.` :
    `Document Title: ${documentTitle}

Document Content:
${documentContent}

Please create a ${numberOfQuestions}-question quiz at ${difficulty} level based on this document. Ensure the quiz tests all important concepts and is suitable for effective learning.`

  return await AIProviders.generateCompletion({
    provider,
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    maxTokens: 6000,
    temperature: 0.7,
    responseFormat: "json",
  })
}