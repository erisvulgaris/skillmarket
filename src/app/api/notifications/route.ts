import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, parsePagination } from '@/lib/api'

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { skip, limit } = parsePagination(req)
    const items = await db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
    const unread = await db.notification.count({
      where: { userId: user.id, readAt: null },
    })
    return ok({ items, unread })
  } catch (e) {
    return handleError(e)
  }
}
