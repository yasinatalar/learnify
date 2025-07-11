name: "LearnifyAI - AI-Powered Document Learning Platform"
description: |
Complete implementation of LearnifyAI SaaS platform that transforms documents into interactive learning materials with AI-generated flashcards, quizzes, and spaced repetition algorithms.

---

## Goal

Build a complete LearnifyAI SaaS platform from scratch that:

- Accepts document uploads (PDF, DOCX, TXT, Markdown) up to 10MB
- Extracts and processes content using AI (OpenAI GPT-4)
- Generates interactive flashcards with spaced repetition (SM-2 algorithm)
- Creates quizzes with immediate feedback and explanations
- Provides comprehensive progress tracking and analytics
- Includes user authentication, subscription management, and export features

## Why

- **Business Value**: Creates a comprehensive learning platform that addresses the growing demand for AI-powered educational tools
- **User Impact**: Transforms passive document reading into active learning with proven spaced repetition techniques
- **Market Opportunity**: Combines document processing, AI generation, and learning science into a unified platform
- **Integration**: Establishes foundation for future features like mind mapping, collaborative learning, and advanced analytics

## What

### User-Visible Behavior

- Users upload documents and receive AI-generated learning materials within minutes
- Interactive flashcard system with spaced repetition scheduling
- Quiz system with multiple difficulty levels and immediate feedback
- Progress dashboard showing learning metrics and performance analytics
- Export functionality for Anki, PDF, and other formats
- Subscription-based access with usage limits and tier management

### Technical Requirements

- Next.js 14 App Router with TypeScript and Server Components
- PostgreSQL database with Prisma ORM
- OpenAI GPT-4 API integration with rate limiting and cost management
- NextAuth.js v5 for authentication
- Tailwind CSS with Shadcn/ui components
- File upload handling with progress tracking and validation
- Responsive design with WCAG 2.1 AA compliance

### Success Criteria

- [ ] Users can upload and process documents in under 2 minutes
- [ ] AI generates 15-20 high-quality flashcards per document
- [ ] Spaced repetition algorithm schedules reviews with 90%+ accuracy
- [ ] Quiz system provides immediate feedback with explanations
- [ ] Progress tracking shows learning metrics and performance trends
- [ ] Export functionality generates valid Anki decks (.apkg files)
- [ ] Platform handles 100+ concurrent users without performance degradation
- [ ] All code passes strict TypeScript validation and comprehensive tests

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://nextjs.org/docs/app
  why: App Router patterns, Server Components, and project structure

- url: https://nextjs.org/docs/app/building-your-application/data-fetching/patterns
  why: Data fetching patterns and caching strategies

- url: https://platform.openai.com/docs/guides/rate-limits
  why: Rate limiting strategies and error handling patterns

- url: https://cookbook.openai.com/examples/how_to_handle_rate_limits
  why: Exponential backoff implementation examples

- url: https://www.prisma.io/docs/orm/prisma-schema
  why: Database schema design and relationship patterns

- url: https://authjs.dev/getting-started/migrating-to-v5
  why: NextAuth.js v5 setup and configuration patterns

- url: https://ui.shadcn.com/docs/installation/next
  why: Shadcn/ui setup and component organization

- url: https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5
  why: React Query v5 patterns and best practices

- url: https://mozilla.github.io/pdf.js/examples/
  why: PDF.js implementation with web workers

- url: https://github.com/mwilliamson/mammoth.js
  why: DOCX parsing implementation examples

- url: https://www.npmjs.com/package/supermemo
  why: SM-2 spaced repetition algorithm implementation

- file: /Users/yasinatalar/projects/yasin/pomo.ai/CLAUDE.md
  why: Project-specific patterns, conventions, and critical implementation notes

- file: /Users/yasinatalar/projects/yasin/pomo.ai/INITIAL.md
  why: Complete feature specification and examples

- docfile: /Users/yasinatalar/projects/yasin/pomo.ai/examples/
  why: Code examples showing intended patterns for core features
```

### Current Codebase Tree

```bash
/Users/yasinatalar/projects/yasin/pomo.ai/
├── .claude/                          # Claude IDE configuration
├── .vscode/                          # VS Code configuration
├── examples/                         # Minimal code examples
│   ├── document-parsing/
│   ├── flashcard-generation/
│   ├── interactive-quiz/
│   ├── spaced-repetition/
│   └── upload-flow/
├── PRPs/                            # Project Requirements & Plans
├── CLAUDE.md                        # Project guidance
└── INITIAL.md                       # Feature specification

# STATUS: No actual implementation exists - building from scratch
```

### Desired Codebase Tree

```bash
/Users/yasinatalar/projects/yasin/pomo.ai/
├── .next/                           # Next.js build output
├── app/                             # Next.js 14 App Router
│   ├── (auth)/                      # Auth route groups
│   ├── (dashboard)/                 # Protected dashboard routes
│   ├── api/                         # API routes
│   ├── globals.css                  # Global styles
│   ├── layout.tsx                   # Root layout
│   └── page.tsx                     # Landing page
├── components/                      # React components
│   ├── ui/                          # Shadcn/ui components
│   ├── dashboard/                   # Dashboard components
│   ├── flashcards/                  # Flashcard components
│   ├── quiz/                        # Quiz components
│   └── upload/                      # File upload components
├── lib/                             # Utility functions
│   ├── auth.ts                      # Authentication config
│   ├── db.ts                        # Database connection
│   ├── ai/                          # AI integration
│   ├── parsers/                     # Document parsers
│   ├── spaced-repetition/           # Learning algorithms
│   └── utils.ts                     # General utilities
├── prisma/                          # Database schema and migrations
├── public/                          # Static assets
├── types/                           # TypeScript type definitions
├── __tests__/                       # Test files
├── .env.local                       # Environment variables
├── next.config.js                   # Next.js configuration
├── package.json                     # Dependencies
├── prisma/schema.prisma             # Database schema
├── tailwind.config.ts               # Tailwind configuration
└── tsconfig.json                    # TypeScript configuration
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: OpenAI API rate limits require exponential backoff
// Example: Implement retry logic with 1s, 2s, 4s, 8s delays
// Example: GPT-4 costs $0.03/1K tokens - implement usage tracking

// CRITICAL: PDF.js requires web workers for performance
// Example: Must configure GlobalWorkerOptions.workerSrc
// Example: Large PDFs (>5MB) can cause memory issues

// CRITICAL: Next.js 14 Server Components vs Client Components
// Example: "use client" directive needed for interactive components
// Example: Server Components can't use browser APIs or event handlers

// CRITICAL: Prisma connection pooling in production
// Example: Use connection pooling to prevent "too many connections" errors
// Example: Implement proper transaction handling for multi-table operations

// CRITICAL: File upload size limits and validation
// Example: 10MB limit requires proper validation on both client and server
// Example: Implement virus scanning for uploaded files

// CRITICAL: Strict TypeScript mode - no 'any' types allowed
// Example: All API responses must have proper type definitions
// Example: Use Zod for runtime validation of external data
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// Core database models ensuring type safety and relationships
// Prisma schema with proper indexing for performance

// User model with subscription management
model User {
  id: string (uuid, primary key)
  email: string (unique, indexed)
  subscription: SubscriptionTier
  usage: UserUsage (relation)
  documents: Document[] (relation)
}

// Document model with processing status
model Document {
  id: string (uuid, primary key)
  userId: string (foreign key, indexed)
  title: string
  content: string (text)
  status: ProcessingStatus
  flashcards: Flashcard[] (relation)
  quizzes: Quiz[] (relation)
}

// Flashcard model with spaced repetition data
model Flashcard {
  id: string (uuid, primary key)
  documentId: string (foreign key, indexed)
  question: string
  answer: string
  interval: number (SM-2 algorithm)
  repetition: number
  efactor: number
  nextReview: DateTime (indexed)
}

// Pydantic-style schemas for API validation
interface DocumentUploadRequest {
  file: File
  title?: string
  processingOptions?: ProcessingOptions
}

interface FlashcardGenerationRequest {
  documentId: string
  count: number (1-50)
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  focusAreas: string[]
}
```

### List of Tasks to Complete (In Order)

```yaml
Task 1: Project Foundation Setup
INITIALIZE Next.js 14 project:
  - RUN: npx create-next-app@latest learnify-ai --typescript --tailwind --app --src-dir
  - CONFIGURE: tsconfig.json with strict mode
  - SETUP: package.json with all required dependencies
  - ESTABLISH: folder structure following Next.js 14 App Router patterns

Task 2: Database Schema & Prisma Setup
CREATE prisma/schema.prisma:
  - DEFINE: User, Document, Flashcard, Quiz, UserUsage models
  - IMPLEMENT: proper foreign key relationships
  - ADD: critical indexes for performance (user_id, document_id)
  - CONFIGURE: connection pooling for production

Task 3: Authentication System
IMPLEMENT NextAuth.js v5:
  - CREATE: lib/auth.ts with configuration
  - SETUP: app/api/auth/[...nextauth]/route.ts
  - IMPLEMENT: middleware for protected routes
  - CREATE: login/register pages with proper validation

Task 4: UI Component Foundation
SETUP Shadcn/ui:
  - INITIALIZE: shadcn-ui components
  - CREATE: components/ui/ with base components
  - IMPLEMENT: responsive layout with dashboard structure
  - ESTABLISH: component patterns for forms and data display

Task 5: File Upload System
IMPLEMENT document upload:
  - CREATE: components/upload/FileUpload.tsx with progress tracking
  - IMPLEMENT: app/api/documents/upload/route.ts with validation
  - ADD: file type validation and size limits (10MB)
  - SETUP: temporary storage and processing pipeline

Task 6: Document Parsing Pipeline
CREATE lib/parsers/:
  - IMPLEMENT: PDF.js parser with web workers
  - IMPLEMENT: Mammoth.js parser for DOCX files
  - CREATE: text and markdown parsers
  - ESTABLISH: unified content extraction interface

Task 7: OpenAI Integration
IMPLEMENT lib/ai/:
  - CREATE: OpenAI client with rate limiting
  - IMPLEMENT: exponential backoff retry logic
  - CREATE: flashcard generation prompts
  - SETUP: usage tracking and cost management

Task 8: Flashcard Generation System
CREATE flashcard features:
  - IMPLEMENT: AI-powered flashcard generation
  - CREATE: components/flashcards/ with interactive UI
  - SETUP: spaced repetition algorithm (SM-2)
  - IMPLEMENT: review scheduling and progress tracking

Task 9: Quiz System
IMPLEMENT quiz functionality:
  - CREATE: components/quiz/ with interactive questions
  - IMPLEMENT: immediate feedback and explanations
  - SETUP: multiple difficulty levels
  - CREATE: progress tracking and analytics

Task 10: Progress Tracking & Analytics
IMPLEMENT analytics:
  - CREATE: dashboard with learning metrics
  - IMPLEMENT: performance tracking over time
  - SETUP: visualization components for progress
  - CREATE: export functionality for reports

Task 11: Export Features
IMPLEMENT export system:
  - CREATE: Anki deck export (.apkg format)
  - IMPLEMENT: PDF export with formatting
  - SETUP: CSV export for data analysis
  - CREATE: batch export functionality

Task 12: Subscription Management
IMPLEMENT subscription system:
  - CREATE: subscription tiers and limits
  - IMPLEMENT: usage tracking and enforcement
  - SETUP: upgrade/downgrade flows
  - CREATE: billing integration (prepare for Stripe)

Task 13: Testing & Quality Assurance
IMPLEMENT comprehensive testing:
  - CREATE: unit tests for utility functions
  - IMPLEMENT: integration tests for API routes
  - SETUP: E2E tests for critical user flows
  - CREATE: performance tests for AI integration

Task 14: Performance Optimization
OPTIMIZE platform performance:
  - IMPLEMENT: caching strategies for AI responses
  - SETUP: database query optimization
  - CREATE: virtual scrolling for large datasets
  - IMPLEMENT: lazy loading for components

Task 15: Security & Production Readiness
IMPLEMENT security measures:
  - SETUP: input sanitization and validation
  - IMPLEMENT: rate limiting on API endpoints
  - CREATE: error handling and logging
  - SETUP: monitoring and alerting systems
```

### Per Task Pseudocode

```typescript
// Task 6: Document Parsing Pipeline
async function parseDocument(
  file: File,
  type: string
): Promise<ParsedDocument> {
  // PATTERN: Validate file type and size first
  validateFile(file); // throws ValidationError if invalid

  // GOTCHA: PDF.js requires web workers configuration
  if (type === "pdf") {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";
  }

  // PATTERN: Use factory pattern for different parsers
  const parser = ParserFactory.create(type);

  // CRITICAL: Handle large files with streaming
  const content = await parser.extractContent(file);

  // PATTERN: Standardized response format
  return {
    title: extractTitle(content),
    content: content,
    metadata: extractMetadata(file),
    wordCount: countWords(content),
  };
}

// Task 7: OpenAI Integration
async function generateFlashcards(
  content: string,
  options: FlashcardOptions
): Promise<Flashcard[]> {
  // PATTERN: Always validate input first
  const validated = validateFlashcardRequest(content, options);

  // GOTCHA: OpenAI API has rate limits - implement retry logic
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
    timeout: 60000,
  });

  // CRITICAL: Count tokens before API call for cost management
  const tokenCount = countTokens(content);
  if (tokenCount > 8000) {
    throw new Error("Content too large for processing");
  }

  // PATTERN: Use structured prompts for consistent output
  const prompt = buildFlashcardPrompt(content, options);

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-2025-04-14",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // PATTERN: Parse and validate AI response
    const flashcards = parseFlashcardResponse(
      response.choices[0].message.content
    );
    return validateFlashcards(flashcards);
  } catch (error) {
    // PATTERN: Specific error handling for different scenarios
    if (error.status === 429) {
      throw new RateLimitError("OpenAI rate limit exceeded");
    }
    throw new AIProcessingError("Failed to generate flashcards");
  }
}
```

### Integration Points

```yaml
DATABASE:
  - migration: "CREATE TABLE users, documents, flashcards, quizzes with proper indexes"
  - index: "CREATE INDEX idx_user_documents ON documents(user_id)"
  - index: "CREATE INDEX idx_flashcard_reviews ON flashcards(next_review)"

CONFIG:
  - add to: lib/config.ts
  - pattern: "OPENAI_API_KEY = process.env.OPENAI_API_KEY"
  - pattern: "MAX_FILE_SIZE = 10 * 1024 * 1024" // 10MB

ROUTES:
  - add to: app/api/documents/route.ts
  - add to: app/api/flashcards/route.ts
  - add to: app/api/quiz/route.ts
  - pattern: "export async function POST(request: Request)"

MIDDLEWARE:
  - add to: middleware.ts
  - pattern: "export { default } from 'next-auth/middleware'"
  - configure: "matcher for protected routes"
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                         # ESLint checking
npm run type-check                   # TypeScript validation
npm run format                       # Prettier formatting

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests

```typescript
// CREATE __tests__/lib/parsers.test.ts
describe("Document Parser", () => {
  test("should parse PDF files correctly", async () => {
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const result = await parseDocument(file, "pdf");

    expect(result.title).toBeDefined();
    expect(result.content).toContain("test content");
    expect(result.wordCount).toBeGreaterThan(0);
  });

  test("should handle invalid file types", async () => {
    const file = new File(["test"], "test.exe", { type: "application/exe" });

    await expect(parseDocument(file, "exe")).rejects.toThrow(ValidationError);
  });
});

// CREATE __tests__/lib/ai.test.ts
describe("AI Integration", () => {
  test("should generate flashcards from content", async () => {
    const content = "The mitochondria is the powerhouse of the cell.";
    const options = { count: 5, difficulty: "medium" };

    const flashcards = await generateFlashcards(content, options);

    expect(flashcards).toHaveLength(5);
    expect(flashcards[0].question).toBeDefined();
    expect(flashcards[0].answer).toBeDefined();
  });

  test("should handle rate limit errors", async () => {
    // Mock OpenAI API to return 429 error
    jest
      .spyOn(OpenAI.prototype, "chat.completions.create")
      .mockRejectedValueOnce(new Error("Rate limit exceeded"));

    await expect(generateFlashcards("test", { count: 1 })).rejects.toThrow(
      RateLimitError
    );
  });
});
```

```bash
# Run and iterate until passing:
npm test
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Tests

```bash
# Start the development server
npm run dev

# Test document upload endpoint
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test.pdf" \
  -H "Authorization: Bearer $TOKEN"

# Expected: {"success": true, "documentId": "uuid", "status": "processing"}

# Test flashcard generation endpoint
curl -X POST http://localhost:3000/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"documentId": "uuid", "count": 10, "difficulty": "medium"}'

# Expected: {"success": true, "flashcards": [...]}
```

### Level 4: End-to-End Tests

```typescript
// CREATE __tests__/e2e/user-flow.test.ts
describe("Complete User Flow", () => {
  test("user can upload document and generate flashcards", async () => {
    // 1. Login
    await page.goto("/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('[type="submit"]');

    // 2. Upload document
    await page.goto("/dashboard");
    await page.setInputFiles('[name="file"]', "test.pdf");
    await page.click('[data-testid="upload-button"]');

    // 3. Wait for processing
    await page.waitForSelector('[data-testid="processing-complete"]');

    // 4. Generate flashcards
    await page.click('[data-testid="generate-flashcards"]');
    await page.waitForSelector('[data-testid="flashcard-list"]');

    // 5. Verify flashcards exist
    const flashcards = await page.locator('[data-testid="flashcard"]').count();
    expect(flashcards).toBeGreaterThan(0);
  });
});
```

## Final Validation Checklist

- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Manual upload test successful: Upload 5MB PDF and generate flashcards
- [ ] Error cases handled gracefully: Invalid file types, rate limits, network errors
- [ ] Logs are informative but not verbose
- [ ] Database migrations run successfully
- [ ] Environment variables properly configured
- [ ] Authentication flows work correctly
- [ ] Subscription limits enforced properly
- [ ] Export functionality generates valid files
- [ ] Performance acceptable with 10+ concurrent users
- [ ] Security measures implemented and tested

---

## Anti-Patterns to Avoid

- ❌ Don't use 'any' types - strict TypeScript mode enforced
- ❌ Don't skip file validation - security vulnerability
- ❌ Don't ignore OpenAI rate limits - will cause production failures
- ❌ Don't use client components for server-side operations
- ❌ Don't hardcode API keys - use environment variables
- ❌ Don't skip database indexes - performance will degrade
- ❌ Don't cache AI responses without expiration - cost management
- ❌ Don't use synchronous operations for file processing
- ❌ Don't skip error boundaries - user experience degradation
- ❌ Don't implement custom auth when NextAuth.js exists
- ❌ Don't skip input sanitization - security vulnerability
- ❌ Don't use generic error messages - poor user experience

## Success Confidence Level: 9/10

This PRP provides comprehensive context, detailed implementation guidance, and executable validation loops. The thorough research, specific examples, and clear task breakdown give high confidence for successful one-pass implementation. The extensive documentation references and gotchas from the codebase analysis ensure the AI agent has all necessary context to avoid common pitfalls and implement a production-ready platform.
