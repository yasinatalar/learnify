# LearnifyAI - AI-Powered Document Learning Platform

## FEATURE:

**LearnifyAI** is a SaaS platform that transforms any document (PDF, DOCX, TXT, Markdown) into interactive, AI-generated learning materials. Users upload documents and receive:

- **Interactive Flashcards** with spaced repetition algorithms
- **Auto-generated Quizzes** with multiple difficulty levels
- **Comprehensive Summaries** and key concept extraction
- **Visual Mind Maps** showing concept relationships
- **Progress Tracking** with analytics and performance metrics
- **Export Options** for Anki, PDF, and other formats

The platform uses OpenAI's GPT-4 for content analysis and generation, Next.js 14 with TypeScript for the frontend, and PostgreSQL for data persistence. It includes user authentication, subscription management, and scalable architecture for handling large documents.

## EXAMPLES:

### 1. Document Upload Flow (`examples/upload-flow/`)

```typescript
// Example: Document upload with real-time processing feedback
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  // Real-time progress updates via WebSocket or polling
  const { documentId } = await response.json();
  router.push(`/dashboard/documents/${documentId}`);
};
```

### 2. Flashcard Generation (`examples/flashcard-generation/`)

```typescript
// Example: AI prompt for generating high-quality flashcards
const flashcards = await AIService.generateFlashcards(documentContent, {
  count: 20,
  difficulty: "mixed",
  focusAreas: ["definitions", "concepts", "applications"],
});
```

### 3. Spaced Repetition Implementation (`examples/spaced-repetition/`)

```typescript
// Example: SM-2 algorithm implementation
function calculateNextReview(difficulty: number, previousInterval: number) {
  const easeFactor = Math.max(1.3, 2.5 - (5 - difficulty) * 0.2);
  const interval =
    difficulty < 3 ? 1 : Math.round(previousInterval * easeFactor);
  return { interval, easeFactor };
}
```

### 4. Quiz Component (`examples/interactive-quiz/`)

```tsx
// Example: Interactive quiz with immediate feedback
<QuizQuestion
  question={currentQuestion}
  onAnswer={(answer) => {
    setShowFeedback(true);
    updateScore(answer === correctAnswer);
  }}
  showExplanation={showFeedback}
/>
```

### 5. Document Parsing (`examples/document-parsing/`)

```typescript
// Example: Multi-format document parser
const parser = new DocumentParser();
const { title, content, metadata } = await parser.parse(file);
// Supports PDF, DOCX, TXT, MD with proper text extraction
```

## DOCUMENTATION:

### Core Technologies:

- **Next.js 14 Documentation**: https://nextjs.org/docs (App Router, Server Components)
- **Prisma ORM**: https://www.prisma.io/docs (Database schema, migrations)
- **NextAuth.js**: https://next-auth.js.org/getting-started/introduction (Authentication)
- **OpenAI API**: https://platform.openai.com/docs/api-reference (GPT-4 integration)
- **Tailwind CSS**: https://tailwindcss.com/docs (Styling)
- **Shadcn/ui**: https://ui.shadcn.com/docs (UI components)

### Required API Documentation:

- **PDF.js**: https://mozilla.github.io/pdf.js/api/ (PDF parsing)
- **Mammoth.js**: https://github.com/mwilliamson/mammoth.js (DOCX parsing)
- **React Query**: https://tanstack.com/query/latest/docs (Data fetching)
- **React Hook Form**: https://react-hook-form.com/docs (Form handling)
- **Zod**: https://zod.dev/ (Schema validation)

### Deployment & Infrastructure:

- **Vercel**: https://vercel.com/docs (Deployment platform)
- **PostgreSQL**: https://www.postgresql.org/docs/ (Database)
- **AWS S3**: https://docs.aws.amazon.com/s3/ (File storage)
- **Stripe**: https://stripe.com/docs (Payment processing)

### AI/ML References:

- **Spaced Repetition**: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2 (SM-2 Algorithm)
- **Bloom's Taxonomy**: For quiz question generation levels
- **RAG (Retrieval Augmented Generation)**: For future improvements

## OTHER CONSIDERATIONS:

### Common AI Assistant Pitfalls to Avoid:

1. **File Size Limitations**

   - AI assistants often forget to implement file size validation
   - Always check file size before upload (10MB default limit)
   - Implement chunking for large documents

2. **OpenAI API Rate Limits**

   - Implement retry logic with exponential backoff
   - Queue system for bulk processing
   - Cache generated content to avoid redundant API calls

3. **TypeScript Strict Mode**

   - The project uses strict TypeScript - no `any` types
   - All API responses must have proper type definitions
   - Use Zod for runtime validation of external data

4. **Database Performance**

   - AI often misses proper indexing - critical for user_id, document_id lookups
   - Use database transactions for multi-table operations
   - Implement connection pooling for production

5. **Security Considerations**

   - File upload validation (not just extension checking)
   - Sanitize all user inputs before AI processing
   - Implement proper CORS configuration
   - Use parameterized queries (Prisma handles this)

6. **Cost Management**

   - GPT-4 is expensive - implement usage limits per user
   - Consider using GPT-3.5 for less critical features
   - Cache AI responses aggressively
   - Implement token counting before API calls

7. **Error Handling**

   - AI assistants often use generic try-catch blocks
   - Implement specific error types for different failures
   - User-friendly error messages (not raw errors)
   - Proper logging for debugging

8. **Browser Compatibility**

   - PDF.js requires web workers setup
   - File upload progress isn't supported in all browsers
   - Implement fallbacks for older browsers

9. **State Management**

   - Don't over-use React Context for everything
   - Use React Query for server state
   - Local state for UI-only concerns
   - Consider Zustand for complex client state

10. **Testing Requirements**
    - Unit tests for utility functions
    - Integration tests for API routes
    - E2E tests for critical user flows
    - Mock OpenAI API in tests

### Specific Implementation Notes:

- **Document Parsing**: The content extraction must preserve formatting hints (headers, lists, etc.) for better AI understanding
- **Flashcard Generation**: Ensure variety in question types - not just definitions
- **Quiz Generation**: Include explanations for wrong answers, not just correct ones
- **Progress Tracking**: Use database triggers for updating statistics
- **Export Features**: Generate valid Anki deck format (.apkg files)
- **Subscription Logic**: Handle edge cases like mid-cycle upgrades/downgrades
- **File Storage**: Implement virus scanning for uploaded files
- **AI Prompts**: Version control prompts for A/B testing
- **Performance**: Implement virtual scrolling for large flashcard sets
- **Accessibility**: Ensure WCAG 2.1 AA compliance throughout
