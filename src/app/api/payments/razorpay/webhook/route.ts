import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { ok, safeJsonParse } from '@/lib/api'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { purchaseCredits } from '@/lib/wallet'

export const POST = async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-razorpay-signature')
    if (!signature) {
      console.error('[razorpay-webhook] missing signature header')
      return ok({ status: 'ignored' })
    }

    const setting = await db.setting.findUnique({ where: { key: 'razorpay_webhook_secret' } })
    if (!setting) {
      console.error('[razorpay-webhook] webhook secret not configured')
      return ok({ status: 'ignored' })
    }

    const rawBody = await req.text()
    const webhookSecret = setting.value

    const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      console.error('[razorpay-webhook] invalid signature')
      return ok({ status: 'ignored' })
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.error('[razorpay-webhook] invalid json body')
      return ok({ status: 'ignored' })
    }

    const event = body.event as string | undefined

    if (event === 'payment.captured') {
      const plPayload = body.payload as Record<string, unknown> | undefined
      const paymentRaw = plPayload?.payment as Record<string, unknown> | undefined
      const payment = paymentRaw?.entity as Record<string, unknown> | undefined
      if (!payment) {
        console.error('[razorpay-webhook] payment.captured missing payment entity')
        return ok({ status: 'ignored' })
      }

      const paymentId = payment.id as string
      const orderId = payment.order_id as string
      const amount = payment.amount as number
      const currency = payment.currency as string
      const method = payment.method as string | undefined
      const bank = payment.bank as string | undefined
      const vpa = payment.vpa as string | undefined
      const fee = payment.fee as number | undefined
      const tax = payment.tax as number | undefined
      const status = payment.status as string

      const rzpOrder = await db.razorpayOrder.findUnique({ where: { razorpayOrderId: orderId } })
      if (!rzpOrder) {
        console.error(`[razorpay-webhook] order not found: ${orderId}`)
        return ok({ status: 'ignored' })
      }

      if (payment.amount !== rzpOrder.amount) {
        console.error(`[razorpay-webhook] amount mismatch: payload=${payment.amount}, order=${rzpOrder.amount}`)
        return ok({ status: 'ignored' })
      }

      await db.$transaction(async (tx: any) => {
        // Duplicate check inside transaction to prevent race condition
        const existing = await tx.razorpayPayment.findUnique({ where: { razorpayPaymentId: paymentId } })
        if (existing) {
          return // silently skip — already processed
        }

        await tx.razorpayPayment.create({
          data: {
            razorpayPaymentId: paymentId,
            orderId: rzpOrder.id,
            razorpayOrderId: orderId,
            userId: rzpOrder.userId,
            amount,
            currency,
            status,
            method,
            bank,
            vpa,
            fee,
            tax,
          },
        })

        await tx.razorpayOrder.update({
          where: { id: rzpOrder.id },
          data: { status: 'paid' },
        })

        const notes = safeJsonParse<Record<string, string>>(rzpOrder.notes, {})

        if (notes.type === 'credit_purchase') {
          const amountCredits = notes.amountCredits ? Number(notes.amountCredits) : Math.floor(amount / 100)
          await purchaseCredits({
            userId: rzpOrder.userId,
            amountCredits,
            amountFiat: amount / 100,
            currency: rzpOrder.currency,
            idempotencyKey: `rzp_${paymentId}`,
            gatewayRef: paymentId,
          })
        }
      })
    } else if (event === 'payment.failed') {
      const plPayload = body.payload as Record<string, unknown> | undefined
      const paymentRaw = plPayload?.payment as Record<string, unknown> | undefined
      const payment = paymentRaw?.entity as Record<string, unknown> | undefined
      if (!payment) {
        console.error('[razorpay-webhook] payment.failed missing payment entity')
        return ok({ status: 'ignored' })
      }

      const orderId = payment.order_id as string
      const paymentId = payment.id as string

      const rzpOrder = await db.razorpayOrder.findUnique({ where: { razorpayOrderId: orderId } })
      if (!rzpOrder) {
        console.error(`[razorpay-webhook] payment.failed: order not found: ${orderId}`)
        return ok({ status: 'ignored' })
      }

      // Duplicate check + create inside transaction to prevent race condition
      await db.$transaction(async (tx: any) => {
        const existing = await tx.razorpayPayment.findUnique({ where: { razorpayPaymentId: paymentId } })
        if (existing) return

        await tx.razorpayPayment.create({
          data: {
            razorpayPaymentId: paymentId,
            orderId: rzpOrder.id,
            razorpayOrderId: orderId,
            userId: rzpOrder.userId,
            amount: payment.amount as number,
            currency: payment.currency as string || 'INR',
            status: 'failed',
            method: payment.method as string | undefined,
          },
        })
        await tx.razorpayOrder.update({
          where: { id: rzpOrder.id },
          data: { status: 'failed' },
        })
      })
    }

    return ok({ status: 'received' })
  } catch (e) {
    console.error('[razorpay-webhook]', e)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}


export async function GET(req?: Request) {
  if (!req || !req.url || process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) return NextResponse.json({ success: true, data: {} })
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
