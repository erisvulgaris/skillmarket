import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { strictLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export const POST = strictLimit(async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    const valid = await verifyPassword(data!.currentPassword, user.passwordHash)
    if (!valid) return err('Current password is incorrect', 400)
    if (data!.currentPassword === data!.newPassword) return err('New password must be different', 400)

    const newHash = await hashPassword(data!.newPassword)
    const { db } = await import('@/lib/db')
    await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
    await writeAudit({ actorId: user.id, action: 'password_changed', entityType: 'user', entityId: user.id })

    return ok({ success: true })
  } catch (e) {
    return handleError(e)
  }
})
