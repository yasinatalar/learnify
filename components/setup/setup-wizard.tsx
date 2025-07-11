"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Target,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  User
} from "lucide-react"
import { toast } from "sonner"
import { TIMEZONES, LANGUAGES } from "@/lib/constants/timezones"

interface SetupWizardProps {
  onComplete: () => void
  userEmail: string
  userName: string
}

interface WizardSettings {
  // Profile
  fullName: string
  timezone: string
  language: string
  
  // Learning preferences
  defaultDifficulty: string
  autoGenerateFlashcards: boolean
  autoGenerateQuiz: boolean
  spacedRepetitionEnabled: boolean
  dailyGoal: number
  preferredStudyTime: string
  
  // Notifications
  emailNotifications: boolean
  studyReminders: boolean
  weeklyProgress: boolean
  
  // Privacy
  dataCollection: boolean
  analytics: boolean
  
  // Appearance
  theme: string
  animations: boolean
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to LearnifyAI',
    description: 'Let\'s customize your learning experience',
    icon: Sparkles
  },
  {
    id: 'profile',
    title: 'Personal Information',
    description: 'Tell us about yourself',
    icon: User
  },
  {
    id: 'learning',
    title: 'Learning Preferences',
    description: 'Configure how you want to learn',
    icon: Target
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Choose what you want to be notified about',
    icon: Bell
  },
  {
    id: 'privacy',
    title: 'Privacy Settings',
    description: 'Control your data and privacy',
    icon: Shield
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize the look and feel',
    icon: Palette
  },
  {
    id: 'complete',
    title: 'Setup Complete',
    description: 'You\'re all set to start learning!',
    icon: Check
  }
]

export function SetupWizard({ onComplete, userEmail, userName }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [settings, setSettings] = useState<WizardSettings>({
    fullName: userName || "",
    timezone: "UTC",
    language: "en",
    defaultDifficulty: "mixed",
    autoGenerateFlashcards: true,
    autoGenerateQuiz: true,
    spacedRepetitionEnabled: true,
    dailyGoal: 30,
    preferredStudyTime: "evening",
    emailNotifications: true,
    studyReminders: true,
    weeklyProgress: true,
    dataCollection: true,
    analytics: true,
    theme: "system",
    animations: true,
  })
  const [saving, setSaving] = useState(false)

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    // Validate required fields before proceeding
    if (currentStep === 1) { // Profile step
      if (!settings.fullName.trim()) {
        toast.error("Please enter your full name")
        return
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('Setup completed successfully!')
        onComplete()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to complete setup')
      }
    } catch (error) {
      console.error('Setup completion error:', error)
      toast.error('Failed to complete setup')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof WizardSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <currentStepData.icon className="h-6 w-6" />
            {currentStepData.title}
          </CardTitle>
          <CardDescription className="text-base">
            {currentStepData.description}
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Welcome Step */}
          {currentStep === 0 && (
            <div className="text-center space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Hello {userName}!</h3>
                <p className="text-muted-foreground">
                  Welcome to LearnifyAI. Let's take a few minutes to customize your learning experience 
                  so you can get the most out of our platform.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>Personalized Learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span>Smart Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span>AI-Powered Content</span>
                </div>
              </div>
            </div>
          )}

          {/* Profile Step */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={settings.fullName}
                  onChange={(e) => updateSetting('fullName', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  This will be displayed in your profile and certificates
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSetting('timezone', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        <div className="flex flex-col">
                          <span>{tz.label}</span>
                          <span className="text-xs text-muted-foreground">{tz.offset}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  This helps us schedule reminders and show times correctly
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your language" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Interface language (content language may vary)
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-mono">{userEmail}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your email is used for account security and notifications
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Learning Preferences Step */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Default Difficulty</Label>
                  <Select value={settings.defaultDifficulty} onValueChange={(value) => updateSetting('defaultDifficulty', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studyTime">Preferred Study Time</Label>
                  <Select value={settings.preferredStudyTime} onValueChange={(value) => updateSetting('preferredStudyTime', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Learning Goal (minutes)</Label>
                <Input
                  id="dailyGoal"
                  type="number"
                  min="5"
                  max="600"
                  value={settings.dailyGoal}
                  onChange={(e) => updateSetting('dailyGoal', parseInt(e.target.value))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Auto-Generation Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoFlashcards">Auto-generate Flashcards</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically create flashcards when you upload documents
                      </p>
                    </div>
                    <Switch
                      id="autoFlashcards"
                      checked={settings.autoGenerateFlashcards}
                      onCheckedChange={(checked) => updateSetting('autoGenerateFlashcards', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoQuiz">Auto-generate Quizzes</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically create quizzes when you upload documents
                      </p>
                    </div>
                    <Switch
                      id="autoQuiz"
                      checked={settings.autoGenerateQuiz}
                      onCheckedChange={(checked) => updateSetting('autoGenerateQuiz', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="spacedRepetition">Spaced Repetition</Label>
                      <p className="text-sm text-muted-foreground">
                        Use spaced repetition algorithm for optimal learning
                      </p>
                    </div>
                    <Switch
                      id="spacedRepetition"
                      checked={settings.spacedRepetitionEnabled}
                      onCheckedChange={(checked) => updateSetting('spacedRepetitionEnabled', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Step */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="studyReminders">Study Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded when it's time to review your flashcards
                  </p>
                </div>
                <Switch
                  id="studyReminders"
                  checked={settings.studyReminders}
                  onCheckedChange={(checked) => updateSetting('studyReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyProgress">Weekly Progress Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summaries of your learning progress
                  </p>
                </div>
                <Switch
                  id="weeklyProgress"
                  checked={settings.weeklyProgress}
                  onCheckedChange={(checked) => updateSetting('weeklyProgress', checked)}
                />
              </div>
            </div>
          )}

          {/* Privacy Step */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dataCollection">Data Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow us to collect usage data to improve the service
                  </p>
                </div>
                <Switch
                  id="dataCollection"
                  checked={settings.dataCollection}
                  onCheckedChange={(checked) => updateSetting('dataCollection', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable analytics to help us understand how you use the platform
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.analytics}
                  onCheckedChange={(checked) => updateSetting('analytics', checked)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Privacy Promise</h4>
                <p className="text-sm text-muted-foreground">
                  Your learning data is private and secure. We never sell your personal information, 
                  and you can change these settings at any time.
                </p>
              </div>
            </div>
          )}

          {/* Appearance Step */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Theme Preference</Label>
                <RadioGroup value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Light Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Dark Mode</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system">System Preference</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="animations">Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth animations and transitions
                  </p>
                </div>
                <Switch
                  id="animations"
                  checked={settings.animations}
                  onCheckedChange={(checked) => updateSetting('animations', checked)}
                />
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 6 && (
            <div className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
                <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
                <p className="text-muted-foreground">
                  Your learning environment is now customized to your preferences. 
                  You can always change these settings later in your account settings.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Name: {settings.fullName}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Difficulty: {settings.defaultDifficulty}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Goal: {settings.dailyGoal} min/day</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Theme: {settings.theme}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {TIMEZONES.find(tz => tz.value === settings.timezone)?.label || settings.timezone}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {settings.autoGenerateFlashcards ? 'Auto-flashcards' : 'Manual flashcards'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="flex justify-between items-center p-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}