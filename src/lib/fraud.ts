// Fraud detection rules — checks for suspicious activity patterns.
// Returns alerts that can be surfaced to admins.

import { db } from './db'

export interface FraudAlert {
  level: 'low' | 'medium' | 'high'
  type: string
  message: string
  userId?: string
  walletId?: string
  data?: Record<string, any>
}

// Velocity check: too many transfers in a short window
export async function checkTransferVelocity(userId: string): Promise<FraudAlert | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentTransfers = await db.transfer.count({
    where: {
      senderId: userId,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (recentTransfers >= 20) {
    return {
      level: 'high',
      type: 'velocity_high',
      message: `User made ${recentTransfers} transfers in the last hour (threshold: 20)`,
      userId,
      data: { count: recentTransfers, window: '1h' },
    }
  }
  if (recentTransfers >= 10) {
    return {
      level: 'medium',
      type: 'velocity_medium',
      message: `User made ${recentTransfers} transfers in the last hour`,
      userId,
      data: { count: recentTransfers, window: '1h' },
    }
  }
  return null
}

// Large transfer check
export async function checkLargeTransfer(userId: string, amount: number): Promise<FraudAlert | null> {
  if (amount >= 10000) {
    return {
      level: 'high',
      type: 'large_transfer',
      message: `Large transfer of ${amount} SC initiated`,
      userId,
      data: { amount },
    }
  }
  if (amount >= 5000) {
    return {
      level: 'medium',
      type: 'large_transfer',
      message: `Transfer of ${amount} SC initiated (above 5000 threshold)`,
      userId,
      data: { amount },
    }
  }
  return null
}

// Multiple accounts from same device fingerprint
export async function checkDeviceFingerprint(fingerprint: string, currentUserId: string): Promise<FraudAlert | null> {
  if (!fingerprint) return null
  const devices = await db.device.findMany({
    where: { fingerprint },
    take: 10,
    include: { user: { select: { id: true, username: true, status: true } } },
  })
  const uniqueUsers = new Set(devices.map((d) => d.userId))
  if (uniqueUsers.size > 3) {
    const others = devices.filter((d) => d.userId !== currentUserId)
    return {
      level: 'high',
      type: 'multiple_accounts_device',
      message: `Device fingerprint ${fingerprint.slice(0, 8)}… associated with ${uniqueUsers.size} accounts`,
      userId: currentUserId,
      data: {
        fingerprint,
        accountCount: uniqueUsers.size,
        accounts: others.map((d) => ({ id: d.userId, username: d.user.username })),
      },
    }
  }
  return null
}

// Rapid spending after purchase (potential money laundering)
export async function checkRapidSpendAfterPurchase(userId: string): Promise<FraudAlert | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentPurchase = await db.creditPurchase.findFirst({
    where: {
      userId,
      status: 'succeeded',
      createdAt: { gte: oneHourAgo },
    },
  })
  if (recentPurchase) {
    const recentTransfersOut = await db.transfer.count({
      where: {
        senderId: userId,
        createdAt: { gte: recentPurchase.createdAt },
      },
    })
    if (recentTransfersOut >= 3) {
      return {
        level: 'medium',
        type: 'rapid_spend_after_purchase',
        message: `User made ${recentTransfersOut} transfers within 1h of purchasing ${recentPurchase.amountCredits} SC`,
        userId,
        data: { purchaseAmount: recentPurchase.amountCredits, transferCount: recentTransfersOut },
      }
    }
  }
  return null
}

// Check for new account + large balance (potential fraud)
export async function checkNewAccountHighBalance(userId: string): Promise<FraudAlert | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  })
  if (!user || !user.wallet) return null

  const accountAgeHours = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60)
  if (accountAgeHours < 24 && user.wallet.availableBalance >= 5000) {
    return {
      level: 'medium',
      type: 'new_account_high_balance',
      message: `New account (< 24h) with balance of ${user.wallet.availableBalance} SC`,
      userId,
      data: { accountAgeHours: Math.round(accountAgeHours), balance: user.wallet.availableBalance },
    }
  }
  return null
}

// Run all checks and return aggregated alerts
export async function runFraudChecks(userId: string, context?: { transferAmount?: number; deviceFingerprint?: string }): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = []

  const velocity = await checkTransferVelocity(userId)
  if (velocity) alerts.push(velocity)

  if (context?.transferAmount) {
    const large = await checkLargeTransfer(userId, context.transferAmount)
    if (large) alerts.push(large)
  }

  if (context?.deviceFingerprint) {
    const device = await checkDeviceFingerprint(context.deviceFingerprint, userId)
    if (device) alerts.push(device)
  }

  const rapid = await checkRapidSpendAfterPurchase(userId)
  if (rapid) alerts.push(rapid)

  const newAccount = await checkNewAccountHighBalance(userId)
  if (newAccount) alerts.push(newAccount)

  return alerts
}

// Get all active fraud alerts for admin dashboard
export async function getPlatformFraudAlerts(): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = []

  // Check all users with recent activity
  const recentUsers = await db.user.findMany({
    where: {
      deletedAt: null,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    include: { wallet: true, devices: true },
    take: 100,
  })

  for (const user of recentUsers) {
    const userAlerts = await runFraudChecks(user.id)
    alerts.push(...userAlerts)
  }

  // Check for disputed orders
  const disputedOrders = await db.order.count({ where: { status: 'disputed' } })
  if (disputedOrders > 0) {
    alerts.push({
      level: 'medium',
      type: 'disputed_orders',
      message: `${disputedOrders} orders currently in dispute`,
      data: { count: disputedOrders },
    })
  }

  // Check for frozen wallets
  const frozenWallets = await db.wallet.count({ where: { frozen: true } })
  if (frozenWallets > 0) {
    alerts.push({
      level: 'low',
      type: 'frozen_wallets',
      message: `${frozenWallets} wallets currently frozen`,
      data: { count: frozenWallets },
    })
  }

  return alerts
}
