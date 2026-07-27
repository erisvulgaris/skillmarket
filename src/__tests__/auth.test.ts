import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db', () => ({ db: {} }))

import { generateReferralCode, hashPin, verifyPin } from '@/lib/auth'

describe('generateReferralCode', () => {
  it('returns a 10-character alphanumeric code', () => {
    const code = generateReferralCode('john_doe')
    expect(code).toMatch(/^[A-Z0-9]{10}$/)
  })

  it('uses first 4 alphanumeric chars of username as prefix', () => {
    const code = generateReferralCode('alice')
    expect(code.startsWith('ALIC')).toBe(true)
  })

  it('falls back to USER for names with no alphanumeric chars', () => {
    const code = generateReferralCode('___')
    expect(code.startsWith('USER')).toBe(true)
  })

  it('produces unique codes for the same username', () => {
    const c1 = generateReferralCode('bob')
    const c2 = generateReferralCode('bob')
    expect(c1).not.toBe(c2)
  })
})

describe('hashPin and verifyPin', () => {
  it('hashPin returns a hash that verifyPin can validate', async () => {
    const pin = '1234'
    const hash = await hashPin(pin)
    expect(hash).toBeTruthy()
    expect(hash).not.toBe(pin)
    const valid = await verifyPin(pin, hash)
    expect(valid).toBe(true)
  })

  it('verifyPin returns false for wrong pin', async () => {
    const hash = await hashPin('1234')
    const valid = await verifyPin('5678', hash)
    expect(valid).toBe(false)
  })

  it('verifyPin returns false when hash is null', async () => {
    const valid = await verifyPin('1234', null)
    expect(valid).toBe(false)
  })
})
