import { db } from './lib/db'
import { hashPassword, hashPin, generateReferralCode } from './lib/auth'

async function main() {
  const email = 'admin@skillcart.shop'
  const username = 'admin'
  const password = 'AdminSecurePassword2026!'
  const pin = '1234'

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }, { role: 'admin' }] }
  })

  if (existing) {
    console.log('Admin user already exists:', existing.username, existing.email)
    const updated = await db.user.update({
      where: { id: existing.id },
      data: {
        role: 'admin',
        status: 'active',
        passwordHash: await hashPassword(password),
        transactionPinHash: await hashPin(pin)
      }
    })
    console.log('Admin credentials updated successfully:', updated.email)
    return
  }

  const passwordHash = await hashPassword(password)
  const pinHash = await hashPin(pin)
  const referralCode = generateReferralCode(username)

  const admin = await db.$transaction(async (tx: any) => {
    const u = await tx.user.create({
      data: {
        email,
        username,
        role: 'admin',
        status: 'active',
        passwordHash,
        transactionPinHash: pinHash,
        referralCode,
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

  console.log('Admin created successfully:', admin.username, admin.email)
}

main().catch(console.error).finally(() => process.exit(0))
