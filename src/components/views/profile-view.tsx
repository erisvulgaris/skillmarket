'use client'

import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkillCredits } from '@/components/sc-badge'
import { User, ShieldCheck, Gift, Bell, Plus, Settings, LogOut, Moon, Sun, ChevronRight, Shield, Star, Package, QrCode, Crown, Activity, BarChart3, LifeBuoy, FileText, Grid3x3, Check, Bookmark } from 'lucide-react'
import { useTheme } from 'next-themes'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

export function ProfileView() {
  const { user, setView, refreshUser } = useApp()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    if (user) {
      api.get<{ dataUrl: string }>(`/api/qr/wallet?id=${user.id}`).then((d) => setQrUrl(d.dataUrl)).catch(() => {})
      api.get<{ items: any[] }>('/api/saved').then((d) => setSavedCount(d.items.length)).catch(() => {})
    }
  }, [user])

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
      await refreshUser()
      toast.success('Signed out')
    } catch {
      toast.error('Logout failed')
    }
  }

  if (!user) return null

  return (
    <div className="px-4 pt-4 space-y-5">
      {/* Profile header */}
      <Card className="p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent -z-10" />
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/20 overflow-hidden">
          {user.profile?.avatarUrl ? <img src={user.profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.username[0].toUpperCase()}
        </div>
        <div className="flex items-center justify-center gap-1 mt-3">
          <h2 className="text-lg font-bold">{user.profile?.displayName || user.username}</h2>
          {user.profile?.isVerified && <ShieldCheck className="h-4 w-4 text-primary" />}
        </div>
        <p className="text-xs text-muted-foreground">@{user.username}</p>
        {user.profile?.bio && <p className="text-sm text-muted-foreground mt-2 px-4">{user.profile.bio}</p>}

        {/* QR */}
        {qrUrl && (
          <div className="mt-4 inline-block p-2 bg-white rounded-xl">
            <img src={qrUrl} alt="My QR" className="h-28 w-28" />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">Scan to send you SkillCredits</p>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox value={user.wallet?.availableBalance || 0} label="Balance" />
        <StatBox value={user.wallet?.lifetimeEarned || 0} label="Earned" />
        <StatBox value={user.wallet?.lifetimeSpent || 0} label="Spent" />
      </div>

      {/* Profile completion meter */}
      <ProfileCompletion user={user} onEdit={() => setView('settings')} />

      {/* Admin entry */}
      {user.role === 'admin' && (
        <Button onClick={() => setView('admin')} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 text-white">
          <Crown className="h-4 w-4 mr-2" /> Admin Dashboard
        </Button>
      )}

      {/* Menu */}
      <div className="space-y-2">
        <MenuItem icon={<Plus className="h-4 w-4" />} label="Create a Service" onClick={() => setView('create-service')} />
        <MenuItem icon={<Grid3x3 className="h-4 w-4" />} label="My Services" onClick={() => setView('my-services')} />
        <MenuItem icon={<Bookmark className="h-4 w-4" />} label="Saved Services" onClick={() => setView('saved')} badge={savedCount > 0 ? String(savedCount) : undefined} />
        <MenuItem icon={<BarChart3 className="h-4 w-4" />} label="Seller Analytics" onClick={() => setView('analytics')} />
        <MenuItem icon={<Package className="h-4 w-4" />} label="My Orders" onClick={() => setView('orders')} />
        <MenuItem icon={<Activity className="h-4 w-4" />} label="Activity Log" onClick={() => setView('activity')} />
        <MenuItem icon={<Gift className="h-4 w-4" />} label="Refer & Earn" onClick={() => setView('referrals')} badge="50 SC" />
        <MenuItem icon={<Bell className="h-4 w-4" />} label="Notifications" onClick={() => setView('notifications')} />
        <MenuItem
          icon={theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />
        <MenuItem icon={<Settings className="h-4 w-4" />} label="Settings & Security" onClick={() => setView('settings')} />
        <MenuItem icon={<LifeBuoy className="h-4 w-4" />} label="Help & Support" onClick={() => setView('help')} />
        <MenuItem icon={<FileText className="h-4 w-4" />} label="Terms & Privacy" onClick={() => setView('cms-page', { slug: 'terms', from: 'profile' })} />
      </div>

      <Button onClick={logout} variant="outline" className="w-full rounded-2xl text-destructive">
        <LogOut className="h-4 w-4 mr-2" /> Sign Out
      </Button>

      <p className="text-center text-[10px] text-muted-foreground/60">SkillMarket v1.0 · User ID: {user.id.slice(-8)}</p>
    </div>
  )
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-base font-bold tabular-nums">
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </Card>
  )
}

function MenuItem({ icon, label, onClick, badge }: { icon: React.ReactNode; label: string; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/40 active:scale-[0.99] transition">
      <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
      <span className="flex-1 text-left text-sm font-semibold">{label}</span>
      {badge && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{badge}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function ProfileCompletion({ user, onEdit }: { user: any; onEdit: () => void }) {
  const checks = [
    { label: 'Display name', done: !!user.profile?.displayName },
    { label: 'Bio', done: !!user.profile?.bio },
    { label: 'Avatar', done: !!user.profile?.avatarUrl },
    { label: 'Location', done: !!user.profile?.location },
    { label: 'Skills', done: (user.profile?.skills?.length || 0) > 0 },
    { label: 'Languages', done: (user.profile?.languages?.length || 0) > 0 },
  ]
  const completed = checks.filter((c) => c.done).length
  const pct = Math.round((completed / checks.length) * 100)

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">Profile Completion</p>
          <p className="text-[10px] text-muted-foreground">{pct === 100 ? 'Your profile is complete!' : 'Complete your profile to attract more buyers'}</p>
        </div>
        <span className={clsx('text-2xl font-bold', pct === 100 ? 'text-emerald-500' : 'text-primary')}>{pct}%</span>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={clsx('h-full rounded-full progress-fill', pct === 100 ? 'bg-emerald-500' : 'bg-primary')}
        />
      </div>
      {/* Checklist */}
      {pct < 100 && (
        <div className="grid grid-cols-2 gap-1.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 text-xs">
              <div className={clsx('h-3.5 w-3.5 rounded-full flex items-center justify-center', c.done ? 'bg-emerald-500 text-white' : 'bg-muted')}>
                {c.done && <Check className="h-2.5 w-2.5" />}
              </div>
              <span className={clsx(c.done ? 'text-muted-foreground line-through' : 'text-foreground')}>{c.label}</span>
            </div>
          ))}
        </div>
      )}
      {pct < 100 && (
        <Button onClick={onEdit} variant="outline" size="sm" className="w-full rounded-xl text-xs">
          Complete Profile
        </Button>
      )}
    </Card>
  )
}
