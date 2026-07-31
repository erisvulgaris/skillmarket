import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return err('UNAUTHORIZED', 401)
    }

    const categories = await db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { services: true } },
      },
    })

    return ok({ categories })
  } catch (e) {
    return handleError(e)
  }
}
