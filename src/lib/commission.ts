import { db } from './db'

const DEFAULT_COMMISSION_RATE = 10

export async function getCommissionRate(sellerId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: sellerId },
    select: { commissionRate: true },
  })
  if (user?.commissionRate != null) {
    const r = user.commissionRate
    if (typeof r === 'number' && !isNaN(r) && isFinite(r) && r >= 0 && r <= 95) return r
  }
  const setting = await db.setting.findUnique({ where: { key: 'commission_default_rate' } })
  if (setting) {
    const parsed = parseFloat(setting.value)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 95) return parsed
  }
  return DEFAULT_COMMISSION_RATE
}

export function calculateCommission(amount: number, ratePercent: number): number {
  if (amount <= 0) return 0
  const commission = Math.floor((amount * ratePercent) / 100)
  return Math.max(0, commission)
}

export function netAfterCommission(amount: number, commission: number): number {
  return amount - commission
}