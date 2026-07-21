import { getCurrentUser, verifyPin, hashPin, verifyPassword } from '@/lib/auth'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { strictLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  currentPin: z.string().length(4),
  newPin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be 4 digits'),
})

export const POST = strictLimit(async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    if (!user.transactionPinHash) return err('PIN_REQUIRED', 400)
    const valid = await verifyPin(data!.currentPin, user.transactionPinHash)
    if (!valid) return err('INVALID_PIN', 400)
    if (data!.currentPin === data!.newPin) return err('New PIN must be different', 400)

    const newHash = await hashPin(data!.newPin)
    const { db } = await import('@/lib/db')
    await db.user.update({ where: { id: user.id }, data: { transactionPinHash: newHash } })
    await writeAudit({ actorId: user.id, action: 'pin_changed', entityType: 'user', entityId: user.id })

    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
})
