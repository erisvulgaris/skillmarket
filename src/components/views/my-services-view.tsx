'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { ArrowLeft, Plus, Package, RotateCcw, Archive, Eye, MoreVertical, Star } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function MyServicesView() {
  const { setView } = useApp()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<{ services: any[] }>('/api/my-services')
      setServices(d.services)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = services.filter((s) => {
    if (filter === 'active') return s.status === 'active' && !s.deletedAt
    if (filter === 'archived') return s.deletedAt || s.status === 'hidden'
    return true
  })

  const restore = async (id: string) => {
    try {
      await api.delete(`/api/services/${id}/archive`)
      toast.success('Service restored')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
  }

  const activeCount = services.filter((s) => s.status === 'active' && !s.deletedAt).length
  const archivedCount = services.filter((s) => s.deletedAt || s.status === 'hidden').length

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('profile')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">My Services</h1>
          <button
            onClick={() => setView('create-service')}
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <p className="text-xl font-bold">{services.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xl font-bold text-emerald-500">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xl font-bold text-muted-foreground">{archivedCount}</p>
            <p className="text-[10px] text-muted-foreground">Archived</p>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex p-1 bg-muted rounded-2xl">
          {([
            { k: 'all', label: 'All' },
            { k: 'active', label: 'Active' },
            { k: 'archived', label: 'Archived' },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setFilter(t.k)}
              className={clsx(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition',
                filter === t.k ? 'bg-card shadow-sm' : 'text-muted-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Service list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === 'archived' ? 'No archived services' : 'No services yet'}
            </p>
            {filter !== 'archived' && (
              <button onClick={() => setView('create-service')} className="mt-3 text-sm font-semibold text-primary">
                Create your first service →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s, i) => {
              const isArchived = s.deletedAt || s.status === 'hidden'
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 30 }}
                >
                  <Card className={clsx('p-3', isArchived && 'opacity-60')}>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                        {s.images[0] ? (
                          <img src={s.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xl">🎨</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold line-clamp-1">{s.title}</p>
                          {isArchived && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">ARCHIVED</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Rating value={s.ratingAvg} count={s.ratingCount} size="sm" showCount={false} />
                          <span className="text-[10px] text-muted-foreground">· {s.views} views</span>
                          <span className="text-[10px] text-muted-foreground">· {s.completedOrders} sold</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <SkillCredits amount={s.price} size="sm" />
                          <span className="text-[10px] text-muted-foreground">{s.deliveryDays}d delivery</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs flex-1"
                        onClick={() => setView('service-detail', { id: s.id })}
                      >
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                      {isArchived ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs flex-1 text-emerald-600"
                          onClick={() => restore(s.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Restore
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs flex-1"
                          onClick={() => setView('create-service', { editId: s.id })}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
