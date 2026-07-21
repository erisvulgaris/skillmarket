import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    const cats = await db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: { children: { orderBy: { sortOrder: 'asc' } } },
    })
    return ok({ categories: cats })
  } catch (e) {
    return handleError(e)
  }
}
