import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError, parsePagination } from '@/lib/api'

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { skip, limit, page } = parsePagination(req)
    const url = new URL(req.url)
    const search = url.searchParams.get('search')
    const frozen = url.searchParams.get('frozen')

    const where: any = {}
    if (frozen === 'true') where.frozen = true
    if (search) {
      const users = await db.user.findMany({
        where: { OR: [{ username: { contains: search } }, { email: { contains: search } }] },
        select: { id: true },
      })
      where.userId = { in: users.map((u) => u.id) }
    }

    const [items, total] = await Promise.all([
      db.wallet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { include: { profile: true } } },
      }),
      db.wallet.count({ where }),
    ])

    return ok({ items, total, page, limit })
  } catch (e) {
    return handleError(e)
  }
}
