# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LearnifyAI is a SaaS platform that transforms documents (PDF, DOCX, TXT, Markdown) into interactive learning materials using AI. The platform generates flashcards, quizzes, summaries, and provides spaced repetition learning algorithms.

## Architecture

### Core Technology Stack
- **Frontend**: Next.js 14 with TypeScript, App Router, Server Components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: OpenAI GPT-4 API
- **Styling**: Tailwind CSS + Shadcn/ui components
- **File Processing**: PDF.js (PDF), Mammoth.js (DOCX)
- **Data Fetching**: React Query
- **Form Handling**: React Hook Form with Zod validation

### Key Components

#### Document Processing Pipeline
The platform processes documents through multiple stages:
1. **Upload**: File validation and storage (10MB limit)
2. **Parsing**: Multi-format content extraction preserving structure
3. **AI Processing**: Content analysis and learning material generation
4. **Storage**: Structured data persistence with proper indexing

#### Learning Systems
- **Flashcard Generation**: AI-powered with variety in question types
- **Spaced Repetition**: SM-2 algorithm implementation for optimal learning intervals
- **Quiz System**: Interactive quizzes with immediate feedback and explanations
- **Progress Tracking**: Database-driven analytics and performance metrics

## Development Patterns

### TypeScript Standards
- Strict mode enabled - no `any` types permitted
- All API responses require proper type definitions
- Use Zod for runtime validation of external data
- Comprehensive error type definitions

### Database Patterns
- Critical indexing on user_id and document_id for performance
- Database transactions for multi-table operations
- Connection pooling for production environments
- Proper foreign key relationships

### AI Integration Best Practices
- Implement retry logic with exponential backoff for API calls
- Queue system for bulk processing operations
- Aggressive caching of AI responses to reduce costs
- Token counting before API calls for cost management
- Version control AI prompts for A/B testing

### Security Implementation
- File upload validation beyond extension checking
- Input sanitization before AI processing
- Proper CORS configuration
- Parameterized queries (handled by Prisma)
- Virus scanning for uploaded files

## Critical Implementation Notes

### Cost Management
- GPT-4 is expensive - implement per-user usage limits
- Consider GPT-3.5 for non-critical features
- Cache AI responses aggressively
- Monitor token usage carefully

### Performance Considerations
- Virtual scrolling for large flashcard sets
- Web workers for PDF.js processing
- Proper error boundaries and fallbacks
- Connection pooling and query optimization

### State Management Strategy
- React Query for server state management
- Local state for UI-only concerns
- Avoid over-using React Context
- Consider Zustand for complex client state

### Browser Compatibility
- PDF.js requires web workers setup
- File upload progress limitations in older browsers
- Implement appropriate fallbacks

## Error Handling Patterns

Implement specific error types rather than generic try-catch blocks:
- Document parsing errors
- AI API failures
- Database connection issues
- File upload failures
- Authentication errors

Provide user-friendly error messages with proper logging for debugging.

## Testing Requirements

- Unit tests for utility functions (especially spaced repetition algorithms)
- Integration tests for API routes
- E2E tests for critical user flows
- Mock OpenAI API in test environments
- Database seeding for consistent test data

## Deployment Considerations

- **Platform**: Vercel for deployment
- **Storage**: AWS S3 for file storage
- **Database**: PostgreSQL with proper backup strategies
- **Monitoring**: Implement proper logging and error tracking
- **Scaling**: Consider database connection limits and API rate limits