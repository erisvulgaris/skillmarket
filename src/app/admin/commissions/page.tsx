import { requireAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'
import { CommissionsClient } from './commissions-client'
import { Suspense } from 'react'

export const metadata = { title: 'Commissions · Admin · SkillCart' }

export default async function AdminCommissionsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage platform commission rates and view deductions</p>
      </div>

      <Suspense fallback={<CommissionsSkeleton />}>
        <CommissionsContent />
      </Suspense>
    </div>
  )
}

async function CommissionsContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const cookieStore = await cookies()

  try {
    const [ordersRes, settingsRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin/orders?limit=50`, {
        cache: 'no-store',
        headers: { cookie: cookieStore.toString() },
      }),
      fetch(`${baseUrl}/api/admin/settings`, {
        cache: 'no-store',
        headers: { cookie: cookieStore.toString() },
      }),
    ])

    const ordersJson = await ordersRes.json()
    const settingsJson = await settingsRes.json()

    if (!ordersJson.success) throw new Error(ordersJson.error || 'Failed to load')

    const settings = settingsJson.success ? settingsJson.data.settings : []
    const defaultRateSetting = settings.find((s: any) => s.key === 'commission_default_rate')
    const defaultRate = defaultRateSetting ? parseFloat(defaultRateSetting.value) : 10

    const orders = ordersJson.data.items.map((order: any) => {
      const commissionRate = defaultRate
      const commissionAmount = Math.round(order.price * (commissionRate / 100))
      return {
        id: order.id,
        orderNo: order.orderNo || `#${order.id.slice(0, 8)}`,
        serviceTitle: order.service?.title || 'Service',
        buyerUsername: order.buyer?.username || 'unknown',
        sellerUsername: order.seller?.username || 'unknown',
        amount: order.price,
        commission: commissionAmount,
        commissionRate,
        netToSeller: order.price - commissionAmount,
        status: order.status,
        createdAt: order.createdAt,
      }
    })

    const totalCollected = orders.reduce((sum: number, o: any) => sum + o.commission, 0)
    const ordersWithCommission = orders.filter((o: any) => o.commission > 0).length

    return (
      <CommissionsClient
        orders={orders}
        defaultRate={defaultRate}
        totalCollected={totalCollected}
        avgCommissionRate={defaultRate}
        ordersWithCommission={ordersWithCommission}
      />
    )
  } catch {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Failed to load commission data</p>
        <p className="text-xs text-muted-foreground mt-1">Try refreshing the page</p>
      </div>
    )
  }
}

function CommissionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-7 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
        <div className="h-9 w-full bg-muted rounded-lg" />
        <div className="h-9 w-full bg-muted rounded-lg" />
        <div className="h-9 w-full bg-muted rounded-lg" />
      </div>
    </div>
  )
}
