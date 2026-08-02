import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError, parsePagination } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'

export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (req: Request) => {
  try {
    await requireAdmin()
    const { skip, limit, page } = parsePagination(req)
    const _u = req.url || 'http://localhost'
    const url = _u.startsWith('http') ? new URL(_u) : new URL(_u, 'http://localhost')
    const status = url.searchParams.get('status')
    const where: any = {}
    if (status) where.status = status
    const [items, total] = await Promise.all([
      db.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        include: { order: { include: { service: true } }, claimant: { select: { username: true } }, respondent: { select: { username: true } } },
      }),
      db.dispute.count({ where }),
    ])
    return ok({ items, total, page, limit })
  } catch (e) {
    return handleError(e)
  }
  })(req as Request)
}