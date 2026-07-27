import { createHmac, timingSafeEqual } from 'crypto'
import { db } from './db'

const RAZORPAY_API = 'https://api.razorpay.com/v1'

function btoa(str: string): string {
  return Buffer.from(str).toString('base64')
}

function safeCompare(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(actual, 'hex')
  if (a.length !== b.length || a.length === 0) return false
  return timingSafeEqual(a, b)
}

async function getActiveKey() {
  const key = await db.razorpayKey.findFirst({ where: { active: true }, orderBy: { createdAt: 'desc' } })
  if (!key) throw new Error('RAZORPAY_KEY_NOT_FOUND')
  return key
}

async function razorpayFetch(path: string, options: RequestInit = {}) {
  const key = await getActiveKey()
  const auth = btoa(`${key.keyId}:${key.keySecret}`)
  const res = await fetch(`${RAZORPAY_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.text()
    console.error('[razorpay] API error:', res.status, body)
    throw new Error(`RAZORPAY_API_ERROR`)
  }
  return res.json()
}

export async function createRazorpayOrder(params: {
  amount: number
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}) {
  const { amount, currency = 'INR', receipt, notes } = params
  const data = await razorpayFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      notes,
    }),
  })
  return data as {
    id: string
    entity: string
    amount: number
    amount_paid: number
    amount_due: number
    currency: string
    receipt: string
    status: string
    attempts: number
    created_at: number
  }
}

export async function verifyPaymentSignature(params: {
  orderId: string
  paymentId: string
  signature: string
}) {
  const { orderId, paymentId, signature } = params
  const key = await getActiveKey()
  const expected = createHmac('sha256', key.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')
  return safeCompare(expected, signature)
}

export async function capturePayment(paymentId: string, amount: number) {
  return razorpayFetch(`/payments/${paymentId}/capture`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  })
}

export async function fetchPayment(paymentId: string) {
  return razorpayFetch(`/payments/${paymentId}`)
}

export async function verifyWebhookSignature(
  body: string,
  signature: string,
  webhookSecret: string,
) {
  const expected = createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')
  return safeCompare(expected, signature)
}

export async function listRazorpayKeys() {
  return db.razorpayKey.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function saveRazorpayKey(data: {
  label: string
  keyId: string
  keySecret: string
  active?: boolean
}) {
  return db.$transaction(async (tx) => {
    if (data.active) {
      await tx.razorpayKey.updateMany({ where: { active: true }, data: { active: false } })
    }
    return tx.razorpayKey.create({ data })
  })
}

export async function deleteRazorpayKey(id: string) {
  const key = await db.razorpayKey.findUnique({ where: { id } })
  if (!key) throw new Error('NOT_FOUND')
  if (key.active) {
    const otherKeys = await db.razorpayKey.findMany({
      where: { active: false, id: { not: id } },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })
    if (otherKeys.length === 0) {
      throw new Error('CANNOT_DELETE_LAST_ACTIVE_KEY')
    }
    await db.razorpayKey.update({ where: { id: otherKeys[0].id }, data: { active: true } })
  }
  return db.razorpayKey.delete({ where: { id } })
}