'use client'

import { useApp } from '@/lib/store'
import { Home, Wallet, ClipboardList, MessageSquare, User, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

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
    if (view === 'marketplace' || view === 'service-detail' || view === 'search' || view === 'saved' || view === 'seller-profile') return 'marketplace'
    if (view === 'orders' || view === 'order-detail' || view === 'dispute') return 'orders'
    if (view === 'wallet' || view === 'transfer' || view === 'buy-credits') return 'wallet'
    if (view === 'messages' || view === 'conversation') return 'messages'
    if (view === 'profile' || view === 'admin' || view === 'referrals' || view === 'notifications' || view === 'create-service') return 'profile'
    return 'marketplace'
  })()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border/40 pb-safe">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around relative">
        {tabs.map((tab, idx) => {
          const active = activeTab === tab.view
          const Icon = tab.icon
          // Insert FAB in the middle (between orders and wallet)
          if (idx === 2) {
            return (
              <div key="fab-spacer" className="flex items-center">
                <NavTab tab={tab} active={active} setView={setView} />
              </div>
            )
          }
          return <NavTab key={tab.view} tab={tab} active={active} setView={setView} />
        })}

        {/* Floating create button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setView('create-service')}
          className="absolute -top-5 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center fab-shadow"
          aria-label="Create service"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </motion.button>
      </div>
    </nav>
  )
}

function NavTab({ tab, active, setView }: { tab: any; active: boolean; setView: (v: any) => void }) {
  const Icon = tab.icon
  return (
    <button
      onClick={() => setView(tab.view as any)}
      className={clsx(
        'relative flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all active:scale-90',
        active ? 'text-primary' : 'text-muted-foreground'
      )}
      aria-label={tab.label}
    >
      {active && (
        <motion.span
          layoutId="nav-dot"
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"
        />
      )}
      <Icon className={clsx('transition-transform', active ? 'h-5 w-5 scale-110' : 'h-5 w-5')} strokeWidth={active ? 2.5 : 2} />
      <span className={clsx('text-[10px] font-medium', active && 'font-semibold')}>{tab.label}</span>
    </button>
  )
}
