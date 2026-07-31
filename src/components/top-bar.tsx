'use client'

import { useApp } from '@/lib/store'
import { useGuestStore } from '@/lib/guest-store'
import { Search, Bell, Coins, Moon, Sun, ShoppingCart, User as UserIcon, LogIn } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'

export function TopBar({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const user = useApp(s => s.user)
  const setView = useApp(s => s.setView)
  const unreadCount = useApp(s => s.unreadCount)
  const cart = useGuestStore(s => s.cart)
  const { theme, setTheme } = useTheme()
  const [mounted] = useState(() => typeof window !== 'undefined')

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe backdrop-blur-md bg-background/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand logo & tagline */}
        <button
          onClick={() => setView('marketplace')}
          className="flex items-center gap-2.5 active:scale-95 transition-transform group"
        >
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
            <span className="text-white font-black text-base">S</span>
          </div>
          <div className="text-left">
            <span className="font-black text-lg tracking-tight block leading-none">SkillMarket</span>
            <span className="text-[10px] text-muted-foreground hidden sm:block">Digital Marketplace & SkillCredits</span>
          </div>
        </button>

        {/* Search bar input for desktop */}
        <button
          onClick={() => setView('search')}
          className="hidden md:flex items-center gap-2 flex-1 max-w-md px-3.5 py-2 rounded-2xl bg-muted/50 border border-border/50 text-xs text-muted-foreground hover:bg-muted transition"
        >
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Search products, courses, services, creators…</span>
          <kbd className="ml-auto px-1.5 py-0.5 rounded bg-background border border-border/60 text-[10px] font-mono">⌘K</kbd>
        </button>

        {/* Action icons & User profile */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => setView('wallet')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 active:scale-95 transition shadow-xs"
              >
                <Coins className="h-3.5 w-3.5" />
                <span className="text-xs font-bold tabular-nums">
                  {new Intl.NumberFormat('en-US').format(user.wallet?.availableBalance || 0)} SC
                </span>
              </button>

              <button
                onClick={() => setView('notifications')}
                className="h-9 w-9 rounded-xl border border-border/40 flex items-center justify-center hover:bg-accent active:scale-95 transition relative"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Guest Cart indicator */}
              <button
                onClick={() => setView('buy-credits')}
                className="h-9 w-9 rounded-xl border border-border/40 flex items-center justify-center hover:bg-accent active:scale-95 transition relative"
                aria-label="Cart"
              >
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold transition active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            </>
          )}

          <button
            onClick={() => setView('search')}
            className="md:hidden h-9 w-9 rounded-xl border border-border/40 flex items-center justify-center hover:bg-accent active:scale-95 transition"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9 rounded-xl border border-border/40 flex items-center justify-center hover:bg-accent active:scale-95 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
