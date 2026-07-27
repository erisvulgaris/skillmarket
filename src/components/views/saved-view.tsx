'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, type Service } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { Bookmark, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function SavedView() {
  const { setView } = useApp()
  const [saved, setSaved] = useState<{ id: string; service: Service }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: { id: string; service: Service }[] }>('/api/saved')
      setSaved(data.items)
    } catch {
      toast.error('Failed to load saved services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (saveId: string) => {
    // Find the service to call unsave endpoint
    const item = saved.find((s) => s.id === saveId)
    if (!item) return
    try {
      await api.delete(`/api/services/${item.service.id}/save`)
      setSaved((prev) => prev.filter((s) => s.id !== saveId))
      toast.success('Removed from saved')
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Saved Services</h1>
        {saved.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{saved.length} saved</span>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : saved.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 space-y-3"
          >
            <div className="inline-flex h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center mx-auto">
              <Bookmark className="h-10 w-10 text-primary/40" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">No saved services yet</p>
              <p className="text-sm text-muted-foreground mt-1">Bookmark services you like to find them here later</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setView('marketplace')}
                className="inline-flex items-center h-10 px-5 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition shadow-lg shadow-primary/20"
              >
                Browse services →
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {saved.map(({ id, service }) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="relative"
              >
                <button
                  onClick={() => setView('service-detail', { id: service.id })}
                  className="w-full text-left active:scale-[0.99] transition"
                >
                  <Card className="p-2.5 flex items-center gap-3 pr-10">
                    <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {service.images[0] ? (
                        <img src={service.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl">🎨</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2">{service.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Rating value={service.ratingAvg} count={service.ratingCount} size="sm" />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">@{service.seller.username}</span>
                        <SkillCredits amount={service.price} size="sm" />
                      </div>
                    </div>
                  </Card>
                </button>
                <button
                  onClick={() => remove(id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
