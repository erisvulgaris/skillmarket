import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)

    const sellerId = user.id

    const [
      totalServices,
      activeServices,
      totalOrders,
      completedOrders,
      pendingOrders,
      totalEarnings,
      totalViews,
      avgRating,
      reviewCount,
      repeatCustomers,
      recentOrders,
    ] = await Promise.all([
      db.service.count({ where: { sellerId } }),
      db.service.count({ where: { sellerId, status: 'active', deletedAt: null } }),
      db.order.count({ where: { sellerId } }),
      db.order.count({ where: { sellerId, status: 'completed' } }),
      db.order.count({ where: { sellerId, status: 'pending' } }),
      db.wallet.findUnique({ where: { userId: sellerId }, select: { lifetimeEarned: true } }),
      db.service.aggregate({ where: { sellerId }, _sum: { views: true } }),
      db.service.aggregate({ where: { sellerId }, _avg: { ratingAvg: true }, _count: { ratingCount: true } }),
      db.review.count({ where: { targetId: sellerId, status: 'published' } }),
      db.order.groupBy({
        by: ['buyerId'],
        where: { sellerId, status: 'completed' },
        having: { buyerId: { _count: { gt: 1 } } },
      }),
      db.order.findMany({
        where: { sellerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { service: { select: { title: true } }, buyer: { select: { username: true } } },
      }),
    ])

    // Daily earnings for last 14 days
    const since = new Date(Date.now() - 14 * 86400000)
    const completedOrdersWithDate = await db.order.findMany({
      where: { sellerId, status: 'completed', completedAt: { gte: since } },
      select: { price: true, completedAt: true },
    })
    const dailyEarnings: Record<string, number> = {}
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() - i * 86400000)
      dailyEarnings[d.toISOString().slice(0, 10)] = 0
    }
    for (const o of completedOrdersWithDate) {
      const key = o.completedAt?.toISOString().slice(0, 10)
      if (key && key in dailyEarnings) dailyEarnings[key] += o.price
    }
    const dailyEarningsArray = Object.entries(dailyEarnings)
      .map(([date, earnings]) => ({ date, earnings }))
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    return ok({
      stats: {
        totalServices,
        activeServices,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalEarnings: totalEarnings?.lifetimeEarned || 0,
        totalViews: totalViews._sum.views || 0,
        avgRating: avgRating._avg.ratingAvg || 0,
        reviewCount,
        repeatCustomers: repeatCustomers.length,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      dailyEarnings: dailyEarningsArray,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        status: o.status,
        price: o.price,
        createdAt: o.createdAt,
        serviceTitle: o.service.title,
        buyerUsername: o.buyer.username,
      })),
    })
  } catch (e) {
    return handleError(e)
  }
}
