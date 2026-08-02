import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { apiLimit } from '@/lib/rate-limit'
import { requireJson } from '@/lib/content-type'
import { createRazorpayOrder } from '@/lib/razorpay'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({
  amount: z.number().int().positive().max(1000000),
  currency: z.enum(['INR']).default('INR'),
  type: z.enum(['credit_purchase']),
})

export const POST = apiLimit(async function POST(req: Request) {
  try {
    const user = await requireUser()
    const ct = requireJson(req); if (ct) return ct
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const amountPaise = data!.amount * 100

    const notes: Record<string, string> = {
      type: data!.type,
      userId: user.id,
      amountCredits: String(data!.amount),
    }

    const rzpOrder = await createRazorpayOrder({
      amountInRupees: data!.amount,
      receipt: `rcpt_${Date.now()}_${randomBytes(4).toString('hex')}`,
      notes,
    })

    await db.razorpayOrder.create({
      data: {
        razorpayOrderId: rzpOrder.orderId,
        amount: amountPaise,
        currency: data!.currency,
        status: 'created',
        userId: user.id,
        notes: JSON.stringify(notes),
      },
    })

    return ok({ id: rzpOrder.orderId, amount: rzpOrder.amount, currency: rzpOrder.currency })
  } catch (e) {
    return handleError(e)
  }
})


export async function GET() {
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
