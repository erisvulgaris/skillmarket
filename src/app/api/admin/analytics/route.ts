import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError, formatSC } from '@/lib/api'

export async function GET() {
  try {
    await requireAdmin()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)
    const yesterday = new Date(now.getTime() - 86400000)

    const [
      totalUsers,
      newUsers30d,
      newUsers7d,
      activeUsers7d,
      totalServices,
      activeServices,
      totalOrders,
      completedOrders,
      pendingOrders,
      disputedOrders,
      totalReviews,
      totalTransfers,
      totalCreditPurchases,
      totalRevenue,
      openDisputes,
      openReports,
      openTickets,
      frozenWallets,
      totalCreditsInCirculation,
      platformEscrow,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
      db.session.count({ where: { createdAt: { gte: sevenDaysAgo }, revokedAt: null } }),
      db.service.count({ where: { deletedAt: null } }),
      db.service.count({ where: { status: 'active', deletedAt: null } }),
      db.order.count(),
      db.order.count({ where: { status: 'completed' } }),
      db.order.count({ where: { status: 'pending' } }),
      db.order.count({ where: { status: 'disputed' } }),
      db.review.count(),
      db.transfer.count(),
      db.creditPurchase.count({ where: { status: 'succeeded' } }),
      db.creditPurchase.aggregate({ _sum: { amountFiat: true }, where: { status: 'succeeded' } }),
      db.dispute.count({ where: { status: 'open' } }),
      db.report.count({ where: { status: 'open' } }),
      db.supportTicket.count({ where: { status: 'open' } }),
      db.wallet.count({ where: { frozen: true } }),
      db.wallet.aggregate({ _sum: { availableBalance: true } }),
      db.wallet.aggregate({ _sum: { reservedBalance: true } }),
    ])

    // Daily user signups (30 days)
    const users30d = await db.user.findMany({
      where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    })
    const dailySignups: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      dailySignups[d.toISOString().slice(0, 10)] = 0
    }
    for (const u of users30d) {
      const key = u.createdAt.toISOString().slice(0, 10)
      if (key in dailySignups) dailySignups[key]++
    }
    const signupChart = Object.entries(dailySignups).map(([date, count]) => ({ date, count }))

    // Daily revenue (30 days) — from completed orders
    const completedOrders30d = await db.order.findMany({
      where: { status: 'completed', completedAt: { gte: thirtyDaysAgo } },
      select: { price: true, completedAt: true },
    })
    const dailyRevenue: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      dailyRevenue[d.toISOString().slice(0, 10)] = 0
    }
    for (const o of completedOrders30d) {
      const key = o.completedAt?.toISOString().slice(0, 10)
      if (key && key in dailyRevenue) dailyRevenue[key] += o.price
    }
    const revenueChart = Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue }))

    // Daily transfers (30 days)
    const transfers30d = await db.transfer.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
    })
    const dailyTransfers: Record<string, { count: number; volume: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000)
      dailyTransfers[d.toISOString().slice(0, 10)] = { count: 0, volume: 0 }
    }
    for (const t of transfers30d) {
      const key = t.createdAt.toISOString().slice(0, 10)
      if (key in dailyTransfers) {
        dailyTransfers[key].count++
        dailyTransfers[key].volume += t.amount
      }
    }
    const transferChart = Object.entries(dailyTransfers).map(([date, v]) => ({ date, ...v }))

    // Order status distribution
    const orderStatuses = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
    })
    const orderDistribution = orderStatuses.map((s) => ({ status: s.status, count: s._count.status }))

    // Top services by views
    const topServices = await db.service.findMany({
      where: { deletedAt: null },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, price: true, views: true, completedOrders: true, ratingAvg: true },
    })

    // Top sellers by earnings
    const topSellers = await db.user.findMany({
      where: { role: 'user', deletedAt: null },
      include: { wallet: { select: { lifetimeEarned: true } }, profile: { select: { displayName: true, avatarUrl: true, isVerified: true } } },
      take: 20,
    })
    const topSellersSorted = topSellers
      .filter((u) => u.wallet && u.wallet.lifetimeEarned > 0)
      .sort((a, b) => (b.wallet?.lifetimeEarned || 0) - (a.wallet?.lifetimeEarned || 0))
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.profile?.displayName,
        avatarUrl: u.profile?.avatarUrl,
        isVerified: u.profile?.isVerified,
        lifetimeEarned: u.wallet?.lifetimeEarned || 0,
      }))

    // Credit purchase volume (30 days)
    const purchases30d = await db.creditPurchase.findMany({
      where: { status: 'succeeded', createdAt: { gte: thirtyDaysAgo } },
      select: { amountCredits: true, amountFiat: true, createdAt: true },
    })
    const purchaseVolume = purchases30d.reduce((s, p) => s + p.amountCredits, 0)
    const fiatVolume = purchases30d.reduce((s, p) => s + p.amountFiat, 0)

    // Category distribution
    const categories = await db.service.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null },
      _count: { categoryId: true },
    })
    const categoryNames = await db.category.findMany({ select: { id: true, name: true, icon: true } })
    const categoryMap = new Map(categoryNames.map((c) => [c.id, c]))
    const categoryDistribution = categories
      .map((c) => ({
        name: categoryMap.get(c.categoryId)?.name || 'Uncategorized',
        icon: categoryMap.get(c.categoryId)?.icon || '📁',
        count: c._count.categoryId,
      }))
      .sort((a, b) => b.count - a.count)

    return ok({
      kpis: {
        totalUsers,
        newUsers30d,
        newUsers7d,
        activeUsers7d,
        totalServices,
        activeServices,
        totalOrders,
        completedOrders,
        pendingOrders,
        disputedOrders,
        totalReviews,
        totalTransfers,
        totalCreditPurchases,
        totalRevenue: totalRevenue._sum.amountFiat || 0,
        openDisputes,
        openReports,
        openTickets,
        frozenWallets,
        totalCreditsInCirculation: totalCreditsInCirculation._sum.availableBalance || 0,
        platformEscrow: platformEscrow._sum.reservedBalance || 0,
        purchaseVolume30d: purchaseVolume,
        fiatVolume30d: Math.round(fiatVolume * 100) / 100,
      },
      charts: {
        signupChart,
        revenueChart,
        transferChart,
        orderDistribution,
        categoryDistribution,
      },
      topServices,
      topSellers: topSellersSorted,
    })
  } catch (e) {
    return handleError(e)
  }
}
