'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { ArrowLeft, TrendingUp, Eye, Package, Star, Repeat, Zap, BarChart3, ShoppingCart, DollarSign } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function AnalyticsView() {
  const { setView } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<any>('/api/seller/analytics')
      setData(d)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const maxEarning = data ? Math.max(...data.dailyEarnings.map((d: any) => d.earnings), 1) : 1

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('profile')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Seller Analytics</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-60 rounded-2xl" />
          </div>
        ) : data ? (
          <>
            {/* Hero stat: Total Earnings */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-5 shadow-2xl shadow-primary/20"
            >
              <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-80 font-medium uppercase tracking-wide">Total Earnings</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-4xl font-black tabular-nums ticker">{formatSC(data.stats.totalEarnings)}</span>
                      <span className="text-sm opacity-80 font-medium">SC</span>
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <MiniStat label="Orders" value={data.stats.completedOrders} />
                  <MiniStat label="Views" value={data.stats.totalViews} />
                  <MiniStat label="Rating" value={data.stats.avgRating.toFixed(1)} />
                </div>
              </div>
            </motion.div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Package className="h-4 w-4" />} label="Active Listings" value={data.stats.activeServices} sub={`${data.stats.totalServices} total`} />
              <StatCard icon={<ShoppingCart className="h-4 w-4" />} label="Total Orders" value={data.stats.totalOrders} sub={`${data.stats.pendingOrders} pending`} />
              <StatCard icon={<Eye className="h-4 w-4" />} label="Total Views" value={data.stats.totalViews} sub="All services" />
              <StatCard icon={<Star className="h-4 w-4" />} label="Avg Rating" value={data.stats.avgRating.toFixed(1)} sub={`${data.stats.reviewCount} reviews`} />
              <StatCard icon={<Repeat className="h-4 w-4" />} label="Repeat Buyers" value={data.stats.repeatCustomers} sub="Returning customers" />
              <StatCard icon={<Zap className="h-4 w-4" />} label="Conversion" value={`${data.stats.conversionRate}%`} sub="Order completion rate" />
            </div>

            {/* Daily earnings chart */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold uppercase text-muted-foreground">Daily Earnings (14 days)</p>
              </div>
              <div className="flex items-end gap-1 h-32">
                {data.dailyEarnings.map((d: any, i: number) => {
                  const height = (d.earnings / maxEarning) * 100
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full bg-primary/20 rounded-t-md hover:bg-primary/40 transition relative" style={{ height: `${Math.max(height, 2)}%` }}>
                        {d.earnings > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-card px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap border border-border/40">
                            {formatSC(d.earnings)}
                          </div>
                        )}
                      </div>
                      <span className="text-[7px] text-muted-foreground">{d.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t">
                <span className="text-muted-foreground">14-day total</span>
                <SkillCredits amount={data.dailyEarnings.reduce((s: number, d: any) => s + d.earnings, 0)} size="sm" />
              </div>
            </Card>

            {/* Recent orders */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-muted-foreground">Recent Orders</p>
                <button onClick={() => setView('orders')} className="text-xs text-primary font-semibold">View all →</button>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {data.recentOrders.map((o: any) => (
                    <div key={o.id} className="flex items-center gap-2 text-xs">
                      <span className={clsx('h-2 w-2 rounded-full flex-shrink-0', o.status === 'completed' ? 'bg-emerald-500' : o.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500')} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{o.serviceTitle}</p>
                        <p className="text-muted-foreground">@{o.buyerUsername} · {new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold tabular-nums">{formatSC(o.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold tabular-nums">{value}</p>
      <p className="text-[9px] opacity-70 uppercase">{label}</p>
    </div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: any; sub?: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </Card>
  )
}
