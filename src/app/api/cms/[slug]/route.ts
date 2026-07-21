import { db } from '@/lib/db'
import { ok, err, handleError } from '@/lib/api'

// Public CMS page endpoint — no auth required
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const page = await db.cmsPage.findUnique({ where: { slug } })
    if (!page || !page.published) return err('NOT_FOUND', 404)
    return ok({ page })
  } catch (e) {
    return handleError(e)
  }
}
