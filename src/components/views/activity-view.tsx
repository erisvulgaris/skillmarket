'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { ArrowLeft, ArrowDownLeft, ArrowUpLeft, TrendingUp, TrendingDown, Plus, Lock, Gift, ShoppingBag, Activity as ActivityIcon, Filter } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

type Tx = {
  id: string
  type: string
  direction: string
  amount: number
  balanceAfter: number
  note: string | null
  counterpartyId: string | null
  createdAt: string
}

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  purchase: { label: 'Purchase', color: 'text-primary', icon: <Plus className="h-3.5 w-3.5" /> },
  transfer_in: { label: 'Received', color: 'text-emerald-500', icon: <ArrowDownLeft className="h-3.5 w-3.5" /> },
  transfer_out: { label: 'Sent', color: 'text-rose-500', icon: <ArrowUpLeft className="h-3.5 w-3.5" /> },
  order_payment: { label: 'Order Payment', color: 'text-rose-500', icon: <Lock className="h-3.5 w-3.5" /> },
  order_refund: { label: 'Refund', color: 'text-emerald-500', icon: <ArrowDownLeft className="h-3.5 w-3.5" /> },
  order_earnings: { label: 'Earnings', color: 'text-emerald-500', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  referral_reward: { label: 'Referral', color: 'text-primary', icon: <Gift className="h-3.5 w-3.5" /> },
  admin_adjustment: { label: 'Adjustment', color: 'text-muted-foreground', icon: <ActivityIcon className="h-3.5 w-3.5" /> },
  fee: { label: 'Fee', color: 'text-rose-500', icon: <TrendingDown className="h-3.5 w-3.5" /> },
}

export function ActivityView() {
  const { setView, user } = useApp()
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filter !== 'all') params.set('type', filter)
      const data = await api.get<{ items: Tx[] }>(`/api/wallet/transactions?${params}`)
      setTxs(data.items)
    } catch {} finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  // Group transactions by day
  const grouped = txs.reduce((acc, tx) => {
    const day = new Date(tx.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!acc[day]) acc[day] = []
    acc[day].push(tx)
    return acc
  }, {} as Record<string, Tx[]>)

  const totalIn = txs.filter((t) => t.direction === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalOut = txs.filter((t) => t.direction === 'debit').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('settings')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Activity Log</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase">Total In</span>
            </div>
            <p className="text-lg font-bold tabular-nums mt-1">{formatSC(totalIn)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-1.5 text-rose-500">
              <ArrowUpLeft className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase">Total Out</span>
            </div>
            <p className="text-lg font-bold tabular-nums mt-1">{formatSC(totalOut)}</p>
          </Card>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {[
            { k: 'all', label: 'All' },
            { k: 'transfer_in', label: 'Received' },
            { k: 'transfer_out', label: 'Sent' },
            { k: 'order_earnings', label: 'Earnings' },
            { k: 'order_payment', label: 'Payments' },
            { k: 'purchase', label: 'Purchases' },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={clsx(
                'flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition',
                filter === f.k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transactions grouped by day */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12">
            <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayTxs]) => (
            <div key={day} className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground px-1 sticky top-14 bg-background/80 backdrop-blur py-1">{day}</p>
              {dayTxs.map((tx, i) => {
                const meta = TYPE_META[tx.type] || TYPE_META.admin_adjustment
                const isCredit = tx.direction === 'credit'
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 30 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/40"
                  >
                    <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', isCredit ? 'bg-emerald-500/10' : 'bg-rose-500/10')}>
                      <span className={meta.color}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{meta.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{tx.note || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={clsx('text-sm font-bold tabular-nums', isCredit ? 'text-emerald-500' : 'text-rose-500')}>
                        {isCredit ? '+' : '−'}{formatSC(tx.amount)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
