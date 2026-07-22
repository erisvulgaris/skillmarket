import { NextResponse } from 'next/server'
import { z } from 'zod'

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status })
}

export function handleError(e: unknown) {
  const message = e instanceof Error ? e.message : 'Unknown error'
  const known = [
    'UNAUTHORIZED',
    'FORBIDDEN',
    'INVALID_AMOUNT',
    'CANNOT_TRANSFER_TO_SELF',
    'SENDER_WALLET_NOT_FOUND',
    'RECEIVER_WALLET_NOT_FOUND',
    'SENDER_WALLET_FROZEN',
    'RECEIVER_WALLET_FROZEN',
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
  ]
  if (known.includes(message)) {
    const status =
      message === 'UNAUTHORIZED' ? 401 :
      message === 'FORBIDDEN' ? 403 :
      message === 'NOT_FOUND' ? 404 :
      message === 'ALREADY_EXISTS' ? 409 :
      400
    return err(message, status)
  }
  console.error('[unhandled]', e)
  return err('Internal server error', 500)
}

export function parsePagination(req: Request) {
  const url = new URL(req.url)
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
    const body = await req.json()
    const data = schema.parse(body)
    return { data }
  } catch (e) {
    if (e instanceof z.ZodError) {
      const issues = (e.issues || e.errors || []) as any[]
      return { error: issues.map((x) => `${(x.path || []).join('.')}: ${x.message}`).join('; ') }
    }
    return { error: 'Invalid request body' }
  }
}
