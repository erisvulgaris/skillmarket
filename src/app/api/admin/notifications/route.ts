import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3),
  body: z.string().min(3),
  type: z.enum(['info', 'warning', 'maintenance']).default('info'),
})

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const announcement = await db.announcement.create({
      data: { ...data!, published: true, authorId: undefined as any },
    })

    // broadcast to all users
    const users = await db.user.findMany({ where: { deletedAt: null }, select: { id: true } })
    await db.notification.createMany({
      data: users.map((u) => ({
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
}
