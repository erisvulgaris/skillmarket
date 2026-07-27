'use client'

import { useState, useMemo } from 'react'
import { api } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search, ChevronLeft, ChevronRight, Flag, Eye, EyeOff,
  Star, StarOff, Trash2, RefreshCw,
} from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { formatSC } from '@/components/sc-badge'
import Link from 'next/link'

interface ServiceItem {
  id: string
  title: string
  slug: string
  price: number
  status: string
  featured: boolean
  views: number
  ratingAvg: number
  ratingCount: number
  completedOrders: number
  createdAt: string
  seller: { id: string; username: string; displayName?: string | null }
  category: { id: string; name: string; slug: string } | null
}

interface ServicesClientProps {
  initialServices: ServiceItem[]
  initialTotal: number
  initialPage: number
  initialLimit: number
}

export function ServicesClient({ initialServices, initialTotal, initialPage, initialLimit }: ServicesClientProps) {
  const [services, setServices] = useState<ServiceItem[]>(initialServices)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)

  const categories = useMemo(() => {
    const cats = new Map<string, string>()
    services.forEach((s) => {
      if (s.category) cats.set(s.category.id, s.category.name)
    })
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name }))
  }, [services])

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (categoryFilter !== 'all' && s.category?.id !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.title.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [services, search, statusFilter, categoryFilter])

  const totalPages = Math.ceil(total / limit)

  const loadPage = async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const d = await api.get<{ items: ServiceItem[]; total: number }>(`/api/admin/services?${params}`)
      setServices(d.items)
      setTotal(d.total)
      setPage(p)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const serviceAction = async (serviceId: string, action: string) => {
    try {
      await api.patch(`/api/admin/services/${serviceId}`, { action })
      toast.success(`Service ${action}d`)
      loadPage(page)
    } catch (e: any) {
      toast.error(e.message || 'Action failed')
    }
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
      setSelectedIds(new Set(filtered.map((s) => s.id)))
    }
  }

  const bulkAction = async (action: string) => {
    if (selectedIds.size === 0) return toast.error('No services selected')
    setLoading(true)
    try {
      for (const id of selectedIds) {
        await api.patch(`/api/admin/services/${id}`, { action })
      }
      toast.success(`${selectedIds.size} services ${action}d`)
      setSelectedIds(new Set())
      setBulkMode(false)
      loadPage(page)
    } catch (e: any) {
      toast.error(e.message || 'Bulk action failed')
    } finally {
      setLoading(false)
    }
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
              onKeyDown={(e) => e.key === 'Enter' && loadPage(1)}
              placeholder="Search by title..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={() => { setPage(1); loadPage(1) }}>
            Search
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'active', 'hidden', 'flagged', 'removed'].map((s) => (
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
        <Button variant="outline" size="sm" className="h-9" onClick={() => setBulkMode(!bulkMode)}>
          {bulkMode ? 'Cancel' : 'Bulk'}
        </Button>
      </div>

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => { setCategoryFilter('all'); setPage(1); loadPage(1) }}
            className={clsx(
              'flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition',
              categoryFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategoryFilter(cat.id); setPage(1); loadPage(1) }}
              className={clsx(
                'flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition',
                categoryFilter === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {bulkMode && selectedIds.size > 0 && (
        <Card className="p-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-muted-foreground">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => bulkAction('flag')}>
            <Flag className="h-3 w-3 mr-1" /> Flag
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600" onClick={() => bulkAction('remove')}>
            <Trash2 className="h-3 w-3 mr-1" /> Remove
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => bulkAction('activate')}>
            <RefreshCw className="h-3 w-3 mr-1" /> Restore
          </Button>
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
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">Service</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden md:table-cell">Seller</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Category</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">Price</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Orders</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Rating</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={bulkMode ? 9 : 8} className="px-3 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={bulkMode ? 9 : 8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No services found
                  </td>
                </tr>
              )}
              {!loading && filtered.map((service) => (
                <tr key={service.id} className="hover:bg-accent/30 transition-colors">
                  {bulkMode && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(service.id)}
                        onChange={() => toggleSelect(service.id)}
                        className="rounded border-border"
                      />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {service.title[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate max-w-[200px]">{service.title}</p>
                        <p className="text-[10px] text-muted-foreground">{service.views} views</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">@{service.seller.username}</span>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    {service.category && (
                      <Badge variant="secondary" className="text-[10px] font-medium">
                        {service.category.name}
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                    {formatSC(service.price)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                        service.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                        service.status === 'flagged' ? 'bg-amber-500/10 text-amber-600' :
                        service.status === 'removed' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {service.status}
                      </span>
                      {service.featured && (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-muted-foreground hidden lg:table-cell tabular-nums">
                    {service.completedOrders}
                  </td>
                  <td className="px-3 py-3 text-right hidden lg:table-cell">
                    <div className="flex items-center justify-end gap-1 text-sm">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="tabular-nums">{service.ratingAvg > 0 ? service.ratingAvg.toFixed(1) : '-'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {service.featured ? (
                        <button
                          onClick={() => serviceAction(service.id, 'unfeature')}
                          className="h-7 px-2 rounded-md text-xs text-amber-600 hover:bg-amber-500/10 transition-colors"
                          title="Unfeature"
                        >
                          <StarOff className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => serviceAction(service.id, 'feature')}
                          className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors"
                          title="Feature"
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {service.status === 'active' ? (
                        <button
                          onClick={() => serviceAction(service.id, 'hide')}
                          className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors"
                          title="Hide"
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => serviceAction(service.id, 'activate')}
                          className="h-7 px-2 rounded-md text-xs text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                          title="Activate"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Link
                        href={`/service/${service.slug || service.id}`}
                        className="h-7 px-2 rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors inline-flex items-center"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
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
