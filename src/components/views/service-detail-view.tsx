'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, type Service } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { SkillCredits } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Clock, ShieldCheck, MessageSquare, Share2, Bookmark, ChevronRight, Star, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { safeJsonParse } from '@/lib/api'

export function ServiceDetailView() {
  const { viewParams, setView, user } = useApp()
  const id = viewParams.id as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requirements, setRequirements] = useState('')
  const [saved, setSaved] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<{ service: any; saved: boolean }>(`/api/services/${id}`)
      setData(d.service)
      setSaved(d.saved)
    } catch {
      toast.error('Failed to load service')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Track recently viewed
  useEffect(() => {
    if (id) {
      try {
        const ids: string[] = JSON.parse(localStorage.getItem('sm_recently_viewed') || '[]')
        const filtered = ids.filter((x) => x !== id)
        filtered.unshift(id)
        localStorage.setItem('sm_recently_viewed', JSON.stringify(filtered.slice(0, 10)))
      } catch {}
    }
  }, [id])

  const toggleSave = async () => {
    try {
      if (saved) {
        await api.delete(`/api/services/${id}/save`)
        setSaved(false)
      } else {
        await api.post(`/api/services/${id}/save`)
        setSaved(true)
      }
    } catch {}
  }

  const order = async () => {
    const orderPrice = selectedPackageId ? (data.packages?.find((p: any) => p.id === selectedPackageId)?.price || data.price) : data.price
    if (!user?.wallet || user.wallet.availableBalance < orderPrice) {
      toast.error('Insufficient balance. Buy more credits first.')
      setView('buy-credits')
      return
    }
    setOrdering(true)
    try {
      const res = await api.post<{ order: any; conversationId: string }>('/api/orders', {
        serviceId: id,
        packageId: selectedPackageId || undefined,
        requirements: requirements || undefined,
      })
      toast.success('Order placed! Credits escrowed.')
      setView('order-detail', { id: res.order.id })
    } catch (e: any) {
      toast.error(e.message || 'Order failed')
    } finally {
      setOrdering(false)
    }
  }

  const reportService = async () => {
    const reason = window.prompt('Why are you reporting this service?')
    if (!reason || reason.trim().length < 5) return
    try {
      await api.post(`/api/services/${id}/report`, { reason: reason.trim() })
      toast.success('Report submitted. Thank you.')
    } catch (e: any) {
      toast.error(e.message || 'Report failed')
    }
  }

  const shareService = async () => {
    const shareData = {
      title: data.title,
      text: `Check out this service on SkillMarket: ${data.title}`,
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareData.url)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="px-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-sm text-muted-foreground">Service not found</div>

  const isOwn = user?.id === data.seller.id

  return (
    <div className="pb-32 slide-enter">
      {/* Image gallery */}
      <div className="relative aspect-video bg-muted">
        {data.images.length > 0 ? (
          <>
            <img src={data.images[activeImage]} alt={data.title} className="h-full w-full object-cover" />
            {data.images.length > 1 && (
              <>
                {/* Navigation arrows */}
                {activeImage > 0 && (
                  <button
                    onClick={() => setActiveImage(activeImage - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass flex items-center justify-center active:scale-90"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                )}
                {activeImage < data.images.length - 1 && (
                  <button
                    onClick={() => setActiveImage(activeImage + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full glass flex items-center justify-center active:scale-90"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {/* Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {data.images.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-1.5 rounded-full transition-all ${i === activeImage ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
                {/* Counter */}
                <span className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
                  {activeImage + 1} / {data.images.length}
                </span>
              </>
            )}
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-6xl">🎨</div>
        )}
        <button
          onClick={() => setView('marketplace')}
          className="absolute top-4 left-4 h-10 w-10 rounded-full glass flex items-center justify-center active:scale-90 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={shareService}
            className="h-10 w-10 rounded-full glass flex items-center justify-center active:scale-90 transition"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={toggleSave}
            className="h-10 w-10 rounded-full glass flex items-center justify-center active:scale-90 transition"
          >
            <Bookmark className={`h-4 w-4 ${saved ? 'fill-primary text-primary' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Title + price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold leading-tight flex-1">{data.title}</h1>
            <div className="flex-shrink-0 text-right">
              <SkillCredits amount={data.price} size="lg" />
              <p className="text-[10px] text-muted-foreground">{data.deliveryDays} days delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Rating value={data.ratingAvg} count={data.ratingCount} size="md" />
            <span className="text-xs text-muted-foreground">· {data.views} views</span>
            <span className="text-xs text-muted-foreground">· {data.completedOrders} sold</span>
          </div>
        </div>

        {/* Seller card */}
        <button
          onClick={() => setView('seller-profile', { username: data.seller.username })}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/40 active:scale-[0.99] transition"
        >
          <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {data.seller.avatarUrl ? <img src={data.seller.avatarUrl} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold">@{data.seller.username}</p>
              {data.seller.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">{data.seller.bio || 'Digital service provider'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Avg response: {data.seller.responseTimeMins}m</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Description */}
        <Section title="About this service">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{data.description}</p>
        </Section>

        {/* Package tiers */}
        {data.packages && data.packages.length > 0 && (
          <Section title="Choose a Package">
            <div className="space-y-2">
              {data.packages.map((pkg: any, i: number) => {
                const isSelected = selectedPackageId === pkg.id
                const isDefault = selectedPackageId === null && i === 0
                const features = safeJsonParse<string[]>(pkg.features, [])
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition relative overflow-hidden ${
                      isSelected || isDefault ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    {pkg.name === 'Premium' && (
                      <span className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg bg-amber-400 text-amber-950 text-[9px] font-bold">POPULAR</span>
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold">{pkg.name}</p>
                      <div className="flex items-center gap-1">
                        <SkillCredits amount={pkg.price} size="md" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{pkg.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                      <span>📦 {pkg.deliveryDays} days</span>
                      <span>🔄 {pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}</span>
                    </div>
                    {features.length > 0 && (
                      <ul className="space-y-1">
                        {features.map((f: string, fi: number) => (
                          <li key={fi} className="text-xs flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>
        )}

        {/* Tags */}
        {data.tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-2">
              {data.tags.map((t: string) => (
                <span key={t} className="px-2.5 py-1 rounded-full bg-secondary text-xs font-medium">{t}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s: string) => (
                <span key={s} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{s}</span>
              ))}
            </div>
          </Section>
        )}

        {/* FAQs */}
        {data.faqs.length > 0 && (
          <Section title="FAQs">
            <div className="space-y-2">
              {data.faqs.map((f: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-sm font-semibold">{f.q}</p>
                  <p className="text-xs text-muted-foreground mt-1">{f.a}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Requirements for ordering */}
        {!isOwn && (
          <Section title="Your requirements (optional)">
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe what you need…"
              className="min-h-[100px] resize-none"
            />
          </Section>
        )}

        {/* Reviews preview */}
        {data.reviews?.length > 0 && (
          <Section title={`Reviews (${data.ratingCount})`}>
            <div className="space-y-3">
              {data.reviews.slice(0, 3).map((r: any) => (
                <div key={r.id} className="p-3 rounded-xl bg-card border border-border/40">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted overflow-hidden">
                      {r.author.avatarUrl && <img src={r.author.avatarUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <span className="text-xs font-semibold">@{r.author.username}</span>
                    <div className="ml-auto flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-2">{r.comment}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Report service */}
        {!isOwn && (
          <div className="pt-2">
            <button
              onClick={() => reportService()}
              className="text-xs text-muted-foreground hover:text-destructive transition"
            >
              Report this service
            </button>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {!isOwn && (
        <div className="fixed bottom-0 inset-x-0 z-30 glass border-t border-border/40 p-3 pb-safe">
          <div className="max-w-md mx-auto flex items-center gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">
                {selectedPackageId ? (data.packages?.find((p: any) => p.id === selectedPackageId)?.name + ' package') : 'Total price'}
              </p>
              <SkillCredits amount={selectedPackageId ? (data.packages?.find((p: any) => p.id === selectedPackageId)?.price || data.price) : data.price} size="lg" />
            </div>
            <Button
              onClick={order}
              disabled={ordering}
              size="lg"
              className="rounded-2xl px-6 shadow-lg shadow-primary/20"
            >
              {ordering ? 'Placing…' : 'Order Now'}
            </Button>
          </div>
        </div>
      )}
      {isOwn && (
        <div className="fixed bottom-0 inset-x-0 z-30 glass border-t border-border/40 p-3 pb-safe">
          <div className="max-w-md mx-auto">
            <Button className="w-full rounded-2xl" variant="secondary" disabled>
              This is your own service
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </div>
  )
}
