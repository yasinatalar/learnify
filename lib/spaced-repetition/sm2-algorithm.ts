// SM-2 Algorithm implementation

export interface SM2Card {
  interval: number
  repetition: number
  efactor: number
  nextReview: Date
}

export interface SM2Response {
  interval: number
  repetition: number
  efactor: number
  nextReview: Date
}

/**
 * SM-2 (SuperMemo 2) Algorithm Implementation
 * 
 * This algorithm calculates when a flashcard should be reviewed next
 * based on the user's performance rating (1-5 scale).
 * 
 * Rating scale:
 * 5 - Perfect response
 * 4 - Correct response with hesitation
 * 3 - Correct response recalled with serious difficulty
 * 2 - Incorrect response; correct answer seemed easy to recall
 * 1 - Incorrect response; correct answer remembered
 * 0 - Complete blackout
 */
export class SM2Algorithm {
  /**
   * Calculate the next review parameters based on user rating
   */
  static calculateNext(card: SM2Card, rating: number): SM2Response {
    // Validate rating
    if (rating < 0 || rating > 5) {
      throw new Error("Rating must be between 0 and 5")
    }

    let { interval, repetition, efactor } = card

    // If rating is less than 3, reset the card
    if (rating < 3) {
      repetition = 0
      interval = 1
    } else {
      // Calculate new E-Factor
      const newEFactor = efactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
      efactor = Math.max(1.3, newEFactor) // E-Factor should not be less than 1.3

      // Increment repetition count
      repetition += 1

      // Calculate new interval
      if (repetition === 1) {
        interval = 1
      } else if (repetition === 2) {
        interval = 6
      } else {
        interval = Math.round(interval * efactor)
      }
    }

    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    return {
      interval,
      repetition,
      efactor,
      nextReview,
    }
  }

  /**
   * Create a new card with default SM-2 parameters
   */
  static createNewCard(): SM2Card {
    return {
      interval: 1,
      repetition: 0,
      efactor: 2.5,
      nextReview: new Date(), // Due immediately for new cards
    }
  }

  /**
   * Check if a card is due for review
   */
  static isDue(card: SM2Card): boolean {
    return card.nextReview <= new Date()
  }

  /**
   * Get cards that are due for review
   */
  static getDueCards(cards: SM2Card[]): SM2Card[] {
    return cards.filter(card => this.isDue(card))
  }

  /**
   * Sort cards by review priority (overdue cards first, then by ease factor)
   */
  static sortByPriority(cards: SM2Card[]): SM2Card[] {
    return cards.sort((a, b) => {
      const now = new Date().getTime()
      const aOverdue = Math.max(0, now - a.nextReview.getTime())
      const bOverdue = Math.max(0, now - b.nextReview.getTime())

      // Sort by overdue time first (most overdue first)
      if (aOverdue !== bOverdue) {
        return bOverdue - aOverdue
      }

      // Then by ease factor (harder cards first)
      return a.efactor - b.efactor
    })
  }

  /**
   * Calculate retention rate based on review history
   */
  static calculateRetention(reviews: Array<{ rating: number; date: Date }>): number {
    if (reviews.length === 0) return 0

    const correctReviews = reviews.filter(review => review.rating >= 3).length
    return (correctReviews / reviews.length) * 100
  }

  /**
   * Get statistics for a card
   */
  static getCardStats(card: SM2Card, reviews: Array<{ rating: number; date: Date }>) {
    const totalReviews = reviews.length
    const correctReviews = reviews.filter(review => review.rating >= 3).length
    const streak = this.getCurrentStreak(reviews)
    const retention = this.calculateRetention(reviews)
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0

    return {
      totalReviews,
      correctReviews,
      streak,
      retention,
      avgRating,
      interval: card.interval,
      efactor: card.efactor,
      nextReview: card.nextReview,
      isDue: this.isDue(card),
    }
  }

  /**
   * Calculate current streak of correct answers
   */
  private static getCurrentStreak(reviews: Array<{ rating: number; date: Date }>): number {
    let streak = 0
    for (let i = reviews.length - 1; i >= 0; i--) {
      if (reviews[i].rating >= 3) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  /**
   * Convert user-friendly rating to SM-2 rating
   * User ratings: 1-5 (Again, Hard, Good, Easy, Perfect)
   * SM-2 ratings: 0-5
   */
  static convertUserRating(userRating: 1 | 2 | 3 | 4 | 5): number {
    const ratingMap = {
      1: 1, // Again -> 1 (repeat soon)
      2: 2, // Hard -> 2 (incorrect but remembered)
      3: 3, // Good -> 3 (correct with difficulty)
      4: 4, // Easy -> 4 (correct with hesitation)
      5: 5, // Perfect -> 5 (perfect response)
    }
    return ratingMap[userRating]
  }

  /**
   * Get recommended study sessions per day based on due cards
   */
  static getStudyRecommendation(dueCards: number): {
    sessionsPerDay: number
    cardsPerSession: number
    estimatedTime: number // in minutes
  } {
    const maxCardsPerSession = 20
    const avgTimePerCard = 1.5 // minutes

    if (dueCards === 0) {
      return {
        sessionsPerDay: 0,
        cardsPerSession: 0,
        estimatedTime: 0,
      }
    }

    if (dueCards <= maxCardsPerSession) {
      return {
        sessionsPerDay: 1,
        cardsPerSession: dueCards,
        estimatedTime: dueCards * avgTimePerCard,
      }
    }

    const sessionsNeeded = Math.ceil(dueCards / maxCardsPerSession)
    const cardsPerSession = Math.ceil(dueCards / sessionsNeeded)

    return {
      sessionsPerDay: Math.min(sessionsNeeded, 3), // Max 3 sessions per day
      cardsPerSession,
      estimatedTime: cardsPerSession * avgTimePerCard,
    }
  }
}