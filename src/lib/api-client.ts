// Centralized client-side API helpers.

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T = any>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    credentials: 'include',
  })
  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // not json
  }
  if (!res.ok) {
    const rawError = json?.error || `Request failed (${res.status})`
    // Map internal error codes to user-friendly messages
    const friendlyErrors: Record<string, string> = {
      'INVALID_CREDENTIALS': 'Invalid email/username or password',
      'UNAUTHORIZED': 'Please sign in to continue',
      'FORBIDDEN': 'You do not have permission to do this',
      'NOT_FOUND': 'The requested item was not found',
      'ALREADY_EXISTS': 'This already exists. Try a different value.',
      'INSUFFICIENT_BALANCE': 'Insufficient SkillCredits balance',
      'WALLET_FROZEN': 'Your wallet is frozen. Contact support.',
      'WALLET_NOT_FOUND': 'Wallet not found',
      'INVALID_PIN': 'Invalid transaction PIN',
      'PIN_REQUIRED': 'Transaction PIN is required',
      'CANNOT_TRANSFER_TO_SELF': 'You cannot transfer credits to yourself',
      'SENDER_WALLET_FROZEN': 'Your wallet is frozen',
      'RECEIVER_WALLET_FROZEN': 'Recipient wallet is frozen',
      'SENDER_INACTIVE': 'Your account is not active',
      'RECEIVER_INACTIVE': 'Recipient account is not active',
      'SERVICE_NOT_AVAILABLE': 'This service is not available',
      'CANNOT_REVIEW': 'You cannot review this order',
      'ORDER_NOT_DELIVERABLE': 'This order cannot be delivered in its current state',
    }
    const message = friendlyErrors[rawError] || rawError
    throw new ApiError(message, res.status)
  }
  return json?.data as T
}

export const api = {
  get: <T = any>(url: string) => request<T>(url),
  post: <T = any>(url: string, body?: any) => request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(url: string, body?: any) => request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(url: string) => request<T>(url, { method: 'DELETE' }),
}

export type User = {
  id: string
  username: string
  email: string
  role: string
  status: string
  referralCode: string
  twoFactorEnabled: boolean
  profile: {
    displayName: string | null
    bio: string | null
    avatarUrl: string | null
    coverUrl: string | null
    location: string | null
    languages: string[]
    skills: string[]
    responseTimeMins: number
    isVerified: boolean
    verificationType: string | null
  } | null
  wallet: {
    availableBalance: number
    reservedBalance: number
    pendingBalance: number
    lifetimePurchased: number
    lifetimeEarned: number
    lifetimeSent: number
    lifetimeReceived: number
    lifetimeSpent: number
    frozen: boolean
  } | null
}

export type Service = {
  id: string
  title: string
  slug: string
  description: string
  price: number
  deliveryDays: number
  tags: string[]
  skills: string[]
  images: string[]
  faqs: { q: string; a: string }[]
  availability: string
  status: string
  featured: boolean
  views: number
  ratingAvg: number
  ratingCount: number
  completedOrders: number
  categoryId: string | null
  category?: { id: string; name: string; slug: string } | null
  seller: {
    id: string
    username: string
    displayName?: string | null
    avatarUrl?: string | null
    isVerified?: boolean
  }
  createdAt: string
}

export type Order = {
  id: string
  orderNo: string
  buyerId: string
  sellerId: string
  serviceId: string
  price: number
  requirements: string | null
  status: string
  paymentStatus: string
  createdAt: string
  acceptedAt: string | null
  deliveredAt: string | null
  completedAt: string | null
  service: { id: string; title: string; price: number }
  buyer: { id: string; username: string; avatarUrl?: string | null }
  seller: { id: string; username: string; avatarUrl?: string | null }
}

export type Notification = {
  id: string
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
}
