import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/lib/db'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  verifyPin: vi.fn(),
}))

import { getCurrentUser, verifyPin } from '@/lib/auth'

const mockUser = {
  id: 'user-001',
  username: 'alice',
  email: 'alice@test.com',
  role: 'user' as const,
  status: 'active' as const,
  transactionPinHash: '$2b$10$pinhash',
  profile: null,
  wallet: {
    id: 'wallet-001',
    userId: 'user-001',
    availableBalance: 5000,
    reservedBalance: 1000,
    pendingBalance: 0,
    lifetimePurchased: 10000,
    lifetimeEarned: 2000,
    lifetimeSent: 1000,
    lifetimeReceived: 3000,
    lifetimeSpent: 5000,
    frozen: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

const mockTransactions = [
  { id: 'txn-001', walletId: 'wallet-001', type: 'purchase', direction: 'credit', amount: 1000, balanceAfter: 5000, referenceId: 'cp-001', referenceType: 'credit_purchase', note: 'Purchased 1000 SkillCredits', createdAt: new Date('2026-07-25'), updatedAt: new Date('2026-07-25') },
  { id: 'txn-002', walletId: 'wallet-001', type: 'transfer_out', direction: 'debit', amount: -500, balanceAfter: 4500, referenceId: 'tr-001', referenceType: 'transfer', note: 'Transfer to bob', createdAt: new Date('2026-07-24'), updatedAt: new Date('2026-07-24') },
]

describe('Wallet — Balance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
  })

  it('GET /api/wallet returns wallet balance and stats', async () => {
    const { GET } = await import('@/app/api/wallet/route')
    const req = new Request('http://localhost/api/wallet')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.wallet.availableBalance).toBe(5000)
    expect(body.data.wallet.reservedBalance).toBe(1000)
  })
})

describe('Wallet — Purchase Credits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(db.wallet.findUnique).mockResolvedValue(mockUser.wallet as any)
  })

  it('POST /api/wallet/buy creates credit purchase and updates wallet', async () => {
    vi.mocked(db.wallet.findUnique).mockResolvedValue(mockUser.wallet as any)
    vi.mocked(db.creditPurchase.create).mockResolvedValue({ id: 'cp-001', userId: mockUser.id, amountCredits: 1000, amountFiat: 1000, currency: 'USD', status: 'succeeded', idempotencyKey: 'test-key', completedAt: new Date() } as any)
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb({
      creditPurchase: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'cp-001', userId: mockUser.id, amountCredits: 1000, amountFiat: 1000, currency: 'USD', status: 'succeeded', idempotencyKey: 'test-key', completedAt: new Date() }),
      },
      wallet: {
        findUnique: vi.fn().mockResolvedValue(mockUser.wallet as any),
        create: vi.fn().mockResolvedValue(mockUser.wallet as any),
        update: vi.fn().mockResolvedValue({ ...mockUser.wallet, availableBalance: 6000, lifetimePurchased: 11000 }),
      },
      walletTransaction: {
        create: vi.fn().mockResolvedValue({}),
      },
      ledgerEntry: {
        create: vi.fn().mockResolvedValue({}),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
      referralReward: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    }))

    const { POST } = await import('@/app/api/wallet/buy/route')
    const req = new Request('http://localhost/api/wallet/buy', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountCredits: 1000, amountFiat: 1000, currency: 'USD' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.purchase.amountCredits).toBe(1000)
  })

  it('POST /api/wallet/buy returns 401 when not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const { POST } = await import('@/app/api/wallet/buy/route')
    const req = new Request('http://localhost/api/wallet/buy', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountCredits: 1000, amountFiat: 1000 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('POST /api/wallet/buy returns 422 for invalid body', async () => {
    const { POST } = await import('@/app/api/wallet/buy/route')
    const req = new Request('http://localhost/api/wallet/buy', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountCredits: -1 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })
})

describe('Wallet — Transfer Credits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(db.wallet.findUnique).mockResolvedValue(mockUser.wallet as any)
  })

  it('POST /api/wallet/transfer sends credits to another user', async () => {
    const recipientUser = { id: 'user-002', username: 'bob', email: 'bob@test.com', role: 'user' as const, status: 'active' as const, profile: { displayName: 'Bob', avatarUrl: null, isVerified: false } }
    vi.mocked(db.user.findFirst).mockResolvedValue(recipientUser as any)
    vi.mocked(verifyPin).mockResolvedValue(true)
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb({
      wallet: {
        findUnique: vi.fn()
          .mockResolvedValueOnce(mockUser.wallet)
          .mockResolvedValueOnce({ id: 'wallet-002', userId: 'user-002', availableBalance: 3000, frozen: false }),
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn()
          .mockResolvedValueOnce({ ...mockUser.wallet, availableBalance: 4500, lifetimeSent: 1500 })
          .mockResolvedValueOnce({ id: 'wallet-002', availableBalance: 3500 }),
      },
      user: {
        findUnique: vi.fn()
          .mockResolvedValueOnce({ id: mockUser.id, status: 'active' })
          .mockResolvedValueOnce({ id: 'user-002', status: 'active' }),
      },
      transfer: {
        create: vi.fn().mockResolvedValue({ id: 'tr-002', senderId: mockUser.id, recipientId: 'user-002', amount: 500, note: 'Payment for design work', status: 'completed', createdAt: new Date(), updatedAt: new Date() }),
      },
      walletTransaction: {
        create: vi.fn().mockResolvedValue({}),
      },
      creditPurchase: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amountCredits: 50000 } }),
      },
      referralReward: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
      },
      ledgerEntry: {
        create: vi.fn().mockResolvedValue({}),
      },
      notification: {
        create: vi.fn().mockResolvedValue({}),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    }))

    const { POST } = await import('@/app/api/wallet/transfer/route')
    const req = new Request('http://localhost/api/wallet/transfer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipient: 'bob', amount: 500, note: 'Payment for design work', pin: '1234' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.transfer.status).toBe('completed')
  })

  it('POST /api/wallet/transfer returns 400 if PIN missing', async () => {
    const userNoPin = { ...mockUser, transactionPinHash: null }
    vi.mocked(getCurrentUser).mockResolvedValue(userNoPin as any)

    const { POST } = await import('@/app/api/wallet/transfer/route')
    const req = new Request('http://localhost/api/wallet/transfer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipient: 'bob', amount: 500, pin: '1234' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('POST /api/wallet/transfer returns 400 for invalid PIN', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({ id: 'user-002', username: 'bob' } as any)
    vi.mocked(verifyPin).mockResolvedValue(false)

    const { POST } = await import('@/app/api/wallet/transfer/route')
    const req = new Request('http://localhost/api/wallet/transfer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipient: 'bob', amount: 500, pin: '0000' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('POST /api/wallet/transfer returns 404 for nonexistent recipient', async () => {
    vi.mocked(verifyPin).mockResolvedValue(true)
    vi.mocked(db.user.findFirst).mockResolvedValue(null)

    const { POST } = await import('@/app/api/wallet/transfer/route')
    const req = new Request('http://localhost/api/wallet/transfer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipient: 'nonexistent', amount: 500, pin: '1234' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('POST /api/wallet/transfer returns 422 for invalid body', async () => {
    const { POST } = await import('@/app/api/wallet/transfer/route')
    const req = new Request('http://localhost/api/wallet/transfer', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ recipient: 'bob', amount: -5 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })
})

describe('Wallet — Transaction History', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
  })

  it('GET /api/wallet/transactions returns paginated transactions', async () => {
    vi.mocked(db.walletTransaction.findMany).mockResolvedValue(mockTransactions as any)
    vi.mocked(db.walletTransaction.count).mockResolvedValue(2)

    const { GET } = await import('@/app/api/wallet/transactions/route')
    const req = new Request('http://localhost/api/wallet/transactions?page=1&limit=10')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.total).toBe(2)
  })

  it('GET /api/wallet/transactions filters by type', async () => {
    const filtered = mockTransactions.filter(t => t.type === 'purchase')
    vi.mocked(db.walletTransaction.findMany).mockResolvedValue(filtered as any)
    vi.mocked(db.walletTransaction.count).mockResolvedValue(1)

    const { GET } = await import('@/app/api/wallet/transactions/route')
    const req = new Request('http://localhost/api/wallet/transactions?type=purchase')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
  })
})
