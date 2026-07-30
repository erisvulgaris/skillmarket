import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    transactionOptions: { timeout: 15000, maxWait: 10000 },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown (CHANGELOG 090)
let isShuttingDown = false
const shutdown = async (signal: string) => {
  if (isShuttingDown) return
  isShuttingDown = true
  console.log(`[shutdown] Received ${signal}, draining connections...`)
  try {
    await db.$disconnect()
    console.log('[shutdown] Database disconnected')
  } catch (e) {
    console.error('[shutdown] Error disconnecting DB:', e)
  }
  process.exit(0)
}

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

// Auto-seed admin user if missing
if (typeof window === 'undefined') {
  setTimeout(async () => {
    try {
      const adminCount = await db.user.count({ where: { role: 'admin' } })
      if (adminCount === 0) {
        const bcrypt = await import('bcryptjs')
        const crypto = await import('crypto')
        const email = 'admin@skillcart.shop'
        const username = 'admin'
        const passwordHash = await bcrypt.hash('AdminSecurePassword2026!', 12)
        const pinHash = crypto.createHash('sha256').update('1234').digest('hex')
        const admin = await db.user.create({
          data: {
            email,
            username,
            role: 'admin',
            status: 'active',
            passwordHash,
            transactionPinHash: pinHash,
            referralCode: 'ADM-001',
            emailVerifiedAt: new Date(),
          }
        })
        await db.profile.create({
          data: {
            userId: admin.id,
            displayName: 'Platform Admin',
            languages: '["English"]',
            skills: '["Administration"]',
            isVerified: true
          }
        })
        await db.wallet.create({
          data: {
            userId: admin.id,
            availableBalance: 100000
          }
        })
        console.log('[db] Platform admin account seeded successfully:', email)
      }
    } catch (e) {
      console.error('[db] Admin auto-seed note:', e)
    }
  }, 2000)
}
