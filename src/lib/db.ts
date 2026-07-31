import { PrismaClient } from '@prisma/client'

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:/data/skillmarket.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    transactionOptions: { timeout: 15000, maxWait: 10000 },
  })

// Enable SQLite WAL mode & busy timeout for high concurrency performance
if (db) {
  db.$executeRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {})
  db.$executeRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {})
}

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
