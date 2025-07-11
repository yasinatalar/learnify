import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

interface UserSettings {
  profile: {
    name: string
    email: string
    timezone: string
    language: string
  }
  notifications: {
    email: boolean
    push: boolean
    studyReminders: boolean
    weeklyProgress: boolean
    newFeatures: boolean
  }
  learning: {
    defaultDifficulty: string
    autoGenerateFlashcards: boolean
    autoGenerateQuiz: boolean
    spacedRepetitionEnabled: boolean
    dailyGoal: number
    preferredStudyTime: string
  }
  privacy: {
    profileVisible: boolean
    shareProgress: boolean
    dataCollection: boolean
    analytics: boolean
  }
  appearance: {
    theme: string
    compactMode: boolean
    animations: boolean
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setError(null)
      } else {
        setError("Failed to load settings")
      }
    } catch (error) {
      console.error("Settings fetch error:", error)
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings)
      })

      if (response.ok) {
        await fetchSettings() // Refresh settings after update
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.error || "Failed to update settings" }
      }
    } catch (error) {
      console.error("Settings update error:", error)
      return { success: false, error: "Failed to update settings" }
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  // Get processing options for upload based on user settings
  const getProcessingOptions = useCallback(() => {
    if (!settings) return {
      generateFlashcards: true,
      generateQuiz: true,
      flashcardCount: "20",
      quizQuestionCount: "10",
      difficulty: "mixed",
    }

    return {
      generateFlashcards: settings.learning.autoGenerateFlashcards,
      generateQuiz: settings.learning.autoGenerateQuiz,
      flashcardCount: "20", // Keep UI default for now
      quizQuestionCount: "10", // Keep UI default for now
      difficulty: settings.learning.defaultDifficulty,
    }
  }, [settings])

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    getProcessingOptions
  }
}