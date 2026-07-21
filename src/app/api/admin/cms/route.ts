import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    await requireAdmin()
    const pages = await db.cmsPage.findMany({ orderBy: { slug: 'asc' } })
    return ok({ pages })
  } catch (e) {
    return handleError(e)
  }
}
