import { db } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'
import { ok, err, handleError, validateBody, getClientIp, getUserAgent } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { strictLimit } from '@/lib/rate-limit'
import * as OTPAuth from 'otpauth'
import { z } from 'zod'

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
})

export const POST = strictLimit(async function POST(req: Request) {
  try {
    const { data, error } = await validateBody(loginSchema, req)
    if (error) return err(error, 422)

    const { emailOrUsername, password, twoFactorCode } = data!
    const user = await db.user.findFirst({
      where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    })
    if (!user) return err('INVALID_CREDENTIALS', 401)
    if (user.status !== 'active') return err('Account is ' + user.status, 403)

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return err('INVALID_CREDENTIALS', 401)

    // 2FA check: if enabled, require a valid TOTP code
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        // Return a special response indicating 2FA is required
        return ok({ requiresTwoFactor: true, userId: user.id }, 200)
      }
      const totp = new OTPAuth.TOTP({
        issuer: 'SkillMarket',
        label: user.username,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      })
      const delta = totp.validate({ token: twoFactorCode, window: 1 })
      if (delta === null) return err('Invalid 2FA code', 400)
    }

    const ip = getClientIp(req)
    const ua = getUserAgent(req)
    const { jwt, expiresAt } = await createSession(user.id, { ip, userAgent: ua })
    await setSessionCookie(jwt, expiresAt)

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await writeAudit({ actorId: user.id, action: 'login', entityType: 'session', ip, userAgent: ua })

    return ok({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    })
  } catch (e) {
    return handleError(e)
  }
})
