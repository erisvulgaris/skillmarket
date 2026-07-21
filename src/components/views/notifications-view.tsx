'use client'

import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bell, Check, ShoppingBag, Send, MessageSquare, Star, Gift, AlertTriangle, Megaphone } from 'lucide-react'
import { useEffect } from 'react'
import { clsx } from 'clsx'

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  order: { icon: <ShoppingBag className="h-4 w-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  payment: { icon: <Send className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  transfer: { icon: <Send className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  message: { icon: <MessageSquare className="h-4 w-4" />, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  review: { icon: <Star className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  dispute: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  announcement: { icon: <Megaphone className="h-4 w-4" />, color: 'text-primary', bg: 'bg-primary/10' },
  referral: { icon: <Gift className="h-4 w-4" />, color: 'text-primary', bg: 'bg-primary/10' },
}

export function NotificationsView() {
  const { setView, notifications, loadNotifications, markNotificationRead, markAllRead } = useApp()

  useEffect(() => { loadNotifications() }, [loadNotifications])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('marketplace')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Notifications</h1>
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">Mark all read</Button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-2 pb-24">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </Card>
        ) : (
          notifications.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.announcement
            const unread = !n.readAt
            return (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={clsx('w-full text-left active:scale-[0.99] transition')}
              >
                <Card className={clsx('p-3 flex items-start gap-3', unread && 'border-primary/40 bg-primary/5')}>
                  <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg, meta.color)}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate flex-1">{n.title}</p>
                      {unread && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </Card>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
