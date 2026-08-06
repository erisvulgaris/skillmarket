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
  db.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => {})
  db.$queryRawUnsafe('PRAGMA busy_timeout=5000;').catch(() => {})
  db.$queryRawUnsafe('PRAGMA table_info(Category);').then((info: any) => {
    if (Array.isArray(info) && !info.some((c: any) => c.name === 'enabled')) {
      db.$executeRawUnsafe('ALTER TABLE Category ADD COLUMN enabled BOOLEAN DEFAULT 1;').catch(() => {})
    }
  }).catch(() => {})
  db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentLink" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sellerId" TEXT NOT NULL,
      "serviceId" TEXT,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "amountCredits" INTEGER NOT NULL,
      "amountFiat" REAL NOT NULL DEFAULT 0,
      "slug" TEXT NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT 1,
      "usageLimit" INTEGER,
      "usesCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentLink_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PaymentLink_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `).catch(() => {})
  db.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLink_slug_key" ON "PaymentLink"("slug");
  `).catch(() => {})
  db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentLinkTransaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "paymentLinkId" TEXT NOT NULL,
      "payerEmail" TEXT NOT NULL,
      "payerUserId" TEXT,
      "amountCredits" INTEGER NOT NULL,
      "amountFiat" REAL NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "razorpayOrderId" TEXT,
      "razorpayPaymentId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completedAt" DATETIME,
      CONSTRAINT "PaymentLinkTransaction_paymentLinkId_fkey" FOREIGN KEY ("paymentLinkId") REFERENCES "PaymentLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `).catch(() => {})
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

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}
