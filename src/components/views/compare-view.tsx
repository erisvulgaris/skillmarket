'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { ArrowLeft, Check, X, Search, GitCompare, ShieldCheck, Clock, Eye, ShoppingCart } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function CompareView() {
  const { viewParams, setView } = useApp()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const ids = (viewParams.ids as string[]) || []

  const load = useCallback(async () => {
    if (ids.length < 2) { setLoading(false); return }
    setLoading(true)
    try {
      const d = await api.get<{ services: any[] }>(`/api/services/compare?ids=${ids.join(',')}`)
      setServices(d.services)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [ids])

  useEffect(() => { load() }, [load])

  const searchServices = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    try {
      const d = await api.get<any>(`/api/marketplace/search?q=${encodeURIComponent(q)}`)
      setSearchResults(d.services.filter((s: any) => !ids.includes(s.id)).slice(0, 5))
    } catch {}
  }

  if (ids.length < 2) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <GitCompare className="h-16 w-16 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground text-center">Select at least 2 services to compare</p>
        <Button onClick={() => setView('marketplace')} className="rounded-2xl">Browse Services</Button>
      </div>
    )
  }

  const rows = [
    { label: 'Price', getValue: (s: any) => <SkillCredits amount={s.price} size="sm" /> },
    { label: 'Delivery', getValue: (s: any) => `${s.deliveryDays} days` },
    { label: 'Rating', getValue: (s: any) => <Rating value={s.ratingAvg} count={s.ratingCount} size="sm" /> },
    { label: 'Views', getValue: (s: any) => `${s.views}` },
    { label: 'Sold', getValue: (s: any) => `${s.completedOrders}` },
    { label: 'Seller', getValue: (s: any) => `@${s.seller.username}` },
    { label: 'Verified', getValue: (s: any) => s.seller.isVerified ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Response', getValue: (s: any) => `${s.seller.responseTimeMins}m` },
    { label: 'Category', getValue: (s: any) => s.category?.name || '—' },
    { label: 'Tags', getValue: (s: any) => s.tags.slice(0, 3).join(', ') || '—' },
  ]

  // Find best value for each row
  const bestPrice = Math.min(...services.map(s => s.price))
  const bestDelivery = Math.min(...services.map(s => s.deliveryDays))
  const bestRating = Math.max(...services.map(s => s.ratingAvg))

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('marketplace')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Compare Services</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 pb-24">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Service headers */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${services.length}, 1fr)` }}>
              <div></div>
              {services.map((s) => (
                <div key={s.id} className="text-center">
                  <div className="h-16 w-full rounded-xl bg-muted overflow-hidden mb-1">
                    {s.images[0] ? <img src={s.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-2xl">🎨</div>}
                  </div>
                  <p className="text-[10px] font-semibold line-clamp-2 leading-tight">{s.title}</p>
                </div>
              ))}
            </div>

            {/* Comparison rows */}
            <Card className="p-0 overflow-hidden">
              {rows.map((row, i) => (
                <div key={row.label} className={clsx('grid items-center py-2.5 px-3', i % 2 === 0 ? 'bg-muted/30' : '')} style={{ gridTemplateColumns: `80px repeat(${services.length}, 1fr)` }}>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{row.label}</span>
                  {services.map((s) => {
                    const isBest = (row.label === 'Price' && s.price === bestPrice) ||
                      (row.label === 'Delivery' && s.deliveryDays === bestDelivery) ||
                      (row.label === 'Rating' && s.ratingAvg === bestRating)
                    return (
                      <div key={s.id} className={clsx('text-center text-xs', isBest && 'font-bold text-emerald-500')}>
                        {row.getValue(s)}
                        {isBest && <span className="block text-[8px] text-emerald-500">BEST</span>}
                      </div>
                    )
                  })}
                </div>
              ))}
            </Card>

            {/* Action buttons */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `80px repeat(${services.length}, 1fr)` }}>
              <div></div>
              {services.map((s) => (
                <Button
                  key={s.id}
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setView('service-detail', { id: s.id })}
                >
                  View
                </Button>
              ))}
            </div>

            {/* Packages comparison */}
            {services.some(s => s.packages?.length > 0) && (
              <Card className="p-4 space-y-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">Packages</p>
                {['Basic', 'Standard', 'Premium'].map((pkgName) => {
                  const hasAny = services.some(s => s.packages?.some((p: any) => p.name === pkgName))
                  if (!hasAny) return null
                  return (
                    <div key={pkgName} className={clsx('grid items-center py-2', 'border-t border-border/30')} style={{ gridTemplateColumns: `80px repeat(${services.length}, 1fr)` }}>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{pkgName}</span>
                      {services.map((s) => {
                        const pkg = s.packages?.find((p: any) => p.name === pkgName)
                        return (
                          <div key={s.id} className="text-center text-xs">
                            {pkg ? <SkillCredits amount={pkg.price} size="sm" /> : '—'}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
