import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(2),
  body: z.string(),
  published: z.boolean().default(true),
})

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

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin()
    const { slug } = await params
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)
    const page = await db.cmsPage.upsert({
      where: { slug },
      create: { slug, ...data! },
      update: { ...data! },
    })
    return ok({ page })
  } catch (e) {
    return handleError(e)
  }
}
