"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  FileText, 
  Zap, 
  Target, 
  TrendingUp, 
  Download,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Play,
  Star,
  Users,
  Clock,
  Shield,
  Menu,
  X
} from "lucide-react"
import { useTranslations, useI18n } from "@/lib/i18n/context"

export default function HomePage() {
  const { isLoading } = useI18n()
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

  if (isLoading || !t?.home) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LearnifyAI
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              {getText('home.features', 'Features')}
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              {getText('home.pricingNav', 'Pricing')}
            </Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              {getText('home.reviews', 'Reviews')}
            </Link>
            <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              {getText('home.signIn', 'Sign In')}
            </Link>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Link href="/auth/signin">{getText('home.getStartedFree', 'Get Started Free')}</Link>
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              {getText('home.poweredByAI', 'Powered by Advanced AI Technology')}
            </Badge>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            {getText('home.heroTitle', 'Transform Any Document into')}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {getText('home.heroTitleHighlight', 'Interactive Learning')}</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            {getText('home.heroSubtitle', 'Upload your PDFs, DOCX, or text files and get AI-generated flashcards, quizzes, and summaries with intelligent spaced repetition to maximize your learning efficiency.')}
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600 font-medium">{t.home.stats.students}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span className="text-gray-600 font-medium">{t.home.stats.documents}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-gray-600 font-medium">{t.home.stats.processingTime}</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Link href="/auth/signin" className="flex items-center space-x-2">
                <span>{t.home.startLearningFree}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300">
              <Link href="#demo" className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>{t.home.watchDemo}</span>
              </Link>
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex justify-center items-center space-x-1 text-yellow-500 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-current" />
            ))}
          </div>
          <p className="text-gray-600">
            <span className="font-semibold">4.9/5</span> {t.home.trustIndicator}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              {t.home.features}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t.home.featuresTitle}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {t.home.featuresTitleHighlight}</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.home.featuresSubtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{t.home.feature1.title}</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {t.home.feature1.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{t.home.feature2.title}</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {t.home.feature2.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{t.home.feature3.title}</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {t.home.feature3.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{t.home.feature4.title}</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {t.home.feature4.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{t.home.feature5.title}</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {t.home.feature5.description}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">{t.home.feature6.title}</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {t.home.feature6.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-800 border-green-200 mb-4">
              <Target className="w-4 h-4 mr-2" />
              {t.home.howItWorks.badge}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t.home.howItWorks.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.home.howItWorks.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="absolute top-10 left-1/2 w-32 h-0.5 bg-gradient-to-r from-blue-200 to-green-200 transform translate-x-8 hidden md:block"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.home.howItWorks.step1.title}</h3>
              <p className="text-gray-600 text-lg">
                {t.home.howItWorks.step1.description}
              </p>
            </div>
            
            <div className="text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="absolute top-10 left-1/2 w-32 h-0.5 bg-gradient-to-r from-green-200 to-purple-200 transform translate-x-8 hidden md:block"></div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.home.howItWorks.step2.title}</h3>
              <p className="text-gray-600 text-lg">
                {t.home.howItWorks.step2.description}
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.home.howItWorks.step3.title}</h3>
              <p className="text-gray-600 text-lg">
                {t.home.howItWorks.step3.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-4">
              <Star className="w-4 h-4 mr-2" />
              {t.home.testimonials.badge}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t.home.testimonials.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.home.testimonials.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">{t.home.testimonials.testimonial1.name}</h4>
                    <p className="text-sm text-gray-600">{t.home.testimonials.testimonial1.role}</p>
                  </div>
                </div>
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <CardDescription className="text-gray-700 text-base">
                  {t.home.testimonials.testimonial1.content}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">{t.home.testimonials.testimonial2.name}</h4>
                    <p className="text-sm text-gray-600">{t.home.testimonials.testimonial2.role}</p>
                  </div>
                </div>
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <CardDescription className="text-gray-700 text-base">
                  {t.home.testimonials.testimonial2.content}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    E
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">{t.home.testimonials.testimonial3.name}</h4>
                    <p className="text-sm text-gray-600">{t.home.testimonials.testimonial3.role}</p>
                  </div>
                </div>
                <div className="flex text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <CardDescription className="text-gray-700 text-base">
                  {t.home.testimonials.testimonial3.content}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-800 border-green-200 mb-4">
              <Shield className="w-4 h-4 mr-2" />
              {t.home.pricing.badge}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t.home.pricing.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.home.pricing.subtitle}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.home.pricing.free.title}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">{t.home.pricing.free.price}<span className="text-lg font-normal">{t.home.pricing.free.period}</span></div>
                <p className="text-gray-600">{t.home.pricing.free.description}</p>
              </CardHeader>
              <CardDescription className="px-6 pb-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.free.feature1}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.free.feature2}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.free.feature3}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.free.feature4}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.free.feature5}</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white">
                  <Link href="/auth/signin">{t.home.pricing.free.cta}</Link>
                </Button>
              </CardDescription>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 bg-gradient-to-br from-blue-50 to-purple-50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">{t.home.pricing.pro.badge}</Badge>
              </div>
              <CardHeader className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.home.pricing.pro.title}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">{t.home.pricing.pro.price}<span className="text-lg font-normal">{t.home.pricing.pro.period}</span></div>
                <p className="text-gray-600">{t.home.pricing.pro.description}</p>
              </CardHeader>
              <CardDescription className="px-6 pb-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.pro.feature1}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.pro.feature2}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.pro.feature3}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.pro.feature4}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.pro.feature5}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.pro.feature6}</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Link href="/auth/signin">{t.home.pricing.pro.cta}</Link>
                </Button>
              </CardDescription>
            </Card>

            {/* Enterprise Plan */}
            <Card className="border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 bg-white">
              <CardHeader className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.home.pricing.enterprise.title}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">{t.home.pricing.enterprise.price}<span className="text-lg font-normal">{t.home.pricing.enterprise.period}</span></div>
                <p className="text-gray-600">{t.home.pricing.enterprise.description}</p>
              </CardHeader>
              <CardDescription className="px-6 pb-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.enterprise.feature1}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.enterprise.feature2}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.enterprise.feature3}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.enterprise.feature4}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{t.home.pricing.enterprise.feature5}</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white">
                  <Link href="/contact">{t.home.pricing.enterprise.cta}</Link>
                </Button>
              </CardDescription>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 bg-gradient-to-br from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t.home.cta.title}
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {t.home.cta.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-0 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Link href="/auth/signin" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
                  <span>{t.home.cta.getStarted}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300">
                <Link href="/contact" className="flex items-center space-x-2 text-blue-700 hover:text-blue-800">
                  <span>{t.home.cta.contactSales}</span>
                </Link>
              </Button>
            </div>
            <div className="flex justify-center items-center space-x-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t.home.cta.noCreditCard}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t.home.cta.freeTrial}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t.home.cta.cancelAnytime}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">LearnifyAI</span>
              </div>
              <p className="text-gray-400 mb-4">
                {t.home.footer.description}
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">T</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">L</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">G</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t.home.footer.product}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">{t.home.footer.features}</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">{t.home.footer.pricing}</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">{t.home.footer.changelog}</Link></li>
                <li><Link href="/roadmap" className="hover:text-white transition-colors">{t.home.footer.roadmap}</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">{t.home.footer.api}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t.home.footer.company}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">{t.home.footer.about}</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">{t.home.footer.blog}</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">{t.home.footer.careers}</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">{t.home.footer.contact}</Link></li>
                <li><Link href="/press" className="hover:text-white transition-colors">{t.home.footer.press}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">{t.home.footer.support}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">{t.home.footer.helpCenter}</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">{t.home.footer.documentation}</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">{t.home.footer.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">{t.home.footer.terms}</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">{t.home.footer.security}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              {t.home.footer.copyright}
            </p>
            <div className="flex items-center space-x-6 text-gray-400">
              <span>{t.home.footer.madeWith}</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{t.home.footer.systemsOperational}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}