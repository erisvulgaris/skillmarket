'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, type Service } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { useGuestStore } from '@/lib/guest-store'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp, Flame, Sparkles, Clock, Star, Bookmark, ChevronRight, Search,
  Crown, Activity, ShieldCheck, Zap, ArrowRight, Code, Layout, Video, FileText,
  Brain, CheckCircle2, MessageSquare, Heart, ShoppingCart, HelpCircle, UserCheck
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

type Category = { id: string; name: string; slug: string; icon?: string | null }

export function MarketplaceView({ onRequireAuth }: { onRequireAuth?: (intent: () => void) => void }) {
  const { setView, user } = useApp()
  const { prefersReduced } = useReducedMotion()
  const { wishlist, toggleWishlist, addToCart } = useGuestStore()

  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'trending' | 'newest' | 'popular' | 'featured'>('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sort = tab === 'trending' ? 'trending' : tab === 'newest' ? 'newest' : tab === 'popular' ? 'popular' : 'newest'
      const [svc, cats] = await Promise.all([
        api.get<{ items: Service[] }>(`/api/marketplace/services?sort=${sort}&limit=24`),
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

  const featured = services.filter((s) => s.featured).slice(0, 4)
  const trending = [...services].sort((a, b) => b.views - a.views).slice(0, 8)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setView('search', { q: searchQuery.trim() })
    }
  }

  const handleBuyNow = (service: Service) => {
    const action = () => setView('service-detail', { id: service.id })
    if (!user && onRequireAuth) {
      onRequireAuth(action)
    } else {
      action()
    }
  }

  return (
    <div className="space-y-16 pt-2 pb-16">
      {/* 1. HERO SECTION — Stripe / Linear / Vercel Narrative Aesthetic */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 p-6 sm:p-12 shadow-2xl">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl space-y-8">
          {/* Floating Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-bold text-emerald-400 backdrop-blur-md shadow-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Verified Digital Assets, AI Tools & Expert Services</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]"
          >
            The Premier Storefront for Digital Creators & Developers.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal"
          >
            Discover code templates, UI kits, AI prompts, and freelance services. Explore freely without signing in. Instant checkout with escrow protection.
          </motion.p>

          {/* Search Bar Input */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl p-2.5 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl"
          >
            <Search className="h-5 w-5 text-slate-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search UI kits, React boilerplates, AI tools, logos..."
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 outline-none px-3 py-1 font-medium"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-xs sm:text-sm text-white transition active:scale-95 flex-shrink-0 shadow-lg shadow-emerald-500/25"
            >
              Search Marketplace
            </button>
          </motion.form>

          {/* Popular Tag Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
            <span className="font-semibold text-slate-300">Popular:</span>
            {['UI Kits', 'Next.js Templates', 'AI Prompts', 'Logo Design', 'Video Editing', 'Python Scripts'].map((tag) => (
              <button
                key={tag}
                onClick={() => setView('search', { q: tag })}
                className="px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 transition text-[11px]"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CREATOR TRUST MARQUEE */}
      <section className="py-4 border-y border-border/40 bg-muted/20 rounded-2xl px-6 flex flex-wrap items-center justify-between gap-6 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-emerald-500" />
          <span>10,000+ Verified Creators</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span>Instant Digital Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-500" />
          <span>100% Escrow Protection</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
          <span>Razorpay Instant Top-Up</span>
        </div>
      </section>

      {/* 3. FEATURED EDITORIAL COLLECTIONS SHOWCASE */}
      {featured.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Curated Offerings</span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Featured Collections</h2>
            </div>
            <button onClick={() => setView('search')} className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="group overflow-hidden border border-border/60 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl rounded-3xl bg-card">
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                    <img
                      src={service.coverUrl || '/logo.svg'}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-md">
                        FEATURED
                      </span>
                      {service.category && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-white backdrop-blur-md">
                          {service.category.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleWishlist(service.id)}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-md transition active:scale-90"
                    >
                      <Heart className={clsx('h-4 w-4', wishlist.includes(service.id) ? 'fill-rose-500 text-rose-500' : 'text-white')} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold">By @{service.seller.username}</span>
                      <Rating rating={service.rating} count={service.reviewsCount} />
                    </div>

                    <h3
                      onClick={() => setView('service-detail', { id: service.id })}
                      className="text-lg font-extrabold tracking-tight hover:text-emerald-500 transition cursor-pointer line-clamp-2"
                    >
                      {service.title}
                    </h3>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Price</p>
                        <SkillCredits amount={service.price} size="md" />
                      </div>

                      <button
                        onClick={() => handleBuyNow(service)}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition flex items-center gap-1.5"
                      >
                        Buy Now <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 4. TRENDING CATALOG GRID (WITH FILTER TABS) */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Live Catalog</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Explore Marketplace Offerings</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-2xl border border-border/50 overflow-x-auto no-scrollbar">
            {[
              { k: 'trending', label: '🔥 Trending' },
              { k: 'newest', label: '✨ Newest' },
              { k: 'popular', label: '⭐ Popular' },
              { k: 'featured', label: '👑 Featured' },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k as any)}
                className={clsx(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition',
                  tab === t.k ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3 rounded-3xl">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group overflow-hidden rounded-3xl border border-border/60 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg bg-card flex flex-col h-full">
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                    <img
                      src={s.coverUrl || '/logo.svg'}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => toggleWishlist(s.id)}
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center backdrop-blur-md transition active:scale-90"
                    >
                      <Heart className={clsx('h-3.5 w-3.5', wishlist.includes(s.id) ? 'fill-rose-500 text-rose-500' : 'text-white')} />
                    </button>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold truncate">@{s.seller.username}</span>
                        <Rating rating={s.rating} count={s.reviewsCount} />
                      </div>
                      <h4
                        onClick={() => setView('service-detail', { id: s.id })}
                        className="text-sm font-bold tracking-tight line-clamp-2 hover:text-emerald-500 transition cursor-pointer"
                      >
                        {s.title}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
                      <SkillCredits amount={s.price} size="sm" />
                      <button
                        onClick={() => handleBuyNow(s)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 text-xs font-bold transition"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 5. VISUAL CATEGORIES SECTION */}
      {categories.length > 0 && (
        <section className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Browse Catalog</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Explore by Category</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Card
                key={cat.id}
                onClick={() => setView('search', { category: cat.slug })}
                className="p-5 text-center rounded-3xl border border-border/60 hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition group"
              >
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Code className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-extrabold tracking-tight group-hover:text-emerald-500 transition">{cat.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-1">Explore Products →</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 6. WHY SKILLMARKET — VALUE PROPOSITIONS */}
      <section className="p-8 sm:p-12 rounded-3xl bg-muted/30 border border-border/50 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Why SkillMarket</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Built for Seamless Digital Commerce</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border/40 space-y-2 text-center">
            <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto mb-1" />
            <h4 className="text-sm font-bold">100% Escrow Protection</h4>
            <p className="text-xs text-muted-foreground">Funds are securely locked in escrow until you verify and approve the work.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/40 space-y-2 text-center">
            <Zap className="h-8 w-8 text-amber-500 mx-auto mb-1" />
            <h4 className="text-sm font-bold">Instant Delivery</h4>
            <p className="text-xs text-muted-foreground">Download code, templates, and digital assets immediately after purchase.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/40 space-y-2 text-center">
            <UserCheck className="h-8 w-8 text-violet-500 mx-auto mb-1" />
            <h4 className="text-sm font-bold">Verified Creators</h4>
            <p className="text-xs text-muted-foreground">Work with vetted top sellers, instructors, and skilled developers.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border/40 space-y-2 text-center">
            <CheckCircle2 className="h-8 w-8 text-blue-500 mx-auto mb-1" />
            <h4 className="text-sm font-bold">Zero Hidden Fees</h4>
            <p className="text-xs text-muted-foreground">Transparent pricing powered by SkillCredits virtual currency.</p>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION SECTION */}
      <section className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {[
            { q: 'Do I need an account to browse SkillMarket?', a: 'No! SkillMarket is completely public. You can browse, search, compare, and inspect all products and creator profiles without creating an account.' },
            { q: 'What are SkillCredits?', a: 'SkillCredits (SC) are the internal virtual currency used for instant, fee-free transactions across SkillMarket.' },
            { q: 'How does buyer escrow protection work?', a: 'When you purchase a service, funds are placed into an escrow lock. The seller receives credits only after you confirm and approve delivery.' },
            { q: 'How do I top up SkillCredits?', a: 'You can buy SkillCredits instantly using Razorpay (UPI, Credit/Debit Cards, Net Banking) via the Buy Credits panel.' },
          ].map((faq, i) => (
            <Card
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="p-5 rounded-2xl border border-border/60 cursor-pointer transition hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between gap-4 font-bold text-sm">
                <span>{faq.q}</span>
                <span className="text-emerald-500 text-lg font-mono">{openFaq === i ? '−' : '+'}</span>
              </div>
              {openFaq === i && (
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed border-t border-border/30 pt-3">
                  {faq.a}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* 8. HIGH-CONVERTING CTA BANNER */}
      <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-center space-y-4 shadow-xl">
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight">Ready to sell your digital products or services?</h2>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
          Join thousands of creators earning SkillCredits on SkillMarket. 1-click email registration and 100 free bonus credits!
        </p>
        <button
          onClick={() => onRequireAuth?.(() => {})}
          className="px-8 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-sm shadow-xl transition active:scale-95 inline-flex items-center gap-2"
        >
          Start Selling Today <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  )
}
