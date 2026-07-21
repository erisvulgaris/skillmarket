'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, type Order } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits } from '@/components/sc-badge'
import { ClipboardList, Package, CheckCircle2, Clock, XCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <Clock className="h-3 w-3" /> },
  in_progress: { label: 'In Progress', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <Package className="h-3 w-3" /> },
  delivered: { label: 'Delivered', color: 'text-violet-500', bg: 'bg-violet-500/10', icon: <CheckCircle2 className="h-3 w-3" /> },
  completed: { label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bg: 'bg-muted', icon: <XCircle className="h-3 w-3" /> },
  disputed: { label: 'Disputed', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: <AlertTriangle className="h-3 w-3" /> },
}

export function OrdersView() {
  const { setView, user } = useApp()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'buyer' | 'seller'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: Order[] }>(`/api/orders?role=${tab}&limit=50`)
      setOrders(data.items)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Orders</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-muted rounded-2xl">
        {([
          { k: 'all', label: 'All' },
          { k: 'buyer', label: 'Buying' },
          { k: 'seller', label: 'Selling' },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition',
              tab === t.k ? 'bg-card shadow-sm' : 'text-muted-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          : orders.length === 0
          ? <div className="text-center py-16">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <button onClick={() => setView('marketplace')} className="mt-3 text-sm font-semibold text-primary">
                Browse services →
              </button>
            </div>
          : orders.map((o) => {
              const meta = STATUS_META[o.status] || STATUS_META.pending
              const isBuyer = o.buyerId === user?.id
              const counterparty = isBuyer ? o.seller : o.buyer
              return (
                <motion.button
                  key={o.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setView('order-detail', { id: o.id })}
                  className="w-full text-left active:scale-[0.99] transition"
                >
                  <Card className="p-3 flex items-center gap-3">
                    <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', meta.bg)}>
                      <span className={meta.color}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{o.service.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {isBuyer ? 'From' : 'To'} @{counterparty.username} · {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={clsx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold', meta.bg, meta.color)}>
                          {meta.icon}{meta.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{o.orderNo.slice(-8)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <SkillCredits amount={o.price} size="sm" />
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 ml-auto" />
                    </div>
                  </Card>
                </motion.button>
              )
            })}
      </div>
    </div>
  )
}
