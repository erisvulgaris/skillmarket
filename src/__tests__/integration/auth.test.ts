import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/lib/db'

vi.mock('@/lib/auth', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  hashPin: vi.fn(),
  generateReferralCode: vi.fn(),
  createSession: vi.fn(),
  destroySession: vi.fn(),
  getSessionToken: vi.fn(),
  setSessionCookie: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock('otpauth', () => {
  const mockTotpInstance = {
    validate: vi.fn().mockReturnValue(0),
    toString: vi.fn().mockReturnValue('otpauth://totp/SkillCart:testuser?secret=TEST'),
  }
  const MockTOTP = vi.fn(() => mockTotpInstance)
  MockTOTP.prototype = mockTotpInstance
  const MockSecret = Object.assign(
    vi.fn(() => ({ base32: 'JBSWY3DPEHPK3PXP' })),
    { fromBase32: vi.fn().mockReturnValue('secret-b32') }
  )
  return { TOTP: MockTOTP, Secret: MockSecret }
})

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fakeqrcode') } }))

import { hashPassword, verifyPassword, hashPin, generateReferralCode, createSession, destroySession, getSessionToken, setSessionCookie, getCurrentUser } from '@/lib/auth'

const mockUser = {
  id: 'user-001',
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  transactionPinHash: null,
  role: 'user' as const,
  status: 'active' as const,
  twoFactorEnabled: false,
  twoFactorSecret: null,
  referralCode: 'TEST123ABC',
  emailVerifiedAt: new Date(),
  lastLoginAt: null,
  createdAt: new Date('2026-06-01'),
  updatedAt: new Date('2026-07-20'),
  deletedAt: null,
  referredById: null,
  profile: null,
  wallet: null,
}

const mockSession = {
  token: 'valid-session-token',
  jwt: 'jwt-token-string',
  expiresAt: new Date(Date.now() + 86400000),
}

describe('Auth — Registration', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('POST /api/auth/register creates a new user', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(hashPassword).mockResolvedValue('$2b$12$newhash')
    vi.mocked(hashPin).mockResolvedValue('$2b$10$pinhashed')
    vi.mocked(generateReferralCode).mockReturnValue('NEWU123ABC')
    vi.mocked(createSession).mockResolvedValue(mockSession)
    vi.mocked(setSessionCookie).mockResolvedValue(undefined)
    const txMock = vi.fn().mockImplementation(async (cb: any) => cb({
      user: { create: vi.fn().mockResolvedValue({ ...mockUser, id: 'user-002', username: 'newuser', email: 'new@test.com' }) },
      profile: { create: vi.fn().mockResolvedValue({}) },
      wallet: { create: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    }))
    vi.mocked(db.$transaction).mockImplementation(txMock)

    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'newuser', email: 'new@test.com', password: 'SecurePass123!', transactionPin: '1234' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.user.email).toBe('new@test.com')
  })

  it('POST /api/auth/register rejects duplicate email', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as any)

    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'another', email: 'test@example.com', password: 'SecurePass123!', transactionPin: '1234' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('POST /api/auth/register rejects weak password (< 8 chars)', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null)

    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'newuser', email: 'new@test.com', password: '123', transactionPin: '1234' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('POST /api/auth/register handles referral code', async () => {
    const referrer = { id: 'referrer-001', referralCode: 'REFERRER' }
    vi.mocked(db.user.findUnique).mockImplementation((q: any) => Promise.resolve(q.where.referralCode ? referrer : null) as any)
    vi.mocked(hashPassword).mockResolvedValue('$2b$12$newhash')
    vi.mocked(hashPin).mockResolvedValue('$2b$10$pinhashed')
    vi.mocked(generateReferralCode).mockReturnValue('NEWU456DEF')
    vi.mocked(createSession).mockResolvedValue(mockSession)
    vi.mocked(setSessionCookie).mockResolvedValue(undefined)
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb({
      user: { create: vi.fn().mockResolvedValue({ ...mockUser, id: 'user-003', email: 'new2@test.com', referredById: 'referrer-001' }) },
      profile: { create: vi.fn().mockResolvedValue({}) },
      wallet: { create: vi.fn().mockResolvedValue({ id: 'wallet-new', userId: 'user-003', availableBalance: 0 }), findUnique: vi.fn().mockResolvedValue({ id: 'wallet-referrer', userId: 'referrer-001', availableBalance: 5000 }), update: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      walletTransaction: { create: vi.fn().mockResolvedValue({}) },
      ledgerEntry: { create: vi.fn().mockResolvedValue({}) },
      referralReward: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
      notification: { create: vi.fn().mockResolvedValue({}) },
    }))

    const { POST } = await import('@/app/api/auth/register/route')
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'newuser2', email: 'new2@test.com', password: 'SecurePass123!', transactionPin: '1234', referralCode: 'REFERRER' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.user.email).toBe('new2@test.com')
  })
})

describe('Auth — Login', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('POST /api/auth/login authenticates with valid credentials', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any)
    vi.mocked(verifyPassword).mockResolvedValue(true)
    vi.mocked(createSession).mockResolvedValue(mockSession)
    vi.mocked(setSessionCookie).mockResolvedValue(undefined)
    vi.mocked(db.user.update).mockResolvedValue(mockUser as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/auth/login/route')
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'test@example.com', password: 'SecurePass123!' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.email).toBe('test@example.com')
  })

  it('POST /api/auth/login returns 401 for wrong password', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any)
    vi.mocked(verifyPassword).mockResolvedValue(false)

    const { POST } = await import('@/app/api/auth/login/route')
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'test@example.com', password: 'wrongpassword' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('POST /api/auth/login returns 401 for nonexistent email', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(null)

    const { POST } = await import('@/app/api/auth/login/route')
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'nonexistent@test.com', password: 'SecurePass123!' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('POST /api/auth/login returns 403 for suspended user', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({ ...mockUser, status: 'suspended' } as any)
    vi.mocked(verifyPassword).mockResolvedValue(true)

    const { POST } = await import('@/app/api/auth/login/route')
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'test@example.com', password: 'SecurePass123!' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('POST /api/auth/login returns 403 for banned user', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({ ...mockUser, status: 'banned' } as any)
    vi.mocked(verifyPassword).mockResolvedValue(true)

    const { POST } = await import('@/app/api/auth/login/route')
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'test@example.com', password: 'SecurePass123!' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('POST /api/auth/login returns requiresTwoFactor when 2FA enabled', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({ ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'JBSWY3DPEHPK3PXP' } as any)
    vi.mocked(verifyPassword).mockResolvedValue(true)

    const { POST } = await import('@/app/api/auth/login/route')
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'test@example.com', password: 'SecurePass123!' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.requiresTwoFactor).toBe(true)
  })
})

describe('Auth — 2FA', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('POST /api/auth/2fa/setup generates secret and QR code', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(db.user.update).mockResolvedValue({ ...mockUser, twoFactorSecret: 'JBSWY3DPEHPK3PXP' } as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/auth/2fa/setup/route')
    const res = await POST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toHaveProperty('qrUrl')
  })

  it('POST /api/auth/2fa/verify enables 2FA with valid code', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...mockUser, twoFactorSecret: 'JBSWY3DPEHPK3PXP', twoFactorEnabled: false } as any)
    vi.mocked(db.user.update).mockResolvedValue({ ...mockUser, twoFactorEnabled: true } as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/auth/2fa/verify/route')
    const req = new Request('http://localhost/api/auth/2fa/verify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '123456' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.enabled).toBe(true)
  })

  it('POST /api/auth/2fa/verify returns 400 if already enabled', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...mockUser, twoFactorSecret: 'JBSWY3DPEHPK3PXP', twoFactorEnabled: true } as any)

    const { POST } = await import('@/app/api/auth/2fa/verify/route')
    const req = new Request('http://localhost/api/auth/2fa/verify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '123456' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('POST /api/auth/2fa/disable disables 2FA with valid code', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...mockUser, twoFactorEnabled: true, twoFactorSecret: 'JBSWY3DPEHPK3PXP' } as any)
    vi.mocked(db.user.update).mockResolvedValue({ ...mockUser, twoFactorEnabled: false, twoFactorSecret: null } as any)
    vi.mocked(db.auditLog.create).mockResolvedValue({} as any)

    const { POST } = await import('@/app/api/auth/2fa/disable/route')
    const req = new Request('http://localhost/api/auth/2fa/disable', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '123456' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.disabled).toBe(true)
  })

  it('POST /api/auth/2fa/disable returns 400 if 2FA not enabled', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...mockUser, twoFactorEnabled: false } as any)

    const { POST } = await import('@/app/api/auth/2fa/disable/route')
    const req = new Request('http://localhost/api/auth/2fa/disable', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: '123456' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('Auth — Sessions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('POST /api/auth/logout destroys active session', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
    vi.mocked(getSessionToken).mockResolvedValue('test-token')
    vi.mocked(destroySession).mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/auth/logout/route')
    const res = await POST()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.success).toBe(true)
  })

  it('GET /api/auth/me returns current user', async () => {
    const userWithProfileWallet = {
      ...mockUser,
      profile: { displayName: 'Test User', bio: null, avatarUrl: null, coverUrl: null, location: null, languages: '[]', skills: '[]', isVerified: false, verificationType: null, responseTimeMins: 30 },
      wallet: { availableBalance: 5000, reservedBalance: 0, pendingBalance: 0, lifetimePurchased: 5000, lifetimeEarned: 0, lifetimeSent: 0, lifetimeReceived: 0, lifetimeSpent: 0, frozen: false },
    }
    vi.mocked(getCurrentUser).mockResolvedValue(userWithProfileWallet as any)

    const { GET } = await import('@/app/api/auth/me/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user.id).toBe('user-001')
    expect(body.data.user.wallet.availableBalance).toBe(5000)
  })

  it('GET /api/auth/me returns user: null when not authenticated', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const { GET } = await import('@/app/api/auth/me/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.user).toBeNull()
  })
})
