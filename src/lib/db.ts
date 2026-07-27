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
