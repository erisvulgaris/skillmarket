import { NextResponse } from 'next/server'
export const revalidate = 0
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  status: z.string(),
  resolution: z.string().optional(),
})

export async function PATCH(req?: Request, ctx?: any) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
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
  })(req as Request, ctx as any)
}


export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}