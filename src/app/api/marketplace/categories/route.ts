import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    const cats = await db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: { children: { orderBy: { sortOrder: 'asc' } } },
    })
    const res = ok({ categories: cats })
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    return res
  } catch (e) {
    return handleError(e)
  }
}
