'use client'

import { useState, useMemo } from 'react'
import { api } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import {
  Search, ChevronLeft, ChevronRight, Check, X, Ban, UserCheck,
  Snowflake, DollarSign, Download, Shield, ShieldOff,
} from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { formatSC } from '@/components/sc-badge'

interface UserItem {
  id: string
  username: string
  email: string
  role: string
  status: string
  isVerified: boolean | null
  createdAt: string
  lastLoginAt: string | null
  wallet: { availableBalance: number; frozen: boolean } | null
}

interface UsersClientProps {
  initialUsers: UserItem[]
  initialTotal: number
  initialPage: number
  initialLimit: number
}

export function UsersClient({ initialUsers, initialTotal, initialPage, initialLimit }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [editingCommission, setEditingCommission] = useState<string | null>(null)
  const [commissionValue, setCommissionValue] = useState('')
  const [showCommissionModal, setShowCommissionModal] = useState(false)

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!u.username.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [users, search, statusFilter])

  const totalPages = Math.ceil(total / limit)

  const loadPage = async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const d = await api.get<{ items: UserItem[]; total: number }>(`/api/admin/users?${params}`)
      setUsers(d.items)
      setTotal(d.total)
      setPage(p)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const doSearch = () => {
    setPage(1)
    loadPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((u) => u.id)))
    }
  }

  const userAction = async (userId: string, action: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}`, { action, reason: `Admin ${action}` })
      toast.success(`User ${action}d`)
      loadPage(page)
    } catch (e: any) {
      toast.error(e.message || 'Action failed')
    }
  }

  const bulkAction = async (action: string) => {
    if (selectedIds.size === 0) return toast.error('No users selected')
    if (action === 'set_commission') {
      setShowCommissionModal(true)
      return
    }
    setLoading(true)
    try {
      for (const id of selectedIds) {
        await api.patch(`/api/admin/users/${id}`, { action, reason: `Bulk ${action}` })
      }
      toast.success(`${selectedIds.size} users ${action}d`)
      setSelectedIds(new Set())
      setBulkMode(false)
      loadPage(page)
    } catch (e: any) {
      toast.error(e.message || 'Bulk action failed')
    } finally {
      setLoading(false)
    }
  }

  const applyCommission = async () => {
    const rate = parseFloat(commissionValue)
    if (isNaN(rate) || rate < 0 || rate > 100) return toast.error('Enter a valid commission rate (0-100)')
    setLoading(true)
    try {
      for (const id of selectedIds) {
        await api.patch(`/api/admin/settings`, {
          key: `commission_rate_user_${id}`,
          value: String(rate),
          type: 'float',
        })
      }
      toast.success(`Commission rate set to ${rate}% for ${selectedIds.size} users`)
      setSelectedIds(new Set())
      setShowCommissionModal(false)
      setCommissionValue('')
      setBulkMode(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to set commission')
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    const csv = [
      'Username,Email,Status,Role,Balance,Frozen,Verified,Joined',
      ...filtered.map((u) =>
        `${u.username},${u.email},${u.status},${u.role},${u.wallet?.availableBalance ?? 0},${u.wallet?.frozen ?? false},${u.isVerified ? 'yes' : 'no'},${new Date(u.createdAt).toLocaleDateString()}`
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Users exported')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Search by username or email..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={doSearch}>
            Search
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'active', 'suspended', 'banned'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); loadPage(1) }}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition',
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={() => setBulkMode(!bulkMode)}>
            {bulkMode ? 'Cancel' : 'Bulk'}
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {bulkMode && selectedIds.size > 0 && (
        <Card className="p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkAction('suspend')}>
            <Ban className="h-3 w-3 mr-1" /> Suspend
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkAction('activate')}>
            <UserCheck className="h-3 w-3 mr-1" /> Activate
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkAction('set_commission')}>
            <DollarSign className="h-3 w-3 mr-1" /> Commission
          </Button>
        </Card>
      )}

      {bulkMode && selectedIds.size === 0 && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground text-center">Select users using the checkboxes to perform bulk actions</p>
        </Card>
      )}

      {showCommissionModal && (
        <Card className="p-4 space-y-3 border-primary/30">
          <p className="text-sm font-bold">Set Commission Rate</p>
          <p className="text-xs text-muted-foreground">For {selectedIds.size} selected users</p>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionValue}
              onChange={(e) => setCommissionValue(e.target.value)}
              placeholder="Rate (0-100)"
              className="h-9 text-sm"
            />
            <span className="text-sm text-muted-foreground self-center">%</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={applyCommission} disabled={loading}>
              {loading ? 'Applying...' : 'Apply'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCommissionModal(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {bulkMode && (
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                )}
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">User</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">Role</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">Wallet</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={bulkMode ? 8 : 7} className="px-3 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={bulkMode ? 8 : 7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
              {!loading && filtered.map((user) => (
                <tr key={user.id} className="hover:bg-accent/30 transition-colors">
                  {bulkMode && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded border-border"
                      />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">@{user.username}</p>
                        {user.isVerified && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-emerald-600 border-emerald-500/30">
                            <Check className="h-2.5 w-2.5 mr-0.5" /> Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                    {user.email}
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                      user.role === 'admin' ? 'bg-violet-500/10 text-violet-600' : 'bg-muted text-muted-foreground'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={clsx(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                      user.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                      user.status === 'suspended' ? 'bg-amber-500/10 text-amber-600' :
                      user.status === 'banned' ? 'bg-rose-500/10 text-rose-600' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="text-sm font-semibold tabular-nums">
                      {formatSC(user.wallet?.availableBalance ?? 0)}
                    </div>
                    {user.wallet?.frozen && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 text-amber-600 border-amber-500/30">
                        <Snowflake className="h-2.5 w-2.5 mr-0.5" /> Frozen
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => userAction(user.id, 'suspend')}
                          className="h-7 px-2 rounded-md text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors"
                          title="Suspend"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => userAction(user.id, 'activate')}
                          className="h-7 px-2 rounded-md text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                          title="Activate"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {user.role === 'admin' ? (
                        <button
                          onClick={() => userAction(user.id, 'remove_admin')}
                          className="h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                          title="Remove admin"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => userAction(user.id, 'make_admin')}
                          className="h-7 px-2 rounded-md text-xs font-medium text-violet-600 hover:bg-violet-500/10 transition-colors"
                          title="Make admin"
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-3 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {total} total · Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1 || loading}
              onClick={() => loadPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages || loading}
              onClick={() => loadPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
