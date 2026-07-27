import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/lib/db'

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn(),
  getCurrentUser: vi.fn(),
}))

import { requireAdmin, getCurrentUser } from '@/lib/auth'

const mockAdmin = { id: 'admin-001', username: 'admin', email: 'admin@skillmarket.com', role: 'admin' as const, status: 'active' as const, profile: null, wallet: { id: 'wallet-admin', userId: 'admin-001', availableBalance: 10000, reservedBalance: 0, pendingBalance: 0, lifetimePurchased: 50000, lifetimeEarned: 25000, lifetimeSent: 0, lifetimeReceived: 0, lifetimeSpent: 0, frozen: false, createdAt: new Date(), updatedAt: new Date() } }

const mockUsers = [
  { id: 'user-001', username: 'alice', email: 'alice@test.com', role: 'user' as const, status: 'active' as const, createdAt: new Date('2026-06-01'), updatedAt: new Date('2026-07-20'), deletedAt: null, lastLoginAt: new Date('2026-07-25'),
    profile: { id: 'prof-alice', userId: 'user-001', displayName: 'Alice', bio: null, avatarUrl: null, coverUrl: null, location: null, languages: '[]', skills: '["React"]', isVerified: false, verificationType: null, responseTimeMins: 30 },
    wallet: { id: 'wallet-alice', userId: 'user-001', availableBalance: 5000, frozen: false, reservedBalance: 0, pendingBalance: 0, lifetimePurchased: 10000, lifetimeEarned: 2000, lifetimeSent: 1000, lifetimeReceived: 3000, lifetimeSpent: 5000, createdAt: new Date(), updatedAt: new Date() } },
  { id: 'user-002', username: 'bob', email: 'bob@test.com', role: 'user' as const, status: 'suspended' as const, createdAt: new Date('2026-06-15'), updatedAt: new Date('2026-07-18'), deletedAt: null, lastLoginAt: new Date('2026-07-22'),
    profile: { id: 'prof-bob', userId: 'user-002', displayName: 'Bob', bio: 'Designer', avatarUrl: '/avatars/bob.png', coverUrl: null, location: 'NYC', languages: '["English","Spanish"]', skills: '["Figma","UI"]', isVerified: true, verificationType: 'identity', responseTimeMins: 15 },
    wallet: { id: 'wallet-bob', userId: 'user-002', availableBalance: 3000, frozen: false, reservedBalance: 0, pendingBalance: 0, lifetimePurchased: 3000, lifetimeEarned: 5000, lifetimeSent: 2000, lifetimeReceived: 4000, lifetimeSpent: 0, createdAt: new Date(), updatedAt: new Date() } },
]

const mockAuditLogs = [
  { id: 'audit-001', actorId: 'admin-001', action: 'admin_suspend', entityType: 'user', entityId: 'user-002', before: null, after: null, reason: 'Policy violation', ip: null, userAgent: null, createdAt: new Date('2026-07-20'), updatedAt: new Date('2026-07-20'), actor: { username: 'admin' } },
  { id: 'audit-002', actorId: 'user-001', action: 'login', entityType: 'session', entityId: 'sess-001', before: null, after: null, reason: null, ip: '192.168.1.1', userAgent: 'Mozilla/5.0', createdAt: new Date('2026-07-25'), updatedAt: new Date('2026-07-25'), actor: { username: 'alice' } },
]

describe('Admin � User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin as any)
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any)
  })

  it('GET /api/admin/users lists all users with pagination', async () => {
    vi.mocked(db.user.findMany).mockResolvedValue(mockUsers as any)
    vi.mocked(db.user.count).mockResolvedValue(2)
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new Request('http://localhost/api/admin/users?page=1&limit=10')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.total).toBe(2)
  })

  it('GET /api/admin/users filters by search query', async () => {
    const filtered = mockUsers.filter(u => u.username.includes('alice'))
    vi.mocked(db.user.findMany).mockResolvedValue(filtered as any)
    vi.mocked(db.user.count).mockResolvedValue(1)
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new Request('http://localhost/api/admin/users?search=alice')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].username).toBe('alice')
  })

  it('GET /api/admin/users filters by status', async () => {
    const filtered = mockUsers.filter(u => u.status === 'suspended')
    vi.mocked(db.user.findMany).mockResolvedValue(filtered as any)
    vi.mocked(db.user.count).mockResolvedValue(1)
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new Request('http://localhost/api/admin/users?status=suspended')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].status).toBe('suspended')
  })

  it('GET /api/admin/users filters by role', async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([mockAdmin] as any)
    vi.mocked(db.user.count).mockResolvedValue(1)
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new Request('http://localhost/api/admin/users?role=admin')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].role).toBe('admin')
  })

  it('GET /api/admin/users/[id] returns user detail', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({ ...mockUsers[0], sessions: [], devices: [], wallet: { ...mockUsers[0].wallet, transactions: [] } } as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)
    const { GET } = await import('@/app/api/admin/users/[id]/route')
    const req = new Request('http://localhost/api/admin/users/user-001')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.id).toBe('user-001')
  })

  it('PATCH /api/admin/users/[id] suspends a user', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(mockUsers[0] as any)
    vi.mocked(db.user.update).mockResolvedValue({ ...mockUsers[0], status: 'suspended' } as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)
    const { PATCH } = await import('@/app/api/admin/users/[id]/route')
    const req = new Request('http://localhost/api/admin/users/user-001', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'suspend', reason: 'Policy violation' }) })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'user-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.success).toBe(true)
  })

  it('PATCH /api/admin/users/[id] bans a user', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(mockUsers[0] as any)
    vi.mocked(db.user.update).mockResolvedValue({ ...mockUsers[0], status: 'banned' } as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)
    const { PATCH } = await import('@/app/api/admin/users/[id]/route')
    const req = new Request('http://localhost/api/admin/users/user-001', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'ban', reason: 'Fraud' }) })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'user-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.success).toBe(true)
  })

  it('PATCH /api/admin/users/[id] verifies a user', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(mockUsers[0] as any)
    vi.mocked(db.profile.update).mockResolvedValue({} as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)
    const { PATCH } = await import('@/app/api/admin/users/[id]/route')
    const req = new Request('http://localhost/api/admin/users/user-001', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'verify', reason: 'Identity confirmed' }) })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'user-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.success).toBe(true)
  })

  it('PATCH /api/admin/users/[id] returns 404 for nonexistent user', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    const { PATCH } = await import('@/app/api/admin/users/[id]/route')
    const req = new Request('http://localhost/api/admin/users/nonexistent', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'suspend' }) })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })
})

describe('Admin � Wallet Adjust', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin as any)
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any)
  })

  it('POST /api/admin/wallets/[id]/adjust credits a wallet', async () => {
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb({
      wallet: { findUnique: vi.fn().mockResolvedValue({ id: 'wallet-001', availableBalance: 5000 }), update: vi.fn().mockResolvedValue({ id: 'wallet-001', availableBalance: 6000 }) },
      walletTransaction: { create: vi.fn().mockResolvedValue({}) },
      ledgerEntry: { create: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }))
    const { POST } = await import('@/app/api/admin/wallets/[id]/adjust/route')
    const req = new Request('http://localhost/api/admin/wallets/wallet-001/adjust', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount: 1000, reason: 'Compensation' }) })
    const res = await POST(req, { params: Promise.resolve({ id: 'wallet-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.wallet.availableBalance).toBe(6000)
  })

  it('POST /api/admin/wallets/[id]/adjust debits a wallet', async () => {
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb({
      wallet: { findUnique: vi.fn().mockResolvedValue({ id: 'wallet-001', availableBalance: 5000 }), update: vi.fn().mockResolvedValue({ id: 'wallet-001', availableBalance: 4000 }) },
      walletTransaction: { create: vi.fn().mockResolvedValue({}) },
      ledgerEntry: { create: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }))
    const { POST } = await import('@/app/api/admin/wallets/[id]/adjust/route')
    const req = new Request('http://localhost/api/admin/wallets/wallet-001/adjust', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount: -1000, reason: 'Fee' }) })
    const res = await POST(req, { params: Promise.resolve({ id: 'wallet-001' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.wallet.availableBalance).toBe(4000)
  })

  it('POST /api/admin/wallets/[id]/adjust returns 422 for zero amount', async () => {
    const { POST } = await import('@/app/api/admin/wallets/[id]/adjust/route')
    const req = new Request('http://localhost/api/admin/wallets/wallet-001/adjust', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ amount: 0, reason: 'Test' }) })
    const res = await POST(req, { params: Promise.resolve({ id: 'wallet-001' }) })
    expect(res.status).toBe(422)
  })
})

describe('Admin � Dashboard & Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin as any)
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any)
  })

  it('GET /api/admin/dashboard returns dashboard stats', async () => {
    vi.mocked(db.user.count).mockResolvedValue(150)
    vi.mocked(db.wallet.count).mockResolvedValue(145)
    vi.mocked(db.wallet.aggregate).mockResolvedValue({ _sum: { lifetimePurchased: 500000, availableBalance: 350000, reservedBalance: 50000 } } as any)
    vi.mocked(db.transfer.count).mockResolvedValue(25)
    vi.mocked(db.order.count).mockResolvedValue(300)
    vi.mocked(db.review.count).mockResolvedValue(200)
    vi.mocked(db.dispute.count).mockResolvedValue(3)
    vi.mocked(db.report.count).mockResolvedValue(2)
    vi.mocked(db.supportTicket.count).mockResolvedValue(5)
    vi.mocked(db.service.count).mockResolvedValue(80)
    vi.mocked(db.transfer.findMany).mockResolvedValue([])
    vi.mocked(db.auditLog.findMany).mockResolvedValue(mockAuditLogs as any)
    const req = new Request('http://localhost/api/admin/dashboard')
    const { GET } = await import('@/app/api/admin/dashboard/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.stats.totalUsers).toBe(150)
    expect(body.data.stats.activeWallets).toBe(145)
    expect(body.data.stats.totalCreditsSold).toBe(500000)
    expect(body.data.stats.ordersTotal).toBe(300)
    expect(body.data.recentActivity).toHaveLength(2)
  })

  it('GET /api/admin/analytics returns analytics', async () => {
    vi.mocked(db.user.count).mockResolvedValue(150)
    vi.mocked(db.session.count).mockResolvedValue(45)
    vi.mocked(db.service.count).mockResolvedValue(80)
    vi.mocked(db.order.count).mockResolvedValue(300)
    vi.mocked(db.review.count).mockResolvedValue(200)
    vi.mocked(db.transfer.count).mockResolvedValue(200)
    vi.mocked(db.creditPurchase.count).mockResolvedValue(50)
    vi.mocked(db.creditPurchase.aggregate).mockResolvedValue({ _sum: { amountFiat: 15000 } } as any)
    vi.mocked(db.dispute.count).mockResolvedValue(3)
    vi.mocked(db.wallet.count).mockResolvedValue(145)
    vi.mocked(db.wallet.aggregate).mockResolvedValue({ _sum: { availableBalance: 350000, reservedBalance: 50000 } } as any)
    vi.mocked(db.report.count).mockResolvedValue(2)
    vi.mocked(db.supportTicket.count).mockResolvedValue(5)
    vi.mocked(db.user.findMany).mockResolvedValue([])
    vi.mocked(db.order.findMany).mockResolvedValue([])
    vi.mocked(db.transfer.findMany).mockResolvedValue([])
    vi.mocked(db.creditPurchase.findMany).mockResolvedValue([])
    vi.mocked(db.order.groupBy).mockResolvedValue([])
    vi.mocked(db.service.findMany).mockResolvedValue([])
    vi.mocked(db.service.groupBy).mockResolvedValue([])
    vi.mocked(db.category.findMany).mockResolvedValue([])
    const req = new Request('http://localhost/api/admin/analytics')
    const { GET } = await import('@/app/api/admin/analytics/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.kpis.totalUsers).toBe(150)
    expect(body.data.kpis.totalOrders).toBe(300)
    expect(body.data.kpis.totalRevenue).toBe(15000)
    expect(body.data.kpis.platformEscrow).toBe(50000)
    expect(body.data.charts).toHaveProperty('signupChart')
    expect(body.data.charts).toHaveProperty('revenueChart')
  })
})

describe('Admin � Audit Log', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdmin).mockResolvedValue(mockAdmin as any)
    vi.mocked(getCurrentUser).mockResolvedValue(mockAdmin as any)
  })

  it('GET /api/admin/audit returns paginated audit logs', async () => {
    vi.mocked(db.auditLog.findMany).mockResolvedValue(mockAuditLogs as any)
    vi.mocked(db.auditLog.count).mockResolvedValue(2)
    const { GET } = await import('@/app/api/admin/audit/route')
    const req = new Request('http://localhost/api/admin/audit?page=1&limit=20')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.total).toBe(2)
  })

  it('GET /api/admin/audit filters by action type', async () => {
    const filtered = mockAuditLogs.filter(a => a.action.includes('login'))
    vi.mocked(db.auditLog.findMany).mockResolvedValue(filtered as any)
    vi.mocked(db.auditLog.count).mockResolvedValue(1)
    const { GET } = await import('@/app/api/admin/audit/route')
    const req = new Request('http://localhost/api/admin/audit?action=login')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
    expect(body.data.items[0].action).toBe('login')
  })

  it('GET /api/admin/audit returns empty when no matches', async () => {
    vi.mocked(db.auditLog.findMany).mockResolvedValue([])
    vi.mocked(db.auditLog.count).mockResolvedValue(0)
    const { GET } = await import('@/app/api/admin/audit/route')
    const req = new Request('http://localhost/api/admin/audit?action=nonexistent')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(0)
  })
})

describe('Admin � Access Control', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('admin routes return 403 when not authenticated', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'))
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const { GET } = await import('@/app/api/admin/users/route')
    const req = new Request('http://localhost/api/admin/users?page=1&limit=10')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('admin routes return 403 for non-admin users', async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error('FORBIDDEN'))
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-001', role: 'user' } as any)
    const { GET } = await import('@/app/api/admin/audit/route')
    const req = new Request('http://localhost/api/admin/audit?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })
})
