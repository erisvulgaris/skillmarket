import crypto from 'crypto'

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_RyhshDxLuZASF6'
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '5qhoE4dsqCuLLWic8ALhn43K'

export interface CreateOrderParams {
  amountInRupees: number
  receipt: string
  notes?: Record<string, string>
}

export async function createRazorpayOrder({ amountInRupees, receipt, notes = {} }: CreateOrderParams) {
  const amountInPaise = Math.round(amountInRupees * 100)
  const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.description || 'Failed to create Razorpay order')
  }

  return {
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    key: RAZORPAY_KEY_ID,
  }
}

export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}): boolean {
  const text = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex')

  return expectedSignature === razorpaySignature
}