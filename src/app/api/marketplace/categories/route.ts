import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { ensureTelegramServicesSeeded } from '@/lib/auto-seed'

export const dynamic = 'force-dynamic'

let cachedCategories: any = null
let lastFetchTime = 0
const CACHE_TTL_MS = 15000 // 15 seconds in-memory cache

export function clearCategoryCache() {
  cachedCategories = null
  lastFetchTime = 0
}

export async function GET() {
  try {
    const now = Date.now()
    if (cachedCategories && (now - lastFetchTime < CACHE_TTL_MS)) {
      const res = ok({ categories: cachedCategories })
      res.headers.set('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60')
      return res
    }

    await ensureTelegramServicesSeeded()
    const cats = await db.category.findMany({
      where: { parentId: null, enabled: true },
      orderBy: { sortOrder: 'asc' },
      include: { children: { where: { enabled: true }, orderBy: { sortOrder: 'asc' } } },
    })

    cachedCategories = cats
    lastFetchTime = now

    const res = ok({ categories: cats })
    res.headers.set('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60')
    return res
  } catch (e) {
    if (cachedCategories) {
      const res = ok({ categories: cachedCategories })
      res.headers.set('Cache-Control', 'public, max-age=5')
      return res
    }
    return handleError(e)
  }
}
