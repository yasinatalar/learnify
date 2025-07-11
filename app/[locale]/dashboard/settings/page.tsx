"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Shield, Globe, Palette } from "lucide-react"
import { toast } from "sonner"
import { useTranslations, useI18n } from "@/lib/i18n/context"

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

export default function SettingsPage() {
  const t = useTranslations()
  const { locale } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: '',
      email: '',
      timezone: 'UTC',
      language: locale
    },
    notifications: {
      email: true,
      push: true,
      studyReminders: true,
      weeklyProgress: true,
      newFeatures: true
    },
    learning: {
      defaultDifficulty: 'medium',
      autoGenerateFlashcards: true,
      autoGenerateQuiz: true,
      spacedRepetitionEnabled: true,
      dailyGoal: 30,
      preferredStudyTime: 'evening'
    },
    privacy: {
      profileVisible: false,
      shareProgress: false,
      dataCollection: true,
      analytics: true
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      animations: true
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          const loadedSettings = data.settings || settings
          // Ensure the language matches the current locale if not set
          if (!loadedSettings.profile.language) {
            loadedSettings.profile.language = locale
          }
          setSettings(loadedSettings)
        } else {
          toast.error(getText('settings.loadError', 'Failed to load settings'))
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error(getText('settings.loadError', 'Error loading settings'))
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [t])

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Convert nested structure to flat structure for API
      const flatSettings = {
        // Profile settings
        language: settings.profile.language,
        timezone: settings.profile.timezone,
        
        // Notification preferences  
        emailNotifications: settings.notifications.email,
        pushNotifications: settings.notifications.push,
        studyReminders: settings.notifications.studyReminders,
        weeklyProgress: settings.notifications.weeklyProgress,
        newFeatures: settings.notifications.newFeatures,
        
        // Learning preferences
        defaultDifficulty: settings.learning.defaultDifficulty,
        autoGenerateFlashcards: settings.learning.autoGenerateFlashcards,
        autoGenerateQuiz: settings.learning.autoGenerateQuiz,
        spacedRepetitionEnabled: settings.learning.spacedRepetitionEnabled,
        dailyGoal: settings.learning.dailyGoal,
        preferredStudyTime: settings.learning.preferredStudyTime,
        
        // Privacy settings
        profileVisible: settings.privacy.profileVisible,
        shareProgress: settings.privacy.shareProgress,
        dataCollection: settings.privacy.dataCollection,
        analytics: settings.privacy.analytics,
        
        // Appearance settings
        theme: settings.appearance.theme,
        compactMode: settings.appearance.compactMode,
        animations: settings.appearance.animations,
        
        // Profile data (handled separately by API)
        profile: {
          name: settings.profile.name,
          email: settings.profile.email
        }
      }
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flatSettings)
      })

      if (response.ok) {
        toast.success(getText('settings.changesSaved', 'Settings saved successfully'))
      } else {
        toast.error(getText('settings.saveError', 'Failed to save settings'))
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(getText('settings.saveError', 'Error saving settings'))
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const handleLanguageChange = async (newLocale: string) => {
    console.log('Changing language to:', newLocale)
    console.log('Current locale:', locale)
    console.log('Current pathname:', pathname)
    
    try {
      // Update the settings first
      updateSetting('profile', 'language', newLocale)
      
      // Save the language preference to the backend
      // Convert nested structure to flat structure for API
      const flatSettings = {
        // Profile settings
        language: newLocale,
        timezone: settings.profile.timezone,
        
        // Notification preferences  
        emailNotifications: settings.notifications.email,
        pushNotifications: settings.notifications.push,
        studyReminders: settings.notifications.studyReminders,
        weeklyProgress: settings.notifications.weeklyProgress,
        newFeatures: settings.notifications.newFeatures,
        
        // Learning preferences
        defaultDifficulty: settings.learning.defaultDifficulty,
        autoGenerateFlashcards: settings.learning.autoGenerateFlashcards,
        autoGenerateQuiz: settings.learning.autoGenerateQuiz,
        spacedRepetitionEnabled: settings.learning.spacedRepetitionEnabled,
        dailyGoal: settings.learning.dailyGoal,
        preferredStudyTime: settings.learning.preferredStudyTime,
        
        // Privacy settings
        profileVisible: settings.privacy.profileVisible,
        shareProgress: settings.privacy.shareProgress,
        dataCollection: settings.privacy.dataCollection,
        analytics: settings.privacy.analytics,
        
        // Appearance settings
        theme: settings.appearance.theme,
        compactMode: settings.appearance.compactMode,
        animations: settings.appearance.animations,
        
        // Profile data (handled separately by API)
        profile: {
          name: settings.profile.name,
          email: settings.profile.email
        }
      }
      
      console.log('Sending settings to API:', flatSettings)
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flatSettings)
      })
      
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('API error:', errorData)
        throw new Error('Failed to save settings')
      }
      
      const responseData = await response.json()
      console.log('API response data:', responseData)
      
      // Navigate to the new locale route
      const currentPath = pathname.replace(/^\/(en|de)/, '') || '/'
      const newPath = `/${newLocale}${currentPath}`
      
      console.log('Redirecting to:', newPath)
      
      toast.success(getText('settings.languageChanged', 'Language changed successfully'))
      
      // Use window.location for a full page reload to ensure all components update
      window.location.href = newPath
    } catch (error) {
      console.error('Error changing language:', error)
      toast.error(getText('settings.languageChangeError', 'Failed to change language'))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('settings.title', 'Settings')}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {getText('settings.subtitle', 'Manage your account and preferences')}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getText('settings.title', 'Settings')}</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {getText('settings.subtitle', 'Manage your account and preferences')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? getText('common.saving', 'Saving...') : getText('settings.saveChanges', 'Save Changes')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                {getText('settings.profile', 'Profile')}
              </CardTitle>
              <CardDescription>
                {getText('settings.profileDesc', 'Update your personal information')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{getText('settings.name', 'Name')}</Label>
                <Input
                  id="name"
                  value={settings.profile.name}
                  onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                  placeholder={getText('settings.enterName', 'Enter your name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{getText('settings.email', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  placeholder={getText('settings.enterEmail', 'Enter your email')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">{getText('settings.timezone', 'Timezone')}</Label>
                <Select value={settings.profile.timezone} onValueChange={(value) => updateSetting('profile', 'timezone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Berlin">Berlin</SelectItem>
                    <SelectItem value="America/New_York">New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                {getText('settings.preferences', 'Preferences')}
              </CardTitle>
              <CardDescription>
                {getText('settings.preferencesDesc', 'Customize your experience')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{getText('settings.language', 'Language')}</Label>
                <Select value={settings.profile.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">{getText('settings.theme', 'Theme')}</Label>
                <Select value={settings.appearance.theme} onValueChange={(value) => updateSetting('appearance', 'theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{getText('settings.lightTheme', 'Light')}</SelectItem>
                    <SelectItem value="dark">{getText('settings.darkTheme', 'Dark')}</SelectItem>
                    <SelectItem value="system">{getText('settings.systemTheme', 'System')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                {getText('settings.notifications', 'Notifications')}
              </CardTitle>
              <CardDescription>
                {getText('settings.notificationsDesc', 'Manage your notification preferences')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('settings.emailNotifications', 'Email Notifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('settings.emailNotificationsDesc', 'Receive notifications via email')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('settings.pushNotifications', 'Push Notifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('settings.pushNotificationsDesc', 'Receive push notifications')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('settings.studyReminders', 'Study Reminders')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('settings.studyRemindersDesc', 'Get reminders for your study sessions')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.studyReminders}
                  onCheckedChange={(checked) => updateSetting('notifications', 'studyReminders', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('settings.weeklyProgress', 'Weekly Progress')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('settings.weeklyProgressDesc', 'Receive weekly progress reports')}
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.weeklyProgress}
                  onCheckedChange={(checked) => updateSetting('notifications', 'weeklyProgress', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy & Security */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                {getText('settings.privacy', 'Privacy & Security')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('settings.dataCollection', 'Data Collection')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('settings.dataCollectionDesc', 'Allow data collection for service improvement')}
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataCollection}
                  onCheckedChange={(checked) => updateSetting('privacy', 'dataCollection', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getText('settings.analytics', 'Analytics')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getText('settings.analyticsDesc', 'Help improve our service')}
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.analytics}
                  onCheckedChange={(checked) => updateSetting('privacy', 'analytics', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">{getText('settings.dangerZone', 'Danger Zone')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" size="sm" className="w-full">
                {getText('settings.deleteAccount', 'Delete Account')}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {getText('settings.deleteAccountDesc', 'This action cannot be undone')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}