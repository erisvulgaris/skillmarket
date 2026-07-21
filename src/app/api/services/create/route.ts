import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
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

export async function POST(req: Request) {
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
}
