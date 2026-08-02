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
  status: z.string(),
  resolution: z.string().optional(),
})

export const PATCH = adminLimit(async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)
    const dispute = await db.dispute.update({ where: { id }, data: { status: data!.status, resolution: data!.resolution } })
    await writeAudit({ actorId: admin.id, action: 'admin_dispute_update', entityType: 'dispute', entityId: id, after: data })
    return ok({ dispute })
  } catch (e) {
    return handleError(e)
  }
})


export async function GET() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
