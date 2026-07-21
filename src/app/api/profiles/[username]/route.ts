import { db } from '@/lib/db'
import { ok, err, handleError, safeJsonParse } from '@/lib/api'

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
    const user = await db.user.findUnique({
      where: { username },
      include: {
        profile: true,
        wallet: { select: { lifetimeEarned: true, lifetimeReceived: true } },
        services: {
          where: { status: 'active', deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        reviewsReceived: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { author: { include: { profile: true } } },
        },
      },
    })
    if (!user || user.status !== 'active') return err('NOT_FOUND', 404)

    const completedOrders = await db.order.count({
      where: { sellerId: user.id, status: 'completed' },
    })
    const repeatCustomers = await db.order.groupBy({
      by: ['buyerId'],
      where: { sellerId: user.id, status: 'completed' },
      having: { buyerId: { _count: { gt: 1 } } },
    })

    return ok({
      user: {
        id: user.id,
        username: user.username,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        profile: user.profile ? {
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          coverUrl: user.profile.coverUrl,
          location: user.profile.location,
          languages: safeJsonParse<string[]>(user.profile.languages, []),
          skills: safeJsonParse<string[]>(user.profile.skills, []),
          responseTimeMins: user.profile.responseTimeMins,
          isVerified: user.profile.isVerified,
          verificationType: user.profile.verificationType,
        } : null,
        stats: {
          completedOrders,
          repeatCustomers: repeatCustomers.length,
          activeListings: user.services.length,
          lifetimeEarned: user.wallet?.lifetimeEarned || 0,
        },
        services: user.services.map((s) => ({
          ...s,
          tags: safeJsonParse<string[]>(s.tags, []),
          skills: safeJsonParse<string[]>(s.skills, []),
          images: safeJsonParse<string[]>(s.images, []),
          faqs: safeJsonParse<any[]>(s.faqs, []),
        })),
        reviews: user.reviewsReceived.map((r) => ({
          ...r,
          images: safeJsonParse<string[]>(r.images, []),
          author: {
            id: r.author.id,
            username: r.author.username,
            avatarUrl: r.author.profile?.avatarUrl,
          },
        })),
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
