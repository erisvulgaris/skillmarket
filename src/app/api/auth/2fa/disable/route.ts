import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { ok, err, handleError, validateBody } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { strictLimit } from '@/lib/rate-limit'
import * as OTPAuth from 'otpauth'
import { z } from 'zod'

const schema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export const POST = strictLimit(async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return err('UNAUTHORIZED', 401)
    const { data, error } = await validateBody(schema, req)
    if (error) return err(error, 422)

    if (!user.twoFactorEnabled || !user.twoFactorSecret) return err('2FA not enabled', 400)

    const totp = new OTPAuth.TOTP({
      issuer: 'SkillMarket',
      label: user.username,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    })

    const delta = totp.validate({ token: data!.code, window: 1 })
    if (delta === null) return err('Invalid verification code', 400)

    await db.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    })

    await writeAudit({ actorId: user.id, action: '2fa_disabled', entityType: 'user', entityId: user.id })

    return ok({ disabled: true })
  } catch (e) {
    return handleError(e)
  }
})
