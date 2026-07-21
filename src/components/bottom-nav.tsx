'use client'

import { useApp } from '@/lib/store'
import { Home, Wallet, ClipboardList, MessageSquare, User } from 'lucide-react'
import { clsx } from 'clsx'

const tabs = [
  { view: 'marketplace', label: 'Home', icon: Home },
  { view: 'orders', label: 'Orders', icon: ClipboardList },
  { view: 'wallet', label: 'Wallet', icon: Wallet },
  { view: 'messages', label: 'Chats', icon: MessageSquare },
  { view: 'profile', label: 'Profile', icon: User },
] as const

export function BottomNav() {
  const { view, setView } = useApp()

  const activeTab = (() => {
    if (view === 'marketplace' || view === 'service-detail' || view === 'search' || view === 'saved') return 'marketplace'
    if (view === 'orders' || view === 'order-detail') return 'orders'
    if (view === 'wallet' || view === 'transfer' || view === 'buy-credits') return 'wallet'
    if (view === 'messages' || view === 'conversation') return 'messages'
    if (view === 'profile' || view === 'admin' || view === 'referrals' || view === 'notifications' || view === 'create-service') return 'profile'
    return 'marketplace'
  })()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/40 pb-safe">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const active = activeTab === tab.view
          const Icon = tab.icon
          return (
            <button
              key={tab.view}
              onClick={() => setView(tab.view as any)}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all active:scale-90',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-label={tab.label}
            >
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
              )}
              <Icon className={clsx('transition-transform', active ? 'h-5 w-5 scale-110' : 'h-5 w-5')} strokeWidth={active ? 2.5 : 2} />
              <span className={clsx('text-[10px] font-medium', active && 'font-semibold')}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
