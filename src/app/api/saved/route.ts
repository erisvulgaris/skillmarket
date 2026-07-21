import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, safeJsonParse } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const saved = await db.savedService.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          include: {
            seller: { include: { profile: true } },
            category: true,
          },
        },
      },
    })
    return ok({
      items: saved.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        service: {
          ...s.service,
          tags: safeJsonParse<string[]>(s.service.tags, []),
          skills: safeJsonParse<string[]>(s.service.skills, []),
          images: safeJsonParse<string[]>(s.service.images, []),
          faqs: safeJsonParse<any[]>(s.service.faqs, []),
          seller: {
            id: s.service.seller.id,
            username: s.service.seller.username,
            displayName: s.service.seller.profile?.displayName,
            avatarUrl: s.service.seller.profile?.avatarUrl,
            isVerified: s.service.seller.profile?.isVerified,
          },
        },
      })),
    })
  } catch (e) {
    return handleError(e)
  }
}
