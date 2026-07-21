'use client'

import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkillCredits } from '@/components/sc-badge'
import { User, ShieldCheck, Gift, Bell, Plus, Settings, LogOut, Moon, Sun, ChevronRight, Shield, Star, Package, QrCode, Crown, Activity } from 'lucide-react'
import { useTheme } from 'next-themes'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

export function ProfileView() {
  const { user, setView, refreshUser } = useApp()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      api.get<{ dataUrl: string }>(`/api/qr/wallet?id=${user.id}`).then((d) => setQrUrl(d.dataUrl)).catch(() => {})
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

      {/* Admin entry */}
      {user.role === 'admin' && (
        <Button onClick={() => setView('admin')} className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-violet-500 text-white">
          <Crown className="h-4 w-4 mr-2" /> Admin Dashboard
        </Button>
      )}

      {/* Menu */}
      <div className="space-y-2">
        <MenuItem icon={<Plus className="h-4 w-4" />} label="Create a Service" onClick={() => setView('create-service')} />
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
