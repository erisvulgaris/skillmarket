import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { isBuildOrWorker, ok, err, handleError } from '@/lib/api'

export async function GET(req?: Request, context?: { params: Promise<{ slug: string }> }) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  try {
    const params = await context?.params
    const slug = params?.slug
    if (!slug) return err('INVALID_SLUG', 400)

    const paymentLink = await db.paymentLink.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
                bio: true,
                isVerified: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            images: true,
          },
        },
      },
    })

    if (!paymentLink || !paymentLink.active) {
      return err('PAYMENT_LINK_NOT_FOUND', 404)
    }

    if (paymentLink.usageLimit && paymentLink.usesCount >= paymentLink.usageLimit) {
      return err('PAYMENT_LINK_EXPIRED', 400)
    }

    return ok({ link: paymentLink })
  } catch (e) {
    return handleError(e)
  }
}
