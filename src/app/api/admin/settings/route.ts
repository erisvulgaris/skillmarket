import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

export async function GET() {
  try {
    await requireAdmin()
    const settings = await db.setting.findMany({ orderBy: { key: 'asc' } })
    return ok({ settings })
  } catch (e) {
    return handleError(e)
  }
}

const schema = z.object({
  key: z.string(),
  value: z.string(),
  type: z.string().default('string'),
})

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin()
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)
    const setting = await db.setting.upsert({
      where: { key: data!.key },
      create: { key: data!.key, value: data!.value, type: data!.type },
      update: { value: data!.value, type: data!.type },
    })
    await writeAudit({ actorId: admin.id, action: 'admin_setting_update', entityType: 'setting', entityId: setting.id, after: data })
    return ok({ setting })
  } catch (e) {
    return handleError(e)
  }
}
