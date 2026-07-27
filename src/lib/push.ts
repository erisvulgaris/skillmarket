// Web Push notification utility
// Uses web-push library for sending push notifications

import { db } from './db'

let webPush: any = null

async function getWebPush() {
  if (!webPush) {
    try {
      webPush = await import('web-push')
    } catch {
      return null
    }
  }
  return webPush
}

export async function sendPushNotification(userId: string, title: string, body: string, url?: string) {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) return

    const wp = await getWebPush()
    if (!wp) {
      console.log(`[PUSH DEV] Would send to user ${userId}: ${title} - ${body}`)
      return
    }

    // Check if VAPID keys are configured
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@skillmarket.app'

    if (!publicKey || !privateKey) {
      console.log(`[PUSH DEV] VAPID keys not configured. Would send to user ${userId}: ${title} - ${body}`)
      return
    }

    wp.setVapidDetails(subject, publicKey, privateKey)

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: { url: url || '/' },
    })

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        wp.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    )

    // Clean up invalid subscriptions
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected') {
        const err = result.reason
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.pushSubscription.delete({ where: { id: subscriptions[i].id } })
        }
      }
    }
  } catch (e) {
    console.error('Push notification error:', e)
  }
}
