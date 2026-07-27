import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ db: {} }))

import { checkLargeTransfer } from '@/lib/fraud'

describe('checkLargeTransfer', () => {
  it('returns null for amounts below 5000', async () => {
    const result = await checkLargeTransfer('user1', 100)
    expect(result).toBeNull()
  })

  it('returns medium for amounts between 5000 and 9999', async () => {
    const result = await checkLargeTransfer('user1', 5000)
    expect(result).not.toBeNull()
    expect(result!.level).toBe('medium')
    expect(result!.type).toBe('large_transfer')

    const result2 = await checkLargeTransfer('user1', 9999)
    expect(result2!.level).toBe('medium')
  })

  it('returns high for amounts of 10000 or more', async () => {
    const result = await checkLargeTransfer('user1', 10000)
    expect(result).not.toBeNull()
    expect(result!.level).toBe('high')
    expect(result!.type).toBe('large_transfer')

    const result2 = await checkLargeTransfer('user1', 50000)
    expect(result2!.level).toBe('high')
  })

  it('includes userId and amount in alert data', async () => {
    const result = await checkLargeTransfer('user-abc', 7500)
    expect(result!.userId).toBe('user-abc')
    expect(result!.data?.amount).toBe(7500)
  })
})
