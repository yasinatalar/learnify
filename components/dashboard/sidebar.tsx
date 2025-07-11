"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUsage } from "@/lib/hooks/use-usage"
import { useI18n, useTranslations } from "@/lib/i18n/context"
import {
  Brain,
  FileText,
  Upload,
  Target,
  BarChart3,
  Download,
  Settings,
  CreditCard,
  Home,
  RefreshCw,
  BookOpen,
} from "lucide-react"

const sidebarItems = [
  {
    titleKey: "nav.dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    titleKey: "nav.documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    titleKey: "nav.upload",
    href: "/dashboard/upload",
    icon: Upload,
  },
  {
    titleKey: "nav.flashcards",
    href: "/dashboard/flashcards",
    icon: Brain,
  },
  {
    titleKey: "nav.summaries",
    href: "/dashboard/summaries",
    icon: BookOpen,
  },
  {
    titleKey: "nav.review",
    href: "/dashboard/review",
    icon: RefreshCw,
  },
  {
    titleKey: "nav.quizzes",
    href: "/dashboard/quizzes",
    icon: Target,
  },
  {
    titleKey: "analytics.title",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    titleKey: "export.title",
    href: "/dashboard/export",
    icon: Download,
  },
  {
    titleKey: "nav.settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    titleKey: "dashboard.billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { usage, loading } = useUsage()
  const { locale } = useI18n()
  const t = useTranslations()

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

  return (
    <div className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-10">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <Brain className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
          LearnifyAI
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          const localeHref = `/${locale}${item.href}`
          const isActive = pathname === localeHref
          return (
            <Link
              key={item.href}
              href={localeHref}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {getText(item.titleKey, item.titleKey)}
            </Link>
          )
        })}
      </nav>

      {/* Usage indicator */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {getText('upload.usageThisMonth', 'Usage this month')}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[
              {key: 'upload.documents', fallback: 'Documents'},
              {key: 'upload.flashcards', fallback: 'Flashcards'},
              {key: 'upload.quizzes', fallback: 'Quizzes'},
              {key: 'nav.summaries', fallback: 'Summaries'}
            ].map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{getText(item.key, item.fallback)}</span>
                  <span>{getText('upload.loading', 'Loading...')}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-gray-400 h-1.5 rounded-full w-0 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : usage ? (
          <div className="space-y-3">
            {/* Documents */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('upload.documents', 'Documents')}</span>
                <span className={usage.documentsProcessed >= usage.documentsLimit ? "text-red-500" : ""}>
                  {usage.documentsProcessed}/{usage.documentsLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    usage.documentsProgress >= 100 
                      ? "bg-red-500" 
                      : usage.documentsProgress >= 80 
                      ? "bg-yellow-500" 
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${Math.min(usage.documentsProgress, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Flashcards */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('upload.flashcards', 'Flashcards')}</span>
                <span className={usage.flashcardsGenerated >= usage.flashcardsLimit ? "text-red-500" : ""}>
                  {usage.flashcardsGenerated}/{usage.flashcardsLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    usage.flashcardsProgress >= 100 
                      ? "bg-red-500" 
                      : usage.flashcardsProgress >= 80 
                      ? "bg-yellow-500" 
                      : "bg-green-600"
                  }`}
                  style={{ width: `${Math.min(usage.flashcardsProgress, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Quizzes */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('upload.quizzes', 'Quizzes')}</span>
                <span className={usage.quizzesGenerated >= usage.quizzesLimit ? "text-red-500" : ""}>
                  {usage.quizzesGenerated}/{usage.quizzesLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    usage.quizzesProgress >= 100 
                      ? "bg-red-500" 
                      : usage.quizzesProgress >= 80 
                      ? "bg-yellow-500" 
                      : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.min(usage.quizzesProgress, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Summaries */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('nav.summaries', 'Summaries')}</span>
                <span className={usage.summariesGenerated >= usage.summariesLimit ? "text-red-500" : ""}>
                  {usage.summariesGenerated}/{usage.summariesLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    usage.summariesProgress >= 100 
                      ? "bg-red-500" 
                      : usage.summariesProgress >= 80 
                      ? "bg-yellow-500" 
                      : "bg-orange-600"
                  }`}
                  style={{ width: `${Math.min(usage.summariesProgress, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('upload.documents', 'Documents')}</span>
                <span>0/5</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full w-0"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('upload.flashcards', 'Flashcards')}</span>
                <span>0/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-green-600 h-1.5 rounded-full w-0"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('upload.quizzes', 'Quizzes')}</span>
                <span>0/10</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-purple-600 h-1.5 rounded-full w-0"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{getText('nav.summaries', 'Summaries')}</span>
                <span>0/10</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className="bg-orange-600 h-1.5 rounded-full w-0"></div>
              </div>
            </div>
          </div>
        )}
        <Link
          href={`/${locale}/dashboard/billing`}
          className="mt-3 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {getText('upload.upgradePlan', 'Upgrade plan')}
        </Link>
      </div>
    </div>
  )
}