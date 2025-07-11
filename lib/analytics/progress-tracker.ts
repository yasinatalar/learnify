import { db } from "@/lib/db"

export interface LearningMetrics {
  totalDocuments: number
  totalFlashcards: number
  totalQuizzes: number
  totalSummaries: number
  documentsProcessedThisWeek: number
  flashcardsReviewedThisWeek: number
  quizzesCompletedThisWeek: number
  summariesGeneratedThisWeek: number
  averageFlashcardRating: number
  averageQuizScore: number
  averageSummaryReadTime: number
  streakDays: number
  totalStudyTime: number // in minutes
  masteredFlashcards: number
  learningFlashcards: number
  dueFlashcards: number
}

export interface StudySession {
  date: string
  flashcardsReviewed: number
  quizzesCompleted: number
  studyTime: number // in minutes
  averageScore: number
}

export interface ProgressData {
  metrics: LearningMetrics
  weeklyProgress: StudySession[]
  monthlyProgress: StudySession[]
  flashcardProgress: {
    mastered: number
    learning: number
    new: number
    due: number
  }
  topicDistribution: Array<{
    topic: string
    count: number
    mastery: number
  }>
  performanceTrends: Array<{
    date: string
    accuracy: number
    speed: number
  }>
}

class ProgressTracker {
  async getUserMetrics(userId: string): Promise<LearningMetrics> {
    // Get basic counts
    const [documents, flashcards, quizzes, summaries] = await Promise.all([
      db.document.count({ where: { userId } }),
      db.flashcard.count({ where: { document: { userId } } }),
      db.quiz.count({ where: { userId } }),
      db.summary.count({ where: { userId } })
    ])

    // Get week boundaries
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    
    // Get this week's activity
    const [documentsThisWeek, flashcardReviewsThisWeek, quizAttemptsThisWeek, summariesThisWeek] = await Promise.all([
      db.document.count({
        where: {
          userId,
          createdAt: { gte: weekStart }
        }
      }),
      db.flashcardReview.count({
        where: {
          userId,
          createdAt: { gte: weekStart }
        }
      }),
      db.quizAttempt.count({
        where: {
          userId,
          createdAt: { gte: weekStart }
        }
      }),
      db.summary.count({
        where: {
          userId,
          createdAt: { gte: weekStart }
        }
      })
    ])

    // Get flashcard statistics
    const flashcardStats = await db.flashcard.findMany({
      where: { document: { userId } },
      select: {
        repetition: true,
        nextReview: true,
        reviews: {
          select: { rating: true }
        }
      }
    })

    const now_date = new Date()
    const masteredFlashcards = flashcardStats.filter(f => f.repetition >= 3).length
    const learningFlashcards = flashcardStats.filter(f => f.repetition < 3).length
    const dueFlashcards = flashcardStats.filter(f => new Date(f.nextReview) <= now_date).length

    // Calculate average flashcard rating
    const allRatings = flashcardStats.flatMap(f => f.reviews.map(r => r.rating))
    const averageFlashcardRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
      : 0

    // Get quiz statistics
    const quizAttempts = await db.quizAttempt.findMany({
      where: { userId },
      select: {
        accuracy: true,
        totalTime: true
      }
    })

    const averageQuizScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, attempt) => sum + attempt.accuracy, 0) / quizAttempts.length
      : 0

    // Get summary statistics
    const summaryStats = await db.summary.findMany({
      where: { userId },
      select: {
        estimatedReadTime: true
      }
    })

    const averageSummaryReadTime = summaryStats.length > 0
      ? summaryStats.reduce((sum, summary) => sum + summary.estimatedReadTime, 0) / summaryStats.length
      : 0

    // Calculate total study time (flashcard reviews + quiz attempts)
    const flashcardTime = await db.flashcardReview.aggregate({
      where: { userId },
      _sum: { timeSpent: true }
    })

    const quizTime = await db.quizAttempt.aggregate({
      where: { userId },
      _sum: { totalTime: true }
    })

    const totalStudyTime = Math.round(
      ((flashcardTime._sum.timeSpent || 0) + (quizTime._sum.totalTime || 0)) / 60
    )

    // Calculate streak days (simplified - days with any activity)
    const streakDays = await this.calculateStreakDays(userId)

    return {
      totalDocuments: documents,
      totalFlashcards: flashcards,
      totalQuizzes: quizzes,
      totalSummaries: summaries,
      documentsProcessedThisWeek: documentsThisWeek,
      flashcardsReviewedThisWeek: flashcardReviewsThisWeek,
      quizzesCompletedThisWeek: quizAttemptsThisWeek,
      summariesGeneratedThisWeek: summariesThisWeek,
      averageFlashcardRating: Math.round(averageFlashcardRating * 10) / 10,
      averageQuizScore: Math.round(averageQuizScore * 10) / 10,
      averageSummaryReadTime: Math.round(averageSummaryReadTime * 10) / 10,
      streakDays,
      totalStudyTime,
      masteredFlashcards,
      learningFlashcards,
      dueFlashcards
    }
  }

  async getWeeklyProgress(userId: string): Promise<StudySession[]> {
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6) // Last 7 days
    
    const sessions: StudySession[] = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)
      
      const [flashcardReviews, quizAttempts] = await Promise.all([
        db.flashcardReview.findMany({
          where: {
            userId,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          },
          select: { timeSpent: true }
        }),
        db.quizAttempt.findMany({
          where: {
            userId,
            createdAt: {
              gte: date,
              lt: nextDate
            }
          },
          select: { accuracy: true, totalTime: true }
        })
      ])

      const studyTime = Math.round(
        (flashcardReviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0) +
         quizAttempts.reduce((sum, a) => sum + (a.totalTime || 0), 0)) / 60
      )

      const averageScore = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + a.accuracy, 0) / quizAttempts.length
        : 0

      sessions.push({
        date: date.toISOString().split('T')[0],
        flashcardsReviewed: flashcardReviews.length,
        quizzesCompleted: quizAttempts.length,
        studyTime,
        averageScore: Math.round(averageScore * 10) / 10
      })
    }
    
    return sessions
  }

  async getMonthlyProgress(userId: string): Promise<StudySession[]> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1) // Last 6 months
    
    const sessions: StudySession[] = []
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + i, 1)
      const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
      
      const [flashcardReviews, quizAttempts] = await Promise.all([
        db.flashcardReview.findMany({
          where: {
            userId,
            createdAt: {
              gte: monthDate,
              lt: nextMonth
            }
          },
          select: { timeSpent: true }
        }),
        db.quizAttempt.findMany({
          where: {
            userId,
            createdAt: {
              gte: monthDate,
              lt: nextMonth
            }
          },
          select: { accuracy: true, totalTime: true }
        })
      ])

      const studyTime = Math.round(
        (flashcardReviews.reduce((sum, r) => sum + (r.timeSpent || 0), 0) +
         quizAttempts.reduce((sum, a) => sum + (a.totalTime || 0), 0)) / 60
      )

      const averageScore = quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + a.accuracy, 0) / quizAttempts.length
        : 0

      sessions.push({
        date: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        flashcardsReviewed: flashcardReviews.length,
        quizzesCompleted: quizAttempts.length,
        studyTime,
        averageScore: Math.round(averageScore * 10) / 10
      })
    }
    
    return sessions
  }

  async getTopicDistribution(userId: string) {
    // Get all flashcards with their tags and performance
    const flashcards = await db.flashcard.findMany({
      where: { document: { userId } },
      select: {
        tags: true,
        repetition: true,
        reviews: {
          select: { rating: true }
        }
      }
    })

    const topicStats: Record<string, { count: number; totalRating: number; ratingCount: number; mastered: number }> = {}

    flashcards.forEach(flashcard => {
      // Parse tags (comma-separated string)
      const tags = flashcard.tags ? flashcard.tags.split(',').map(t => t.trim()).filter(t => t) : ['General']
      
      tags.forEach(tag => {
        if (!topicStats[tag]) {
          topicStats[tag] = { count: 0, totalRating: 0, ratingCount: 0, mastered: 0 }
        }
        
        topicStats[tag].count++
        
        if (flashcard.repetition >= 3) {
          topicStats[tag].mastered++
        }
        
        flashcard.reviews.forEach(review => {
          topicStats[tag].totalRating += review.rating
          topicStats[tag].ratingCount++
        })
      })
    })

    return Object.entries(topicStats)
      .map(([topic, stats]) => ({
        topic,
        count: stats.count,
        mastery: stats.count > 0 ? Math.round((stats.mastered / stats.count) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 topics
  }

  async getPerformanceTrends(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        accuracy: true,
        totalTime: true,
        createdAt: true,
        quiz: {
          select: {
            questions: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Group by date and calculate daily averages
    const dailyStats: Record<string, { accuracies: number[]; speeds: number[] }> = {}

    quizAttempts.forEach(attempt => {
      const date = attempt.createdAt.toISOString().split('T')[0]
      const questionCount = attempt.quiz.questions.length
      const speed = questionCount > 0 && attempt.totalTime ? attempt.totalTime / questionCount : 0

      if (!dailyStats[date]) {
        dailyStats[date] = { accuracies: [], speeds: [] }
      }
      
      dailyStats[date].accuracies.push(attempt.accuracy)
      if (speed > 0) {
        dailyStats[date].speeds.push(speed)
      }
    })

    return Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      accuracy: stats.accuracies.reduce((sum, acc) => sum + acc, 0) / stats.accuracies.length,
      speed: stats.speeds.length > 0 
        ? stats.speeds.reduce((sum, speed) => sum + speed, 0) / stats.speeds.length 
        : 0
    }))
  }

  private async calculateStreakDays(userId: string): Promise<number> {
    const now = new Date()
    let streakDays = 0
    let currentDate = new Date(now)
    
    // Check each day going backwards
    for (let i = 0; i < 365; i++) { // Max 1 year
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      // Check if there was any activity on this day
      const [flashcardReviews, quizAttempts] = await Promise.all([
        db.flashcardReview.count({
          where: {
            userId,
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        }),
        db.quizAttempt.count({
          where: {
            userId,
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        })
      ])
      
      if (flashcardReviews > 0 || quizAttempts > 0) {
        streakDays++
      } else {
        break // Streak is broken
      }
      
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    return streakDays
  }

  async getFullProgressData(userId: string): Promise<ProgressData> {
    const [
      metrics,
      weeklyProgress,
      monthlyProgress,
      topicDistribution,
      performanceTrends
    ] = await Promise.all([
      this.getUserMetrics(userId),
      this.getWeeklyProgress(userId),
      this.getMonthlyProgress(userId),
      this.getTopicDistribution(userId),
      this.getPerformanceTrends(userId)
    ])

    return {
      metrics,
      weeklyProgress,
      monthlyProgress,
      flashcardProgress: {
        mastered: metrics.masteredFlashcards,
        learning: metrics.learningFlashcards,
        new: Math.max(0, metrics.totalFlashcards - metrics.masteredFlashcards - metrics.learningFlashcards),
        due: metrics.dueFlashcards
      },
      topicDistribution,
      performanceTrends
    }
  }
}

export const progressTracker = new ProgressTracker()