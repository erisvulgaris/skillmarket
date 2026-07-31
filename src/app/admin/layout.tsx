import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', initials: 'D' },
  { href: '/admin/users', label: 'Users', initials: 'U' },
  { href: '/admin/services', label: 'Services', initials: 'S' },
  { href: '/admin/commissions', label: 'Commissions', initials: 'C' },
  { href: '/admin/payments', label: 'Payments', initials: 'P' },
  { href: '/admin/settings', label: 'Settings', initials: 'S' },
] as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              S
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Admin Panel</p>
              <p className="text-[10px] text-muted-foreground">SkillCart</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <span className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {item.initials}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <span>←</span>
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 md:px-6 h-14">
            <Link href="/admin" className="md:hidden h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              S
            </Link>
            <div className="flex-1" />
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>←</span>
              <span className="hidden sm:inline">Marketplace</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
