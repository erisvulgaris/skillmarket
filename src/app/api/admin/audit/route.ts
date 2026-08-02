import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, parsePagination } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'

export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) {
    return NextResponse.json({ success: true, data: { items: [], total: 0 } })
  }
  return adminLimit(async (r: Request) => {
    try {
      await requireAdmin()
      const { skip, limit, page } = parsePagination(r)
      const urlStr = r?.url || 'http://localhost'
      const url = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, 'http://localhost')
      const action = url.searchParams.get('action')

      const where: any = {}
      if (action) where.action = { contains: action }

      const [items, total] = await Promise.all([
        db.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: { actor: { select: { username: true } } },
        }),
        db.auditLog.count({ where }),
      ])

      return ok({ items, total, page, limit })
    } catch (e) {
      return handleError(e)
    }
  })(req)
}
