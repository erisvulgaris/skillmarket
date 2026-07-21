'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function CmsPageView() {
  const { viewParams, setView } = useApp()
  const slug = viewParams.slug as string
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<{ page: any }>(`/api/cms/${slug}`)
      setPage(d.page)
    } catch (e: any) {
      toast.error('Page not found')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView(viewParams.from || 'profile')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1 truncate">{page?.title || 'Loading…'}</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : page ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span>Last updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{page.body}</div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Page not found</p>
          </div>
        )}
      </div>
    </div>
  )
}
