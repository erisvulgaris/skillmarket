'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { ArrowLeft, ShieldCheck, MapPin, Languages, Clock, Package, Repeat, Star, MessageSquare, Send } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function SellerProfileView() {
  const { viewParams, setView, user } = useApp()
  const username = viewParams.username as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<{ user: any }>(`/api/profiles/${username}`)
      setData(d.user)
    } catch (e: any) {
      toast.error(e.message || 'Profile not found')
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => { load() }, [load])

  const messageSeller = () => {
    // For simplicity, route to transfer view; in full app would create a DM conversation
    toast.info('Order a service to start chatting with this seller')
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="px-4 -mt-12 space-y-3">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-sm text-muted-foreground">Profile not found</div>

  const isSelf = user?.id === data.id

  return (
    <div className="min-h-screen slide-enter">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('marketplace')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Seller Profile</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto pb-24">
        {/* Cover + avatar */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
          <div className="px-4 -mt-12">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto border-4 border-background overflow-hidden shadow-xl">
              {data.profile?.avatarUrl ? (
                <img src={data.profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary-foreground text-3xl font-bold">
                  {data.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Name + badges */}
        <div className="px-4 pt-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-lg font-bold">{data.profile?.displayName || data.username}</h2>
            {data.profile?.isVerified && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                <ShieldCheck className="h-3 w-3" /> VERIFIED
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">@{data.username}</p>
          {data.profile?.bio && <p className="text-sm text-muted-foreground mt-2 px-4">{data.profile.bio}</p>}

          {/* Meta */}
          <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
            {data.profile?.location && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {data.profile.location}
              </span>
            )}
            {data.profile?.languages?.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Languages className="h-3 w-3" /> {data.profile.languages.join(', ')}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> ~{data.profile?.responseTimeMins}m response
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mt-5 grid grid-cols-3 gap-2">
          <StatBox icon={<Package className="h-4 w-4" />} value={data.stats.completedOrders} label="Completed" />
          <StatBox icon={<Repeat className="h-4 w-4" />} value={data.stats.repeatCustomers} label="Repeat buyers" />
          <StatBox icon={<Star className="h-4 w-4" />} value={data.stats.activeListings} label="Active listings" />
        </div>

        {/* Lifetime earned */}
        <div className="px-4 mt-3">
          <Card className="p-3 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
            <span className="text-xs text-muted-foreground">Lifetime Earned</span>
            <SkillCredits amount={data.stats.lifetimeEarned} size="md" />
          </Card>
        </div>

        {/* Actions */}
        {!isSelf && (
          <div className="px-4 mt-4 flex gap-2">
            <Button onClick={messageSeller} variant="outline" className="flex-1 rounded-2xl">
              <MessageSquare className="h-4 w-4 mr-1" /> Message
            </Button>
            <Button
              onClick={() => data.services[0] && setView('service-detail', { id: data.services[0].id })}
              className="flex-1 rounded-2xl"
            >
              View Services
            </Button>
          </div>
        )}

        {/* Skills */}
        {data.profile?.skills?.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {data.profile.skills.map((s: string) => (
                <span key={s} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{s}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Active listings */}
        <Section title={`Active Listings (${data.services.length})`}>
          <div className="space-y-2">
            {data.services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active listings</p>
            ) : (
              data.services.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setView('service-detail', { id: s.id })}
                  className="w-full text-left active:scale-[0.99] transition"
                >
                  <Card className="p-3 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                      {s.images[0] ? <img src={s.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xl">🎨</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-1">{s.title}</p>
                      <Rating value={s.ratingAvg} count={s.ratingCount} size="sm" />
                    </div>
                    <SkillCredits amount={s.price} size="sm" />
                  </Card>
                </button>
              ))
            )}
          </div>
        </Section>

        {/* Reviews */}
        {data.reviews?.length > 0 && (
          <Section title={`Reviews (${data.reviews.length})`}>
            <div className="space-y-2">
              {data.reviews.map((r: any) => (
                <Card key={r.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
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
                </Card>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card className="p-3 text-center">
      <span className="inline-flex h-8 w-8 rounded-lg bg-primary/10 text-primary items-center justify-center mx-auto mb-1">{icon}</span>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </Card>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 mt-5 space-y-2">
      <h3 className="text-sm font-bold">{title}</h3>
      {children}
    </div>
  )
}
