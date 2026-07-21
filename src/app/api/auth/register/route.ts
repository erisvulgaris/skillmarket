import { db } from '@/lib/db'
import { hashPassword, createSession, setSessionCookie, generateReferralCode, hashPin } from '@/lib/auth'
import { ok, err, handleError, validateBody, getClientIp, getUserAgent } from '@/lib/api'
import { writeAudit, pushNotification } from '@/lib/audit'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, underscores'),
  password: z.string().min(8),
  transactionPin: z.string().length(4).regex(/^\d{4}$/, 'PIN must be 4 digits'),
  referralCode: z.string().optional(),
  displayName: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const { data, error } = await validateBody(registerSchema, req)
    if (error) return err(error, 422)

    const { email, username, password, transactionPin, referralCode, displayName } = data!

    const existingEmail = await db.user.findUnique({ where: { email } })
    if (existingEmail) return err('ALREADY_EXISTS', 409)
    const existingUsername = await db.user.findUnique({ where: { username } })
    if (existingUsername) return err('ALREADY_EXISTS', 409)

    let referrer = null
    if (referralCode) {
      referrer = await db.user.findUnique({ where: { referralCode } })
      if (!referrer) return err('Invalid referral code', 400)
    }

    const passwordHash = await hashPassword(password)
    const pinHash = await hashPin(transactionPin)
    const myReferralCode = generateReferralCode(username)

    const user = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          transactionPinHash: pinHash,
          referralCode: myReferralCode,
          referredById: referrer?.id,
          emailVerifiedAt: new Date(),
        },
      })
      await tx.profile.create({
        data: {
          userId: u.id,
          displayName: displayName || username,
          languages: '[]',
          skills: '[]',
        },
      })
      await tx.wallet.create({ data: { userId: u.id } })
      await tx.auditLog.create({
        data: { actorId: u.id, action: 'user_registered', entityType: 'user', entityId: u.id },
      })
      return u
    })

    // Welcome bonus + referral reward
    if (referrer) {
      const { grantReferralReward } = await import('@/lib/wallet')
      try {
        await grantReferralReward({
          referrerId: referrer.id,
          referredId: user.id,
          amount: 50,
          reason: 'signup_referral',
        })
        await pushNotification({
          userId: referrer.id,
          type: 'referral',
          title: 'Referral reward earned',
          body: `You earned 50 SkillCredits for referring ${username}.`,
        })
      } catch (e) {
        console.error('referral reward failed', e)
      }
    }

    const ip = getClientIp(req)
    const ua = getUserAgent(req)
    const { token, jwt, expiresAt } = await createSession(user.id, { ip, userAgent: ua })
    await setSessionCookie(jwt, expiresAt)

    await writeAudit({ actorId: user.id, action: 'login', entityType: 'session', ip, userAgent: ua })

    return ok({ user: { id: user.id, username: user.username, email: user.email, role: user.role } }, 201)
  } catch (e) {
    return handleError(e)
  }
}
