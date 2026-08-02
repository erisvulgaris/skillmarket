import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { isBuildOrWorker, ok, err, handleError, validateBody } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { listRazorpayKeys, saveRazorpayKey, deleteRazorpayKey } from '@/lib/razorpay'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async () => {
  try {
    await requireAdmin()
    const keys = await listRazorpayKeys()
    const masked = keys.map((k: any) => ({
      id: k.id,
      label: k.label || 'Default Live Key',
      keyId: k.keyId,
      active: k.isActive ?? k.active,
      createdAt: k.createdAt || new Date().toISOString(),
    }))
    return ok({ keys: masked })
  } catch (e) {
    return handleError(e)
  }
  })()
}

const postSchema = z.object({
  label: z.string().optional(),
  keyId: z.string(),
  keySecret: z.string(),
  active: z.boolean().optional(),
})

export async function POST(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (req: Request) => {
  try {
    const admin = await requireAdmin()
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(postSchema, req)
    if (error) return err(error, 422)
    const key = await saveRazorpayKey({ keyId: data!.keyId, keySecret: data!.keySecret })
    await writeAudit({ actorId: admin.id, action: 'admin_razorpay_key_create', entityType: 'razorpay_key', entityId: key.id, after: { keyId: key.keyId } })
    return ok({ key: { id: key.id, label: 'Default Live Key', keyId: key.keyId, active: key.isActive, createdAt: new Date().toISOString() } })
  } catch (e) {
    return handleError(e)
  }
  })(req as Request)
}

export async function DELETE(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (req: Request) => {
  try {
    const admin = await requireAdmin()
    const _u = req.url || 'http://localhost'
    const url = _u.startsWith('http') ? new URL(_u) : new URL(_u, 'http://localhost')
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
  })(req as Request)
}