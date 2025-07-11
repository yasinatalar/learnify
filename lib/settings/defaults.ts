/**
 * Default settings values for new users
 */
export const DEFAULT_USER_SETTINGS = {
  // Profile settings
  timezone: "UTC",
  language: "en",
  
  // Notification preferences
  emailNotifications: true,
  pushNotifications: false,
  studyReminders: true,
  weeklyProgress: true,
  newFeatures: false,
  
  // Learning preferences
  defaultDifficulty: "mixed" as const,
  autoGenerateFlashcards: true,
  autoGenerateQuiz: true,
  autoGenerateSummaries: true,
  spacedRepetitionEnabled: true,
  dailyGoal: 30,
  preferredStudyTime: "evening" as const,
  
  // Privacy settings
  profileVisible: false,
  shareProgress: false,
  dataCollection: true,
  analytics: true,
  
  // Appearance settings
  theme: "system" as const,
  compactMode: false,
  animations: true,
  
  // Setup tracking
  setupCompleted: false,
}

/**
 * Initialize user settings for a new user
 * @param userId - The user ID
 * @returns Promise<UserSettings>
 */
export async function initializeUserSettings(userId: string) {
  const { db } = await import("@/lib/db")
  
  try {
    // Check if settings already exist
    const existingSettings = await db.userSettings.findUnique({
      where: { userId }
    })
    
    if (existingSettings) {
      return existingSettings
    }
    
    // Create new settings with defaults
    const newSettings = await db.userSettings.create({
      data: {
        userId,
        ...DEFAULT_USER_SETTINGS,
      }
    })
    
    return newSettings
  } catch (error) {
    console.error("Error initializing user settings:", error)
    throw new Error("Failed to initialize user settings")
  }
}

/**
 * Ensure user settings exist, create if not
 * @param userId - The user ID
 * @returns Promise<UserSettings>
 */
export async function ensureUserSettings(userId: string) {
  const { db } = await import("@/lib/db")
  
  try {
    // Use upsert to create if not exists
    const settings = await db.userSettings.upsert({
      where: { userId },
      update: {}, // No update needed if exists
      create: {
        userId,
        ...DEFAULT_USER_SETTINGS,
      }
    })
    
    return settings
  } catch (error) {
    console.error("Error ensuring user settings:", error)
    throw new Error("Failed to ensure user settings")
  }
}