'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { ArrowLeft, Users, DollarSign, Package, TrendingUp, TrendingDown, Activity, AlertTriangle, ShieldCheck, Snowflake, Star, Eye, Crown, Download, Zap, ShoppingCart, MessageSquare, Ban, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280']

export function EnterpriseDashboard({ onBack }: { onBack: () => void }) {
  const { setView } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<any>('/api/admin/analytics')
      setData(d)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const exportReport = () => {
    if (!data) return
    const csv = [
      'Metric,Value',
      `Total Users,${data.kpis.totalUsers}`,
      `New Users (30d),${data.kpis.newUsers30d}`,
      `Active Users (7d),${data.kpis.activeUsers7d}`,
      `Total Services,${data.kpis.totalServices}`,
      `Active Services,${data.kpis.activeServices}`,
      `Total Orders,${data.kpis.totalOrders}`,
      `Completed Orders,${data.kpis.completedOrders}`,
      `Pending Orders,${data.kpis.pendingOrders}`,
      `Disputed Orders,${data.kpis.disputedOrders}`,
      `Total Transfers,${data.kpis.totalTransfers}`,
      `Credit Purchases,${data.kpis.totalCreditPurchases}`,
      `Total Revenue ($),${data.kpis.totalRevenue}`,
      `Credits in Circulation,${data.kpis.totalCreditsInCirculation}`,
      `Platform Escrow,${data.kpis.platformEscrow}`,
      `Open Disputes,${data.kpis.openDisputes}`,
      `Open Reports,${data.kpis.openReports}`,
      `Open Tickets,${data.kpis.openTickets}`,
      `Frozen Wallets,${data.kpis.frozenWallets}`,
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `platform-report-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported')
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-12 text-sm text-muted-foreground">Failed to load analytics</div>

  const k = data.kpis
  const c = data.charts

  return (
    <div className="space-y-4">
      {/* Header with export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Platform Analytics</h2>
          <p className="text-[10px] text-muted-foreground">Real-time enterprise dashboard</p>
        </div>
        <Button onClick={exportReport} size="sm" variant="outline" className="rounded-xl text-xs">
          <Download className="h-3.5 w-3.5 mr-1" /> Export Report
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-2">
        <KpiCard icon={<Users className="h-4 w-4" />} label="Total Users" value={k.totalUsers} sub={`+${k.newUsers7d} this week`} trend="up" />
        <KpiCard icon={<DollarSign className="h-4 w-4" />} label="Revenue" value={`$${k.totalRevenue.toFixed(2)}`} sub={`$${k.fiatVolume30d.toFixed(2)} (30d)`} trend="up" />
        <KpiCard icon={<Zap className="h-4 w-4" />} label="Credits Circulating" value={formatSC(k.totalCreditsInCirculation)} sub={`Escrow: ${formatSC(k.platformEscrow)}`} />
        <KpiCard icon={<ShoppingCart className="h-4 w-4" />} label="Total Orders" value={k.totalOrders} sub={`${k.completedOrders} completed`} />
        <KpiCard icon={<Package className="h-4 w-4" />} label="Active Services" value={k.activeServices} sub={`${k.totalServices} total`} />
        <KpiCard icon={<Activity className="h-4 w-4" />} label="Active Users" value={k.activeUsers7d} sub="Last 7 days" trend="up" />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Transfers" value={k.totalTransfers} sub={`${k.purchaseVolume30d} SC bought`} />
        <KpiCard icon={<AlertTriangle className="h-4 w-4" />} label="Alerts" value={k.openDisputes + k.openReports + k.openTickets} sub={`${k.openDisputes} disputes · ${k.openTickets} tickets`} trend={k.openDisputes > 0 ? 'down' : undefined} accent={k.openDisputes > 0 ? 'warn' : undefined} />
      </div>

      {/* Revenue Chart */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Revenue (30 days)</p>
          <span className="text-xs font-bold text-emerald-500">{formatSC(c.revenueChart.reduce((s: number, d: any) => s + d.revenue, 0))} SC</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={c.revenueChart}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={(v) => v.slice(5)} interval={5} />
            <YAxis tick={{ fontSize: 8 }} width={30} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* User Growth + Order Distribution */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="p-4 space-y-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">User Signups (30 days)</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={c.signupChart}>
              <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={(v) => v.slice(5)} interval={5} />
              <YAxis tick={{ fontSize: 8 }} width={20} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 space-y-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Order Status Distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={c.orderDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={55} innerRadius={30} label={({ status, count }) => `${status}: ${count}`} labelLine={false} style={{ fontSize: 8 }}>
                {c.orderDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Transfer Volume */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground">Transfer Volume (30 days)</p>
          <span className="text-xs font-bold">{formatSC(c.transferChart.reduce((s: number, d: any) => s + d.volume, 0))} SC</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={c.transferChart}>
            <defs>
              <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={(v) => v.slice(5)} interval={5} />
            <YAxis tick={{ fontSize: 8 }} width={30} />
            <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
            <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2} fill="url(#transGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Services */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-bold uppercase text-muted-foreground">Top Services by Views</p>
        <div className="space-y-2">
          {data.topServices.map((s: any, i: number) => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <span className={clsx('h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0', i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-muted text-muted-foreground')}>
                {i + 1}
              </span>
              <p className="flex-1 truncate font-medium">{s.title}</p>
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Eye className="h-3 w-3" /> {s.views}
              </span>
              <span className="text-muted-foreground flex items-center gap-0.5">
                <ShoppingCart className="h-3 w-3" /> {s.completedOrders}
              </span>
              <span className="font-bold tabular-nums">{formatSC(s.price)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Sellers */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-bold uppercase text-muted-foreground">Top Sellers by Earnings</p>
        <div className="space-y-2">
          {data.topSellers.map((s: any, i: number) => (
            <div key={s.id} className="flex items-center gap-2 text-xs">
              <span className={clsx('h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0', i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-muted text-muted-foreground')}>
                {i + 1}
              </span>
              <div className="h-6 w-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {s.avatarUrl && <img src={s.avatarUrl} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="flex-1 truncate font-medium">
                @{s.username}
                {s.isVerified && <ShieldCheck className="h-3 w-3 text-primary inline ml-1" />}
              </p>
              <span className="font-bold text-emerald-500 tabular-nums">{formatSC(s.lifetimeEarned)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Category Distribution */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-bold uppercase text-muted-foreground">Services by Category</p>
        <div className="space-y-1.5">
          {c.categoryDistribution.map((cat: any) => {
            const max = Math.max(...c.categoryDistribution.map((x: any) => x.count))
            const pct = (cat.count / max) * 100
            return (
              <div key={cat.name} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate flex-shrink-0">{cat.icon} {cat.name}</span>
                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="font-bold tabular-nums w-6 text-right">{cat.count}</span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Platform Health */}
      <Card className="p-4 space-y-3">
        <p className="text-xs font-bold uppercase text-muted-foreground">Platform Health</p>
        <div className="grid grid-cols-2 gap-2">
          <HealthItem icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Frozen Wallets" value={k.frozenWallets} color={k.frozenWallets > 0 ? 'text-amber-600' : 'text-emerald-500'} />
          <HealthItem icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Open Disputes" value={k.openDisputes} color={k.openDisputes > 0 ? 'text-rose-500' : 'text-emerald-500'} />
          <HealthItem icon={<MessageSquare className="h-3.5 w-3.5" />} label="Open Tickets" value={k.openTickets} color={k.openTickets > 0 ? 'text-amber-600' : 'text-emerald-500'} />
          <HealthItem icon={<Ban className="h-3.5 w-3.5" />} label="Open Reports" value={k.openReports} color={k.openReports > 0 ? 'text-rose-500' : 'text-emerald-500'} />
        </div>
      </Card>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, trend, accent }: {
  icon: React.ReactNode
  label: string
  value: any
  sub?: string
  trend?: 'up' | 'down'
  accent?: 'warn'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={clsx('p-3', accent === 'warn' && 'border-amber-500/30')}>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-[9px] font-semibold uppercase">{label}</span>
          {trend === 'up' && <TrendingUp className="h-3 w-3 text-emerald-500 ml-auto" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3 text-rose-500 ml-auto" />}
        </div>
        <p className="text-lg font-bold tabular-nums mt-1">{value}</p>
        {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
      </Card>
    </motion.div>
  )
}

function HealthItem({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
      <span className={color}>{icon}</span>
      <span className="text-[10px] text-muted-foreground flex-1">{label}</span>
      <span className={clsx('text-sm font-bold tabular-nums', color)}>{value}</span>
    </div>
  )
}
