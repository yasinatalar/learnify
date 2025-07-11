"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Check, Zap, Crown, Shield, Calendar, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useI18n } from "@/lib/i18n/context"

interface BillingInfo {
  currentPlan: {
    name: string
    price: number
    billingCycle: string
    features: string[]
  }
  usage: {
    documents: { used: number; limit: number }
    flashcards: { used: number; limit: number }
    quizzes: { used: number; limit: number }
    summaries: { used: number; limit: number }
  }
  nextBillingDate: string
  paymentMethod: {
    type: string
    lastFour: string
    expiryDate: string
  }
}

export default function BillingPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Safe accessor function
  const getText = (path: string, fallback: string = '') => {
    const keys = path.split('.')
    let current: any = t
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return fallback
      }
    }
    
    return typeof current === 'string' ? current : fallback
  }

  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        const response = await fetch('/api/billing')
        if (response.ok) {
          const data = await response.json()
          setBillingInfo(data.billing || null)
        } else {
          toast.error(getText('dashboard.errorLoading', 'Failed to load billing information'))
        }
      } catch (error) {
        console.error('Error fetching billing info:', error)
        toast.error(getText('dashboard.errorLoading', 'Error loading billing information'))
      } finally {
        setLoading(false)
      }
    }

    fetchBillingInfo()
  }, [t])

  const plans = [
    {
      name: getText('home.pricing.free.title', 'Free'),
      price: 0,
      billingCycle: getText('home.pricing.free.period', '/month'),
      features: [
        getText('home.pricing.free.feature1', '5 documents per month'),
        getText('home.pricing.free.feature2', '100 AI-generated flashcards'),
        getText('home.pricing.free.feature3', 'Basic spaced repetition'),
        getText('home.pricing.free.feature4', 'Quiz generation'),
        getText('home.pricing.free.feature5', '10 AI summaries per month')
      ],
      popular: false,
      icon: Shield
    },
    {
      name: getText('home.pricing.pro.title', 'Pro'),
      price: 19,
      billingCycle: getText('home.pricing.pro.period', '/month'),
      features: [
        getText('home.pricing.pro.feature1', 'Unlimited documents'),
        getText('home.pricing.pro.feature2', 'Unlimited flashcards'),
        getText('home.pricing.pro.feature3', 'Advanced spaced repetition'),
        getText('home.pricing.pro.feature4', 'Progress analytics'),
        getText('home.pricing.pro.feature5', 'Export to Anki, PDF, CSV'),
        getText('home.pricing.pro.feature6', 'Unlimited AI summaries')
      ],
      popular: true,
      icon: Zap
    },
    {
      name: getText('home.pricing.enterprise.title', 'Enterprise'),
      price: 49,
      billingCycle: getText('home.pricing.enterprise.period', '/month'),
      features: [
        getText('home.pricing.enterprise.feature1', 'Everything in Pro'),
        getText('home.pricing.enterprise.feature2', 'Team collaboration'),
        getText('home.pricing.enterprise.feature3', 'Admin dashboard'),
        getText('home.pricing.enterprise.feature4', 'Priority support'),
        getText('home.pricing.enterprise.feature5', 'Custom integrations')
      ],
      popular: false,
      icon: Crown
    }
  ]

  const handleUpgrade = (planName: string) => {
    toast.info(getText('billing.upgradeInfo', 'Redirecting to payment...'))
    // Implement payment flow
  }

  const handleCancelSubscription = () => {
    toast.info(getText('billing.cancelInfo', 'Cancellation process initiated'))
    // Implement cancellation
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('dashboard.billing', 'Billing')}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {getText('billing.subtitle', 'Manage your subscription and billing')}
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{getText('common.loading', 'Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('dashboard.billing', 'Billing')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('billing.subtitle', 'Manage your subscription and billing')}
          </p>
        </div>
      </div>

      {/* Current Plan */}
      {billingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{getText('billing.currentPlan', 'Current Plan')}</span>
              <Badge variant="outline">{billingInfo.currentPlan.name}</Badge>
            </CardTitle>
            <CardDescription>
              €{billingInfo.currentPlan.price}{billingInfo.currentPlan.billingCycle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{getText('upload.documents', 'Documents')}</span>
                    <span>{billingInfo.usage.documents.used}/{billingInfo.usage.documents.limit}</span>
                  </div>
                  <Progress value={(billingInfo.usage.documents.used / billingInfo.usage.documents.limit) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{getText('upload.flashcards', 'Flashcards')}</span>
                    <span>{billingInfo.usage.flashcards.used}/{billingInfo.usage.flashcards.limit}</span>
                  </div>
                  <Progress value={(billingInfo.usage.flashcards.used / billingInfo.usage.flashcards.limit) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{getText('upload.quizzes', 'Quizzes')}</span>
                    <span>{billingInfo.usage.quizzes.used}/{billingInfo.usage.quizzes.limit}</span>
                  </div>
                  <Progress value={(billingInfo.usage.quizzes.used / billingInfo.usage.quizzes.limit) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{getText('nav.summaries', 'Summaries')}</span>
                    <span>{billingInfo.usage.summaries.used}/{billingInfo.usage.summaries.limit}</span>
                  </div>
                  <Progress value={(billingInfo.usage.summaries.used / billingInfo.usage.summaries.limit) * 100} />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {getText('billing.nextBilling', 'Next billing date')}: {new Date(billingInfo.nextBillingDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getText('billing.paymentMethod', 'Payment method')}: {billingInfo.paymentMethod.type} **** {billingInfo.paymentMethod.lastFour}
                  </p>
                </div>
                <Button variant="outline" onClick={handleCancelSubscription}>
                  {getText('billing.cancelSubscription', 'Cancel Subscription')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>{getText('billing.availablePlans', 'Available Plans')}</CardTitle>
          <CardDescription>
            {getText('billing.choosePlan', 'Choose the plan that best fits your needs')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      {getText('home.pricing.pro.badge', 'Most Popular')}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    €{plan.price}
                    <span className="text-sm font-normal text-muted-foreground">{plan.billingCycle}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={billingInfo?.currentPlan.name === plan.name}
                  >
                    {billingInfo?.currentPlan.name === plan.name 
                      ? getText('billing.currentPlan', 'Current Plan')
                      : getText('billing.upgrade', 'Upgrade')
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>{getText('billing.billingHistory', 'Billing History')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {getText('billing.noBillingHistory', 'No billing history available')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}