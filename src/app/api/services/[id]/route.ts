import { db } from '@/lib/db'
import { ok, err, handleError, safeJsonParse, validateBody } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).max(5000).optional(),
  categoryId: z.string().nullable().optional(),
  price: z.number().int().positive().max(100000).optional(),
  deliveryDays: z.number().int().positive().max(90).optional(),
  tags: z.array(z.string()).max(10).optional(),
  skills: z.array(z.string()).max(15).optional(),
  images: z.array(z.string().url()).max(8).optional(),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).max(10).optional(),
  availability: z.enum(['available', 'paused', 'sold_out']).optional(),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const service = await db.service.findUnique({
      where: { id },
      include: {
        seller: { include: { profile: true } },
        category: true,
        packages: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { status: 'published' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { author: { include: { profile: true } } },
        },
      },
    })
    if (!service || service.deletedAt) return err('NOT_FOUND', 404)

    // increment views
    await db.service.update({ where: { id }, data: { views: { increment: 1 } } })

    const user = await getCurrentUser()
    let saved = false
    if (user) {
      const sv = await db.savedService.findUnique({
        where: { userId_serviceId: { userId: user.id, serviceId: id } },
      })
      saved = !!sv
    }

    return ok({
      service: {
        ...service,
        tags: safeJsonParse<string[]>(service.tags, []),
        skills: safeJsonParse<string[]>(service.skills, []),
        images: safeJsonParse<string[]>(service.images, []),
        faqs: safeJsonParse<any[]>(service.faqs, []),
        seller: {
          id: service.seller.id,
          username: service.seller.username,
          displayName: service.seller.profile?.displayName,
          avatarUrl: service.seller.profile?.avatarUrl,
          bio: service.seller.profile?.bio,
          isVerified: service.seller.profile?.isVerified,
          responseTimeMins: service.seller.profile?.responseTimeMins,
        },
        reviews: service.reviews.map((r) => ({
          ...r,
          images: safeJsonParse<string[]>(r.images, []),
          author: {
            id: r.author.id,
            username: r.author.username,
            avatarUrl: r.author.profile?.avatarUrl,
          },
        })),
      },
      saved,
    })
  } catch (e) {
    return handleError(e)
  }
}

// Update service (seller only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const { data, error } = await validateBody(updateSchema, req)
    if (error) return err(error, 422)

    const service = await db.service.findUnique({ where: { id } })
    if (!service) return err('NOT_FOUND', 404)
    if (service.sellerId !== user.id) return err('FORBIDDEN', 403)

    const update: any = {}
    if (data!.title !== undefined) update.title = data!.title
    if (data!.description !== undefined) update.description = data!.description
    if (data!.categoryId !== undefined) update.categoryId = data!.categoryId
    if (data!.price !== undefined) update.price = data!.price
    if (data!.deliveryDays !== undefined) update.deliveryDays = data!.deliveryDays
    if (data!.tags !== undefined) update.tags = JSON.stringify(data!.tags)
    if (data!.skills !== undefined) update.skills = JSON.stringify(data!.skills)
    if (data!.images !== undefined) update.images = JSON.stringify(data!.images)
    if (data!.faqs !== undefined) update.faqs = JSON.stringify(data!.faqs)
    if (data!.availability !== undefined) update.availability = data!.availability

    const updated = await db.service.update({ where: { id }, data: update })
    await writeAudit({ actorId: user.id, action: 'service_updated', entityType: 'service', entityId: id, after: update })

    return ok({ service: updated })
  } catch (e) {
    return handleError(e)
  }
}
