"use client"

import { signIn, getProviders } from "next-auth/react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { Mail, Sparkles, BookOpen, Brain, Target } from "lucide-react"
import { useTranslations, useI18n } from "@/lib/i18n/context"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [providers, setProviders] = useState<Record<string, any> | null>(null)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const t = useTranslations()
  const { locale } = useI18n()

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await signIn("email", { email, callbackUrl: `/${locale}/dashboard` })
    } catch (error) {
      console.error("Sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: `/${locale}/dashboard` })
    } catch (error) {
      console.error("Google sign in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 max-w-6xl mx-auto">
        {/* Left side - Features showcase */}
        <div className="hidden lg:flex flex-col space-y-8 max-w-md">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t.auth.transformLearning || "Transform Learning with"}{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.auth.aiPower || "AI Power"}
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t.auth.convertDocuments || "Convert your documents into interactive flashcards, quizzes, and personalized learning experiences."}
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.auth.smartDocumentProcessing || "Smart Document Processing"}</h3>
                <p className="text-sm text-gray-600">{t.auth.uploadPDFs || "Upload PDFs, DOCX, and more"}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.auth.aiGeneratedFlashcards || "AI-Generated Flashcards"}</h3>
                <p className="text-sm text-gray-600">{t.auth.intelligentQuestionGeneration || "Intelligent question generation"}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.auth.spacedRepetition || "Spaced Repetition"}</h3>
                <p className="text-sm text-gray-600">{t.auth.optimizeMemoryRetention || "Optimize your memory retention"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Signin form */}
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LearnifyAI
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              {t.auth.welcomeBack}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {t.auth.signInToContinue || "Sign in to continue your learning journey"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                <span>
                  {error === "OAuthSignin" && "Error in OAuth sign in"}
                  {error === "OAuthCallback" && "Error in OAuth callback"}
                  {error === "OAuthCreateAccount" && "Could not create OAuth account"}
                  {error === "EmailCreateAccount" && "Could not create email account"}
                  {error === "Callback" && "Error in callback"}
                  {error === "OAuthAccountNotLinked" && "Account not linked"}
                  {error === "EmailSignin" && "Check your email for a sign in link"}
                  {error === "CredentialsSignin" && t.auth.invalidCredentials}
                  {error === "default" && "Unable to sign in"}
                </span>
              </div>
            )}

            {providers?.google && (
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-2 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">{t.auth.continueWithGoogle || "Continue with Google"}</span>
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">{t.common.or} {t.auth.continueWithEmail || "continue with email"}</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  {t.auth.email}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t.auth.enterYourEmail || `Enter your ${t.auth.email.toLowerCase()}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 border-2 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !email} 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none disabled:hover:shadow-none"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.auth.sendingMagicLink || "Sending magic link..."}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>{t.auth.sendMagicLink || "Send magic link"}</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t.auth.bySigningIn || "By signing in, you agree to our"}{" "}
                <a href="/terms" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                  {t.auth.termsOfService || "Terms of Service"}
                </a>{" "}
                {t.common.and}{" "}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                  {t.auth.privacyPolicy || "Privacy Policy"}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}