import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/lib/db'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

import { getCurrentUser } from '@/lib/auth'

const mockBuyer = {
  id: 'buyer-001',
  username: 'buyer',
  email: 'buyer@test.com',
  role: 'user' as const,
  status: 'active' as const,
  passwordHash: 'hash',
  transactionPinHash: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  referralCode: 'BUYER12345',
  emailVerifiedAt: new Date(),
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  referredById: null,
}

const mockSeller = {
  id: 'seller-001',
  username: 'seller',
  email: 'seller@test.com',
  role: 'user' as const,
  status: 'active' as const,
  passwordHash: 'hash',
  transactionPinHash: 'pin',
  twoFactorEnabled: false,
  twoFactorSecret: null,
  referralCode: 'SELLER12345',
  emailVerifiedAt: new Date(),
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  referredById: null,
}

const mockAdmin = {
  id: 'admin-001',
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin' as const,
  status: 'active' as const,
  passwordHash: 'hash',
  transactionPinHash: null,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  referralCode: 'ADMIN12345',
  emailVerifiedAt: new Date(),
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  referredById: null,
}

const mockService = {
  id: 'service-001',
  title: 'Express Logo Design',
  description: 'Professional logo design service',
  price: 2500,
  currency: 'credits' as const,
  userId: mockSeller.id,
  sellerId: mockSeller.id,
  status: 'active' as const,
  seller: { id: mockSeller.id },
  packages: [],
}

const mockOrder = {
  id: 'order-001',
  orderNo: 'ORD-20260720-ABCD',
  buyerId: mockBuyer.id,
  sellerId: mockSeller.id,
  serviceId: mockService.id,
  price: 2500,
  status: 'pending' as const,
  paymentStatus: 'escrow' as const,
  requirements: 'Need a modern logo',
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  cancelledAt: null,
  acceptedAt: null,
  deliveredAt: null,
  deletedAt: null,
  service: { id: mockService.id, title: 'Express Logo Design', price: 2500, seller: { id: mockSeller.id, username: 'seller', profile: null } },
  buyer: { id: mockBuyer.id, username: 'buyer', profile: null },
}

const mockUserWithWallet = (u: any, bal: number) => ({
  ...u,
  wallet: { id: `wallet-${u.id}`, userId: u.id, availableBalance: bal, reservedBalance: 0, frozen: false, pendingBalance: 0, lifetimePurchased: 0, lifetimeEarned: 0, lifetimeSent: 0, lifetimeReceived: 0, lifetimeSpent: 0, createdAt: new Date(), updatedAt: new Date() },
  profile: null,
})

describe('Orders — List', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000) as any)
  })

  it('GET /api/orders returns user orders', async () => {
    vi.mocked(db.order.findMany).mockResolvedValue([mockOrder] as any)
    vi.mocked(db.order.count).mockResolvedValue(1)

    const { GET } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders?page=1&limit=10')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.total).toBe(1)
  })

  it('GET /api/orders filters by status', async () => {
    vi.mocked(db.order.findMany).mockResolvedValue([mockOrder] as any)
    vi.mocked(db.order.count).mockResolvedValue(1)

    const { GET } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders?status=pending')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
  })
})

describe('Orders — Create Order', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000) as any)
  })

  it('POST /api/orders creates a new order successfully', async () => {
    vi.mocked(db.service.findUnique).mockResolvedValue(mockService as any)
    const txFn = vi.fn().mockImplementation(async (cb: any) => cb({
      order: { create: vi.fn().mockResolvedValue(mockOrder) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
      orderActivity: { create: vi.fn().mockResolvedValue({}) },
      conversation: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'conv-001' }) },
      conversationMember: { create: vi.fn().mockResolvedValue({}) },
      wallet: { findUnique: vi.fn().mockResolvedValue({ id: 'wallet-buyer', userId: mockBuyer.id, availableBalance: 10000, frozen: false }), update: vi.fn().mockResolvedValue({}) },
      walletTransaction: { create: vi.fn().mockResolvedValue({}) },
      ledgerEntry: { createMany: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementation(txFn)

    const { POST } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serviceId: mockService.id, requirements: 'Need a modern logo' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.order.status).toBe('pending')
    expect(body.data.order.price).toBe(2500)
  })

  it('POST /api/orders returns 404 for nonexistent service', async () => {
    vi.mocked(db.service.findUnique).mockResolvedValue(null)

    const { POST } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serviceId: 'nonexistent' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('POST /api/orders returns 400 for inactive service', async () => {
    vi.mocked(db.service.findUnique).mockResolvedValue({ ...mockService, status: 'draft' } as any)

    const { POST } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serviceId: mockService.id }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('POST /api/orders returns 400 when buying own service', async () => {
    const ownService = { ...mockService, sellerId: mockBuyer.id, seller: { id: mockBuyer.id } }
    vi.mocked(db.service.findUnique).mockResolvedValue(ownService as any)

    const { POST } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ serviceId: mockService.id }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('Orders — Accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockSeller, 5000) as any)
  })

  it('POST /api/orders/[id]?action=accept transitions to in_progress', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue(mockOrder as any)
    const txFn = vi.fn().mockImplementation(async (cb: any) => cb({
      order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'in_progress', acceptedAt: new Date() }) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
      orderActivity: { create: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementation(txFn)
    vi.mocked(db.notification.create).mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=accept`, { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.order.status).toBe('in_progress')
  })

  it('POST /api/orders/[id]?action=accept returns 403 for non-seller', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000) as any)
    vi.mocked(db.order.findUnique).mockResolvedValue(mockOrder as any)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=accept`, { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    expect(res.status).toBe(403)
  })
})

describe('Orders — Deliver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockSeller, 5000) as any)
  })

  it('POST /api/orders/[id]?action=deliver delivers order', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({ ...mockOrder, status: 'in_progress' } as any)
    const txFn = vi.fn().mockImplementation(async (cb: any) => cb({
      order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'delivered', deliveredAt: new Date() }) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
      orderActivity: { create: vi.fn().mockResolvedValue({}) },
      orderAttachment: { create: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementation(txFn)
    vi.mocked(db.notification.create).mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=deliver`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'Final delivery', attachmentUrl: 'http://example.com/file.pdf', filename: 'deliverable.pdf', fileType: 'application/pdf' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.order.status).toBe('delivered')
  })

  it('POST /api/orders/[id]?action=deliver returns 400 if order not in_progress', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({ ...mockOrder, status: 'pending' } as any)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=deliver`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'Test delivery' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    expect(res.status).toBe(400)
  })
})

describe('Orders — Complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000) as any)
  })

  it('POST /api/orders/[id]?action=complete completes order and releases escrow', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ commissionRate: null } as any)
    vi.mocked(db.setting.findUnique).mockResolvedValue(null)
    vi.mocked(db.order.findUnique).mockResolvedValue({ ...mockOrder, status: 'delivered' } as any)
    const txFn = vi.fn().mockImplementation(async (cb: any) => cb({
      order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'completed', completedAt: new Date(), paymentStatus: 'released' }) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
      orderActivity: { create: vi.fn().mockResolvedValue({}) },
      service: { update: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementation(txFn)
    vi.mocked(db.notification.create).mockResolvedValue({} as any)
    vi.mocked(db.wallet.findUnique).mockResolvedValue(mockUserWithWallet(mockSeller, 5000).wallet as any)
    const releaseTxFn = vi.fn().mockImplementation(async (cb: any) => cb({
      wallet: { findUnique: vi.fn().mockResolvedValueOnce({ id: 'wallet-buyer', userId: mockBuyer.id, availableBalance: 7500, reservedBalance: 2500 }).mockResolvedValueOnce({ id: 'wallet-seller', userId: mockSeller.id, availableBalance: 5000 }), update: vi.fn().mockResolvedValue({}) },
      walletTransaction: { create: vi.fn().mockResolvedValue({}) },
      ledgerEntry: { create: vi.fn().mockResolvedValue({}) },
      notification: { create: vi.fn().mockResolvedValue({}) },
      user: { findUnique: vi.fn().mockResolvedValue({ commissionRate: null }) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementationOnce(txFn).mockImplementationOnce(releaseTxFn)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=complete`, { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.order.status).toBe('completed')
  })

  it('POST /api/orders/[id]?action=complete returns 403 if not buyer', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockSeller, 5000) as any)
    vi.mocked(db.order.findUnique).mockResolvedValue({ ...mockOrder, status: 'delivered' } as any)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=complete`, { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    expect(res.status).toBe(403)
  })
})

describe('Orders — Cancel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000) as any)
  })

  it('POST /api/orders/[id]?action=cancel cancels a pending order', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue(mockOrder as any)
    const txFn = vi.fn().mockImplementation(async (cb: any) => cb({
      order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'cancelled', cancelledAt: new Date(), paymentStatus: 'refunded' }) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
      orderActivity: { create: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementation(txFn)
    vi.mocked(db.notification.create).mockResolvedValue({} as any)
    vi.mocked(db.wallet.findUnique).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000).wallet as any)
    const refundTxFn = vi.fn().mockImplementation(async (cb: any) => cb({
      wallet: { findUnique: vi.fn().mockResolvedValue({ id: 'wallet-buyer', userId: mockBuyer.id, availableBalance: 7500, reservedBalance: 2500 }), update: vi.fn().mockResolvedValue({}) },
      walletTransaction: { create: vi.fn().mockResolvedValue({}) },
      ledgerEntry: { create: vi.fn().mockResolvedValue({}) },
      notification: { create: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementationOnce(txFn).mockImplementationOnce(refundTxFn)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=cancel`, { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.order.status).toBe('cancelled')
  })

  it('POST /api/orders/[id]?action=cancel returns 400 if order completed', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({ ...mockOrder, status: 'completed' } as any)

    const { POST } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}?action=cancel`, { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    expect(res.status).toBe(400)
  })
})

describe('Orders — Disputes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000) as any)
  })

  it('POST /api/orders/[id]/dispute creates a dispute', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({ ...mockOrder, status: 'in_progress' } as any)
    vi.mocked(db.dispute.findUnique).mockResolvedValue(null)
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb({
      dispute: { create: vi.fn().mockResolvedValue({ id: 'disp-001', orderId: mockOrder.id, claimantId: mockBuyer.id, respondentId: mockSeller.id, reason: 'Seller not responsive', status: 'open', createdAt: new Date() }) },
      order: { update: vi.fn().mockResolvedValue({ ...mockOrder, status: 'disputed' }) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
      orderActivity: { create: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.user.findMany).mockResolvedValue([])
    vi.mocked(db.notification.create).mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/orders/[id]/dispute/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}/dispute`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'Seller not responsive' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.dispute.status).toBe('open')
  })

  it('POST /api/orders/[id]/dispute returns 400 for order not in eligible status', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({ ...mockOrder, status: 'completed' } as any)

    const { POST } = await import('@/app/api/orders/[id]/dispute/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}/dispute`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'Test dispute' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: mockOrder.id }) })
    expect(res.status).toBe(400)
  })
})

describe('Orders — Detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(mockBuyer, 10000) as any)
  })

  it('GET /api/orders/[id] returns order detail', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue({
      ...mockOrder,
      service: { ...mockOrder.service, seller: { id: mockSeller.id, profile: null } },
      buyer: { ...mockBuyer, profile: null },
      seller: { ...mockSeller, profile: null },
      statusHistory: [],
      activities: [],
      attachments: [],
      reviews: [],
      dispute: null,
    } as any)

    const { GET } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}`)
    const res = await GET(req, { params: Promise.resolve({ id: mockOrder.id }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.order.id).toBe('order-001')
  })

  it('GET /api/orders/[id] returns 404 for nonexistent order', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue(null)

    const { GET } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/nonexistent`)
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('GET /api/orders/[id] returns 403 for non-participant', async () => {
    const outsider = { ...mockBuyer, id: 'outsider-001', username: 'outsider' }
    vi.mocked(getCurrentUser).mockResolvedValue(mockUserWithWallet(outsider, 0) as any)
    vi.mocked(db.order.findUnique).mockResolvedValue(mockOrder as any)

    const { GET } = await import('@/app/api/orders/[id]/route')
    const req = new Request(`http://localhost/api/orders/${mockOrder.id}`)
    const res = await GET(req, { params: Promise.resolve({ id: mockOrder.id }) })
    expect(res.status).toBe(403)
  })
})
