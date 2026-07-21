import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError, parsePagination } from '@/lib/api'

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { skip, limit, page } = parsePagination(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const [items, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { include: { profile: true } } },
      }),
      db.supportTicket.count({ where }),
    ])

    return ok({
      items: items.map((t) => ({
        ...t,
        user: {
          id: t.user.id,
          username: t.user.username,
          avatarUrl: t.user.profile?.avatarUrl,
        },
      })),
      total, page, limit,
    })
  } catch (e) {
    return handleError(e)
  }
}
