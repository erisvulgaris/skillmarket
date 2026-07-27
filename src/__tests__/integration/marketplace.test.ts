import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@/lib/db'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

const mockCategories = [
  { id: 'cat-001', name: 'Design', slug: 'design', description: 'Design services', icon: 'palette', sortOrder: 1, parentId: null, createdAt: new Date(), updatedAt: new Date(), children: [
    { id: 'cat-003', name: 'Logo Design', slug: 'logo-design', description: 'Logo design', icon: null, sortOrder: 1, parentId: 'cat-001', createdAt: new Date(), updatedAt: new Date() },
  ]},
  { id: 'cat-002', name: 'Development', slug: 'development', description: 'Dev services', icon: 'code', sortOrder: 2, parentId: null, createdAt: new Date(), updatedAt: new Date(), children: [] },
]

const mockServices = [
  {
    id: 'service-001',
    title: 'Professional Logo Design',
    description: 'I will design a professional logo',
    price: 5000,
    currency: 'credits' as const,
    tags: '["logo","design"]',
    skills: '["illustrator","photoshop"]',
    images: '[]',
    faqs: '[]',
    deliveryDays: 3,
    status: 'active' as const,
    categoryId: 'cat-001',
    userId: 'seller-001',
    sellerId: 'seller-001',
    views: 150,
    trendingScore: 10,
    ratingAvg: 4.5,
    completedOrders: 15,
    createdAt: new Date('2026-07-01'),
    updatedAt: new Date('2026-07-20'),
    featured: true,
    deletedAt: null,
    seller: { id: 'seller-001', username: 'designer1', profile: { displayName: 'Designer One', avatarUrl: null } },
    category: mockCategories[0],
    packages: [],
    reviews: [],
    _count: { reviews: 2 },
  },
  {
    id: 'service-002',
    title: 'Full Stack Web Development',
    description: 'Complete web application development',
    price: 15000,
    currency: 'credits' as const,
    tags: '["web","fullstack"]',
    skills: '["react","node"]',
    images: '[]',
    faqs: '[]',
    deliveryDays: 14,
    status: 'active' as const,
    categoryId: 'cat-002',
    userId: 'seller-002',
    sellerId: 'seller-002',
    views: 300,
    trendingScore: 25,
    ratingAvg: 4.8,
    completedOrders: 25,
    createdAt: new Date('2026-06-15'),
    updatedAt: new Date('2026-07-18'),
    featured: false,
    deletedAt: null,
    seller: { id: 'seller-002', username: 'developer1', profile: { displayName: 'Developer One', avatarUrl: '/avatars/dev1.png' } },
    category: mockCategories[1],
    packages: [],
    reviews: [],
    _count: { reviews: 3 },
  },
]

describe('Marketplace — List Services', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('GET /api/marketplace/services returns paginated services', async () => {
    vi.mocked(db.service.findMany).mockResolvedValue(mockServices as any)
    vi.mocked(db.service.count).mockResolvedValue(2)

    const { GET } = await import('@/app/api/marketplace/services/route')
    const req = new Request('http://localhost/api/marketplace/services?page=1&limit=10')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.total).toBe(2)
  })

  it('GET /api/marketplace/services filters by categoryId', async () => {
    const filtered = mockServices.filter(s => s.categoryId === 'cat-001')
    vi.mocked(db.service.findMany).mockResolvedValue(filtered as any)
    vi.mocked(db.service.count).mockResolvedValue(1)

    const { GET } = await import('@/app/api/marketplace/services/route')
    const req = new Request('http://localhost/api/marketplace/services?categoryId=cat-001')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
  })

  it('GET /api/marketplace/services filters by min/max price', async () => {
    const filtered = mockServices.filter(s => s.price >= 3000 && s.price <= 10000)
    vi.mocked(db.service.findMany).mockResolvedValue(filtered as any)
    vi.mocked(db.service.count).mockResolvedValue(1)

    const { GET } = await import('@/app/api/marketplace/services/route')
    const req = new Request('http://localhost/api/marketplace/services?minPrice=3000&maxPrice=10000')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(1)
  })

  it('GET /api/marketplace/services sorts by price_low', async () => {
    const sorted = [...mockServices].sort((a, b) => a.price - b.price)
    vi.mocked(db.service.findMany).mockResolvedValue(sorted as any)
    vi.mocked(db.service.count).mockResolvedValue(2)

    const { GET } = await import('@/app/api/marketplace/services/route')
    const req = new Request('http://localhost/api/marketplace/services?sort=price_low')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items[0].price).toBeLessThanOrEqual(body.data.items[1].price)
  })

  it('GET /api/marketplace/services sorts by price_high', async () => {
    const sorted = [...mockServices].sort((a, b) => b.price - a.price)
    vi.mocked(db.service.findMany).mockResolvedValue(sorted as any)
    vi.mocked(db.service.count).mockResolvedValue(2)

    const { GET } = await import('@/app/api/marketplace/services/route')
    const req = new Request('http://localhost/api/marketplace/services?sort=price_high')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items[0].price).toBeGreaterThanOrEqual(body.data.items[1].price)
  })

  it('GET /api/marketplace/services returns empty array when no matches', async () => {
    vi.mocked(db.service.findMany).mockResolvedValue([])
    vi.mocked(db.service.count).mockResolvedValue(0)

    const { GET } = await import('@/app/api/marketplace/services/route')
    const req = new Request('http://localhost/api/marketplace/services?categoryId=nonexistent')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.items).toHaveLength(0)
    expect(body.data.total).toBe(0)
  })
})

describe('Marketplace — Service Detail', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('GET /api/services/[id] returns service detail', async () => {
    const detail = {
      ...mockServices[0],
      reviews: [{
        id: 'rev-001', rating: 5, content: 'Great!', author: { id: 'user-001', username: 'alice', profile: { displayName: 'Alice', avatarUrl: null } }, createdAt: new Date(), updatedAt: new Date(), status: 'published',
      }],
      packages: [{ id: 'pkg-001', name: 'Basic', price: 5000, sortOrder: 1, features: '[]' }],
    }
    vi.mocked(db.service.findUnique).mockResolvedValue(detail as any)
    vi.mocked(db.savedService.findUnique).mockResolvedValue(null)

    const { GET } = await import('@/app/api/services/[id]/route')
    const req = new Request(`http://localhost/api/services/${mockServices[0].id}`)
    const res = await GET(req, { params: Promise.resolve({ id: mockServices[0].id }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.service.id).toBe('service-001')
    expect(body.data.service.title).toBe('Professional Logo Design')
  })

  it('GET /api/services/[id] returns 404 for deleted service', async () => {
    vi.mocked(db.service.findUnique).mockResolvedValue(null)

    const { GET } = await import('@/app/api/services/[id]/route')
    const req = new Request(`http://localhost/api/services/nonexistent`)
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })
})

describe('Marketplace — Categories', () => {
  it('GET /api/marketplace/categories returns parent categories with children', async () => {
    vi.mocked(db.category.findMany).mockResolvedValue(mockCategories as any)

    const { GET } = await import('@/app/api/marketplace/categories/route')
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.categories).toHaveLength(2)
    expect(body.data.categories[0].children).toHaveLength(1)
  })
})

describe('Marketplace — Compare', () => {
  it('GET /api/services/compare returns comparison of services', async () => {
    vi.mocked(db.service.findMany).mockResolvedValue(mockServices as any)

    const { GET } = await import('@/app/api/services/compare/route')
    const req = new Request(`http://localhost/api/services/compare?ids=${mockServices.map(s => s.id).join(',')}`)
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.services).toHaveLength(2)
  })
})

describe('Marketplace — Save/Like Services', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('POST /api/services/[id]/save saves a service', async () => {
    vi.mocked(db.savedService.upsert).mockResolvedValue({ id: 'saved-001', userId: 'buyer-001', serviceId: mockServices[0].id } as any)
    const { getCurrentUser } = await import('@/lib/auth')
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'buyer-001', username: 'buyer' } as any)

    const { POST } = await import('@/app/api/services/[id]/save/route')
    const req = new Request(`http://localhost/api/services/${mockServices[0].id}/save`, { method: 'POST' })
    const res = await POST(req, { params: Promise.resolve({ id: mockServices[0].id }) })
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.saved).toBe(true)
  })

  it('DELETE /api/services/[id]/save unsaves a service', async () => {
    vi.mocked(db.savedService.deleteMany).mockResolvedValue({ count: 1 } as any)
    const { getCurrentUser } = await import('@/lib/auth')
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'buyer-001', username: 'buyer' } as any)

    const { DELETE } = await import('@/app/api/services/[id]/save/route')
    const req = new Request(`http://localhost/api/services/${mockServices[0].id}/save`, { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: mockServices[0].id }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.saved).toBe(false)
  })
})
