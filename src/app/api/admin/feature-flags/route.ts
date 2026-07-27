import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

export const GET = adminLimit(async function GET() {
  try {
    await requireAdmin()
    const flags = await db.featureFlag.findMany({ orderBy: { key: 'asc' } })
    return ok({ flags })
  } catch (e) {
    return handleError(e)
  }
})

const schema = z.object({
  key: z.string(),
  enabled: z.boolean(),
})

export const PATCH = adminLimit(async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin()
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)
    const flag = await db.featureFlag.update({
      where: { key: data!.key },
      data: { enabled: data!.enabled },
    })
    await writeAudit({ actorId: admin.id, action: 'admin_feature_flag_toggle', entityType: 'feature_flag', entityId: flag.id, after: { key: data!.key, enabled: data!.enabled } })
    return ok({ flag })
  } catch (e) {
    return handleError(e)
  }
})
