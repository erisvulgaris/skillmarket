import { requireAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'
import { PaymentsClient } from './payments-client'
import { Suspense } from 'react'

export const metadata = { title: 'Payments · Admin · SkillMarket' }

export default async function AdminPaymentsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Razorpay payment management and transaction history</p>
      </div>

      <Suspense fallback={<PaymentsSkeleton />}>
        <PaymentsContent />
      </Suspense>
    </div>
  )
}

async function PaymentsContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const cookieStore = await cookies()

  try {
    const res = await fetch(`${baseUrl}/api/admin/payments?limit=100`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Failed to load')

    return (
      <PaymentsClient
        initialPayments={json.data.items || []}
        initialTotal={json.data.total || 0}
        initialPage={json.data.page || 1}
        initialLimit={json.data.limit || 50}
      />
    )
  } catch {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Failed to load payments</p>
        <p className="text-xs text-muted-foreground mt-1">Try refreshing the page</p>
      </div>
    )
  }
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-7 w-24 bg-muted rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-9 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-muted rounded" />
                <div className="h-3 w-56 bg-muted rounded" />
              </div>
              <div className="h-5 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
