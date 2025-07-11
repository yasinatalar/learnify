import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { db } from "@/lib/db"
import authConfig from "@/auth.config"
import { DEFAULT_USER_SETTINGS } from "@/lib/settings/defaults"
import { createSignInEmailTemplate } from "@/lib/email/templates"
import { sendWelcomeEmail } from "@/lib/email/send-welcome"

// Add email provider for Node.js runtime
const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
]

// Only add email provider in Node.js runtime (not Edge)
if (typeof window === "undefined" && process.env.EMAIL_SERVER_HOST) {
  const EmailProvider = require("next-auth/providers/email").default;
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { subject, html, text } = createSignInEmailTemplate({
          url,
          host: new URL(url).host,
          email
        });

        const { createTransport } = require("nodemailer");
        const transport = createTransport(provider.server);

        await transport.sendMail({
          to: email,
          from: provider.from,
          subject,
          text,
          html,
        });
      },
    })
  )
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers,
  events: {
    async createUser({ user }) {
      try {
        // Create user usage record when a new user is created
        await db.userUsage.create({
          data: {
            userId: user.id!,
            documentsProcessed: 0,
            flashcardsGenerated: 0,
            quizzesGenerated: 0,
            aiTokensUsed: 0,
            documentsLimit: 5, // FREE tier default
            flashcardsLimit: 100,
            quizzesLimit: 10,
            aiTokensLimit: 50000,
          },
        })

        // Create default user settings when a new user is created
        await db.userSettings.create({
          data: {
            userId: user.id!,
            ...DEFAULT_USER_SETTINGS,
          },
        })
        
        console.log(`✅ Initialized user settings for user: ${user.id}`)
        
        // Send welcome email to new users
        if (user.email) {
          await sendWelcomeEmail(user.email, user.name)
        }
      } catch (error) {
        console.error(`❌ Failed to initialize user data for user: ${user.id}`, error)
        // Don't throw error to prevent login failure
        // The settings API will handle creating defaults if missing
      }
    },
  },
})