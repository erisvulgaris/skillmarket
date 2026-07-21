import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { adminAdjust } from '@/lib/wallet'
import { writeAudit } from '@/lib/audit'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
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
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { action } = body as { action: string }
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
}
