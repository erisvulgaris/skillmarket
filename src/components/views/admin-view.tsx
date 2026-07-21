'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Users, Wallet, Package, Shield, AlertTriangle, Activity, TrendingUp, Eye, Snowflake, CheckCircle2, Ban, Flag, Settings as SettingsIcon, Megaphone, FileText, ToggleLeft, Gavel, Send } from 'lucide-react'
import { clsx } from 'clsx'
import { formatSC } from '@/components/sc-badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

type Tab = 'dashboard' | 'users' | 'wallets' | 'services' | 'audit' | 'disputes' | 'reports' | 'settings' | 'flags' | 'cms' | 'broadcast'

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

  useEffect(() => {
    const loaders: Record<Tab, () => void> = {
      dashboard: loadDashboard, users: loadUsers, wallets: loadWallets,
      services: loadServices, audit: loadAudit, disputes: loadDisputes,
      reports: loadReports, settings: loadSettings, flags: loadFlags, cms: loadCms,
      broadcast: () => setLoading(false),
    }
    loaders[tab]?.()
  }, [tab, loadDashboard, loadUsers, loadWallets, loadServices, loadAudit, loadDisputes, loadReports, loadSettings, loadFlags, loadCms])

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
    { k: 'disputes', label: 'Disputes' },
    { k: 'reports', label: 'Reports' },
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
                <Card key={w.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">@{w.user.username}</p>
                      <div className="flex gap-3 mt-1 text-xs">
                        <span className="text-muted-foreground">Avail: <b className="text-foreground">{formatSC(w.availableBalance)}</b></span>
                        <span className="text-muted-foreground">Res: <b className="text-foreground">{formatSC(w.reservedBalance)}</b></span>
                        <span className="text-muted-foreground">Earned: <b className="text-foreground">{formatSC(w.lifetimeEarned)}</b></span>
                      </div>
                    </div>
                    {w.frozen ? (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => walletAction(w.id, 'unfreeze')}>Unfreeze</Button>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600" onClick={() => walletAction(w.id, 'freeze')}><Snowflake className="h-3 w-3" /></Button>
                    )}
                  </div>
                </Card>
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
          <div className="space-y-2">
            {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />) :
              cmsPages.map((p) => (
                <Card key={p.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold flex-1 truncate">{p.title}</p>
                    <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', p.published ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>{p.published ? 'LIVE' : 'DRAFT'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">/{p.slug}</p>
                </Card>
              ))}
          </div>
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
