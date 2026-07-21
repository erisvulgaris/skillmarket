'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Lock, KeyRound, User, Shield, Bell, Globe, LogOut, ChevronRight, Check, Moon, Sun, Fingerprint } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function SettingsView() {
  const { setView, user, refreshUser } = useApp()
  const { theme, setTheme } = useTheme()
  const [section, setSection] = useState<'menu' | 'pin' | 'password' | 'profile'>('menu')

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => section === 'menu' ? setView('profile') : setSection('menu')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">
            {section === 'menu' && 'Settings & Security'}
            {section === 'pin' && 'Change Transaction PIN'}
            {section === 'password' && 'Change Password'}
            {section === 'profile' && 'Edit Profile'}
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 pb-24">
        {section === 'menu' && (
          <div className="space-y-4">
            {/* Security section */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground px-1">Security</p>
              <Card className="divide-y divide-border/40 p-0">
                <SettingRow icon={<KeyRound className="h-4 w-4 text-primary" />} label="Transaction PIN" desc="Change your 4-digit PIN" onClick={() => setSection('pin')} />
                <SettingRow icon={<Lock className="h-4 w-4 text-primary" />} label="Password" desc="Change your login password" onClick={() => setSection('password')} />
                <SettingRow icon={<Fingerprint className="h-4 w-4 text-primary" />} label="Two-Factor Auth" desc="Coming soon" badge="SOON" onClick={() => toast.info('2FA coming soon')} />
              </Card>
            </div>

            {/* Profile section */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground px-1">Profile</p>
              <Card className="divide-y divide-border/40 p-0">
                <SettingRow icon={<User className="h-4 w-4 text-primary" />} label="Edit Profile" desc="Update bio, skills, avatar" onClick={() => setSection('profile')} />
                <SettingRow icon={<Globe className="h-4 w-4 text-primary" />} label="Languages" desc="Coming soon" onClick={() => toast.info('Language settings coming soon')} />
              </Card>
            </div>

            {/* Preferences */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground px-1">Preferences</p>
              <Card className="divide-y divide-border/40 p-0">
                <SettingRow
                  icon={theme === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                  label="Theme"
                  desc={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  trailing={<ToggleSwitch on={theme === 'dark'} />}
                />
                <SettingRow icon={<Bell className="h-4 w-4 text-primary" />} label="Notifications" desc="Manage notification preferences" onClick={() => setView('notifications')} />
              </Card>
            </div>

            {/* Activity */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground px-1">Account</p>
              <Card className="divide-y divide-border/40 p-0">
                <SettingRow icon={<Shield className="h-4 w-4 text-primary" />} label="Activity Log" desc="View your recent activity" onClick={() => setView('activity')} />
              </Card>
            </div>

            <Button
              onClick={async () => {
                await api.post('/api/auth/logout')
                await refreshUser()
                toast.success('Signed out')
              }}
              variant="outline"
              className="w-full rounded-2xl text-destructive border-destructive/30"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>

            <p className="text-center text-[10px] text-muted-foreground/60 pt-4">
              SkillMarket v1.0 · User ID: {user?.id.slice(-8)}
            </p>
          </div>
        )}

        {section === 'pin' && <ChangePinSection />}
        {section === 'password' && <ChangePasswordSection />}
        {section === 'profile' && <EditProfileSection onSaved={() => { setSection('menu'); refreshUser() }} />}
      </div>
    </div>
  )
}

function SettingRow({ icon, label, desc, onClick, badge, trailing }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void; badge?: string; trailing?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3.5 active:bg-accent/50 transition text-left">
      <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{label}</p>
          {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">{badge}</span>}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {trailing || <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  )
}

function ToggleSwitch({ on }: { on: boolean }) {
  return (
    <span className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-primary' : 'bg-muted'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-5' : 'left-0.5'}`} />
    </span>
  )
}

function ChangePinSection() {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async () => {
    if (currentPin.length !== 4) return toast.error('Enter current 4-digit PIN')
    if (newPin.length !== 4) return toast.error('Enter new 4-digit PIN')
    if (newPin !== confirmPin) return toast.error('PINs do not match')
    if (newPin === currentPin) return toast.error('New PIN must be different')
    setLoading(true)
    try {
      await api.post('/api/auth/change-pin', { currentPin, newPin })
      setSuccess(true)
      toast.success('PIN changed successfully')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to change PIN'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <Check className="h-8 w-8" />
          </div>
          <p className="text-base font-bold">PIN Changed</p>
          <p className="text-xs text-muted-foreground">Your transaction PIN has been updated.</p>
        </Card>
      </motion.div>
    )
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-primary" />
        <p>Your PIN is required for all wallet transfers and purchases.</p>
      </div>
      <PinInput label="Current PIN" value={currentPin} onChange={(v) => setCurrentPin(v.replace(/\D/g, '').slice(0, 4))} />
      <PinInput label="New PIN" value={newPin} onChange={(v) => setNewPin(v.replace(/\D/g, '').slice(0, 4))} />
      <PinInput label="Confirm New PIN" value={confirmPin} onChange={(v) => setConfirmPin(v.replace(/\D/g, '').slice(0, 4))} />
      <Button onClick={submit} disabled={loading} className="w-full rounded-2xl h-12">
        {loading ? 'Updating…' : 'Update PIN'}
      </Button>
    </Card>
  )
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async () => {
    if (!currentPassword) return toast.error('Enter current password')
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword })
      setSuccess(true)
      toast.success('Password changed successfully')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to change password'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <Check className="h-8 w-8" />
          </div>
          <p className="text-base font-bold">Password Changed</p>
          <p className="text-xs text-muted-foreground">Your login password has been updated.</p>
        </Card>
      </motion.div>
    )
  }

  return (
    <Card className="p-4 space-y-4">
      <PwdInput label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
      <PwdInput label="New Password (min 8 chars)" value={newPassword} onChange={setNewPassword} />
      <PwdInput label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />
      <Button onClick={submit} disabled={loading} className="w-full rounded-2xl h-12">
        {loading ? 'Updating…' : 'Update Password'}
      </Button>
    </Card>
  )
}

function EditProfileSection({ onSaved }: { onSaved: () => void }) {
  const { user } = useApp()
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || '')
  const [bio, setBio] = useState(user?.profile?.bio || '')
  const [location, setLocation] = useState(user?.profile?.location || '')
  const [skills, setSkills] = useState((user?.profile?.skills || []).join(', '))
  const [languages, setLanguages] = useState((user?.profile?.languages || []).join(', '))
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      // We'll use a direct update — need an endpoint. For now, use the existing pattern.
      const res = await fetch('/api/profiles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
        }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Profile updated')
        onSaved()
      } else {
        toast.error(json.error || 'Update failed')
      }
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Display Name</Label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
      </div>
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell buyers about yourself…" className="min-h-[80px]" maxLength={500} />
        <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
      </div>
      <div className="space-y-2">
        <Label>Location</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
      </div>
      <div className="space-y-2">
        <Label>Skills (comma-separated)</Label>
        <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Logo Design, Branding, Illustration" />
      </div>
      <div className="space-y-2">
        <Label>Languages (comma-separated)</Label>
        <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Spanish" />
      </div>
      <Button onClick={submit} disabled={loading} className="w-full rounded-2xl h-12">
        {loading ? 'Saving…' : 'Save Profile'}
      </Button>
    </Card>
  )
}

function PinInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="password"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••"
        maxLength={4}
        className="text-center text-2xl tracking-[0.5em] font-bold h-14"
      />
    </div>
  )
}

function PwdInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
