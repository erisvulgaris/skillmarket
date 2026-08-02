import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { db } from '@/lib/db'
import { hashPassword, hashPin } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return NextResponse.json({ success: true, data: {} })
  try {
    const existing = await db.user.findFirst({
      where: { OR: [{ email: 'admin@skillcart.shop' }, { username: 'admin' }, { role: 'admin' }] }
    })

    if (existing) {
      const updated = await db.user.update({
        where: { id: existing.id },
        data: {
          role: 'admin',
          status: 'active',
          passwordHash: await hashPassword('AdminSecurePassword2026!'),
          transactionPinHash: await hashPin('1234')
        }
      })
      return ok({ status: 'admin_ready', email: updated.email, username: updated.username })
    }

    const passwordHash = await hashPassword('AdminSecurePassword2026!')
    const pinHash = await hashPin('1234')

    const admin = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: 'admin@skillcart.shop',
          username: 'admin',
          role: 'admin',
          status: 'active',
          passwordHash,
          transactionPinHash: pinHash,
          referralCode: 'ADM-001',
          emailVerifiedAt: new Date(),
        }
      })
      await tx.profile.create({
        data: {
          userId: u.id,
          displayName: 'Platform Admin',
          languages: '["English"]',
          skills: '["Administration"]',
          isVerified: true
        }
      })
      await tx.wallet.create({
        data: {
          userId: u.id,
          availableBalance: 100000
        }
      })
      return u
    })

    return ok({ status: 'admin_created', email: admin.email, username: admin.username })
  } catch (e) {
    return handleError(e)
  }
}
