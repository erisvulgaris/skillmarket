import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { createRazorpayOrder, RAZORPAY_KEY_ID } from '@/lib/razorpay'
import { isBuildOrWorker, ok, err, handleError, parseJsonBody, validateBody } from '@/lib/api'
import { hashPassword, hashPin, generateReferralCode, createSession, setSessionCookie } from '@/lib/auth'
import { apiLimit } from '@/lib/rate-limit'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  customAmountCredits: z.number().int().min(1).optional(),
})

export async function POST(req?: Request, context?: { params: Promise<{ slug: string }> }) {
  if (isBuildOrWorker(req)) return NextResponse.json({ success: true, data: {} })
  return apiLimit(async (req: Request) => {
    try {
      const params = await context?.params
      const slug = params?.slug
      if (!slug) return err('INVALID_SLUG', 400)

      const { data, error } = await validateBody(checkoutSchema, req)
      if (error) return err(error, 422)

      const { email, customAmountCredits } = data!

      const paymentLink = await db.paymentLink.findUnique({
        where: { slug },
        include: { seller: true },
      })

      if (!paymentLink || !paymentLink.active) {
        return err('PAYMENT_LINK_NOT_FOUND', 404)
      }

      if (paymentLink.usageLimit && paymentLink.usesCount >= paymentLink.usageLimit) {
        return err('PAYMENT_LINK_EXPIRED', 400)
      }

      // Determine final credits amount (manual custom amount if permitted or default link amount)
      const finalCredits = customAmountCredits && customAmountCredits > 0 ? customAmountCredits : paymentLink.amountCredits
      const finalFiat = finalCredits // 1 SC = ₹1

      // 1. Auto-create or find payer user in background for zero-friction access
      let user = await db.user.findUnique({ where: { email } })
      if (!user) {
        const baseName = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 15) || 'payer'
        const suffix = randomBytes(2).toString('hex')
        const username = `${baseName}_${suffix}`
        const autoPassword = randomBytes(12).toString('hex')
        const passwordHash = await hashPassword(autoPassword)
        const pinHash = await hashPin('1234')
        const referralCode = generateReferralCode(username)

        user = await db.$transaction(async (tx: any) => {
          const u = await tx.user.create({
            data: {
              email,
              username,
              passwordHash,
              transactionPinHash: pinHash,
              referralCode,
              emailVerifiedAt: new Date(),
            },
          })
          await tx.profile.create({
            data: {
              userId: u.id,
              displayName: baseName,
              languages: '["English"]',
              skills: '[]',
            },
          })
          await tx.wallet.create({ data: { userId: u.id, availableBalance: 0 } })
          return u
        })
      }

      // Auto-set session cookie so payer is seamlessly authenticated
      try {
        const { jwt, expiresAt } = await createSession(user!.id)
        await setSessionCookie(jwt, expiresAt)
      } catch {}

      // 2. Create Razorpay order
      const receipt = `pl_${paymentLink.id.slice(-6)}_${Date.now().toString(36)}`
      const razorpayOrder = await createRazorpayOrder({
        amountInRupees: finalFiat,
        receipt,
        notes: {
          paymentLinkId: paymentLink.id,
          sellerId: paymentLink.sellerId,
          payerEmail: email,
          amountCredits: String(finalCredits),
          amountFiat: String(finalFiat),
        },
      })

      // 3. Create pending PaymentLinkTransaction
      const transaction = await db.paymentLinkTransaction.create({
        data: {
          paymentLinkId: paymentLink.id,
          payerEmail: email,
          payerUserId: user!.id,
          amountCredits: finalCredits,
          amountFiat: finalFiat,
          status: 'pending',
          razorpayOrderId: razorpayOrder.orderId,
        },
      })

      return ok({
        order: razorpayOrder,
        transactionId: transaction.id,
        keyId: RAZORPAY_KEY_ID,
        user: {
          id: user!.id,
          email: user!.email,
          username: user!.username,
        },
      }, 201)
    } catch (e) {
      return handleError(e)
    }
  })(req as Request)
}
