'use client'

import { useState, useRef, useEffect } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Lock, KeyRound, User, Shield, Bell, Globe, LogOut, ChevronRight, Check, Moon, Sun, Fingerprint, Camera, Volume2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function SettingsView() {
  const { setView, user, refreshUser } = useApp()
  const { theme, setTheme } = useTheme()
  const [section, setSection] = useState<'menu' | 'pin' | 'password' | 'profile' | '2fa' | 'notifications'>('menu')
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window === 'undefined') return true
    return (localStorage.getItem('sm_message_sound') || 'on') === 'on'
  })

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
            {section === '2fa' && 'Two-Factor Authentication'}
            {section === 'notifications' && 'Notification Preferences'}
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
                <SettingRow
                  icon={<Fingerprint className="h-4 w-4 text-primary" />}
                  label="Two-Factor Auth"
                  desc={user?.twoFactorEnabled ? 'Enabled — requires code on login' : 'Add an extra layer of security'}
                  badge={user?.twoFactorEnabled ? 'ON' : undefined}
                  onClick={() => setSection('2fa')}
                  trailing={user?.twoFactorEnabled ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : undefined}
                />
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
                <SettingRow
                  icon={<Volume2 className="h-4 w-4 text-primary" />}
                  label="Message Sound"
                  desc="Play a beep on new messages"
                  onClick={() => {
                    const current = localStorage.getItem('sm_message_sound') || 'on'
                    localStorage.setItem('sm_message_sound', current === 'on' ? 'off' : 'on')
                    setSoundOn(current === 'off')
                    toast.success(`Message sound ${current === 'off' ? 'enabled' : 'disabled'}`)
                  }}
                  trailing={<ToggleSwitch on={soundOn} />}
                />
                <SettingRow icon={<Bell className="h-4 w-4 text-primary" />} label="Notifications" desc="Manage notification preferences" onClick={() => setSection('notifications')} />
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
        {section === '2fa' && <TwoFactorSection enabled={user?.twoFactorEnabled || false} onChanged={() => { refreshUser(); setSection('menu') }} />}
        {section === 'notifications' && <NotificationPrefsSection />}
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
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' })
      const json = await res.json()
      if (json.success) {
        setAvatarUrl(json.data.url)
        toast.success('Avatar uploaded')
      } else {
        toast.error(json.error || 'Upload failed')
      }
    } catch (e: any) {
      toast.error(e.message || 'Upload failed')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profiles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          avatarUrl: avatarUrl || undefined,
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
      {/* Avatar uploader */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadAvatar(file)
          if (avatarInputRef.current) avatarInputRef.current.value = ''
        }}
      />
      <div className="flex flex-col items-center gap-3 py-2">
        <button
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploadingAvatar}
          className="relative h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            user?.username?.[0]?.toUpperCase() || '?'
          )}
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
            <Camera className="h-3.5 w-3.5" />
          </div>
        </button>
        <p className="text-xs text-muted-foreground">Tap to upload avatar</p>
      </div>

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

function TwoFactorSection({ enabled, onChanged }: { enabled: boolean; onChanged: () => void }) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'disable'>(enabled ? 'disable' : 'intro')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const setup = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST', credentials: 'include' })
      const json = await res.json()
      if (json.success) {
        setQrUrl(json.data.qrUrl)
        setSecret(json.data.secret)
        setStep('qr')
      } else {
        toast.error(json.error || 'Setup failed')
      }
    } catch (e: any) {
      toast.error(e.message || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    if (code.length !== 6) return toast.error('Enter 6-digit code')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('2FA enabled successfully!')
        onChanged()
      } else {
        toast.error(json.error || 'Invalid code')
      }
    } catch (e: any) {
      toast.error(e.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const disable = async () => {
    if (code.length !== 6) return toast.error('Enter 6-digit code')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('2FA disabled')
        onChanged()
      } else {
        toast.error(json.error || 'Invalid code')
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'disable') {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-600">2FA is Active</p>
            <p className="text-xs text-muted-foreground">Your account requires a verification code on login.</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-600 font-semibold">Disable 2FA</p>
          <p className="text-xs text-muted-foreground mt-1">Enter your current 6-digit code to disable 2FA.</p>
        </div>
        <Input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          className="text-center text-2xl tracking-[0.3em] font-bold h-14"
        />
        <Button onClick={disable} disabled={loading} variant="destructive" className="w-full rounded-2xl">
          {loading ? 'Disabling…' : 'Disable 2FA'}
        </Button>
      </Card>
    )
  }

  if (step === 'intro') {
    return (
      <Card className="p-6 space-y-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <Fingerprint className="h-8 w-8" />
        </div>
        <div>
          <p className="text-base font-bold">Protect Your Account</p>
          <p className="text-xs text-muted-foreground mt-1">
            Two-factor authentication adds an extra layer of security. You'll need a 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) each time you log in.
          </p>
        </div>
        <div className="text-left space-y-2 p-3 rounded-xl bg-secondary/50">
          <p className="text-xs font-bold">How it works:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Scan the QR code with your authenticator app</li>
            <li>Enter the 6-digit code to verify</li>
            <li>2FA is enabled — use the code on every login</li>
          </ol>
        </div>
        <Button onClick={setup} disabled={loading} className="w-full rounded-2xl h-12">
          {loading ? 'Setting up…' : 'Get Started'}
        </Button>
      </Card>
    )
  }

  if (step === 'qr' && qrUrl) {
    return (
      <Card className="p-4 space-y-4">
        <div className="text-center">
          <p className="text-sm font-bold">Scan QR Code</p>
          <p className="text-xs text-muted-foreground mt-1">Use Google Authenticator, Authy, or any TOTP app</p>
        </div>
        <div className="flex justify-center">
          <div className="p-3 bg-white rounded-2xl">
            <img src={qrUrl} alt="2FA QR Code" className="h-48 w-48" />
          </div>
        </div>
        {secret && (
          <div className="p-3 rounded-xl bg-secondary/50">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Manual entry code</p>
            <p className="text-xs font-mono break-all mt-1">{secret}</p>
          </div>
        )}
        <Button onClick={() => setStep('verify')} className="w-full rounded-2xl">
          I've Scanned the Code
        </Button>
      </Card>
    )
  }

  if (step === 'verify') {
    return (
      <Card className="p-4 space-y-4">
        <div className="text-center">
          <p className="text-sm font-bold">Enter Verification Code</p>
          <p className="text-xs text-muted-foreground mt-1">Enter the 6-digit code from your authenticator app</p>
        </div>
        <Input
          type="text"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          className="text-center text-3xl tracking-[0.3em] font-bold h-16"
        />
        <Button onClick={verify} disabled={loading || code.length !== 6} className="w-full rounded-2xl h-12">
          {loading ? 'Verifying…' : 'Enable 2FA'}
        </Button>
        <button onClick={() => setStep('qr')} className="w-full text-xs text-muted-foreground hover:text-foreground">
          ← Back to QR code
        </button>
      </Card>
    )
  }

  return null
}

const NOTIF_TYPES = [
  { key: 'order', label: 'Orders', desc: 'New orders and order status updates' },
  { key: 'payment', label: 'Payments', desc: 'Payment releases and escrow updates' },
  { key: 'transfer', label: 'Transfers', desc: 'SkillCredits sent and received' },
  { key: 'message', label: 'Messages', desc: 'New chat messages' },
  { key: 'review', label: 'Reviews', desc: 'New reviews on your services' },
  { key: 'dispute', label: 'Disputes', desc: 'Dispute updates and resolutions' },
  { key: 'announcement', label: 'Announcements', desc: 'Platform-wide broadcasts' },
  { key: 'referral', label: 'Referrals', desc: 'Referral rewards and signups' },
]

function NotificationPrefsSection() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ preferences: Record<string, boolean> }>('/api/notifications/preferences')
      .then((d) => setPrefs(d.preferences))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (key: string) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    try {
      await api.patch('/api/notifications/preferences', { [key]: !prefs[key] })
      toast.success('Preference updated')
    } catch (e: any) {
      setPrefs(prefs) // revert
      toast.error(e.message || 'Failed to update')
    }
  }

  if (loading) {
    return (
      <Card className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </Card>
    )
  }

  return (
    <Card className="p-0 divide-y divide-border/40">
      {NOTIF_TYPES.map((t) => (
        <div key={t.key} className="flex items-center gap-3 p-3.5">
          <div className="flex-1">
            <p className="text-sm font-semibold">{t.label}</p>
            <p className="text-xs text-muted-foreground">{t.desc}</p>
          </div>
          <button
            onClick={() => toggle(t.key)}
            className={`relative h-6 w-11 rounded-full transition flex-shrink-0 ${prefs[t.key] ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${prefs[t.key] ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      ))}
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
