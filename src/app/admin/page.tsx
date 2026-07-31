import { requireAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'
import { SkeletonCard } from './_components/skeleton-card'
import { DashboardClient } from './_components/dashboard-client'
import { Suspense } from 'react'

export const metadata = { title: 'Dashboard · Admin · SkillCart' }

export default async function AdminDashboardPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const cookieStore = await cookies()

  let data: DashboardData
  try {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Failed to load')
    data = json.data
  } catch {
    return <DashboardError />
  }

  let analytics: AnalyticsData | null = null
  try {
    const res = await fetch(`${baseUrl}/api/admin/analytics`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    })
    const json = await res.json()
    if (json.success) analytics = json.data
  } catch {}

  return <DashboardClient data={data} analytics={analytics} />
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

function DashboardError() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <p className="text-sm font-semibold text-muted-foreground">Failed to load dashboard data</p>
      <p className="text-xs text-muted-foreground mt-1">Try refreshing the page</p>
    </div>
  )
}

interface DashboardData {
  stats: Record<string, number>
  dailyTransfers: { date: string; count: number; volume: number }[]
  recentActivity: { id: string; action: string; entityType: string; entityId: string; actor: string; createdAt: string }[]
}

interface AnalyticsData {
  kpis: Record<string, number>
  charts: {
    signupChart: { date: string; count: number }[]
    revenueChart: { date: string; revenue: number }[]
    transferChart: { date: string; count: number; volume: number }[]
    orderDistribution: { status: string; count: number }[]
    categoryDistribution: { name: string; icon: string; count: number }[]
  }
  topServices: { id: string; title: string; price: number; views: number; completedOrders: number; ratingAvg: number }[]
  topSellers: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null; isVerified?: boolean; lifetimeEarned: number }[]
}
