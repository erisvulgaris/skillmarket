import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    await requireAdmin()
    const [
      totalUsers,
      newUsers7d,
      activeWallets,
      totalCreditsSold,
      transfers24h,
      ordersTotal,
      ordersPending,
      ordersCompleted,
      reviewsTotal,
      disputesOpen,
      reportsOpen,
      fraudAlerts,
      supportTickets,
      activeServices,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      db.wallet.count(),
      db.wallet.aggregate({ _sum: { lifetimePurchased: true } }),
      db.transfer.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
      db.order.count(),
      db.order.count({ where: { status: 'pending' } }),
      db.order.count({ where: { status: 'completed' } }),
      db.review.count(),
      db.dispute.count({ where: { status: 'open' } }),
      db.report.count({ where: { status: 'open' } }),
      db.report.count({ where: { status: 'open', targetType: 'user' } }),
      db.supportTicket.count({ where: { status: 'open' } }),
      db.service.count({ where: { status: 'active', deletedAt: null } }),
    ])

    const walletBalances = await db.wallet.aggregate({
      _sum: { availableBalance: true, reservedBalance: true },
    })

    // daily transfers for last 14 days
    const since = new Date(Date.now() - 14 * 86400000)
    const transfers = await db.transfer.findMany({
      where: { createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
    })
    const dailyMap: Record<string, { count: number; volume: number }> = {}
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      dailyMap[key] = { count: 0, volume: 0 }
    }
    for (const t of transfers) {
      const key = t.createdAt.toISOString().slice(0, 10)
      if (dailyMap[key]) {
        dailyMap[key].count += 1
        dailyMap[key].volume += t.amount
      }
    }
    const dailyTransfers = Object.entries(dailyMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    // recent activity (audit log)
    const recentActivity = await db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actor: { select: { username: true } } },
    })

    return ok({
      stats: {
        totalUsers,
        newUsers7d,
        activeWallets,
        totalCreditsSold: totalCreditsSold._sum.lifetimePurchased || 0,
        transfers24h,
        ordersTotal,
        ordersPending,
        ordersCompleted,
        reviewsTotal,
        disputesOpen,
        reportsOpen,
        fraudAlerts,
        supportTickets,
        activeServices,
        walletAvailable: walletBalances._sum.availableBalance || 0,
        walletReserved: walletBalances._sum.reservedBalance || 0,
      },
      dailyTransfers,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        actor: a.actor?.username || 'system',
        createdAt: a.createdAt,
      })),
    })
  } catch (e) {
    return handleError(e)
  }
}
