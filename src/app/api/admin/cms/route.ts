export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'

export const GET = adminLimit(async function GET() {
  try {
    await requireAdmin()
    const pages = await db.cmsPage.findMany({ orderBy: { slug: 'asc' } })
    return ok({ pages })
  } catch (e) {
    return handleError(e)
  }
})
