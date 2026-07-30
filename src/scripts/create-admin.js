const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const prisma = new PrismaClient()

function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex')
}

function generateReferralCode(username) {
  const hash = crypto.createHash('md5').update(username + Date.now()).digest('hex').substring(0, 6).toUpperCase()
  return `${username.substring(0, 3).toUpperCase()}-${hash}`
}

async function main() {
  const email = 'admin@skillcart.shop'
  const username = 'admin'
  const password = 'AdminSecurePassword2026!'
  const pin = '1234'

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }, { role: 'admin' }] }
  })

  if (existing) {
    console.log('[seed] Admin user exists, updating credentials...')
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'admin',
        status: 'active',
        passwordHash: await hashPassword(password),
        transactionPinHash: hashPin(pin)
      }
    })
    console.log('[seed] Admin credentials updated:', updated.email)
    return
  }

  const passwordHash = await hashPassword(password)
  const pinHash = hashPin(pin)
  const referralCode = generateReferralCode(username)

  const admin = await prisma.$transaction(async (tx) => {
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

  console.log('[seed] Admin created:', admin.username, admin.email)
}

main()
  .catch((err) => console.error('[seed] error:', err))
  .finally(() => prisma.$disconnect())
