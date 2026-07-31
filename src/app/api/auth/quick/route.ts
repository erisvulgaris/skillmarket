import { db } from '@/lib/db'
import { hashPassword, createSession, setSessionCookie, generateReferralCode, hashPin } from '@/lib/auth'
import { ok, err, handleError, validateBody, getClientIp, getUserAgent } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { strictLimit } from '@/lib/rate-limit'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const quickSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const POST = strictLimit(async function POST(req: Request) {
  try {
    const { data, error } = await validateBody(quickSchema, req)
    if (error) return err(error, 422)

    const { email } = data!

    // Check if user exists
    let user = await db.user.findUnique({
      where: { email },
      include: { profile: true, wallet: true }
    })

    if (!user) {
      // Auto-generate username from email prefix
      const baseName = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 15) || 'user'
      const suffix = randomBytes(2).toString('hex')
      const username = `${baseName}_${suffix}`
      
      const autoPassword = randomBytes(12).toString('hex')
      const passwordHash = await hashPassword(autoPassword)
      const pinHash = await hashPin('1234')
      const referralCode = generateReferralCode(username)

      user = await db.$transaction(async (tx: any) => {
        const u = await tx.user.create({
          data: {
            email,
            username,
            passwordHash,
            transactionPinHash: pinHash,
            referralCode,
            emailVerifiedAt: new Date(),
          },
        })
        await tx.profile.create({
          data: {
            userId: u.id,
            displayName: baseName,
            languages: '["English"]',
            skills: '[]',
          },
        })
        await tx.wallet.create({ data: { userId: u.id, availableBalance: 100 } }) // Give 100 bonus SC to new quick signups
        return u
      })

      // Refetch with profile & wallet
      user = await db.user.findUnique({
        where: { id: user!.id },
        include: { profile: true, wallet: true }
      })
    }

    if (!user) return err('FAILED_TO_CREATE_ACCOUNT', 500)
    if (user.status !== 'active') return err(`Account is ${user.status}`, 403)

    const ip = getClientIp(req)
    const ua = getUserAgent(req)
    const { jwt, expiresAt } = await createSession(user.id, { ip, userAgent: ua })
    await setSessionCookie(jwt, expiresAt)

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await writeAudit({ actorId: user.id, action: 'quick_auth', entityType: 'session', ip, userAgent: ua })

    return ok({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: user.profile ? {
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          avatarUrl: user.profile.avatarUrl,
          coverUrl: user.profile.coverUrl,
          location: user.profile.location,
          isVerified: user.profile.isVerified,
        } : null,
        wallet: user.wallet ? {
          availableBalance: user.wallet.availableBalance,
          reservedBalance: user.wallet.reservedBalance,
          pendingBalance: user.wallet.pendingBalance,
          lifetimePurchased: user.wallet.lifetimePurchased,
          lifetimeEarned: user.wallet.lifetimeEarned,
          lifetimeSpent: user.wallet.lifetimeSpent,
        } : null,
      },
    })
  } catch (e) {
    return handleError(e)
  }
})
