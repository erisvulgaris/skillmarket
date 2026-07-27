'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSC } from '@/components/sc-badge'
import {
  Users, Package, ShoppingCart, DollarSign, Activity, AlertTriangle,
  ShieldCheck, Snowflake, Crown, Star, Eye,
  TrendingUp, TrendingDown, Zap,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'

interface DashboardClientProps {
  data: {
    stats: Record<string, number>
    dailyTransfers: { date: string; count: number; volume: number }[]
    recentActivity: { id: string; action: string; entityType: string; entityId: string; actor: string; createdAt: string }[]
  }
  analytics: {
    kpis: Record<string, number>
    charts: {
      signupChart: { date: string; count: number }[]
      revenueChart: { date: string; revenue: number }[]
      orderDistribution: { status: string; count: number }[]
      categoryDistribution: { name: string; icon: string; count: number }[]
    }
    topServices: { id: string; title: string; price: number; views: number; completedOrders: number; ratingAvg: number }[]
    topSellers: { id: string; username: string; displayName?: string | null; lifetimeEarned: number; isVerified?: boolean }[]
  } | null
}

const STAT_CARDS: {
  key: string
  label: string
  icon: typeof Users
  color: string
  bg: string
  format?: boolean
}[] = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { key: 'activeServices', label: 'Active Services', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { key: 'ordersTotal', label: 'Total Orders', icon: ShoppingCart, color: 'text-violet-600', bg: 'bg-violet-500/10' },
  { key: 'walletAvailable', label: 'Wallet Available', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-500/10', format: true },
  { key: 'newUsers7d', label: 'New Users (7d)', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  { key: 'transfers24h', label: 'Transfers (24h)', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { key: 'disputesOpen', label: 'Open Disputes', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  { key: 'supportTickets', label: 'Support Tickets', icon: ShieldCheck, color: 'text-orange-600', bg: 'bg-orange-500/10' },
]

const LABEL_MAP: Record<string, string> = {
  totalUsers: 'Total Users',
  newUsers7d: 'New (7d)',
  activeWallets: 'Wallets',
  transfers24h: 'Transfers (24h)',
  ordersTotal: 'Orders',
  ordersPending: 'Pending',
  ordersCompleted: 'Completed',
  reviewsTotal: 'Reviews',
  disputesOpen: 'Disputes',
  reportsOpen: 'Reports',
  fraudAlerts: 'Fraud',
  supportTickets: 'Support',
  activeServices: 'Services',
  walletAvailable: 'Available',
  walletReserved: 'Reserved',
}

export function DashboardClient({ data, analytics }: DashboardClientProps) {
  const stats = data.stats
  const [showAnalytics, setShowAnalytics] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const value = stats[card.key]
          const Icon = card.icon
          return (
            <Card key={card.key} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center', card.bg)}>
                  <Icon className={clsx('h-5 w-5', card.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-bold tabular-nums mt-0.5">
                    {card.format ? formatSC(value ?? 0) : (value?.toLocaleString() ?? '0')}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {analytics && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Analytics</h2>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-xs text-primary font-semibold hover:underline"
            >
              {showAnalytics ? 'Hide' : 'Show Details'}
            </button>
          </div>

          {showAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="text-sm font-bold mb-3">Order Status Distribution</h3>
                <div className="space-y-2">
                  {analytics.charts.orderDistribution.map((item) => (
                    <div key={item.status} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-28 capitalize text-muted-foreground">{item.status.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(item.count / Math.max(...analytics.charts.orderDistribution.map((o) => o.count)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-16 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-bold mb-3">Category Distribution</h3>
                <div className="space-y-2">
                  {analytics.charts.categoryDistribution.slice(0, 10).map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="text-xs">{item.icon}</span>
                      <span className="text-xs font-medium flex-1 truncate">{item.name}</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden flex-shrink-0">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${(item.count / Math.max(...analytics.charts.categoryDistribution.map((c) => c.count)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums w-12 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-bold mb-3">Top Services by Views</h3>
                <div className="space-y-2">
                  {analytics.topServices.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <span className={clsx('text-xs font-bold w-5', i === 0 ? 'text-amber-500' : 'text-muted-foreground')}>
                        {i === 0 ? <Crown className="h-3.5 w-3.5" /> : `#${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <Eye className="h-3 w-3" /> {s.views}
                          <Star className="h-3 w-3 ml-1" /> {s.ratingAvg.toFixed(1)}
                        </p>
                      </div>
                      <span className="text-xs font-bold">{formatSC(s.price)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-sm font-bold mb-3">Top Sellers by Earnings</h3>
                <div className="space-y-2">
                  {analytics.topSellers.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <span className={clsx('text-xs font-bold w-5', i === 0 ? 'text-amber-500' : 'text-muted-foreground')}>
                        {i === 0 ? <Crown className="h-3.5 w-3.5" /> : `#${i + 1}`}
                      </span>
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {s.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">@{s.username}</p>
                      </div>
                      <span className="text-xs font-bold">{formatSC(s.lifetimeEarned)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Recent Activity</h2>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          {data.recentActivity.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
          )}
          {data.recentActivity.slice(0, 15).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  <span className="text-muted-foreground">{entry.action.replace(/_/g, ' ')}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-semibold">{entry.actor}</span>
                  <span className="mx-1">·</span>
                  <span>{entry.entityType}</span>
                  <span className="mx-1">·</span>
                  <span>{new Date(entry.createdAt).toLocaleString()}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
