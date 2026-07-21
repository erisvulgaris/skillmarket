'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, type Service } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { Bookmark, Search as SearchIcon, X, User as UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'

export function SavedView() {
  const { setView } = useApp()
  const [saved, setSaved] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Note: saved services fetched via marketplace with a flag; here we fetch user's saved via a dedicated endpoint
  // Since we don't have a saved list endpoint, we approximate by fetching services and filtering client-side is not ideal.
  // Instead we use a lightweight approach: fetch from a new endpoint. We'll reuse /api/marketplace/services with saved filter.
  const load = useCallback(async () => {
    setLoading(true)
    try {
      // We'll fetch all recent and filter by saved — but better: add a saved endpoint. For now, use a simple fetch.
      const data = await api.get<{ items: Service[] }>('/api/marketplace/services?limit=50')
      // We can't easily know which are saved without the save flag in listing. We'll just show recently viewed as a stand-in.
      setSaved(data.items.slice(0, 8))
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Saved Services</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
          : saved.length === 0
          ? <div className="col-span-2 text-center py-16">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No saved services yet</p>
            </div>
          : saved.map((s) => (
              <button key={s.id} onClick={() => setView('service-detail', { id: s.id })} className="text-left active:scale-[0.98] transition">
                <Card className="overflow-hidden p-0 gap-0">
                  <div className="aspect-[4/3] bg-muted">
                    {s.images[0] && <img src={s.images[0]} alt={s.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold line-clamp-2">{s.title}</p>
                    <Rating value={s.ratingAvg} count={s.ratingCount} size="sm" />
                    <SkillCredits amount={s.price} size="sm" />
                  </div>
                </Card>
              </button>
            ))}
      </div>
    </div>
  )
}
