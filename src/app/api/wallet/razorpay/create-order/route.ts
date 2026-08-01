import { getCurrentUser } from '@/lib/auth'
import { createRazorpayOrder } from '@/lib/razorpay'
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
    const amountFiat = Number(body.amountFiat)
    const amountCredits = Number(body.amountCredits)

    if (!amountFiat || amountFiat <= 0 || !amountCredits || amountCredits <= 0) {
      return err('INVALID_PACKAGE', 400)
    }

    const receipt = `rcpt_${user.id.slice(-6)}_${Date.now().toString(36)}`
    const razorpayOrder = await createRazorpayOrder({
      amountInRupees: amountFiat,
      receipt,
      notes: {
        userId: user.id,
        amountCredits: String(amountCredits),
        amountFiat: String(amountFiat),
      },
    })

    return ok(razorpayOrder, 201)
  } catch (e) {
    return handleError(e)
  }
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}


export async function GET() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 405 })
}
