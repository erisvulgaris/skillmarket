import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, err, handleError, validateBody, safeJsonParse } from '@/lib/api'
import { z } from 'zod'

const DEFAULT_PREFS = {
  order: true,
  payment: true,
  transfer: true,
  message: true,
  review: true,
  dispute: true,
  announcement: true,
  referral: true,
}

export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const profile = await db.profile.findUnique({ where: { userId: user.id } })
    const prefs = profile?.notificationPrefs
      ? safeJsonParse<any>(profile.notificationPrefs, DEFAULT_PREFS)
      : DEFAULT_PREFS
    return ok({ preferences: prefs })
  } catch (e) {
    return handleError(e)
  }
}

const schema = z.object({
  order: z.boolean().optional(),
  payment: z.boolean().optional(),
  transfer: z.boolean().optional(),
  message: z.boolean().optional(),
  review: z.boolean().optional(),
  dispute: z.boolean().optional(),
  announcement: z.boolean().optional(),
  referral: z.boolean().optional(),
})

export async function PATCH(req: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const profile = await db.profile.findUnique({ where: { userId: user.id } })
    const current = profile?.notificationPrefs
      ? safeJsonParse<any>(profile.notificationPrefs, DEFAULT_PREFS)
      : DEFAULT_PREFS
    const updated = { ...current, ...data }

    await db.profile.update({
      where: { userId: user.id },
      data: { notificationPrefs: JSON.stringify(updated) },
    })

    return ok({ preferences: updated })
  } catch (e) {
    return handleError(e)
  }
}