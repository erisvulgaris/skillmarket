import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'
import { writeAudit } from '@/lib/audit'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
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
    return ok({ user })
  } catch (e) {
    return handleError(e)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { action, reason } = body as { action: string; reason?: string }
    // action: suspend | activate | ban | verify | unverify | reset_pin | make_admin | remove_admin

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
}
