import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { pushNotification } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({
  reason: z.string().min(5).max(500),
  detail: z.string().max(2000).optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const service = await db.service.findUnique({ where: { id }, include: { seller: true } })
    if (!service) return err('NOT_FOUND', 404)

    const report = await db.report.create({
      data: {
        authorId: user.id,
        targetType: 'service',
        targetId: id,
        targetUserId: service.sellerId,
        reason: data!.reason,
        detail: data!.detail,
        status: 'open',
      },
    })

    const admins = await db.user.findMany({ where: { role: 'admin' }, select: { id: true } })
    for (const a of admins) {
      await pushNotification({
        userId: a.id,
        type: 'dispute',
        title: 'New report filed',
        body: `Service "${service.title}" was reported: ${data!.reason}`,
        data: { reportId: report.id },
      })
    }

    return ok({ report }, 201)
  } catch (e) {
    return handleError(e)
  }
}
