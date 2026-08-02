import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3),
  body: z.string().min(3),
  type: z.enum(['info', 'warning', 'maintenance']).default('info'),
})

export const POST = adminLimit(async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const announcement = await db.announcement.create({
      data: { ...data!, published: true },
    })

    // broadcast to all users
    const users = await db.user.findMany({ where: { deletedAt: null }, select: { id: true } })
    await db.notification.createMany({
      data: users.map((u: { id: string }) => ({
        userId: u.id,
        type: 'announcement',
        title: data!.title,
        body: data!.body,
        data: JSON.stringify({ announcementId: announcement.id }),
      })),
    })

    return ok({ announcement }, 201)
  } catch (e) {
    return handleError(e)
  }
})


export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
