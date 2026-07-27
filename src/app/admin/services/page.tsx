import { requireAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'
import { ServicesClient } from './services-client'
import { Suspense } from 'react'

export const metadata = { title: 'Services · Admin · SkillMarket' }

export default async function AdminServicesPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage platform services and listings</p>
      </div>

      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesContent />
      </Suspense>
    </div>
  )
}

async function ServicesContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const cookieStore = await cookies()

  try {
    const [servicesRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin/services?limit=100`, {
        cache: 'no-store',
        headers: { cookie: cookieStore.toString() },
      }),
      fetch(`${baseUrl}/api/admin/services?limit=1`, {
        cache: 'no-store',
        headers: { cookie: cookieStore.toString() },
      }),
    ])

    const servicesJson = await servicesRes.json()
    if (!servicesJson.success) throw new Error(servicesJson.error || 'Failed to load')

    return (
      <ServicesClient
        initialServices={servicesJson.data.items}
        initialTotal={servicesJson.data.total}
        initialPage={servicesJson.data.page}
        initialLimit={servicesJson.data.limit}
      />
    )
  } catch {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Failed to load services</p>
        <p className="text-xs text-muted-foreground mt-1">Try refreshing the page</p>
      </div>
    )
  }
}

function ServicesSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="h-9 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
