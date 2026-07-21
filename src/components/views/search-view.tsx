'use client'

import { useState, useEffect, useRef } from 'react'
import { api, type Service } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits } from '@/components/sc-badge'
import { Rating } from '@/components/rating'
import { Search as SearchIcon, X, Clock, User as UserIcon, ArrowLeft } from 'lucide-react'

type SearchResult = {
  services: any[]
  users: any[]
  categories: any[]
}

export function SearchView() {
  const { viewParams, setView } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('sm_recent_searches') || '[]')
      setRecent(r)
    } catch {}
  }, [])

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
              autoFocus
              value={query}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch(query)}
              placeholder="Search services, people…"
              className="w-full h-10 rounded-xl bg-muted/60 border border-border/40 pl-9 pr-9 text-sm outline-none focus:border-primary"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults(null) }} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center hover:bg-accent">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
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
                  <button key={u.id} onClick={() => setView('transfer', { recipient: u.username })} className="w-full text-left">
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
                    <button key={c.id} className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium hover:bg-accent">
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
      </div>
    </div>
  )
}
