"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTranslations, useI18n } from "@/lib/i18n/context"

export default function VerifyRequestPage() {
  const t = useTranslations()
  const { locale } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6 px-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LearnifyAI
                </span>
              </div>
            </div>
            
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900 mb-3">
              {t.auth.checkYourEmail || "Check your email"}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-lg mx-auto">
              {t.auth.weveSentYouMagicLink || "We've sent you a magic link to sign in to your account."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-6 px-8 pb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
              <p className="text-gray-700 font-medium">
                {t.auth.clickTheLinkInEmail || "Click the link in the email to sign in. The link will expire in 24 hours for security."}
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 font-medium">
                {t.auth.didntReceiveEmail || "Didn't receive the email? Check your spam folder or try sending again."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 h-11 border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 font-medium"
                  asChild
                >
                  <Link href={`/${locale}/auth/signin`}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t.auth.backToSignIn || "Back to Sign In"}
                  </Link>
                </Button>
                <Button 
                  className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 hover:shadow-lg font-medium"
                  asChild
                >
                  <Link href={`/${locale}/auth/signin`}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t.auth.sendAgain || "Send Again"}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}