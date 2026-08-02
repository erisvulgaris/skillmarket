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
  })(req as Request)
}