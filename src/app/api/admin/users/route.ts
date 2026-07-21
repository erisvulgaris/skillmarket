import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError, parsePagination } from '@/lib/api'

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { skip, limit, page } = parsePagination(req)
    const url = new URL(req.url)
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')
    const role = url.searchParams.get('role')

    const where: any = { deletedAt: null }
    if (search) {
      where.OR = [{ username: { contains: search } }, { email: { contains: search } }]
    }
    if (status) where.status = status
    if (role) where.role = role

    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { profile: true, wallet: true },
      }),
      db.user.count({ where }),
    ])

    return ok({
      items: items.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        isVerified: u.profile?.isVerified,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        wallet: u.wallet
          ? {
              availableBalance: u.wallet.availableBalance,
              frozen: u.wallet.frozen,
            }
          : null,
      })),
      total, page, limit,
    })
  } catch (e) {
    return handleError(e)
  }
}
