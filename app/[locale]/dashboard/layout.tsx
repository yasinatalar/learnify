import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { I18nProvider } from "@/lib/i18n/context"
import type { Locale } from "@/lib/i18n"

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}

export default async function DashboardLayout({
  children,
  params
}: DashboardLayoutProps) {
  const { locale } = await params

  return (
    <I18nProvider initialLocale={locale}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <Header />
        <main className="ml-64 pt-16 min-h-screen overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </I18nProvider>
  )
}