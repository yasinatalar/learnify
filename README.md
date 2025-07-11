# LearnifyAI

A powerful SaaS platform that transforms documents into interactive learning materials using AI. Upload your PDFs, DOCX, TXT, or Markdown files and generate flashcards, quizzes, summaries, and leverage spaced repetition algorithms for optimal learning.

## Features

### 📄 Document Processing

- **Multi-format support**: PDF, DOCX, TXT, and Markdown files
- **Smart parsing**: Preserves document structure and formatting
- **File validation**: Secure upload with 10MB size limit
- **Bulk processing**: Handle multiple documents efficiently

### 🧠 AI-Powered Learning Materials

- **Flashcard generation**: Variety of question types powered by GPT-4
- **Interactive quizzes**: Immediate feedback with detailed explanations
- **Smart summaries**: Key concepts extracted from your documents
- **Adaptive content**: AI learns your preferences over time

### 📚 Spaced Repetition System

- **SM-2 Algorithm**: Scientifically proven learning intervals
- **Progress tracking**: Monitor your learning performance
- **Personalized scheduling**: Cards appear when you need to review them
- **Analytics dashboard**: Detailed insights into your learning patterns

### 🔐 Secure & Scalable

- **User authentication**: Secure login with NextAuth.js
- **Data privacy**: Your documents and progress are protected
- **Cloud storage**: Reliable file storage with AWS S3
- **Database optimization**: Fast queries with PostgreSQL + Prisma

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4 API
- **Storage**: AWS S3
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- AWS S3 bucket (for file storage)

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/learnifyai.git
cd learnifyai
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/learnifyai"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="your-openai-api-key"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="your-aws-region"
AWS_S3_BUCKET="your-s3-bucket-name"
```

4. Set up the database

```bash
npx prisma generate
npx prisma db push
```

5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign up/Login**: Create an account or sign in
2. **Upload documents**: Drag and drop your learning materials
3. **AI processing**: Wait for AI to analyze and generate content
4. **Study**: Use flashcards, take quizzes, and track progress
5. **Review**: Follow spaced repetition schedule for optimal learning

## API Routes

- `POST /api/documents/upload` - Upload and process documents
- `GET /api/documents` - List user documents
- `POST /api/flashcards/generate` - Generate flashcards from document
- `GET /api/flashcards` - Get user flashcards
- `POST /api/quizzes/generate` - Generate quiz questions
- `POST /api/learning/review` - Submit review results
- `GET /api/analytics` - Get learning analytics

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email yasinatalar@proton.me or join our [Discord community](https://discord.gg/learnifyai).

---

Made with ❤️ by Yasin Atalar

© 2025 Yasin Atalar. All rights reserved.
