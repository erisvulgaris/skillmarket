export const revalidate = 0
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { adminAdjust } from '@/lib/wallet'
import { writeAudit } from '@/lib/audit'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  action: z.string(),
})

export async function GET(req: Request, ctx: any) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (r: Request, c: any) => {
    try {
      const admin = await requireAdmin()
      const { id } = await (c?.params || ctx?.params)
      const wallet = await db.wallet.findUnique({
        where: { id },
        include: {
          user: { include: { profile: true } },
          transactions: { orderBy: { createdAt: 'desc' }, take: 100 },
          ledgerEntries: { orderBy: { createdAt: 'desc' }, take: 100 },
        },
      })
      if (!wallet) return err('NOT_FOUND', 404)
      await writeAudit({ actorId: admin.id, action: 'admin_view_wallet', entityType: 'wallet', entityId: id })
      return ok({ wallet })
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
      const { action } = data!
      // action: freeze | unfreeze
      if (action === 'freeze' || action === 'unfreeze') {
        const updated = await db.wallet.update({ where: { id }, data: { frozen: action === 'freeze' } })
        await writeAudit({ actorId: admin.id, action: `admin_wallet_${action}`, entityType: 'wallet', entityId: id, after: { frozen: updated.frozen } })
        return ok({ wallet: updated })
      }
      return err('Unknown action', 400)
    } catch (e) {
      return handleError(e)
    }
  })(req, ctx)
}
