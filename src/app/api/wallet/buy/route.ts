export const dynamic = 'force-dynamic'
import { getCurrentUser } from '@/lib/auth'
import { purchaseCredits } from '@/lib/wallet'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { setCors } from '@/lib/cors'
import { apiLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({
  amountCredits: z.number().int().positive().max(100000),
  amountFiat: z.number().positive(),
  currency: z.string().max(3).optional(),
})

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
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const idempotencyKey = req.headers.get('X-Idempotency-Key') || `${user.id}_${Date.now()}_${randomBytes(4).toString('hex')}`

    const result = await purchaseCredits({
      userId: user.id,
      amountCredits: data!.amountCredits,
      amountFiat: data!.amountFiat,
      currency: data!.currency || 'INR',
      idempotencyKey,
      gatewayRef: `sim_payment_${Date.now()}`,
    })

    if (result.alreadyExists) {
      return err('DUPLICATE_REQUEST', 409)
    }

    return ok({ purchase: result.purchase }, 201)
  } catch (e) {
    return handleError(e)
  }
}))

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: setCors() })
}


export async function GET() {
  return Response.json({ error: 'METHOD_NOT_ALLOWED' }, { status: 200 })
}
