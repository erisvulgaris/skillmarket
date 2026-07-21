import { db } from '@/lib/db'
import { ok, handleError, parsePagination, safeJsonParse } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const { skip, limit, page } = parsePagination(req)
    const url = new URL(req.url)
    const categoryId = url.searchParams.get('categoryId')
    const sort = url.searchParams.get('sort') || 'newest' // newest | popular | trending | price_low | price_high | rating
    const minPrice = url.searchParams.get('minPrice')
    const maxPrice = url.searchParams.get('maxPrice')
    const deliveryDays = url.searchParams.get('deliveryDays')
    const tag = url.searchParams.get('tag')

    const where: any = { status: 'active', deletedAt: null }
    if (categoryId) where.categoryId = categoryId
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number(minPrice)
      if (maxPrice) where.price.lte = Number(maxPrice)
    }
    if (deliveryDays) where.deliveryDays = { lte: Number(deliveryDays) }
    if (tag) where.tags = { contains: tag }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'popular') orderBy = { views: 'desc' }
    if (sort === 'trending') orderBy = { trendingScore: 'desc' }
    if (sort === 'price_low') orderBy = { price: 'asc' }
    if (sort === 'price_high') orderBy = { price: 'desc' }
    if (sort === 'rating') orderBy = { ratingAvg: 'desc' }

    const [items, total] = await Promise.all([
      db.service.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          seller: { include: { profile: true } },
          category: true,
        },
      }),
      db.service.count({ where }),
    ])

    const mapped = items.map((s) => ({
      ...s,
      tags: safeJsonParse<string[]>(s.tags, []),
      skills: safeJsonParse<string[]>(s.skills, []),
      images: safeJsonParse<string[]>(s.images, []),
      faqs: safeJsonParse<any[]>(s.faqs, []),
      seller: {
        id: s.seller.id,
        username: s.seller.username,
        displayName: s.seller.profile?.displayName,
        avatarUrl: s.seller.profile?.avatarUrl,
        isVerified: s.seller.profile?.isVerified,
      },
    }))

    return ok({ items: mapped, total, page, limit })
  } catch (e) {
    return handleError(e)
  }
}
