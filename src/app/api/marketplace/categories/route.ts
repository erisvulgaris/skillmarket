import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { ensureTelegramServicesSeeded } from '@/lib/auto-seed'

export async function GET() {
  try {
    await ensureTelegramServicesSeeded()
    const cats = await db.category.findMany({
      where: { parentId: null, enabled: true },
      orderBy: { sortOrder: 'asc' },
      include: { children: { where: { enabled: true }, orderBy: { sortOrder: 'asc' } } },
    })
    const res = ok({ categories: cats })
    res.headers.set('Cache-Control', 'no-cache')
    return res
  } catch (e) {
    return handleError(e)
  }
}
