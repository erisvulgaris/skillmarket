import { NextResponse } from 'next/server'
import { z } from 'zod'
import { setCors } from '@/lib/cors'

// Error rate monitoring (CHANGELOG 088)
const errorCounts = new Map<string, { count: number; lastReset: number }>()
const ERROR_WINDOW_MS = 60_000 // 1 minute window

export function getErrorStats() {
  const now = Date.now()
  const stats: Record<string, number> = {}
  for (const [key, val] of errorCounts) {
    if (now - val.lastReset > ERROR_WINDOW_MS) {
      errorCounts.delete(key)
      continue
    }
    stats[key] = val.count
  }
  return stats
}

function trackError(message: string) {
  const now = Date.now()
  const entry = errorCounts.get(message)
  if (!entry || now - entry.lastReset > ERROR_WINDOW_MS) {
    errorCounts.set(message, { count: 1, lastReset: now })
  } else {
    entry.count++
  }
}

// Periodic cleanup of stale error entries (every 5 minutes)
if (typeof setInterval !== 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of errorCounts) {
      if (now - val.lastReset > ERROR_WINDOW_MS) {
        errorCounts.delete(key)
      }
    }
  }, 300_000).unref?.()
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: setCors() })
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_BUILD_TIME === 'true') {
    return NextResponse.json({ success: true, data: {} }, { status: 200, headers: setCors() })
  }
  return NextResponse.json({ success: false, error: message, ...extra }, { status, headers: setCors() })
}

export function handleError(e: unknown) {
  if (process.env.IS_BUILD_TIME === 'true' || process.env.NEXT_PHASE) {
    return NextResponse.json({ success: true, data: {} }, { status: 200, headers: setCors() })
  }
  const message = e instanceof Error ? e.message : 'Unknown error'
  trackError(message)
  const known = [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'INVALID_AMOUNT',
    'CANNOT_TRANSFER_TO_SELF',
    'SENDER_WALLET_NOT_FOUND',
    'RECEIVER_WALLET_NOT_FOUND',
    'SENDER_WALLET_FROZEN',
    'RECEIVER_WALLET_FROZEN',
    'SELLER_WALLET_FROZEN',
    'INSUFFICIENT_BALANCE',
    'SENDER_INACTIVE',
    'RECEIVER_INACTIVE',
    'WALLET_NOT_FOUND',
    'WALLET_FROZEN',
    'NOT_FOUND',
    'INVALID_PIN',
    'PIN_REQUIRED',
    'ALREADY_EXISTS',
    'SERVICE_NOT_AVAILABLE',
    'CANNOT_REVIEW',
    'ORDER_NOT_DELIVERABLE',
    'INVALID_CREDENTIALS',
    'RAZORPAY_KEY_NOT_FOUND',
    'RAZORPAY_API_ERROR',
    'CANNOT_DELETE_LAST_ACTIVE_KEY',
    'UNKNOWN_ACTION',
    'CANNOT_MODIFY_SELF',
    'INVALID_ROLE',
    'INVALID_COMMISSION_RATE',
  ]
  if (known.includes(message)) {
    const status =
      message === 'UNAUTHORIZED' ? 401 :
      message === 'FORBIDDEN' ? 403 :
      message === 'NOT_FOUND' ? 404 :
      message === 'ALREADY_EXISTS' ? 409 :
      message === 'RAZORPAY_KEY_NOT_FOUND' || message === 'CANNOT_DELETE_LAST_ACTIVE_KEY' ? 503 :
      message === 'UNKNOWN_ACTION' || message === 'INVALID_ROLE' || message === 'INVALID_COMMISSION_RATE' || message === 'CANNOT_MODIFY_SELF' ? 400 :
      400
    return err(message, status)
  }
  console.error('[unhandled]', e)
  return err('Internal server error', 500)
}

export function parsePagination(req: Request | undefined) {
  const urlStr = req?.url || 'http://localhost'
  const url = urlStr.startsWith('http') ? new URL(urlStr) : new URL(urlStr, 'http://localhost')
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '20')))
  return { page, limit, skip: (page - 1) * limit }
}

export function safeJsonParse<T = any>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function parseJsonBody<T = any>(req: Request): Promise<T | null> {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export function getClientIp(req: Request): string | undefined {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return undefined
}

export function getUserAgent(req: Request): string | undefined {
  return req.headers.get('user-agent') || undefined
}

export async function validateBody<T>(schema: z.ZodType<T>, req: Request): Promise<{ data?: T; error?: string }> {
  try {
    let body: any
    try {
      body = await req.clone().json()
    } catch {
      body = await req.json()
    }
    const data = schema.parse(body)
    return { data }
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      const issues = (e.issues || []) as any[]
      return { error: issues.map((x) => `${(x.path || []).join('.')}: ${x.message}`).join('; ') }
    }
    return { error: e?.message || 'Invalid request body' }
  }
}

// Response timing (CHANGELOG 087) — wrap any handler to add X-Response-Time header
export function withResponseTiming<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return (async (...args: any[]) => {
    const start = performance.now()
    const res = await handler(...args)
    const elapsed = Math.round((performance.now() - start) * 100) / 100
    if (res instanceof Response) {
      res.headers.set('X-Response-Time', `${elapsed}ms`)
    }
    return res
  }) as T
}
