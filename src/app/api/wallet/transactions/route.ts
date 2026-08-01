export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, parsePagination } from '@/lib/api'
import { setCors } from '@/lib/cors'
import { apiLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const querySchema = z.object({
  type: z.string().optional(),
  search: z.string().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  cursor: z.string().optional(),
  take: z.coerce.number().optional(),
})

function withCors<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const res = await handler(...args)
    if (res instanceof Response) Object.entries(setCors()).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }) as T
}

export const GET = withCors(apiLimit(async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const wallet = user.wallet
    if (!wallet) return err('WALLET_NOT_FOUND', 404)

    const url = new URL(req.url)
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))
    if (!parsed.success) return err('Invalid query parameters: ' + parsed.error.issues.map(i => i.path.join('.') + ': ' + i.message).join('; '), 422)

    const { skip, limit, page } = parsePagination(req)
    const { type, search, cursor, take: takeParam } = parsed.data
    const effectiveTake = takeParam || limit

    const where: any = { walletId: wallet.id }
    if (type) where.type = type
    if (search) where.note = { contains: search }
    // Wire up date range filters (CHANGELOG 036)
    if (parsed.data.from || parsed.data.to) {
      where.createdAt = {}
      if (parsed.data.from) where.createdAt.gte = new Date(parsed.data.from)
      if (parsed.data.to) where.createdAt.lte = new Date(parsed.data.to)
    }

    if (cursor) {
      const items = await db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: effectiveTake + 1,
        skip: 1,
        cursor: { id: cursor },
      })
      const hasMore = items.length > effectiveTake
      if (hasMore) items.pop()
      return ok({ items, total: items.length, page, limit: effectiveTake, cursor, hasMore })
    }

    const [items, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: effectiveTake,
      }),
      db.walletTransaction.count({ where }),
    ])

    return ok({ items, total, page, limit: effectiveTake, cursor: null, hasMore: skip + effectiveTake < total })
  } catch (e) {
    return handleError(e)
  }
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}
