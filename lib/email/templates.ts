interface EmailTemplateProps {
  url: string
  host: string
  email: string
}

export function createSignInEmailTemplate({ url, host, email }: EmailTemplateProps): { subject: string; html: string; text: string } {
  const subject = `Sign in to LearnifyAI`
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to LearnifyAI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f8fafc;
    }
    
    .container {
      background-color: #ffffff;
      margin: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .brain-icon {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .tagline {
      font-size: 16px;
      opacity: 0.9;
      margin: 0;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1a202c;
    }
    
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .signin-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .signin-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .features {
      background-color: #f7fafc;
      padding: 30px;
      margin: 30px 0;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .features h3 {
      color: #2d3748;
      font-size: 18px;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .feature-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #4a5568;
      font-size: 14px;
    }
    
    .feature-icon {
      width: 16px;
      height: 16px;
      background: #667eea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      flex-shrink: 0;
    }
    
    .security-note {
      background-color: #fef5e7;
      border: 1px solid #f6d55c;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    
    .security-note h4 {
      color: #744210;
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
    }
    
    .security-note p {
      color: #744210;
      margin: 0;
      font-size: 13px;
    }
    
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      color: #718096;
      font-size: 14px;
      margin: 8px 0;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .url-fallback {
      background-color: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin: 20px 0;
      font-family: monospace;
      font-size: 14px;
      color: #4a5568;
      word-break: break-all;
    }
    
    @media (max-width: 600px) {
      .container {
        margin: 10px;
      }
      
      .header, .content, .footer {
        padding: 20px;
      }
      
      .logo {
        font-size: 24px;
      }
      
      .greeting {
        font-size: 20px;
      }
      
      .feature-list {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="brain-icon">🧠</div>
        LearnifyAI
      </div>
      <p class="tagline">Transform your learning with AI-powered education</p>
    </div>
    
    <div class="content">
      <div class="greeting">Welcome back!</div>
      
      <div class="message">
        You requested to sign in to your LearnifyAI account. Click the button below to complete your sign-in securely.
      </div>
      
      <div class="button-container">
        <a href="${url}" class="signin-button">Sign in to LearnifyAI</a>
      </div>
      
      <div class="features">
        <h3>What's waiting for you:</h3>
        <ul class="feature-list">
          <li class="feature-item">
            <div class="feature-icon">📚</div>
            <span>AI-powered document processing</span>
          </li>
          <li class="feature-item">
            <div class="feature-icon">🧠</div>
            <span>Smart flashcard generation</span>
          </li>
          <li class="feature-item">
            <div class="feature-icon">📊</div>
            <span>Interactive quizzes</span>
          </li>
          <li class="feature-item">
            <div class="feature-icon">📈</div>
            <span>Progress tracking</span>
          </li>
          <li class="feature-item">
            <div class="feature-icon">🎯</div>
            <span>Spaced repetition learning</span>
          </li>
          <li class="feature-item">
            <div class="feature-icon">⚡</div>
            <span>Personalized experience</span>
          </li>
        </ul>
      </div>
      
      <div class="security-note">
        <h4>🔒 Security Notice</h4>
        <p>This sign-in link is valid for 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.</p>
      </div>
      
      <div class="url-fallback">
        <p style="margin: 0 0 8px 0; color: #718096; font-size: 12px;">If the button doesn't work, copy and paste this link:</p>
        <div>${url}</div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>LearnifyAI</strong> - Your AI Learning Companion</p>
      <p>
        Need help? Visit our <a href="https://${host}/support">Support Center</a> or 
        <a href="https://${host}/contact">Contact Us</a>
      </p>
      <p style="font-size: 12px; color: #a0aec0;">
        This email was sent to <strong>${email}</strong> because you requested to sign in to LearnifyAI.
      </p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Welcome back to LearnifyAI!

You requested to sign in to your LearnifyAI account. 

Click here to sign in: ${url}

What's waiting for you:
• AI-powered document processing
• Smart flashcard generation  
• Interactive quizzes
• Progress tracking
• Spaced repetition learning
• Personalized experience

Security Notice: This sign-in link is valid for 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.

If the link doesn't work, copy and paste this URL into your browser:
${url}

---
LearnifyAI - Your AI Learning Companion
Need help? Visit https://${host}/support

This email was sent to ${email} because you requested to sign in to LearnifyAI.
  `
  
  return { subject, html, text }
}

export function createWelcomeEmailTemplate({ url, host, email, name }: EmailTemplateProps & { name?: string }): { subject: string; html: string; text: string } {
  const subject = `Welcome to LearnifyAI! 🎉`
  const userName = name || 'there'
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LearnifyAI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
      background-color: #f8fafc;
    }
    
    .container {
      background-color: #ffffff;
      margin: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .brain-icon {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    
    .welcome-badge {
      background: rgba(255, 255, 255, 0.15);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      margin-top: 10px;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1a202c;
    }
    
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .getting-started {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 30px;
      border-radius: 12px;
      margin: 30px 0;
    }
    
    .getting-started h3 {
      color: #2d3748;
      font-size: 20px;
      margin-bottom: 20px;
      font-weight: 600;
    }
    
    .steps {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    .step-number {
      width: 32px;
      height: 32px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .step-content h4 {
      margin: 0 0 6px 0;
      color: #2d3748;
      font-size: 16px;
      font-weight: 600;
    }
    
    .step-content p {
      margin: 0;
      color: #4a5568;
      font-size: 14px;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    
    .feature-card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    
    .feature-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    
    .feature-title {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 8px;
    }
    
    .feature-description {
      font-size: 14px;
      color: #4a5568;
      margin: 0;
    }
    
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      color: #718096;
      font-size: 14px;
      margin: 8px 0;
    }
    
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    
    @media (max-width: 600px) {
      .container {
        margin: 10px;
      }
      
      .header, .content, .footer {
        padding: 20px;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
      }
      
      .steps {
        gap: 16px;
      }
      
      .step {
        padding: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="brain-icon">🧠</div>
        LearnifyAI
      </div>
      <div class="welcome-badge">Welcome to the future of learning!</div>
    </div>
    
    <div class="content">
      <div class="greeting">Welcome ${userName}! 🎉</div>
      
      <div class="message">
        Thank you for joining LearnifyAI! You've just unlocked a powerful platform that will transform how you learn and retain information using cutting-edge AI technology.
      </div>
      
      <div class="button-container">
        <a href="${url}" class="cta-button">Complete Your Setup & Start Learning</a>
      </div>
      
      <div class="getting-started">
        <h3>🚀 Getting Started is Easy:</h3>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Complete Your Profile</h4>
              <p>Set up your learning preferences, timezone, and personalization settings to get the most out of LearnifyAI.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Upload Your First Document</h4>
              <p>Upload a PDF, Word document, or text file and watch as our AI transforms it into interactive learning materials.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Start Learning</h4>
              <p>Review flashcards, take quizzes, and track your progress with our intelligent spaced repetition system.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🧠</div>
          <div class="feature-title">AI-Powered Learning</div>
          <p class="feature-description">Advanced AI automatically generates flashcards and quizzes from your documents</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <div class="feature-title">Smart Progress Tracking</div>
          <p class="feature-description">Monitor your learning progress with detailed analytics and insights</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <div class="feature-title">Spaced Repetition</div>
          <p class="feature-description">Optimize retention with scientifically-proven spaced repetition algorithms</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <div class="feature-title">Multi-Format Support</div>
          <p class="feature-description">Upload PDFs, Word docs, text files, and more for comprehensive learning</p>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>LearnifyAI</strong> - Your AI Learning Companion</p>
      <p>
        Need help getting started? Visit our <a href="https://${host}/support">Help Center</a> or 
        <a href="https://${host}/contact">Contact Support</a>
      </p>
      <p style="font-size: 12px; color: #a0aec0;">
        This email was sent to <strong>${email}</strong> because you created a LearnifyAI account.
      </p>
    </div>
  </div>
</body>
</html>
  `
  
  const text = `
Welcome to LearnifyAI! 🎉

Hi ${userName},

Thank you for joining LearnifyAI! You've just unlocked a powerful platform that will transform how you learn and retain information using cutting-edge AI technology.

Complete your setup: ${url}

Getting Started is Easy:

1. Complete Your Profile
   Set up your learning preferences, timezone, and personalization settings to get the most out of LearnifyAI.

2. Upload Your First Document  
   Upload a PDF, Word document, or text file and watch as our AI transforms it into interactive learning materials.

3. Start Learning
   Review flashcards, take quizzes, and track your progress with our intelligent spaced repetition system.

What You Get:
• AI-Powered Learning: Advanced AI automatically generates flashcards and quizzes from your documents
• Smart Progress Tracking: Monitor your learning progress with detailed analytics and insights  
• Spaced Repetition: Optimize retention with scientifically-proven spaced repetition algorithms
• Multi-Format Support: Upload PDFs, Word docs, text files, and more for comprehensive learning

---
LearnifyAI - Your AI Learning Companion
Need help getting started? Visit https://${host}/support

This email was sent to ${email} because you created a LearnifyAI account.
  `
  
  return { subject, html, text }
}