import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { randomBytes } from 'crypto'

const SESSION_COOKIE = 'sm_session'
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'skillmarket-dev-secret-change-me-in-production-please'
)
const SESSION_TTL_DAYS = 30

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string | null): Promise<boolean> {
  if (!hash) return false
  return bcrypt.compare(pin, hash)
}

export function generateReferralCode(username: string): string {
  const base = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'USER'
  const suffix = randomBytes(3).toString('hex').toUpperCase()
  return `${base}${suffix}`
}

export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string; fingerprint?: string }) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)

  // Also sign a JWT carrying the userId for quick middleware reads
  const jwt = await new SignJWT({ uid: userId, sid: token })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(SESSION_SECRET)

  await db.session.create({
    data: {
      userId,
      token,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      deviceFingerprint: meta?.fingerprint,
      expiresAt,
    },
  })

  return { token, jwt, expiresAt }
}

export async function setSessionCookie(jwt: string, expiresAt: Date) {
  const store = await cookies()
  store.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value
}

export async function getCurrentUser() {
  const jwt = await getSessionToken()
  if (!jwt) return null

  try {
    const { payload } = await jwtVerify(jwt, SESSION_SECRET)
    const sid = payload.sid as string
    if (!sid) return null

    const session = await db.session.findUnique({
      where: { token: sid },
      include: { user: { include: { profile: true, wallet: true } } },
    })

    if (!session) return null
    if (session.revokedAt) return null
    if (session.expiresAt < new Date()) return null
    if (session.user.status !== 'active') return null

    return session.user
  } catch {
    return null
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Error('FORBIDDEN')
  return user
}

export async function destroySession(token?: string) {
  if (token) {
    await db.session.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    })
  }
  await clearSessionCookie()
}
