import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isBuildOrWorker, ok, err, handleError, validateBody } from '@/lib/api'
import { apiLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const createLinkSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  amountCredits: z.number().int().min(1, 'Amount must be at least 1 SkillCredit'),
  serviceId: z.string().optional(),
  usageLimit: z.number().int().min(1).optional(),
})

export async function POST(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return apiLimit(async (req: Request) => {
    try {
      const user = await getCurrentUser()
      if (!user) return err('UNAUTHORIZED', 401)

      const { data, error } = await validateBody(createLinkSchema, req)
      if (error) return err(error, 422)

      const { title, description, amountCredits, serviceId, usageLimit } = data!
      const slug = `pl_${randomBytes(4).toString('hex')}`
      const amountFiat = Number(amountCredits) // 1 SkillCredit = ₹1

      const paymentLink = await db.paymentLink.create({
        data: {
          sellerId: user.id,
          serviceId: serviceId || null,
          title,
          description: description || null,
          amountCredits,
          amountFiat,
          slug,
          usageLimit: usageLimit || null,
        },
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
            },
          },
        },
      })

      const origin = req.headers.get('origin') || req.headers.get('host') || 'https://skillcart.shop'
      const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`
      const shareUrl = `${baseUrl}/pay/${slug}`

      return ok({ link: paymentLink, shareUrl }, 201)
    } catch (e) {
      return handleError(e)
    }
  })(req as Request)
}

export async function GET(req?: Request) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return apiLimit(async (req: Request) => {
    try {
      const user = await getCurrentUser()
      if (!user) return err('UNAUTHORIZED', 401)

      const links = await db.paymentLink.findMany({
        where: { sellerId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          service: {
            select: { id: true, title: true, slug: true, images: true },
          },
          transactions: {
            where: { status: 'completed' },
            select: { id: true, payerEmail: true, amountCredits: true, completedAt: true },
          },
        },
      })

      return ok({ links })
    } catch (e) {
      return handleError(e)
    }
  })(req as Request)
}
