export const dynamic = 'force-dynamic'
export const revalidate = 0
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { adminLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(2),
  body: z.string(),
  published: z.boolean().default(true),
})

export async function GET(req: Request, ctx: any) {
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return adminLimit(async (r: Request, c: any) => {
    try {
      const { slug } = await (c?.params || ctx?.params)
      const page = await db.cmsPage.findUnique({ where: { slug } })
      if (!page) return err('NOT_FOUND', 404)
      return ok({ page })
    } catch (e) {
      return handleError(e)
    }
  })(req, ctx)
}

export async function PUT(req: Request, ctx: any) {
  return adminLimit(async (r: Request, c: any) => {
    try {
      await requireAdmin()
      const jsonErr = requireJson(r)
      if (jsonErr) return jsonErr
      const { slug } = await (c?.params || ctx?.params)
      const { data, error } = await validateBody(schema, r)
      if (error) return err(error, 422)

      const page = await db.cmsPage.upsert({
        where: { slug },
        create: { slug, title: data!.title, body: data!.body, published: data!.published },
        update: { title: data!.title, body: data!.body, published: data!.published },
      })
      return ok({ page })
    } catch (e) {
      return handleError(e)
    }
  })(req, ctx)
}
