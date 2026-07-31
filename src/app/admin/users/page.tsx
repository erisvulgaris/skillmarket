import { requireAdmin } from '@/lib/auth'
import { cookies } from 'next/headers'
import { UsersClient } from './users-client'
import { Suspense } from 'react'

export const metadata = { title: 'Users · Admin · SkillCart' }

export default async function AdminUsersPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage platform users</p>
      </div>

      <Suspense fallback={<UsersTableSkeleton />}>
        <UsersContent />
      </Suspense>
    </div>
  )
}

async function UsersContent() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const cookieStore = await cookies()

  try {
    const res = await fetch(`${baseUrl}/api/admin/users?limit=100`, {
      cache: 'no-store',
      headers: { cookie: cookieStore.toString() },
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Failed to load')

    return (
      <UsersClient
        initialUsers={json.data.items}
        initialTotal={json.data.total}
        initialPage={json.data.page}
        initialLimit={json.data.limit}
      />
    )
  } catch {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-semibold text-muted-foreground">Failed to load users</p>
        <p className="text-xs text-muted-foreground mt-1">Try refreshing the page</p>
      </div>
    )
  }
}

function UsersTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="h-9 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
