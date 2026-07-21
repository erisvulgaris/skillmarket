import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError, parsePagination } from '@/lib/api'

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { skip, limit, page } = parsePagination(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const where: any = { deletedAt: null }
    if (status) where.status = status

    const [items, total] = await Promise.all([
      db.service.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { seller: { include: { profile: true } }, category: true },
      }),
      db.service.count({ where }),
    ])

    return ok({ items, total, page, limit })
  } catch (e) {
    return handleError(e)
  }
}
