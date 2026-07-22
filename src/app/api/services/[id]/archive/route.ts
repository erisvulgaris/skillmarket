import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { writeAudit } from '@/lib/audit'

// Archive (soft-delete) a service — seller only
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params

    const service = await db.service.findUnique({ where: { id } })
    if (!service) return err('NOT_FOUND', 404)
    if (service.sellerId !== user.id) return err('FORBIDDEN', 403)

    await db.service.update({
      where: { id },
      data: { status: 'hidden', availability: 'paused', deletedAt: new Date() },
    })

    await writeAudit({ actorId: user.id, action: 'service_archived', entityType: 'service', entityId: id })
    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}

// Restore (un-archive) a service
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params

    const service = await db.service.findUnique({ where: { id } })
    if (!service) return err('NOT_FOUND', 404)
    if (service.sellerId !== user.id) return err('FORBIDDEN', 403)

    await db.service.update({
      where: { id },
      data: { status: 'active', availability: 'available', deletedAt: null },
    })

    await writeAudit({ actorId: user.id, action: 'service_restored', entityType: 'service', entityId: id })
    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
}
