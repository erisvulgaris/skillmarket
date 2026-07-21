'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, type User } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { ArrowDownLeft, ArrowUpLeft, Send, Plus, QrCode, Download, Filter, Search, TrendingUp, TrendingDown, Lock, Wallet as WalletIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

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
  referral_reward: { label: 'Referral', color: 'text-primary', icon: <Plus className="h-3.5 w-3.5" /> },
  admin_adjustment: { label: 'Adjustment', color: 'text-muted-foreground', icon: <WalletIcon className="h-3.5 w-3.5" /> },
  fee: { label: 'Fee', color: 'text-rose-500', icon: <TrendingDown className="h-3.5 w-3.5" /> },
}

export function WalletView() {
  const { user, setView } = useApp()
  const [txs, setTxs] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filter !== 'all') params.set('type', filter)
      if (search) params.set('search', search)
      const data = await api.get<{ items: Tx[] }>(`/api/wallet/transactions?${params}`)
      setTxs(data.items)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  const wallet = user?.wallet

  const exportCsv = async () => {
    try {
      window.open('/api/wallet/export', '_blank')
      toast.success('Statement exported')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-5 shadow-2xl shadow-primary/20"
      >
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 font-medium uppercase tracking-wide">Available Balance</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-4xl font-black tabular-nums ticker">{formatSC(wallet?.availableBalance || 0)}</span>
                <span className="text-sm opacity-80 font-medium">SC</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <WalletIcon className="h-6 w-6" />
            </div>
          </div>

          {/* Reserved indicator */}
          {(wallet?.reservedBalance || 0) > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] font-medium">
              <Lock className="h-3 w-3" />
              {formatSC(wallet.reservedBalance)} SC in escrow
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <ActionBtn icon={<Send className="h-4 w-4" />} label="Send" onClick={() => setView('transfer')} />
            <ActionBtn icon={<Plus className="h-4 w-4" />} label="Buy" onClick={() => setView('buy-credits')} />
            <ActionBtn icon={<QrCode className="h-4 w-4" />} label="Receive" onClick={() => setView('transfer', { tab: 'receive' })} />
            <ActionBtn icon={<Download className="h-4 w-4" />} label="Export" onClick={exportCsv} />
          </div>
        </div>
      </motion.div>

      {/* Sub balances */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Reserved" value={wallet?.reservedBalance || 0} hint="In escrow" />
        <StatCard label="Pending" value={wallet?.pendingBalance || 0} hint="Processing" />
        <StatCard label="Purchased" value={wallet?.lifetimePurchased || 0} hint="Lifetime" />
      </div>

      {/* Lifetime stats */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Lifetime Activity</p>
        <div className="grid grid-cols-2 gap-3">
          <LifetimeStat label="Earned" value={wallet?.lifetimeEarned || 0} icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-500" />} />
          <LifetimeStat label="Spent" value={wallet?.lifetimeSpent || 0} icon={<TrendingDown className="h-3.5 w-3.5 text-rose-500" />} />
          <LifetimeStat label="Sent" value={wallet?.lifetimeSent || 0} icon={<ArrowUpLeft className="h-3.5 w-3.5 text-rose-500" />} />
          <LifetimeStat label="Received" value={wallet?.lifetimeReceived || 0} icon={<ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />} />
        </div>
      </Card>

      {/* Monthly summary */}
      <MonthlySummary transactions={txs} />

      {/* Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Transactions</h3>
          <button onClick={exportCsv} className="text-xs text-primary font-semibold active:scale-95">Export CSV</button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {[
            { k: 'all', label: 'All' },
            { k: 'transfer_in', label: 'Received' },
            { k: 'transfer_out', label: 'Sent' },
            { k: 'purchase', label: 'Purchases' },
            { k: 'order_earnings', label: 'Earnings' },
            { k: 'order_payment', label: 'Payments' },
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full h-10 rounded-xl bg-muted/60 border border-border/40 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            : txs.length === 0
            ? <div className="text-center py-10 text-sm text-muted-foreground">No transactions yet</div>
            : txs.map((tx) => <TxRow key={tx.id} tx={tx} />)}
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl bg-white/15 backdrop-blur hover:bg-white/20 active:scale-95 transition"
    >
      <span className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">{icon}</span>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  )
}

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold tabular-nums mt-0.5">{formatSC(value)}</p>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </Card>
  )
}

function LifetimeStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</span>
      <SkillCredits amount={value} size="sm" />
    </div>
  )
}

function TxRow({ tx }: { tx: Tx }) {
  const meta = TYPE_META[tx.type] || TYPE_META.admin_adjustment
  const isCredit = tx.direction === 'credit'
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/40"
    >
      <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', isCredit ? 'bg-emerald-500/10' : 'bg-rose-500/10')}>
        <span className={meta.color}>{meta.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{meta.label}</p>
        <p className="text-xs text-muted-foreground truncate">{tx.note || '—'}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={clsx('text-sm font-bold tabular-nums', isCredit ? 'text-emerald-500' : 'text-rose-500')}>
          {isCredit ? '+' : '−'}{formatSC(tx.amount)}
        </p>
        <p className="text-[10px] text-muted-foreground">Bal {formatSC(tx.balanceAfter)}</p>
      </div>
    </motion.div>
  )
}

function MonthlySummary({ transactions }: { transactions: Tx[] }) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthTx = transactions.filter((t) => new Date(t.createdAt) >= monthStart)
  const income = monthTx.filter((t) => t.direction === 'credit').reduce((s, t) => s + t.amount, 0)
  const expenses = monthTx.filter((t) => t.direction === 'debit').reduce((s, t) => s + t.amount, 0)
  const net = income - expenses
  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-muted-foreground">{monthName} Summary</p>
        <span className="text-[10px] text-muted-foreground">{monthTx.length} transactions</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Income</p>
          <p className="text-lg font-bold text-emerald-500 tabular-nums">{formatSC(income)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground">Expenses</p>
          <p className="text-lg font-bold text-rose-500 tabular-nums">{formatSC(expenses)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="text-xs font-semibold">Net</span>
        <span className={clsx('text-sm font-bold tabular-nums', net >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
          {net >= 0 ? '+' : '−'}{formatSC(Math.abs(net))}
        </span>
      </div>
    </Card>
  )
}
