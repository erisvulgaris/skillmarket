import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { writeAudit } from '@/lib/audit'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { status } = body as { status: string }
    const report = await db.report.update({ where: { id }, data: { status } })
    await writeAudit({ actorId: admin.id, action: 'admin_report_update', entityType: 'report', entityId: id, after: { status } })
    return ok({ report })
  } catch (e) {
    return handleError(e)
  }
}
