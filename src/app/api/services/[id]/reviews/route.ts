import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody, safeJsonParse, parsePagination } from '@/lib/api'
import { z } from 'zod'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { skip, limit, page } = parsePagination(req)
    const where = { serviceId: id, status: 'published' }
    const [items, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { author: { include: { profile: true } } },
      }),
      db.review.count({ where }),
    ])
    return ok({
      items: items.map((r) => ({
        ...r,
        images: safeJsonParse<string[]>(r.images, []),
        author: {
          id: r.author.id,
          username: r.author.username,
          avatarUrl: r.author.profile?.avatarUrl,
        },
      })),
      total, page, limit,
    })
  } catch (e) {
    return handleError(e)
  }
}

const reviewSchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { id } = await params
    const { data, error } = await validateBody(reviewSchema, req)
    if (error) return err(error, 422)

    const order = await db.order.findUnique({ where: { id: data!.orderId } })
    if (!order) return err('NOT_FOUND', 404)
    if (order.buyerId !== user.id) return err('FORBIDDEN', 403)
    if (order.serviceId !== id) return err('Order does not match service', 400)
    if (order.status !== 'completed') return err('CANNOT_REVIEW', 400)

    const existing = await db.review.findFirst({ where: { orderId: order.id } })
    if (existing) return err('ALREADY_EXISTS', 409)

    const review = await db.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          orderId: order.id,
          serviceId: id,
          authorId: user.id,
          targetId: order.sellerId,
          rating: data!.rating,
          comment: data!.comment,
          images: JSON.stringify(data!.images),
        },
      })
      // recompute service rating
      const agg = await tx.review.aggregate({
        where: { serviceId: id, status: 'published' },
        _avg: { rating: true },
        _count: { rating: true },
      })
      await tx.service.update({
        where: { id },
        data: {
          ratingAvg: agg._avg.rating || 0,
          ratingCount: agg._count.rating || 0,
        },
      })
      // notify seller
      await tx.notification.create({
        data: {
          userId: order.sellerId,
          type: 'review',
          title: 'New review received',
          body: `${user.username} left a ${data!.rating}-star review on your service.`,
          data: JSON.stringify({ reviewId: r.id, serviceId: id }),
        },
      })
      return r
    })

    return ok({ review }, 201)
  } catch (e) {
    return handleError(e)
  }
}
