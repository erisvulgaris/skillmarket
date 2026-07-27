type EmailOptions = {
  to: string
  subject: string
  text: string
  html?: string
}

const isDev = process.env.NODE_ENV !== 'production'

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (isDev) {
    console.log(`[EMAIL DEV] To: ${options.to}`)
    console.log(`[EMAIL DEV] Subject: ${options.subject}`)
    console.log(`[EMAIL DEV] Body: ${options.text}`)
    return
  }

  throw new Error('Email sending not configured. Set SMTP_* environment variables.')
}

export function formatNotificationEmail(type: string, title: string, body: string): { subject: string; text: string } {
  const prefix = '[SkillMarket] '
  return {
    subject: prefix + title,
    text: `${title}\n\n${body}\n\n---\nSkillMarket - P2P Digital Service Marketplace`,
  }
}

export async function sendNotificationEmail(params: {
  email: string
  type: string
  title: string
  body: string
}): Promise<void> {
  const { subject, text } = formatNotificationEmail(params.type, params.title, params.body)
  await sendEmail({ to: params.email, subject, text })
}
