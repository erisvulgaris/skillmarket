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
    const message = json?.error || `Request failed (${res.status})`
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
