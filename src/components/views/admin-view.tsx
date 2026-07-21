'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Users, Wallet, Package, Shield, AlertTriangle, Activity, TrendingUp, Eye, Snowflake, CheckCircle2, Ban, Flag, Settings as SettingsIcon, Megaphone, FileText, ToggleLeft, Gavel, Send, Plus, MessageSquare } from 'lucide-react'
import { clsx } from 'clsx'
import { formatSC } from '@/components/sc-badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

type Tab = 'dashboard' | 'users' | 'wallets' | 'services' | 'orders' | 'audit' | 'disputes' | 'reports' | 'fraud' | 'support' | 'settings' | 'flags' | 'cms' | 'broadcast'

export function AdminView() {
  const { setView } = useApp()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])
  const [flags, setFlags] = useState<any[]>([])
  const [cmsPages, setCmsPages] = useState<any[]>([])
  const [adminOrders, setAdminOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [fraudAlerts, setFraudAlerts] = useState<any>(null)
  const [supportTickets, setSupportTickets] = useState<any[]>([])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<any>('/api/admin/dashboard')
      setData(d)
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/users?limit=30'); setUsers(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadWallets = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/wallets?limit=30'); setWallets(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadServices = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/services?limit=30'); setServices(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadAudit = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/audit?limit=50'); setAudit(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadDisputes = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/disputes?limit=30'); setDisputes(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadReports = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/reports?limit=30'); setReports(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ settings: any[] }>('/api/admin/settings'); setSettings(d.settings) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadFlags = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ flags: any[] }>('/api/admin/feature-flags'); setFlags(d.flags) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadCms = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ pages: any[] }>('/api/admin/cms'); setCmsPages(d.pages) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/orders?limit=50'); setAdminOrders(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadFraud = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<any>('/api/admin/fraud'); setFraudAlerts(d) }
    catch {} finally { setLoading(false) }
  }, [])

  const loadSupport = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get<{ items: any[] }>('/api/admin/support?limit=30'); setSupportTickets(d.items) }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const loaders: Record<Tab, () => void> = {
      dashboard: loadDashboard, users: loadUsers, wallets: loadWallets,
      services: loadServices, orders: loadOrders, audit: loadAudit, disputes: loadDisputes,
      reports: loadReports, fraud: loadFraud, support: loadSupport, settings: loadSettings, flags: loadFlags, cms: loadCms,
      broadcast: () => setLoading(false),
    }
    loaders[tab]?.()
  }, [tab, loadDashboard, loadUsers, loadWallets, loadServices, loadOrders, loadAudit, loadDisputes, loadReports, loadFraud, loadSupport, loadSettings, loadFlags, loadCms])

  const userAction = async (userId: string, action: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { action, reason: `Admin ${action}` })
      toast.success(`User ${action}`)
      loadUsers()
    } catch (e: any) { toast.error(e.message) }
  }

  const walletAction = async (walletId: string, action: 'freeze' | 'unfreeze') => {
    try {
      await api.patch(`/api/admin/wallets/${walletId}`, { action })
      toast.success(`Wallet ${action}d`)
      loadWallets()
    } catch (e: any) { toast.error(e.message) }
  }

  const walletAdjust = async (walletId: string, amount: number, reason: string) => {
    try {
      await api.post(`/api/admin/wallets/${walletId}/adjust`, { amount, reason })
      toast.success(`Adjusted ${amount > 0 ? '+' : ''}${amount} SC`)
      loadWallets()
    } catch (e: any) { toast.error(e.message) }
  }

  const serviceAction = async (serviceId: string, action: string) => {
    try {
      await api.patch(`/api/admin/services/${serviceId}`, { action })
      toast.success(`Service ${action}`)
      loadServices()
    } catch (e: any) { toast.error(e.message) }
  }

  const disputeAction = async (disputeId: string, status: string) => {
    try {
      await api.patch(`/api/admin/disputes/${disputeId}`, { status, resolution: `Resolved as ${status}` })
      toast.success('Dispute updated')
      loadDisputes()
    } catch (e: any) { toast.error(e.message) }
  }

  const reportAction = async (reportId: string, status: string) => {
    try {
      await api.patch(`/api/admin/reports/${reportId}`, { status })
      toast.success('Report updated')
      loadReports()
    } catch (e: any) { toast.error(e.message) }
  }

  const toggleFlag = async (key: string, enabled: boolean) => {
    try {
      await api.patch('/api/admin/feature-flags', { key, enabled: !enabled })
      toast.success(`${key} ${!enabled ? 'enabled' : 'disabled'}`)
      loadFlags()
    } catch (e: any) { toast.error(e.message) }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      await api.patch('/api/admin/settings', { key, value, type: 'string' })
      toast.success(`${key} updated`)
    } catch (e: any) { toast.error(e.message) }
  }

  const TABS: { k: Tab; label: string }[] = [
    { k: 'dashboard', label: 'Dashboard' },
    { k: 'users', label: 'Users' },
    { k: 'wallets', label: 'Wallets' },
    { k: 'services', label: 'Services' },
    { k: 'orders', label: 'Orders' },
    { k: 'disputes', label: 'Disputes' },
    { k: 'reports', label: 'Reports' },
    { k: 'fraud', label: 'Fraud' },
    { k: 'support', label: 'Support' },
    { k: 'flags', label: 'Flags' },
    { k: 'settings', label: 'Settings' },
    { k: 'cms', label: 'CMS' },
    { k: 'broadcast', label: 'Broadcast' },
    { k: 'audit', label: 'Audit' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('profile')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-sm font-bold flex items-center gap-1.5 flex-1">
            <Shield className="h-4 w-4 text-violet-500" /> Admin Console
          </p>
        </div>
        <div className="max-w-md mx-auto px-3 pb-2 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition',
                tab === t.k ? 'bg-violet-600 text-white' : 'bg-secondary text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {tab === 'dashboard' && (loading ? <DashboardSkeleton /> : data ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={<Users className="h-4 w-4" />} label="Total Users" value={data.stats.totalUsers} sub={`+${data.stats.newUsers7d} this week`} />
              <StatCard icon={<Wallet className="h-4 w-4" />} label="Credits Sold" value={data.stats.totalCreditsSold} sub="Lifetime" />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Transfers 24h" value={data.stats.transfers24h} sub="Count" />
              <StatCard icon={<Package className="h-4 w-4" />} label="Orders" value={data.stats.ordersTotal} sub={`${data.stats.ordersPending} pending`} />
              <StatCard icon={<Activity className="h-4 w-4" />} label="Active Services" value={data.stats.activeServices} sub="Live" />
              <StatCard icon={<AlertTriangle className="h-4 w-4" />} label="Fraud Alerts" value={data.stats.fraudAlerts} sub={`${data.stats.disputesOpen} disputes`} accent="warn" />
            </div>

            <Card className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Wallet Balances (Platform)</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available</span>
                <span className="font-bold tabular-nums">{formatSC(data.stats.walletAvailable)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">In Escrow</span>
                <span className="font-bold tabular-nums">{formatSC(data.stats.walletReserved)}</span>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Daily Transfers (14d)</p>
              <div className="flex items-end gap-1 h-24">
                {data.dailyTransfers.map((d: any) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-violet-500/30 rounded-t" style={{ height: `${Math.min(100, (d.volume / Math.max(...data.dailyTransfers.map((x: any) => x.volume || 1))) * 100)}%` }} />
                    <span className="text-[8px] text-muted-foreground">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Recent Activity</p>
              <div className="space-y-2 max-h-64 overflow-y-auto scroll-area">
                {data.recentActivity.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="font-medium">{a.actor}</span>
                    <span className="text-muted-foreground">{a.action}</span>
                    <span className="text-muted-foreground ml-auto">{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : null)}

        {tab === 'users' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
              users.map((u) => (
                <Card key={u.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold">{u.username[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold truncate">@{u.username}</p>
                        {u.isVerified && <CheckCircle2 className="h-3 w-3 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', u.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600')}>{u.status}</span>
                        {u.role === 'admin' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600">ADMIN</span>}
                        {u.wallet && <span className="text-[10px] text-muted-foreground">{formatSC(u.wallet.availableBalance)} SC</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {u.status === 'active' ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => userAction(u.id, 'suspend')}>Suspend</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => userAction(u.id, 'activate')}>Activate</Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => userAction(u.id, u.isVerified ? 'unverify' : 'verify')}>{u.isVerified ? 'Unverify' : 'Verify'}</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => userAction(u.id, 'ban')}><Ban className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => userAction(u.id, 'reset_pin')}>Reset PIN</Button>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {tab === 'wallets' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
              wallets.map((w) => (
                <WalletAdminCard key={w.id} wallet={w} onFreeze={walletAction} onAdjust={walletAdjust} />
              ))}
          </div>
        )}

        {tab === 'services' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
              services.map((s) => (
                <Card key={s.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">@{s.seller.username} · {formatSC(s.price)} SC</p>
                      <div className="flex gap-2 mt-1">
                        <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', s.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>{s.status}</span>
                        {s.featured && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">FEATURED</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => serviceAction(s.id, s.featured ? 'unfeature' : 'feature')}>{s.featured ? 'Unfeature' : 'Feature'}</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => serviceAction(s.id, 'hide')}>Hide</Button>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}

        {tab === 'orders' && (
          <AdminOrdersTab
            orders={adminOrders}
            loading={loading}
            selectedOrder={selectedOrder}
            onSelect={async (id) => {
              try {
                const d = await api.get<{ order: any }>(`/api/orders/${id}`)
                setSelectedOrder(d.order)
              } catch (e: any) { toast.error(e.message) }
            }}
            onClose={() => setSelectedOrder(null)}
          />
        )}

        {tab === 'disputes' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />) :
             disputes.length === 0 ? <EmptyState icon={<Gavel className="h-8 w-8" />} text="No disputes" /> :
             disputes.map((d) => (
              <Card key={d.id} className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded uppercase', d.status === 'open' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600')}>{d.status}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-semibold">Order: {d.order.orderNo}</p>
                <p className="text-xs text-muted-foreground">{d.claimant.username} vs {d.respondent.username}</p>
                <p className="text-xs">{d.reason}</p>
                {d.status === 'open' && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => disputeAction(d.id, 'resolved_claimant')}>For Claimant</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-blue-600" onClick={() => disputeAction(d.id, 'resolved_respondent')}>For Respondent</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
             reports.length === 0 ? <EmptyState icon={<Flag className="h-8 w-8" />} text="No reports" /> :
             reports.map((r) => (
              <Card key={r.id} className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted uppercase">{r.targetType}</span>
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded uppercase', r.status === 'open' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600')}>{r.status}</span>
                </div>
                <p className="text-sm font-semibold">{r.reason}</p>
                {r.detail && <p className="text-xs text-muted-foreground">{r.detail}</p>}
                <p className="text-[10px] text-muted-foreground">By @{r.author?.username} · {new Date(r.createdAt).toLocaleDateString()}</p>
                {r.status === 'open' && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => reportAction(r.id, 'resolved')}>Resolve</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => reportAction(r.id, 'dismissed')}>Dismiss</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === 'fraud' && (
          <div className="space-y-3">
            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
             !fraudAlerts ? <EmptyState icon={<AlertTriangle className="h-8 w-8" />} text="No data" /> :
             <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2">
                <Card className={clsx('p-3 text-center', fraudAlerts.summary.high > 0 && 'border-rose-500/40')}>
                  <p className="text-2xl font-bold text-rose-500">{fraudAlerts.summary.high}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">High</p>
                </Card>
                <Card className={clsx('p-3 text-center', fraudAlerts.summary.medium > 0 && 'border-amber-500/40')}>
                  <p className="text-2xl font-bold text-amber-500">{fraudAlerts.summary.medium}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Medium</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{fraudAlerts.summary.low}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Low</p>
                </Card>
              </div>

              {fraudAlerts.alerts.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                  <p className="text-sm font-semibold">No fraud alerts detected</p>
                  <p className="text-xs text-muted-foreground mt-1">All clear — no suspicious activity found.</p>
                </Card>
              ) : (
                fraudAlerts.alerts.map((a: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 50 }}
                  >
                    <Card className={clsx('p-3 border-l-4', a.level === 'high' ? 'border-l-rose-500' : a.level === 'medium' ? 'border-l-amber-500' : 'border-l-muted-foreground')}>
                      <div className="flex items-start gap-2">
                        <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0', a.level === 'high' ? 'bg-rose-500/10 text-rose-600' : a.level === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
                          {a.level}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold">{a.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                          {a.userId && (
                            <button onClick={() => { setTab('users') }} className="text-[10px] text-primary font-semibold mt-1">
                              View user →
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
             </>
            }
          </div>
        )}

        {tab === 'support' && (
          <AdminSupportTab
            tickets={supportTickets}
            loading={loading}
            onAction={async (ticketId, status) => {
              try {
                await api.patch(`/api/admin/support/${ticketId}`, { status })
                toast.success(`Ticket ${status}`)
                loadSupport()
              } catch (e: any) { toast.error(e.message) }
            }}
          />
        )}

        {tab === 'flags' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />) :
              flags.map((f) => (
                <Card key={f.id} className="p-3 flex items-center gap-3">
                  <ToggleLeft className={clsx('h-6 w-6', f.enabled ? 'text-emerald-500' : 'text-muted-foreground')} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                  <button
                    onClick={() => toggleFlag(f.key, f.enabled)}
                    className={clsx('relative h-6 w-11 rounded-full transition', f.enabled ? 'bg-emerald-500' : 'bg-muted')}
                  >
                    <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition', f.enabled ? 'left-5' : 'left-0.5')} />
                  </button>
                </Card>
              ))}
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />) :
              settings.map((s) => (
                <Card key={s.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm font-semibold font-mono">{s.key}</p>
                    <span className="text-[10px] text-muted-foreground ml-auto uppercase">{s.type}</span>
                  </div>
                  <SettingEditor setting={s} onSave={updateSetting} />
                </Card>
              ))}
          </div>
        )}

        {tab === 'cms' && (
          <AdminCmsTab pages={cmsPages} loading={loading} onSaved={loadCms} />
        )}

        {tab === 'broadcast' && <BroadcastPanel />}

        {tab === 'audit' && (
          <div className="space-y-2">
            {loading ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />) :
              audit.map((a) => (
                <Card key={a.id} className="p-2.5 flex items-center gap-2 text-xs">
                  <Activity className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{a.action}</p>
                    <p className="text-muted-foreground">{a.actor?.username || 'system'} · {a.entityType}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{new Date(a.createdAt).toLocaleTimeString()}</span>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: number; sub?: string; accent?: 'warn' }) {
  return (
    <Card className={clsx('p-3', accent === 'warn' && 'border-amber-500/30')}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-semibold uppercase">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums mt-1">{typeof value === 'number' ? formatSC(value) : value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </Card>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex h-14 w-14 rounded-2xl bg-muted items-center justify-center mb-3 text-muted-foreground/50">{icon}</div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function SettingEditor({ setting, onSave }: { setting: any; onSave: (key: string, value: string) => void }) {
  const [val, setVal] = useState(setting.value)
  return (
    <div className="flex gap-2">
      <Input value={val} onChange={(e) => setVal(e.target.value)} className="h-8 text-xs" />
      <Button size="sm" className="h-8 text-xs" onClick={() => onSave(setting.key, val)}>Save</Button>
    </div>
  )
}

function BroadcastPanel() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<'info' | 'warning' | 'maintenance'>('info')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!title.trim() || !body.trim()) return toast.error('Title and body required')
    setLoading(true)
    try {
      await api.post('/api/admin/notifications', { title, body, type })
      toast.success('Broadcast sent to all users')
      setTitle(''); setBody(''); setType('info')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-violet-500" />
        <p className="text-sm font-bold">Broadcast Notification</p>
      </div>
      <p className="text-xs text-muted-foreground">Send a notification to all platform users instantly.</p>
      <div className="space-y-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body…" className="min-h-[80px]" />
        <div className="flex gap-2">
          {(['info', 'warning', 'maintenance'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={clsx('flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize', type === t ? 'bg-violet-600 text-white' : 'bg-secondary text-muted-foreground')}
            >{t}</button>
          ))}
        </div>
        <Button onClick={send} disabled={loading} className="w-full rounded-2xl">
          {loading ? 'Sending…' : <><Send className="h-4 w-4 mr-1" /> Broadcast to All Users</>}
        </Button>
      </div>
    </Card>
  )
}

const TICKET_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  pending: { label: 'Pending', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  resolved: { label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  closed: { label: 'Closed', color: 'text-muted-foreground', bg: 'bg-muted' },
}

const PRIORITY_META: Record<string, string> = {
  low: 'text-muted-foreground',
  normal: 'text-blue-600',
  high: 'text-amber-600',
  urgent: 'text-rose-600',
}

function AdminSupportTab({ tickets, loading, onAction }: {
  tickets: any[]
  loading: boolean
  onAction: (ticketId: string, status: string) => Promise<void>
}) {
  const [filter, setFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [ticketDetail, setTicketDetail] = useState<any>(null)
  const [noteText, setNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)

  const openTicket = async (ticket: any) => {
    setSelectedTicket(ticket)
    setTicketDetail(null)
    try {
      const d = await api.get<{ ticket: any }>(`/api/admin/support/${ticket.id}/notes`)
      setTicketDetail(d.ticket)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load')
    }
  }

  const addNote = async () => {
    if (!noteText.trim() || !selectedTicket) return
    setAddingNote(true)
    try {
      await api.post(`/api/admin/support/${selectedTicket.id}/notes`, { body: noteText, internal: true })
      setNoteText('')
      // Reload detail
      const d = await api.get<{ ticket: any }>(`/api/admin/support/${selectedTicket.id}/notes`)
      setTicketDetail(d.ticket)
      toast.success('Note added')
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setAddingNote(false)
    }
  }

  // Detail view
  if (selectedTicket) {
    return (
      <div className="space-y-3">
        <button onClick={() => { setSelectedTicket(null); setTicketDetail(null) }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to tickets
        </button>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{selectedTicket.subject}</p>
            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', TICKET_STATUS_META[selectedTicket.status]?.bg, TICKET_STATUS_META[selectedTicket.status]?.color)}>
              {TICKET_STATUS_META[selectedTicket.status]?.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{selectedTicket.message}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>@{selectedTicket.user?.username}</span>
            <span>· {selectedTicket.priority} priority</span>
            <span>· {new Date(selectedTicket.createdAt).toLocaleString()}</span>
          </div>
        </Card>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground">Internal Notes</p>
          {ticketDetail?.notes?.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No notes yet</p>
          )}
          {ticketDetail?.notes?.map((n: any) => (
            <Card key={n.id} className="p-2.5">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1">
                <span className="font-semibold">Admin</span>
                <span>· {new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs">{n.body}</p>
            </Card>
          ))}
        </div>

        {/* Add note */}
        <Card className="p-3 space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add internal note…"
            className="min-h-[60px] text-xs"
          />
          <Button onClick={addNote} disabled={addingNote || !noteText.trim()} size="sm" className="w-full rounded-xl text-xs">
            {addingNote ? 'Adding…' : 'Add Note'}
          </Button>
        </Card>

        {/* Actions */}
        {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => onAction(selectedTicket.id, 'pending')}>Pending</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs flex-1 text-emerald-600" onClick={() => onAction(selectedTicket.id, 'resolved')}>Resolve</Button>
            <Button size="sm" variant="outline" className="h-8 text-xs flex-1" onClick={() => onAction(selectedTicket.id, 'closed')}>Close</Button>
          </div>
        )}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {['all', 'open', 'pending', 'resolved', 'closed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition',
              filter === f ? 'bg-violet-600 text-white' : 'bg-secondary text-muted-foreground'
            )}
          >
            {f === 'all' ? 'All' : TICKET_STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>
      {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />) :
       filtered.length === 0 ? <EmptyState icon={<MessageSquare className="h-8 w-8" />} text="No support tickets" /> :
       filtered.map((t) => (
        <button key={t.id} onClick={() => openTicket(t)} className="w-full text-left active:scale-[0.99] transition">
          <Card className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{t.subject}</p>
                  <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', PRIORITY_META[t.priority])}>{t.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">@{t.user?.username}</span>
                  <span className="text-[10px] text-muted-foreground">· {new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0', TICKET_STATUS_META[t.status]?.bg, TICKET_STATUS_META[t.status]?.color)}>
                {TICKET_STATUS_META[t.status]?.label}
              </span>
            </div>
          </Card>
        </button>
      ))}
    </div>
  )
}

function AdminCmsTab({ pages, loading, onSaved }: { pages: any[]; loading: boolean; onSaved: () => void }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)

  const selected = pages.find((p) => p.slug === selectedSlug)

  const editPage = (p: any) => {
    setSelectedSlug(p.slug)
    setTitle(p.title)
    setBody(p.body)
    setPublished(p.published)
  }

  const newPage = () => {
    setSelectedSlug('')
    setTitle('')
    setBody('')
    setPublished(true)
  }

  const save = async () => {
    if (!title.trim() || !body.trim()) return toast.error('Title and body required')
    setSaving(true)
    try {
      const slug = selectedSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
      const res = await fetch(`/api/admin/cms/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, published }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Page saved')
        setSelectedSlug(slug)
        onSaved()
      } else {
        toast.error(json.error || 'Save failed')
      }
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (selectedSlug !== null) {
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedSlug(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to pages
          </button>
          <span className="text-xs text-muted-foreground">/{selectedSlug || 'new-slug'}</span>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground">Title</p>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page title" className="h-9 text-sm" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-muted-foreground">Body (Markdown supported)</p>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Page content…" className="min-h-[200px] text-xs font-mono" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPublished(!published)}
            className={clsx('relative h-6 w-11 rounded-full transition', published ? 'bg-emerald-500' : 'bg-muted')}
          >
            <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition', published ? 'left-5' : 'left-0.5')} />
          </button>
          <span className="text-xs font-semibold">{published ? 'Published (live)' : 'Draft (hidden)'}</span>
        </div>
        <Button onClick={save} disabled={saving} className="w-full rounded-2xl">
          {saving ? 'Saving…' : 'Save Page'}
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <Button onClick={newPage} className="w-full rounded-2xl mb-2">
        <Plus className="h-4 w-4 mr-1" /> New Page
      </Button>
      {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
        pages.map((p) => (
          <button key={p.id} onClick={() => editPage(p)} className="w-full text-left active:scale-[0.99] transition">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold flex-1 truncate">{p.title}</p>
                <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', p.published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>{p.published ? 'LIVE' : 'DRAFT'}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">/{p.slug}</p>
            </Card>
          </button>
        ))}
    </div>
  )
}

function WalletAdminCard({ wallet, onFreeze, onAdjust }: { wallet: any; onFreeze: (id: string, action: 'freeze' | 'unfreeze') => void; onAdjust: (id: string, amount: number, reason: string) => void }) {
  const [showAdjust, setShowAdjust] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const amt = Number(amount)
    if (!amt || amt === 0) return toast.error('Enter a non-zero amount')
    if (!reason.trim()) return toast.error('Reason required')
    setLoading(true)
    await onAdjust(wallet.id, amt, reason.trim())
    setLoading(false)
    setShowAdjust(false)
    setAmount('')
    setReason('')
  }

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">@{w_user(wallet)}</p>
            {wallet.frozen && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-600">FROZEN</span>}
          </div>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="text-muted-foreground">Avail: <b className="text-foreground">{formatSC(wallet.availableBalance)}</b></span>
            <span className="text-muted-foreground">Res: <b className="text-foreground">{formatSC(wallet.reservedBalance)}</b></span>
            <span className="text-muted-foreground">Earned: <b className="text-foreground">{formatSC(wallet.lifetimeEarned)}</b></span>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAdjust(!showAdjust)}>
            <Plus className="h-3 w-3" />
          </Button>
          {wallet.frozen ? (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onFreeze(wallet.id, 'unfreeze')}>Unfreeze</Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600" onClick={() => onFreeze(wallet.id, 'freeze')}><Snowflake className="h-3 w-3" /></Button>
          )}
        </div>
      </div>
      {showAdjust && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 pt-2 border-t"
        >
          <div className="flex gap-2">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="+100 or -50"
              className="h-8 text-xs flex-1"
            />
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="h-8 text-xs flex-1"
            />
          </div>
          <Button size="sm" className="w-full h-8 text-xs" disabled={loading} onClick={submit}>
            {loading ? 'Adjusting…' : 'Apply Adjustment'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">Positive = credit, negative = debit. Full audit logged.</p>
        </motion.div>
      )}
    </Card>
  )
}

function w_user(w: any) { return w.user?.username || 'unknown' }

const ORDER_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  delivered: { label: 'Delivered', color: 'text-violet-600', bg: 'bg-violet-500/10' },
  completed: { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bg: 'bg-muted' },
  disputed: { label: 'Disputed', color: 'text-rose-600', bg: 'bg-rose-500/10' },
}

function AdminOrdersTab({ orders, loading, selectedOrder, onSelect, onClose }: {
  orders: any[]
  loading: boolean
  selectedOrder: any
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  if (selectedOrder) {
    const o = selectedOrder
    return (
      <div className="space-y-3">
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </button>
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">{o.orderNo}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
            </div>
            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded uppercase', ORDER_STATUS_META[o.status]?.bg, ORDER_STATUS_META[o.status]?.color)}>
              {ORDER_STATUS_META[o.status]?.label || o.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Buyer</p>
              <p className="font-semibold">@{o.buyer?.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Seller</p>
              <p className="font-semibold">@{o.seller?.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Service</p>
              <p className="font-semibold line-clamp-1">{o.service?.title}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Price</p>
              <p className="font-semibold">{formatSC(o.price)} SC</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment</p>
              <p className="font-semibold capitalize">{o.paymentStatus}</p>
            </div>
          </div>
          {o.requirements && (
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Requirements</p>
              <p className="text-xs mt-1 p-2 rounded-lg bg-secondary/50">{o.requirements}</p>
            </div>
          )}
        </Card>
        {o.statusHistory?.length > 0 && (
          <Card className="p-4 space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Timeline</p>
            <div className="space-y-2">
              {o.statusHistory.map((h: any, i: number) => (
                <div key={h.id} className="flex gap-2 text-xs">
                  <div className="flex flex-col items-center">
                    <div className={clsx('h-2 w-2 rounded-full', i === 0 ? 'bg-primary' : 'bg-muted-foreground/40')} />
                    {i < o.statusHistory.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{h.status.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</p>
                    {h.note && <p className="text-muted-foreground">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {['all', 'pending', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition',
              filter === f ? 'bg-violet-600 text-white' : 'bg-secondary text-muted-foreground'
            )}
          >
            {f === 'all' ? 'All' : ORDER_STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>
      {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
       filtered.length === 0 ? <EmptyState icon={<Package className="h-8 w-8" />} text="No orders" /> :
       filtered.map((o) => (
        <button key={o.id} onClick={() => onSelect(o.id)} className="w-full text-left active:scale-[0.99] transition">
          <Card className="p-3 flex items-center gap-3">
            <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', ORDER_STATUS_META[o.status]?.bg)}>
              <span className={ORDER_STATUS_META[o.status]?.color}><Package className="h-4 w-4" /></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{o.service?.title || 'Service'}</p>
              <p className="text-xs text-muted-foreground">@{o.buyer?.username} → @{o.seller?.username}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase', ORDER_STATUS_META[o.status]?.bg, ORDER_STATUS_META[o.status]?.color)}>
                  {ORDER_STATUS_META[o.status]?.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold">{formatSC(o.price)}</p>
              <p className="text-[10px] text-muted-foreground">SC</p>
            </div>
          </Card>
        </button>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}
