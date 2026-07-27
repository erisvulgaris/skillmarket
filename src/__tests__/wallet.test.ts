import { describe, it, expect, vi, beforeEach } from 'vitest'
import { randomBytes } from 'crypto'

vi.mock('@/lib/db', () => ({ db: {} }))

const mod = await import('@/lib/wallet')

describe('genReceiptNo', () => {
  it('returns a string with TRX prefix and two dashes', () => {
    const receipt = mod.genReceiptNo()
    const parts = receipt.split('-')
    expect(parts[0]).toBe('TRX')
    expect(parts.length).toBe(3)
    expect(parts[1]).toMatch(/^[0-9A-Z]+$/)
    expect(parts[2]).toMatch(/^[0-9A-F]{8}$/)
  })

  it('accepts a custom prefix', () => {
    const receipt = mod.genReceiptNo('RFD')
    expect(receipt.startsWith('RFD-')).toBe(true)
  })

  it('produces unique values on successive calls', () => {
    const r1 = mod.genReceiptNo()
    const r2 = mod.genReceiptNo()
    expect(r1).not.toBe(r2)
  })
})

describe('genOrderNo', () => {
  it('returns ORD-{base36ts}-{6hex}', () => {
    const order = mod.genOrderNo()
    const parts = order.split('-')
    expect(parts[0]).toBe('ORD')
    expect(parts.length).toBe(3)
    expect(parts[1]).toMatch(/^[0-9A-Z]+$/)
    expect(parts[2]).toMatch(/^[0-9A-F]{6}$/)
  })
})

describe('transferCredits', () => {
  it('throws CANNOT_TRANSFER_TO_SELF when sender === receiver', async () => {
    await expect(
      mod.transferCredits({ senderId: 'u1', receiverId: 'u1', amount: 100 })
    ).rejects.toThrow('CANNOT_TRANSFER_TO_SELF')
  })

  it('throws INVALID_AMOUNT when amount <= 0', async () => {
    await expect(
      mod.transferCredits({ senderId: 'u1', receiverId: 'u2', amount: 0 })
    ).rejects.toThrow('INVALID_AMOUNT')
  })
})

describe('purchaseCredits', () => {
  it('throws INVALID_AMOUNT when amountCredits <= 0', async () => {
    await expect(
      mod.purchaseCredits({ userId: 'u1', amountCredits: 0, amountFiat: 10, idempotencyKey: 'k' })
    ).rejects.toThrow('INVALID_AMOUNT')
  })
})

describe('escrowForOrder', () => {
  it('throws INVALID_AMOUNT when amount <= 0', async () => {
    await expect(
      mod.escrowForOrder({ buyerId: 'u1', orderId: 'o1', amount: 0 })
    ).rejects.toThrow('INVALID_AMOUNT')
  })
})

describe('adminAdjust', () => {
  it('throws INVALID_AMOUNT when amount === 0', async () => {
    await expect(
      mod.adminAdjust({ walletId: 'w1', amount: 0, reason: 'test', adminId: 'a1' })
    ).rejects.toThrow('INVALID_AMOUNT')
  })
})
