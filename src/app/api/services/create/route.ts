import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, err, handleError, validateBody } from '@/lib/api'
import { setCors } from '@/lib/cors'
import { apiLimit } from '@/lib/rate-limit'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(5000),
  categoryId: z.string().optional(),
  price: z.number().int().positive().max(100000),
  deliveryDays: z.number().int().positive().max(90),
  tags: z.array(z.string()).max(10).default([]),
  skills: z.array(z.string()).max(15).default([]),
  images: z.array(z.string().url()).max(8).default([]),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).max(10).default([]),
})

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

function withCors<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const res = await handler(...args)
    if (res instanceof Response) Object.entries(setCors()).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }) as T
}

export const POST = withCors(apiLimit(async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    if (user.status !== 'active') return err('Account is ' + user.status, 403)

    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const slug = `${slugify(data!.title)}-${Math.random().toString(36).slice(2, 7)}`
    const service = await db.service.create({
      data: {
        sellerId: user.id,
        categoryId: data!.categoryId,
        title: data!.title,
        slug,
        description: data!.description,
        price: data!.price,
        deliveryDays: data!.deliveryDays,
        tags: JSON.stringify(data!.tags),
        skills: JSON.stringify(data!.skills),
        images: JSON.stringify(data!.images),
        faqs: JSON.stringify(data!.faqs),
        status: 'active',
      },
    })

    await writeAudit({ actorId: user.id, action: 'service_created', entityType: 'service', entityId: service.id })
    return ok({ service }, 201)
  } catch (e) {
    return handleError(e)
  }
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}


export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}