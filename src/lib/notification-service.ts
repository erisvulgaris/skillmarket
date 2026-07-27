import { db } from './db'
import { pushNotification } from './audit'
import { sendNotificationEmail } from './email'
import { safeJsonParse } from './api'

type NotificationPrefs = {
  order: boolean
  payment: boolean
  transfer: boolean
  message: boolean
  review: boolean
  dispute: boolean
  announcement: boolean
  referral: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  order: true,
  payment: true,
  transfer: true,
  message: true,
  review: true,
  dispute: true,
  announcement: true,
  referral: true,
}

export function parseNotificationPrefs(raw: string | null | undefined): NotificationPrefs {
  return { ...DEFAULT_PREFS, ...safeJsonParse(raw, {}) }
}

export async function sendNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: unknown
}) {
  await pushNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data,
  })

  try {
    const user = await db.user.findUnique({
      where: { id: params.userId },
      include: { profile: true },
    })
    if (!user || !user.profile) return

    const prefs = parseNotificationPrefs(user.profile.notificationPrefs)
    if (prefs[params.type as keyof NotificationPrefs] !== false) {
      await sendNotificationEmail({
        email: user.email,
        type: params.type,
        title: params.title,
        body: params.body,
      }).catch(() => {})
    }
  } catch {
    // Silently fail - in-app notification was already sent
  }
}
