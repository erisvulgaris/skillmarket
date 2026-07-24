import { db } from '@/lib/db'
import { ok, err, handleError, safeJsonParse } from '@/lib/api'

// Compare multiple services side by side
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const ids = url.searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (ids.length < 2) return err('Provide at least 2 service IDs', 400)
    if (ids.length > 4) return err('Maximum 4 services to compare', 400)

    const services = await db.service.findMany({
      where: { id: { in: ids }, deletedAt: null },
      include: {
        seller: { include: { profile: true } },
        packages: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    })

    const mapped = services.map((s) => ({
      ...s,
      tags: safeJsonParse<string[]>(s.tags, []),
      skills: safeJsonParse<string[]>(s.skills, []),
      images: safeJsonParse<string[]>(s.images, []),
      faqs: safeJsonParse<any[]>(s.faqs, []),
      packages: s.packages.map((p) => ({
        ...p,
        features: safeJsonParse<string[]>(p.features, []),
      })),
      seller: {
        id: s.seller.id,
        username: s.seller.username,
        displayName: s.seller.profile?.displayName,
        avatarUrl: s.seller.profile?.avatarUrl,
        isVerified: s.seller.profile?.isVerified,
        responseTimeMins: s.seller.profile?.responseTimeMins,
      },
    }))

    return ok({ services: mapped })
  } catch (e) {
    return handleError(e)
  }
}
