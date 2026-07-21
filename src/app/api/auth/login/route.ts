import { db } from '@/lib/db'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'
import { ok, err, handleError, validateBody, getClientIp, getUserAgent } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { z } from 'zod'

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const { data, error } = await validateBody(loginSchema, req)
    if (error) return err(error, 422)

    const { emailOrUsername, password } = data!
    const user = await db.user.findFirst({
      where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    })
    if (!user) return err('INVALID_CREDENTIALS', 401)
    if (user.status !== 'active') return err('Account is ' + user.status, 403)

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return err('INVALID_CREDENTIALS', 401)

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
}
