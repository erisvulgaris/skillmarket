import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, handleError, safeJsonParse } from '@/lib/api'

export const dynamic = 'force-dynamic'

export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  try {
    const _u = req.url || 'http://localhost'
    const url = _u.startsWith('http') ? new URL(_u) : new URL(_u, 'http://localhost')
    const q = url.searchParams.get('q') || ''
    if (!q.trim()) return ok({ services: [], users: [], categories: [] })

    const [services, users, categories] = await Promise.all([
      db.service.findMany({
        where: {
          status: 'active',
          deletedAt: null,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
            { skills: { contains: q } },
          ],
        },
        take: 10,
        include: { seller: { include: { profile: true } } },
      }),
      db.user.findMany({
        where: { username: { contains: q }, status: 'active' },
        take: 5,
        include: { profile: true },
      }),
      db.category.findMany({ where: { name: { contains: q } }, take: 5 }),
    ])

    return ok({
      services: services.map((s) => ({
        id: s.id,
        title: s.title,
        price: s.price,
        images: safeJsonParse<string[]>(s.images, []),
        seller: {
          username: s.seller.username,
          avatarUrl: s.seller.profile?.avatarUrl,
          isVerified: s.seller.profile?.isVerified,
        },
      })),
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.profile?.displayName,
        avatarUrl: u.profile?.avatarUrl,
        isVerified: u.profile?.isVerified,
      })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    })
  } catch (e) {
    return handleError(e)
  }
}
