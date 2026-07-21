'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, type Service } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, Flame, Sparkles, Clock, Star, Bookmark, ChevronRight, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import Link from 'next/link'

type Category = { id: string; name: string; slug: string; icon?: string | null; children?: Category[] }

export function MarketplaceView() {
  const { setView, user } = useApp()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'trending' | 'newest' | 'popular' | 'featured'>('trending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sort = tab === 'trending' ? 'trending' : tab === 'newest' ? 'newest' : tab === 'popular' ? 'popular' : 'newest'
      const [svc, cats] = await Promise.all([
        api.get<{ items: Service[] }>(`/api/marketplace/services?sort=${sort}&limit=20`),
        api.get<{ categories: Category[] }>('/api/marketplace/categories'),
      ])
      setServices(svc.items)
      setCategories(cats.categories)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const featured = services.filter((s) => s.featured).slice(0, 5)
  const trending = [...services].sort((a, b) => b.views - a.views).slice(0, 6)

  return (
    <div className="px-4 pt-4 space-y-6">
      {/* Hero greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5"
      >
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
        <p className="text-xs text-muted-foreground font-medium">Welcome back</p>
        <h2 className="text-xl font-bold mt-0.5">{user?.profile?.displayName || user?.username}</h2>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <SkillCredits amount={user?.wallet?.availableBalance || 0} size="sm" />
          </div>
          <button
            onClick={() => setView('buy-credits')}
            className="text-xs font-semibold text-primary active:scale-95 transition"
          >
            + Buy Credits
          </button>
        </div>
      </motion.div>

      {/* Search bar */}
      <button
        onClick={() => setView('search')}
        className="w-full h-12 rounded-2xl bg-muted/60 border border-border/40 flex items-center gap-3 px-4 text-muted-foreground hover:bg-muted transition active:scale-[0.99]"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">Search services, people, categories…</span>
      </button>

      {/* Categories */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Browse Categories</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />)
          ) : (
            categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setView('search', { categoryId: c.id, categoryName: c.name })}
                className="flex-shrink-0 h-10 px-4 rounded-full bg-secondary border border-border/50 flex items-center gap-2 text-sm font-medium hover:bg-accent active:scale-95 transition"
              >
                <span className="text-base">{c.icon || '📁'}</span>
                {c.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Featured carousel */}
      {featured.length > 0 && (
        <div className="space-y-3">
          <SectionHeader icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />} title="Featured" onSeeAll={() => setView('search', { featured: true })} />
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {featured.map((s) => (
              <ServiceCardHorizontal key={s.id} service={s} onClick={() => setView('service-detail', { id: s.id })} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-2xl">
        {([
          { k: 'trending', label: 'Trending', icon: TrendingUp },
          { k: 'newest', label: 'Newest', icon: Clock },
          { k: 'popular', label: 'Popular', icon: Flame },
        ] as const).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all',
              tab === t.k ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
          : services.map((s) => (
              <ServiceCard key={s.id} service={s} onClick={() => setView('service-detail', { id: s.id })} />
            ))}
      </div>

      {services.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No services found yet.</p>
          <button onClick={() => setView('create-service')} className="mt-3 text-sm font-semibold text-primary">
            Be the first to list a service →
          </button>
        </div>
      )}

      {/* Sell CTA */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setView('create-service')}
        className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground p-4 flex items-center justify-between shadow-lg shadow-primary/20"
      >
        <div className="text-left">
          <p className="text-sm font-bold">Have a skill to sell?</p>
          <p className="text-xs opacity-80">List your service in minutes</p>
        </div>
        <ChevronRight className="h-5 w-5" />
      </motion.button>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <QuickLink icon={<Bookmark className="h-4 w-4" />} label="Saved Services" onClick={() => setView('saved')} />
        <QuickLink icon={<Sparkles className="h-4 w-4" />} label="Refer & Earn" onClick={() => setView('referrals')} />
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, onSeeAll }: { icon: React.ReactNode; title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-bold flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-xs font-semibold text-primary active:scale-95 transition">
          See all
        </button>
      )}
    </div>
  )
}

function QuickLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-card border border-border/50 p-4 flex items-center gap-3 hover:bg-accent active:scale-95 transition"
    >
      <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</span>
      <span className="text-sm font-semibold text-left">{label}</span>
    </button>
  )
}

function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const img = service.images[0]
  return (
    <button onClick={onClick} className="text-left active:scale-[0.98] transition">
      <Card className="overflow-hidden p-0 gap-0 h-full">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {img ? (
            <img src={img} alt={service.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-3xl">🎨</div>
          )}
          {service.featured && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-400/90 text-amber-950 text-[10px] font-bold">FEATURED</span>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          <p className="text-xs font-semibold line-clamp-2 leading-snug min-h-[2rem]">{service.title}</p>
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 rounded-full bg-muted overflow-hidden flex-shrink-0">
              {service.seller.avatarUrl && <img src={service.seller.avatarUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="text-[10px] text-muted-foreground truncate">{service.seller.username}</span>
            {service.seller.isVerified && <span className="text-[9px] text-primary">✓</span>}
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <Rating value={service.ratingAvg} count={service.ratingCount} size="sm" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <SkillCredits amount={service.price} size="sm" />
            <span className="text-[10px] text-muted-foreground">{service.deliveryDays}d</span>
          </div>
        </div>
      </Card>
    </button>
  )
}

function ServiceCardHorizontal({ service, onClick }: { service: Service; onClick: () => void }) {
  const img = service.images[0]
  return (
    <button onClick={onClick} className="flex-shrink-0 w-64 active:scale-[0.98] transition text-left">
      <Card className="overflow-hidden p-0 gap-0">
        <div className="aspect-video bg-muted relative">
          {img ? <img src={img} alt={service.title} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-4xl">🎨</div>}
        </div>
        <div className="p-3 space-y-1">
          <p className="text-sm font-semibold line-clamp-1">{service.title}</p>
          <div className="flex items-center justify-between">
            <Rating value={service.ratingAvg} count={service.ratingCount} size="sm" />
            <SkillCredits amount={service.price} size="sm" />
          </div>
        </div>
      </Card>
    </button>
  )
}

function ServiceCardSkeleton() {
  return (
    <Card className="overflow-hidden p-0 gap-0">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-16" />
      </div>
    </Card>
  )
}
