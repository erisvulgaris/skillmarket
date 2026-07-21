import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, parsePagination } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const wallet = user.wallet
    if (!wallet) return err('WALLET_NOT_FOUND', 404)

    const { skip, limit, page } = parsePagination(req)
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const search = url.searchParams.get('search')

    const where: any = { walletId: wallet.id }
    if (type) where.type = type
    if (search) where.note = { contains: search }

    const [items, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.walletTransaction.count({ where }),
    ])

    return ok({ items, total, page, limit })
  } catch (e) {
    return handleError(e)
  }
}
