import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user subscription and usage
    const [userUsage, userSubscription] = await Promise.all([
      db.userUsage.findUnique({
        where: { userId }
      }),
      db.userSubscription.findUnique({
        where: { userId }
      }).catch(() => null) // Handle if subscription table doesn't exist
    ])

    // Default to free plan if no subscription
    const currentPlan = userSubscription ? {
      name: userSubscription.plan || 'Free',
      price: userSubscription.plan === 'PRO' ? 19 : userSubscription.plan === 'ENTERPRISE' ? 49 : 0,
      billingCycle: '/month',
      features: getPlanFeatures(userSubscription.plan || 'FREE')
    } : {
      name: 'Free',
      price: 0,
      billingCycle: '/month',
      features: getPlanFeatures('FREE')
    }

    // Get usage data
    const usage = userUsage ? {
      documents: { 
        used: userUsage.documentsProcessed || 0, 
        limit: userUsage.documentsLimit || 5 
      },
      flashcards: { 
        used: userUsage.flashcardsGenerated || 0, 
        limit: userUsage.flashcardsLimit || 100 
      },
      quizzes: { 
        used: userUsage.quizzesGenerated || 0, 
        limit: userUsage.quizzesLimit || 10 
      },
      summaries: { 
        used: userUsage.summariesGenerated || 0, 
        limit: userUsage.summariesLimit || 10 
      }
    } : {
      documents: { used: 0, limit: 5 },
      flashcards: { used: 0, limit: 100 },
      quizzes: { used: 0, limit: 10 },
      summaries: { used: 0, limit: 10 }
    }

    // Mock billing data (in real app, this would come from payment provider)
    const nextBillingDate = new Date()
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

    const paymentMethod = {
      type: 'Credit Card',
      lastFour: '4242',
      expiryDate: '12/25'
    }

    const billing = {
      currentPlan,
      usage,
      nextBillingDate: nextBillingDate.toISOString(),
      paymentMethod
    }

    return NextResponse.json({
      success: true,
      billing
    })

  } catch (error) {
    console.error("Error fetching billing info:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch billing information" },
      { status: 500 }
    )
  }
}

function getPlanFeatures(plan: string): string[] {
  switch (plan.toUpperCase()) {
    case 'FREE':
      return [
        '5 documents per month',
        '100 AI-generated flashcards',
        'Basic spaced repetition',
        'Quiz generation',
        '10 AI summaries per month'
      ]
    case 'PRO':
      return [
        'Unlimited documents',
        'Unlimited flashcards',
        'Advanced spaced repetition',
        'Progress analytics',
        'Export to Anki, PDF, CSV',
        'Unlimited AI summaries'
      ]
    case 'ENTERPRISE':
      return [
        'Everything in Pro',
        'Team collaboration',
        'Admin dashboard',
        'Priority support',
        'Custom integrations'
      ]
    default:
      return []
  }
}