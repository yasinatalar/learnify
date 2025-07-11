import { createWelcomeEmailTemplate } from "./templates"

export async function sendWelcomeEmail(email: string, name?: string) {
  // Only send welcome email if email server is configured
  if (!process.env.EMAIL_SERVER_HOST) {
    console.log('Email server not configured, skipping welcome email')
    return
  }

  try {
    const { createTransport } = require("nodemailer")
    
    const transport = createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    const host = process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '') || 'localhost:3000'
    const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/setup`

    const { subject, html, text } = createWelcomeEmailTemplate({
      url,
      host,
      email,
      name
    })

    await transport.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject,
      text,
      html,
    })

    console.log(`✅ Welcome email sent to ${email}`)
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    // Don't throw error to prevent user creation failure
  }
}