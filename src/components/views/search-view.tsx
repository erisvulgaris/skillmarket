'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api, type Service } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { Search as SearchIcon, X, Clock, ArrowLeft, SlidersHorizontal, Grid3x3 } from 'lucide-react'
import { clsx } from 'clsx'

type SearchResult = {
  services: any[]
  users: any[]
  categories: any[]
}

type SortOption = 'newest' | 'popular' | 'price_low' | 'price_high' | 'rating'

export function SearchView() {
  const { viewParams, setView } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState<string | null>(viewParams.categoryId || null)
  const [categoryName, setCategoryName] = useState<string | null>(viewParams.categoryName || null)
  const [browseServices, setBrowseServices] = useState<Service[]>([])
  const [sort, setSort] = useState<SortOption>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('sm_recent_searches') || '[]')
      setRecent(r)
    } catch {}
  }, [])

  // If category is set, browse services in that category
  const loadCategory = useCallback(async (catId: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50', sort })
      params.set('categoryId', catId)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      const d = await api.get<{ items: Service[] }>(`/api/marketplace/services?${params}`)
      setBrowseServices(d.items)
    } catch {} finally { setLoading(false) }
  }, [sort, minPrice, maxPrice])

  useEffect(() => {
    if (categoryId) {
      loadCategory(categoryId)
    }
  }, [categoryId, loadCategory])

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    try {
      const d = await api.get<SearchResult>(`/api/marketplace/search?q=${encodeURIComponent(q)}`)
      setResults(d)
    } catch {} finally { setLoading(false) }
  }

  const onType = (v: string) => {
    setQuery(v)
    if (categoryId) {
      // Switching to text search clears category browse
      setCategoryId(null)
      setCategoryName(null)
      setBrowseServices([])
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 300)
  }

  const submitSearch = (q: string) => {
    setQuery(q)
    doSearch(q)
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 8)
    setRecent(next)
    localStorage.setItem('sm_recent_searches', JSON.stringify(next))
  }

  const clearCategory = () => {
    setCategoryId(null)
    setCategoryName(null)
    setBrowseServices([])
  }

  const isBrowsing = !!categoryId

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('marketplace')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus={!isBrowsing}
              value={query}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch(query)}
              placeholder={isBrowsing ? `Search in ${categoryName}…` : "Search services, people…"}
              className="w-full h-10 rounded-xl bg-muted/60 border border-border/40 pl-9 pr-9 text-sm outline-none focus:border-primary"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults(null) }} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx('h-9 w-9 rounded-full flex items-center justify-center transition', showFilters || isBrowsing ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="max-w-md mx-auto px-3 pb-3 space-y-2 fade-scale">
            {isBrowsing && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Category:</span>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
                  {categoryName}
                  <button onClick={clearCategory}><X className="h-3 w-3" /></button>
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min SC"
                className="flex-1 h-9 rounded-lg bg-muted/60 border border-border/40 px-3 text-xs outline-none focus:border-primary"
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max SC"
                className="flex-1 h-9 rounded-lg bg-muted/60 border border-border/40 px-3 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {([
                { k: 'newest', label: 'Newest' },
                { k: 'popular', label: 'Popular' },
                { k: 'price_low', label: 'Price ↑' },
                { k: 'price_high', label: 'Price ↓' },
                { k: 'rating', label: 'Top Rated' },
              ] as const).map((s) => (
                <button
                  key={s.k}
                  onClick={() => setSort(s.k)}
                  className={clsx(
                    'flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition',
                    sort === s.k ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {/* Category browse mode */}
        {isBrowsing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-primary" />
                {categoryName}
                <span className="text-xs text-muted-foreground font-normal">({browseServices.length})</span>
              </h2>
              {showFilters && (
                <button onClick={() => setShowFilters(false)} className="text-xs text-muted-foreground">Hide filters</button>
              )}
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
              </div>
            ) : browseServices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No services in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {browseServices.map((s, i) => (
                  <div key={s.id} className="stagger-item" style={{ animationDelay: `${i * 30}ms` }}>
                    <button onClick={() => setView('service-detail', { id: s.id })} className="w-full text-left active:scale-[0.98] transition">
                      <Card className="overflow-hidden p-0 gap-0 h-full">
                        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                          {s.images[0] ? (
                            <img src={s.images[0]} alt={s.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-3xl">🎨</div>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <p className="text-xs font-semibold line-clamp-2 leading-snug min-h-[2rem]">{s.title}</p>
                          <Rating value={s.ratingAvg} count={s.ratingCount} size="sm" />
                          <SkillCredits amount={s.price} size="sm" />
                        </div>
                      </Card>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Text search mode */}
        {!isBrowsing && (
          <>
            {!results && recent.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase text-muted-foreground">Recent searches</p>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r, i) => (
                    <button key={i} onClick={() => submitSearch(r)} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium hover:bg-accent">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
              </div>
            )}

            {results && !loading && (
              <>
                {results.users.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">People</p>
                    {results.users.map((u) => (
                      <button key={u.id} onClick={() => setView('seller-profile', { username: u.username })} className="w-full text-left">
                        <Card className="p-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                            {u.avatarUrl && <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">@{u.username}</p>
                            {u.displayName && <p className="text-xs text-muted-foreground">{u.displayName}</p>}
                          </div>
                          {u.isVerified && <span className="text-xs text-primary">✓</span>}
                        </Card>
                      </button>
                    ))}
                  </div>
                )}

                {results.categories.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {results.categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setCategoryId(c.id); setCategoryName(c.name); setResults(null); setQuery('') }}
                          className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium hover:bg-accent"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Services ({results.services.length})</p>
                  {results.services.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No services found for "{query}"</p>
                  ) : (
                    results.services.map((s) => (
                      <button key={s.id} onClick={() => setView('service-detail', { id: s.id })} className="w-full text-left active:scale-[0.99] transition">
                        <Card className="p-3 flex items-center gap-3">
                          <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                            {s.images[0] && <img src={s.images[0]} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold line-clamp-2">{s.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Rating value={s.ratingAvg || 0} count={s.ratingCount || 0} size="sm" showCount={false} />
                              <span className="text-xs text-muted-foreground">@{s.seller.username}</span>
                            </div>
                          </div>
                          <SkillCredits amount={s.price} size="sm" />
                        </Card>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {!results && !loading && recent.length === 0 && (
              <div className="text-center py-16">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Search for services, sellers, or categories</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
