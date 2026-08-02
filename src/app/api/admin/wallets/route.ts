import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, handleError, parsePagination } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'

export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (req: Request) => {
  try {
    await requireAdmin()
    const { skip, limit, page } = parsePagination(req)
    const _u = req.url || 'http://localhost'
    const url = _u.startsWith('http') ? new URL(_u) : new URL(_u, 'http://localhost')
    const search = url.searchParams.get('search')
    const frozen = url.searchParams.get('frozen')

    const where: any = {}
    if (frozen === 'true') where.frozen = true
    if (search) {
      const users = await db.user.findMany({
        where: { OR: [{ username: { contains: search } }, { email: { contains: search } }] },
        select: { id: true },
      })
      const userIds = users.map((u: { id: string }) => u.id)
      if (userIds.length === 0) {
        // No matching users — return empty results
        where.userId = '__no_match__'
      } else {
        where.userId = { in: userIds }
      }
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
  })(req as Request)
}