'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Settings, Plus, Trash2, Save, Key, Percent, ToggleLeft,
  SlidersHorizontal, CreditCard, Eye, EyeOff,
} from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'

interface Setting {
  id: string
  key: string
  value: string
  type: string
}

interface FeatureFlag {
  id: string
  key: string
  label: string
  description: string
  enabled: boolean
}

interface RazorpayKey {
  id: string
  label: string
  keyId: string
  keySecret: string
  active: boolean
  createdAt: string
}

const PLATFORM_SETTINGS_META: Record<string, { label: string; description: string }> = {
  commission_default_rate: { label: 'Default Commission Rate', description: 'Global commission rate applied to all orders' },
  min_payout: { label: 'Minimum Payout', description: 'Minimum amount a seller can withdraw' },
  max_escrow_days: { label: 'Max Escrow Days', description: 'Maximum days funds held in escrow' },
  max_order_value: { label: 'Max Order Value', description: 'Maximum value allowed per order' },
  referral_bonus: { label: 'Referral Bonus', description: 'Credits earned per successful referral' },
  free_credits_on_signup: { label: 'Free Credits on Signup', description: 'Free credits given to new users' },
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [razorpayKeys, setRazorpayKeys] = useState<RazorpayKey[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSetting, setSavingSetting] = useState<string | null>(null)

  const [showAddKey, setShowAddKey] = useState(false)
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [newKeyId, setNewKeyId] = useState('')
  const [newKeySecret, setNewKeySecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [addingKey, setAddingKey] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const d = await api.get<{ settings: Setting[] }>('/api/admin/settings')
      setSettings(d.settings)
    } catch {} 
  }, [])

  const loadFlags = useCallback(async () => {
    try {
      const d = await api.get<{ flags: FeatureFlag[] }>('/api/admin/feature-flags')
      setFlags(d.flags)
    } catch {}
  }, [])

  const loadRazorpayKeys = useCallback(async () => {
    try {
      const d = await api.get<{ keys: RazorpayKey[] }>('/api/admin/razorpay/keys')
      setRazorpayKeys(d.keys || [])
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([loadSettings(), loadFlags(), loadRazorpayKeys()]).finally(() => setLoading(false))
  }, [loadSettings, loadFlags, loadRazorpayKeys])

  const updateSetting = async (key: string, value: string) => {
    setSavingSetting(key)
    try {
      await api.patch('/api/admin/settings', { key, value, type: 'string' })
      toast.success('Setting updated')
      loadSettings()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    } finally {
      setSavingSetting(null)
    }
  }

  const toggleFlag = async (flag: FeatureFlag) => {
    try {
      await api.patch('/api/admin/feature-flags', { key: flag.key, enabled: !flag.enabled })
      toast.success(`${flag.label} ${!flag.enabled ? 'enabled' : 'disabled'}`)
      loadFlags()
    } catch (e: any) {
      toast.error(e.message || 'Failed to toggle')
    }
  }

  const addRazorpayKey = async () => {
    if (!newKeyLabel.trim() || !newKeyId.trim() || !newKeySecret.trim()) {
      return toast.error('All fields are required')
    }
    setAddingKey(true)
    try {
      await api.post('/api/admin/razorpay/keys', {
        label: newKeyLabel.trim(),
        keyId: newKeyId.trim(),
        keySecret: newKeySecret.trim(),
      })
      toast.success('Razorpay key added')
      setNewKeyLabel('')
      setNewKeyId('')
      setNewKeySecret('')
      setShowAddKey(false)
      loadRazorpayKeys()
    } catch (e: any) {
      toast.error(e.message || 'Failed to add key')
    } finally {
      setAddingKey(false)
    }
  }

  const deleteRazorpayKey = async (keyId: string) => {
    try {
      await api.delete(`/api/admin/razorpay/keys/${keyId}`)
      toast.success('Key deleted')
      loadRazorpayKeys()
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete')
    }
  }

  const toggleRazorpayKeyActive = async (key: RazorpayKey) => {
    try {
      await api.patch(`/api/admin/razorpay/keys/${key.id}`, { active: !key.active })
      toast.success(`Key ${!key.active ? 'activated' : 'deactivated'}`)
      loadRazorpayKeys()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform configuration and management</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-9 w-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration and management</p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Razorpay Keys</h2>
        </div>

        {razorpayKeys.length > 0 && (
          <div className="space-y-2">
            {razorpayKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className={clsx('h-2 w-2 rounded-full', key.active ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{key.label}</p>
                  <p className="text-xs font-mono text-muted-foreground truncate">{key.keyId}</p>
                </div>
                <Switch
                  checked={key.active}
                  onCheckedChange={() => toggleRazorpayKeyActive(key)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600"
                  onClick={() => deleteRazorpayKey(key.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showAddKey ? (
          <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Label</label>
              <Input
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder="Production Key"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Key ID</label>
              <Input
                value={newKeyId}
                onChange={(e) => setNewKeyId(e.target.value)}
                placeholder="rzp_live_..."
                className="h-9 text-sm font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Key Secret</label>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={newKeySecret}
                  onChange={(e) => setNewKeySecret(e.target.value)}
                  placeholder="Enter secret key"
                  className="h-9 text-sm font-mono pr-9"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={addRazorpayKey} disabled={addingKey}>
                {addingKey ? 'Adding...' : 'Add Key'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddKey(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowAddKey(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Key
          </Button>
        )}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Commission Settings</h2>
        </div>
        <div className="space-y-3">
          {settings
            .filter((s) => s.key === 'commission_default_rate')
            .map((setting) => (
              <SettingEditor
                key={setting.id}
                setting={setting}
                meta={PLATFORM_SETTINGS_META[setting.key]}
                onSave={updateSetting}
                saving={savingSetting === setting.key}
              />
            ))}
          {settings.filter((s) => s.key.startsWith('commission_rate_user_')).map((setting) => (
            <SettingEditor
              key={setting.id}
              setting={setting}
              onSave={updateSetting}
              saving={savingSetting === setting.key}
            />
          ))}
          {settings.filter((s) => s.key === 'commission_default_rate').length === 0 && (
            <p className="text-xs text-muted-foreground">No commission settings configured yet</p>
          )}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Feature Flags</h2>
        </div>
        <div className="space-y-2">
          {flags.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No feature flags configured</p>
          )}
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{flag.label || flag.key}</p>
                {flag.description && (
                  <p className="text-xs text-muted-foreground">{flag.description}</p>
                )}
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={() => toggleFlag(flag)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Platform Settings</h2>
        </div>
        <div className="space-y-4">
          {settings
            .filter((s) => Object.keys(PLATFORM_SETTINGS_META).includes(s.key))
            .map((setting) => (
              <SettingEditor
                key={setting.id}
                setting={setting}
                meta={PLATFORM_SETTINGS_META[setting.key]}
                onSave={updateSetting}
                saving={savingSetting === setting.key}
              />
            ))}
          {settings.filter((s) => Object.keys(PLATFORM_SETTINGS_META).includes(s.key)).length === 0 && (
            <div className="space-y-2">
              {settings.filter((s) => !s.key.startsWith('commission_')).map((setting) => (
                <SettingEditor
                  key={setting.id}
                  setting={setting}
                  onSave={updateSetting}
                  saving={savingSetting === setting.key}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function SettingEditor({
  setting,
  meta,
  onSave,
  saving,
}: {
  setting: Setting
  meta?: { label: string; description: string }
  onSave: (key: string, value: string) => Promise<void>
  saving?: boolean
}) {
  const [val, setVal] = useState(setting.value)

  return (
    <div className="p-3 rounded-lg border border-border">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold">{meta?.label || setting.key}</p>
          {meta?.description && (
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          )}
          {!meta && (
            <p className="text-xs font-mono text-muted-foreground">{setting.key}</p>
          )}
        </div>
        <Badge variant="secondary" className="text-[9px] uppercase flex-shrink-0">
          {setting.type}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="h-9 text-sm"
        />
        <Button
          size="sm"
          className="h-9"
          onClick={() => onSave(setting.key, val)}
          disabled={saving || val === setting.value}
        >
          {saving ? '...' : <Save className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}
