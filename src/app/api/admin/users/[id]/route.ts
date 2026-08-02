export const revalidate = 0
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  action: z.string(),
  reason: z.string().optional(),
  value: z.unknown().optional(),
})

export async function GET(req: Request, ctx: any) {
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (r: Request, c: any) => {
    try {
      const admin = await requireAdmin()
      const { id } = await (c?.params || ctx?.params)
      const user = await db.user.findUnique({
        where: { id },
        include: {
          profile: true,
          wallet: { include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } } },
          sessions: { orderBy: { createdAt: 'desc' }, take: 20 },
          devices: { orderBy: { lastSeenAt: 'desc' }, take: 20 },
        },
      })
      if (!user) return err('NOT_FOUND', 404)
      await writeAudit({ actorId: admin.id, action: 'admin_view_user', entityType: 'user', entityId: id })
      const { passwordHash, twoFactorSecret, transactionPinHash, ...safeUser } = user
      return ok({ user: safeUser })
    } catch (e) {
      return handleError(e)
    }
  })(req, ctx)
}

export async function PATCH(req: Request, ctx: any) {
  return adminLimit(async (r: Request, c: any) => {
    try {
      const admin = await requireAdmin()
      const { id } = await (c?.params || ctx?.params)
      const ct = requireJson(r); if (ct) return ct
      const { data, error } = await validateBody(schema, r)
      if (error) return err(error, 422)
      const { action, reason, value } = data!

      const ALLOWED = ['suspend', 'activate', 'ban', 'verify', 'unverify', 'reset_pin', 'make_admin', 'remove_admin', 'set_commission']
      if (!ALLOWED.includes(action)) return err('UNKNOWN_ACTION', 400)

      const user = await db.user.findUnique({ where: { id } })
      if (!user) return err('NOT_FOUND', 404)

      const before = { status: user.status, role: user.role }
      let update: any = {}
      if (action === 'suspend') update.status = 'suspended'
      if (action === 'activate') update.status = 'active'
      if (action === 'ban') update.status = 'banned'
      if (action === 'reset_pin') update.transactionPinHash = null
      if (action === 'make_admin') update.role = 'admin'
      if (action === 'remove_admin') update.role = 'user'
      if (action === 'set_commission') {
        const rate = value as number
        if (typeof rate !== 'number' || isNaN(rate) || rate < 0 || rate > 95) {
          return err('INVALID_COMMISSION_RATE', 400)
        }
        update.commissionRate = rate
      }

      if (action === 'verify' || action === 'unverify') {
        await db.profile.update({ where: { userId: id }, data: { isVerified: action === 'verify', verificationType: action === 'verify' ? 'identity' : null } })
      } else {
        await db.user.update({ where: { id }, data: update })
      }

      await writeAudit({
        actorId: admin.id,
        action: `admin_${action}`,
        entityType: 'user',
        entityId: id,
        before,
        after: update,
        reason,
      })

      return ok({ success: true })
    } catch (e) {
      return handleError(e)
    }
  })(req, ctx)
}
