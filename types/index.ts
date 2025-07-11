import { User, Document, Flashcard, Quiz, QuizQuestion, QuizAttempt, FlashcardReview, UserUsage } from '@prisma/client'

// Database types
export type {
  User,
  Document,
  Flashcard,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  FlashcardReview,
  UserUsage,
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Document processing types
export interface DocumentUploadRequest {
  file: File
  title?: string
  processingOptions?: ProcessingOptions
}

export interface ProcessingOptions {
  generateFlashcards?: boolean
  generateQuiz?: boolean
  flashcardCount?: number
  quizQuestionCount?: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  focusAreas?: string[]
}

export interface ParsedDocument {
  title: string
  content: string
  metadata: DocumentMetadata
  wordCount: number
  pageCount?: number
  language?: string
}

export interface DocumentMetadata {
  originalName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
  processingTime?: number
}

// Flashcard types
export interface FlashcardGenerationRequest {
  documentId: string
  count: number
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  focusAreas?: string[]
}

export interface FlashcardData {
  question: string
  answer: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export interface SpacedRepetitionData {
  interval: number
  repetition: number
  efactor: number
  nextReview: Date
}

// Quiz types
export interface QuizGenerationRequest {
  documentId: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionTypes?: QuestionType[]
}

export interface QuizData {
  title: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: QuizQuestionData[]
}

export interface QuizQuestionData {
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  order: number
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in-blank'

// AI Integration types
export interface AIRequest {
  content: string
  type: 'flashcard' | 'quiz' | 'summary'
  options: Record<string, any>
}

export interface AIResponse {
  success: boolean
  data: any
  tokensUsed: number
  processingTime: number
}

// User analytics types
export interface UserAnalytics {
  documentsProcessed: number
  flashcardsCreated: number
  flashcardsReviewed: number
  quizzesTaken: number
  averageScore: number
  streakDays: number
  totalStudyTime: number
}

export interface LearningProgress {
  flashcardsToReview: number
  flashcardsLearned: number
  quizzesCompleted: number
  averageRetention: number
  weeklyActivity: number[]
}

// Subscription types
export interface SubscriptionLimits {
  documentsPerMonth: number
  flashcardsPerMonth: number
  quizzesPerMonth: number
  aiTokensPerMonth: number
}

export interface UsageStats {
  documentsUsed: number
  flashcardsUsed: number
  quizzesUsed: number
  aiTokensUsed: number
  resetDate: Date
}

// Error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter?: number) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class AIProcessingError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AIProcessingError'
  }
}

export class FileProcessingError extends Error {
  constructor(message: string, public fileType?: string) {
    super(message)
    this.name = 'FileProcessingError'
  }
}

// Utility types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface FilterOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, any>
}

// Export/Import types
export interface ExportOptions {
  format: 'anki' | 'pdf' | 'csv' | 'json'
  includeProgress?: boolean
  includeMetadata?: boolean
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface ExportResult {
  success: boolean
  fileUrl?: string
  fileName?: string
  error?: string
}