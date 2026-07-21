import { getCurrentUser } from '@/lib/auth'
import { purchaseCredits } from '@/lib/wallet'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({
  amountCredits: z.number().int().positive().max(100000),
  amountFiat: z.number().positive(),
  currency: z.string().max(3).optional(),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    // Idempotency key is server-generated to avoid client replays creating duplicates
    const idempotencyKey = `${user.id}_${Date.now()}_${randomBytes(4).toString('hex')}`

    const result = await purchaseCredits({
      userId: user.id,
      amountCredits: data!.amountCredits,
      amountFiat: data!.amountFiat,
      currency: data!.currency,
      idempotencyKey,
      gatewayRef: `sim_payment_${Date.now()}`,
    })

    return ok({ purchase: result.purchase }, 201)
  } catch (e) {
    return handleError(e)
  }
}
