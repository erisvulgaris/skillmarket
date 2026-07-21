import { db } from '@/lib/db'
import { ok, err, handleError, safeJsonParse } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const service = await db.service.findUnique({
      where: { id },
      include: {
        seller: { include: { profile: true } },
        category: true,
        reviews: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { author: { include: { profile: true } } },
        },
      },
    })
    if (!service || service.deletedAt) return err('NOT_FOUND', 404)

    // increment views
    await db.service.update({ where: { id }, data: { views: { increment: 1 } } })

    const user = await getCurrentUser()
    let saved = false
    if (user) {
      const sv = await db.savedService.findUnique({
        where: { userId_serviceId: { userId: user.id, serviceId: id } },
      })
      saved = !!sv
    }

    return ok({
      service: {
        ...service,
        tags: safeJsonParse<string[]>(service.tags, []),
        skills: safeJsonParse<string[]>(service.skills, []),
        images: safeJsonParse<string[]>(service.images, []),
        faqs: safeJsonParse<any[]>(service.faqs, []),
        seller: {
          id: service.seller.id,
          username: service.seller.username,
          displayName: service.seller.profile?.displayName,
          avatarUrl: service.seller.profile?.avatarUrl,
          bio: service.seller.profile?.bio,
          isVerified: service.seller.profile?.isVerified,
          responseTimeMins: service.seller.profile?.responseTimeMins,
        },
        reviews: service.reviews.map((r) => ({
          ...r,
          images: safeJsonParse<string[]>(r.images, []),
          author: {
            id: r.author.id,
            username: r.author.username,
            avatarUrl: r.author.profile?.avatarUrl,
          },
        })),
      },
      saved,
    })
  } catch (e) {
    return handleError(e)
  }
}
