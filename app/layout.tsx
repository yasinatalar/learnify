import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { auth } from "@/lib/auth"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LearnifyAI - Transform Documents into Interactive Learning",
  description: "AI-powered platform that transforms documents into interactive flashcards, quizzes, and learning materials with spaced repetition.",
  keywords: ["AI", "learning", "flashcards", "education", "documents", "spaced repetition"],
  authors: [{ name: "LearnifyAI Team" }],
  openGraph: {
    title: "LearnifyAI - AI-Powered Learning Platform",
    description: "Transform any document into interactive learning materials with AI-generated flashcards and quizzes.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnifyAI - AI-Powered Learning Platform",
    description: "Transform any document into interactive learning materials with AI-generated flashcards and quizzes.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
