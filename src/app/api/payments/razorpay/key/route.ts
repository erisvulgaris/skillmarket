import { requireAdmin } from '@/lib/auth'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { listRazorpayKeys, saveRazorpayKey, deleteRazorpayKey } from '@/lib/razorpay'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

export const GET = adminLimit(async function GET() {
  try {
    await requireAdmin()
    const keys = await listRazorpayKeys()
    const masked = keys.map((k: any) => ({
      id: k.id,
      label: k.label,
      keyId: k.keyId,
      active: k.active,
      createdAt: k.createdAt,
    }))
    return ok({ keys: masked })
  } catch (e) {
    return handleError(e)
  }
})

const postSchema = z.object({
  label: z.string(),
  keyId: z.string(),
  keySecret: z.string(),
  active: z.boolean().optional(),
})

export const POST = adminLimit(async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(postSchema, req)
    if (error) return err(error, 422)
    const key = await saveRazorpayKey(data!)
    await writeAudit({ actorId: admin.id, action: 'admin_razorpay_key_create', entityType: 'razorpay_key', entityId: key.id, after: { label: key.label, keyId: key.keyId, active: key.active } })
    return ok({ key: { id: key.id, label: key.label, keyId: key.keyId, active: key.active, createdAt: key.createdAt } })
  } catch (e) {
    return handleError(e)
  }
})

export const DELETE = adminLimit(async function DELETE(req: Request) {
  try {
    const admin = await requireAdmin()
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return err('Missing id query parameter', 400)
    try {
      await deleteRazorpayKey(id)
    } catch (e) {
      if (e instanceof Error && e.message === 'NOT_FOUND') return err('NOT_FOUND', 404)
      throw e
    }
    await writeAudit({ actorId: admin.id, action: 'admin_razorpay_key_delete', entityType: 'razorpay_key', entityId: id })
    return ok({ deleted: true })
  } catch (e) {
    return handleError(e)
  }
})
