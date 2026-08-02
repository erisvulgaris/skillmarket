import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({
  entity: z.enum(['user', 'service']),
  ids: z.array(z.string()).min(1).max(100),
  action: z.enum(['suspend', 'activate', 'set_role', 'set_commission', 'flag', 'remove', 'restore', 'toggle_featured']),
  value: z.unknown().optional(),
})

export const POST = adminLimit(async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const { entity, ids, action, value } = data!

    const results: { id: string; success: boolean; error?: string }[] = []

    if (entity === 'user') {
      for (const id of ids) {
        try {
          if (id === admin.id) {
            results.push({ id, success: false, error: 'CANNOT_MODIFY_SELF' })
            continue
          }
          const user = await db.user.findUnique({ where: { id } })
          if (!user) {
            results.push({ id, success: false, error: 'NOT_FOUND' })
            continue
          }

          if (action === 'suspend') {
            await db.user.update({ where: { id }, data: { status: 'suspended' } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_suspend', entityType: 'user', entityId: id, before: { status: user.status }, after: { status: 'suspended' } })
          } else if (action === 'activate') {
            await db.user.update({ where: { id }, data: { status: 'active' } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_activate', entityType: 'user', entityId: id, before: { status: user.status }, after: { status: 'active' } })
          } else if (action === 'set_role') {
            const role = value as string
            if (!['user', 'admin'].includes(role)) {
              results.push({ id, success: false, error: 'INVALID_ROLE' })
              continue
            }
            await db.user.update({ where: { id }, data: { role } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_set_role', entityType: 'user', entityId: id, before: { role: user.role }, after: { role } })
          } else if (action === 'set_commission') {
            const rate = value as number
            if (typeof rate !== 'number' || isNaN(rate) || rate < 0 || rate > 95) {
              results.push({ id, success: false, error: 'INVALID_COMMISSION_RATE' })
              continue
            }
            await db.user.update({ where: { id }, data: { commissionRate: rate } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_set_commission', entityType: 'user', entityId: id, before: { commissionRate: user.commissionRate }, after: { commissionRate: rate } })
          } else {
            results.push({ id, success: false, error: 'UNKNOWN_ACTION' })
            continue
          }

          results.push({ id, success: true })
        } catch (e) {
          results.push({ id, success: false, error: e instanceof Error ? e.message : 'UNKNOWN' })
        }
      }
    } else if (entity === 'service') {
      for (const id of ids) {
        try {
          const service = await db.service.findUnique({ where: { id } })
          if (!service) {
            results.push({ id, success: false, error: 'NOT_FOUND' })
            continue
          }

          if (action === 'flag') {
            await db.service.update({ where: { id }, data: { status: 'removed' } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_flag', entityType: 'service', entityId: id, before: { status: service.status }, after: { status: 'removed' } })
          } else if (action === 'remove') {
            await db.service.update({ where: { id }, data: { deletedAt: new Date() } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_remove', entityType: 'service', entityId: id, before: { deletedAt: service.deletedAt }, after: { deletedAt: new Date() } })
          } else if (action === 'restore') {
            await db.service.update({ where: { id }, data: { status: 'active', deletedAt: null } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_restore', entityType: 'service', entityId: id, before: { status: service.status, deletedAt: service.deletedAt }, after: { status: 'active', deletedAt: null } })
          } else if (action === 'toggle_featured') {
            const now = !service.featured
            await db.service.update({ where: { id }, data: { featured: now } })
            await writeAudit({ actorId: admin.id, action: 'admin_bulk_toggle_featured', entityType: 'service', entityId: id, before: { featured: service.featured }, after: { featured: now } })
          } else {
            results.push({ id, success: false, error: 'UNKNOWN_ACTION' })
            continue
          }

          results.push({ id, success: true })
        } catch (e) {
          results.push({ id, success: false, error: e instanceof Error ? e.message : 'UNKNOWN' })
        }
      }
    }

    return ok({ affected: results.filter((r) => r.success).length, results })
  } catch (e) {
    return handleError(e)
  }
})


export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
