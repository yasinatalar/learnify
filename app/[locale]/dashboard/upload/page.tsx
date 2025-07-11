"use client"

import { useState, useEffect } from "react"
import { FileUpload } from "@/components/upload/file-upload"
import { useSettings } from "@/lib/hooks/use-settings"
import { useUsage } from "@/lib/hooks/use-usage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Brain, Target, Sparkles, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations, useI18n } from "@/lib/i18n/context"

export default function UploadPage() {
  const { settings, loading: settingsLoading, getProcessingOptions } = useSettings()
  const { usage, loading: usageLoading, refreshUsage } = useUsage()
  const [processingOptions, setProcessingOptions] = useState({
    generateFlashcards: true,
    generateQuiz: true,
    flashcardCount: "20",
    quizQuestionCount: "10",
    difficulty: "mixed",
  })
  const router = useRouter()
  const t = useTranslations()
  const { locale } = useI18n()

  // Update processing options when settings are loaded
  useEffect(() => {
    if (settings) {
      setProcessingOptions(getProcessingOptions())
    }
  }, [settings, getProcessingOptions])

  const handleUploadComplete = (documentId: string) => {
    // Refresh usage data after upload
    refreshUsage()
    // Redirect to document view after upload
    router.push(`/${locale}/dashboard/documents/${documentId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.upload.title}</h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t.upload.subtitle}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <FileUpload 
            onUploadComplete={handleUploadComplete} 
            processingOptions={processingOptions}
            disabled={usage?.documentsProcessed >= usage?.documentsLimit}
            disabledMessage={t.upload.documentLimitReached}
          />
        </div>

        {/* Processing Options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
                {t.upload.aiProcessingOptions}
              </CardTitle>
              <CardDescription>
                {t.upload.aiProcessingOptionsDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Generate Flashcards */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flashcards"
                  checked={processingOptions.generateFlashcards}
                  onCheckedChange={(checked) =>
                    setProcessingOptions((prev) => ({
                      ...prev,
                      generateFlashcards: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="flashcards" className="flex items-center">
                  <Brain className="mr-2 h-4 w-4 text-blue-500" />
                  {t.upload.generateFlashcards}
                </Label>
              </div>

              {processingOptions.generateFlashcards && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="flashcard-count" className="text-sm">
                    {t.upload.numberOfFlashcards}
                  </Label>
                  <Select
                    value={processingOptions.flashcardCount}
                    onValueChange={(value) =>
                      setProcessingOptions((prev) => ({
                        ...prev,
                        flashcardCount: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 {t.upload.flashcards}</SelectItem>
                      <SelectItem value="15">15 {t.upload.flashcards}</SelectItem>
                      <SelectItem value="20">20 {t.upload.flashcards}</SelectItem>
                      <SelectItem value="25">25 {t.upload.flashcards}</SelectItem>
                      <SelectItem value="30">30 {t.upload.flashcards}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Generate Quiz */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quiz"
                  checked={processingOptions.generateQuiz}
                  onCheckedChange={(checked) =>
                    setProcessingOptions((prev) => ({
                      ...prev,
                      generateQuiz: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="quiz" className="flex items-center">
                  <Target className="mr-2 h-4 w-4 text-green-500" />
                  {t.upload.generateQuiz}
                </Label>
              </div>

              {processingOptions.generateQuiz && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="quiz-count" className="text-sm">
                    {t.upload.numberOfQuestions}
                  </Label>
                  <Select
                    value={processingOptions.quizQuestionCount}
                    onValueChange={(value) =>
                      setProcessingOptions((prev) => ({
                        ...prev,
                        quizQuestionCount: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 {t.upload.questions}</SelectItem>
                      <SelectItem value="10">10 {t.upload.questions}</SelectItem>
                      <SelectItem value="15">15 {t.upload.questions}</SelectItem>
                      <SelectItem value="20">20 {t.upload.questions}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Difficulty */}
              <div className="space-y-2">
                <Label htmlFor="difficulty">{t.upload.difficultyLevel}</Label>
                <Select
                  value={processingOptions.difficulty}
                  onValueChange={(value) =>
                    setProcessingOptions((prev) => ({
                      ...prev,
                      difficulty: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">{t.upload.difficulty.easy}</SelectItem>
                    <SelectItem value="medium">{t.upload.difficulty.medium}</SelectItem>
                    <SelectItem value="hard">{t.upload.difficulty.hard}</SelectItem>
                    <SelectItem value="mixed">{t.upload.difficulty.mixed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                {t.upload.supportedFormats}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{t.upload.formats.pdf}</span>
                  <span className="text-green-500">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.upload.formats.docx}</span>
                  <span className="text-green-500">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.upload.formats.txt}</span>
                  <span className="text-green-500">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.upload.formats.markdown}</span>
                  <span className="text-green-500">✓</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 {t.upload.bestResults}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Usage Limits */}
          <Card>
            <CardHeader>
              <CardTitle>{t.upload.usageThisMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{t.upload.documents}</span>
                      <span>{t.upload.loading}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full w-0"></div>
                    </div>
                  </div>
                </div>
              ) : usage ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{t.upload.documents}</span>
                      <span className={usage.documentsProcessed >= usage.documentsLimit ? "text-red-500 font-medium" : ""}>
                        {usage.documentsProcessed}/{usage.documentsLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
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
                  
                  {usage.documentsProcessed >= usage.documentsLimit && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-md">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-300">
                        {t.upload.documentLimitReached}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{t.upload.flashcards}</span>
                      <span className={usage.flashcardsGenerated >= usage.flashcardsLimit ? "text-red-500 font-medium" : ""}>
                        {usage.flashcardsGenerated}/{usage.flashcardsLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
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
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{t.upload.quizzes}</span>
                      <span className={usage.quizzesGenerated >= usage.quizzesLimit ? "text-red-500 font-medium" : ""}>
                        {usage.quizzesGenerated}/{usage.quizzesLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
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
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => router.push(`/${locale}/dashboard/billing`)}
                  >
                    {t.upload.upgradePlan}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{t.upload.documents}</span>
                      <span>0/5</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-0"></div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    {t.upload.upgradePlan}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}