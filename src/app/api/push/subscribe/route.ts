export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { err, ok, isBuildOrWorker } from '@/lib/api'
import { z } from 'zod'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

// Vapid keys should be in env vars:
// NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
// VAPID_PRIVATE_KEY=...
// VAPID_SUBJECT=mailto:admin@skillcart.app

export async function POST(req: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const body = await req.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) return err('Invalid subscription data', 422)

    // Store subscription - upsert to avoid duplicates
    const existing = await db.pushSubscription.findFirst({
      where: { userId: user.id, endpoint: parsed.data.endpoint },
    })

    if (existing) {
      await db.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: parsed.data.keys.p256dh,
          auth: parsed.data.keys.auth,
        },
      })
    } else {
      await db.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint: parsed.data.endpoint,
          p256dh: parsed.data.keys.p256dh,
          auth: parsed.data.keys.auth,
        },
      })
    }

    return ok({ subscribed: true })
  } catch (e) {
    console.error('Push subscribe error:', e)
    return err('Failed to subscribe', 500)
  }
}

export async function DELETE(req: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const { endpoint } = await req.json()
    if (endpoint) {
      await db.pushSubscription.deleteMany({
        where: { userId: user.id, endpoint },
      })
    } else {
      await db.pushSubscription.deleteMany({
        where: { userId: user.id },
      })
    }

    return ok({ unsubscribed: true })
  } catch (e) {
    console.error('Push unsubscribe error:', e)
    return err('Failed to unsubscribe', 500)
  }
}


export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}