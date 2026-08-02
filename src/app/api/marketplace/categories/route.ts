import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, handleError } from '@/lib/api'
import { ensureTelegramServicesSeeded } from '@/lib/auto-seed'
import { clearCategoryCache as clearCache } from '@/lib/cache'

export const dynamic = 'force-dynamic'

let cachedCategories: any = null
let lastFetchTime = 0
const CACHE_TTL_MS = 15000 // 15 seconds in-memory cache

export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  try {
    const now = Date.now()
    if (cachedCategories && (now - lastFetchTime < CACHE_TTL_MS)) {
      const res = ok({ categories: cachedCategories })
      res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
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
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
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