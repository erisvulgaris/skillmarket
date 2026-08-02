export const revalidate = 0
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  action: z.string(),
})

export const PATCH = adminLimit(async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)
    const { action } = data!
    // action: feature | unfeature | hide | activate | remove

    const service = await db.service.findUnique({ where: { id } })
    if (!service) return err('NOT_FOUND', 404)

    const before = { status: service.status, featured: service.featured }
    let update: any = {}
    if (action === 'feature' || action === 'unfeature') update.featured = action === 'feature'
    if (action === 'hide') update.status = 'hidden'
    if (action === 'activate') update.status = 'active'
    if (action === 'remove') { update.status = 'removed'; update.deletedAt = new Date() }

    const updated = await db.service.update({ where: { id }, data: update })
    await writeAudit({ actorId: admin.id, action: `admin_service_${action}`, entityType: 'service', entityId: id, before, after: update })
    return ok({ service: updated })
  } catch (e) {
    return handleError(e)
  }
})


export async function GET() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
