'use client'

import { useApp } from '@/lib/store'
import { Search, Bell, Coins, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'

export function TopBar() {
  const { user, setView, unreadCount } = useApp()
  const { theme, setTheme } = useTheme()
  const [mounted] = useState(() => typeof window !== 'undefined')

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <button
          onClick={() => setView('marketplace')}
          className="flex items-center gap-2 active:scale-95 transition-transform"
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-black text-sm">S</span>
          </div>
          <span className="font-bold text-base tracking-tight">SkillMarket</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setView('wallet')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary active:scale-95 transition-transform"
          >
            <Coins className="h-3.5 w-3.5" />
            <span className="text-xs font-bold tabular-nums">
              {user?.wallet ? new Intl.NumberFormat('en-US').format(user.wallet.availableBalance) : 0}
            </span>
          </button>

          <button
            onClick={() => setView('search')}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-95 transition"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={() => setView('notifications')}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-95 transition relative"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-95 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
