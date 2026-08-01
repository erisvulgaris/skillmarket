export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  status: z.string(),
})

export const PATCH = adminLimit(async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)
    const { status } = data!
    const report = await db.report.update({ where: { id }, data: { status } })
    await writeAudit({ actorId: admin.id, action: 'admin_report_update', entityType: 'report', entityId: id, after: { status } })
    return ok({ report })
  } catch (e) {
    return handleError(e)
  }
})
