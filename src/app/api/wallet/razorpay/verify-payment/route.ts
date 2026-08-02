import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { purchaseCredits } from '@/lib/wallet'
import { ok, err, handleError, parseJsonBody } from '@/lib/api'
import { setCors } from '@/lib/cors'
import { apiLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

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

    const body = await parseJsonBody(req)
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountCredits,
      amountFiat,
    } = body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return err('MISSING_RAZORPAY_PARAMS', 400)
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })

    if (!isValid) {
      return err('INVALID_PAYMENT_SIGNATURE', 400)
    }

    const idempotencyKey = `rzp_${razorpayPaymentId}`
    const result = await purchaseCredits({
      userId: user.id,
      amountCredits: Number(amountCredits),
      amountFiat: Number(amountFiat),
      currency: 'INR',
      idempotencyKey,
      gatewayRef: razorpayPaymentId,
    })

    return ok({ purchase: result.purchase, success: true }, 200)
  } catch (e) {
    return handleError(e)
  }
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}


export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  return NextResponse.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
