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

## License

This project is copyrighted and can't be used for any purpose other than reviewing at all. - see the [LICENSE](LICENSE) file for details.

## Support

For support, email yasinatalar@proton.me or join our [Discord community](https://discord.gg/learnifyai).

## Gallery

### Dashboard
<img width="1690" height="867" alt="Bildschirmfoto 2025-07-14 um 11 29 21" src="https://github.com/user-attachments/assets/6639e78e-896e-4318-bbfd-96e9f9b43c05" />

### Upload Documents
<img width="1689" height="865" alt="Bildschirmfoto 2025-07-14 um 11 30 41" src="https://github.com/user-attachments/assets/4077ab98-c26a-47f2-9cc5-7c5e1c7b2968" />

### Document Processing
<img width="1694" height="867" alt="image" src="https://github.com/user-attachments/assets/c652ccac-79d1-4a76-9d7b-45edbd3d22fe" />

### Flashcards
<img width="1692" height="866" alt="image" src="https://github.com/user-attachments/assets/355facd8-c165-4218-b030-17419fd6fc4a" />

### Flashcard Reviews
<img width="1678" height="868" alt="image" src="https://github.com/user-attachments/assets/cfa6ca1c-eca7-4927-9bef-62fe09fb4a10" />

### Quizzes
<img width="1691" height="867" alt="image" src="https://github.com/user-attachments/assets/e7acab61-c268-40db-9f1c-31d6136d64d3" />

### Summaries
<img width="1693" height="866" alt="image" src="https://github.com/user-attachments/assets/38370368-b09f-4c6e-80c7-8e5c2ecd428a" />

### Analytics
<img width="1692" height="867" alt="image" src="https://github.com/user-attachments/assets/fccc9ad8-e1a9-401c-b311-7c9f168e8bc3" />

### Export
<img width="1691" height="866" alt="image" src="https://github.com/user-attachments/assets/0cb7e924-e072-42b5-b5ca-83c5b152014e" />

### Exported Document
<img width="1457" height="868" alt="image" src="https://github.com/user-attachments/assets/51dc806b-1dfb-41f3-b6db-c76967293b69" />








---

Made with ❤️ by Yasin Atalar


© 2025 Yasin Atalar. All rights reserved.
