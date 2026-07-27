'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, ShieldCheck, Search, X, Mail, MailOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type Convo = {
  id: string
  type: string
  orderId: string | null
  updatedAt: string
  unread: boolean
  lastMessage: { content: string; type: string; createdAt: string } | null
  other: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    isVerified: boolean
  } | null
}

export function MessagesView() {
  const { setView, convoFilter, convoSearch, setConvoFilter, setConvoSearch } = useApp()
  const [convos, setConvos] = useState<Convo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ conversations: Convo[] }>('/api/messages/conversations?limit=50')
      setConvos(data.conversations)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Apply filter + search
  const filtered = convos
    .filter((c) => {
      if (convoFilter === 'unread' && !c.unread) return false
      return true
    })
    .filter((c) => {
      if (!convoSearch.trim()) return true
      const q = convoSearch.toLowerCase()
      return (
        c.other?.username?.toLowerCase().includes(q) ||
        c.other?.displayName?.toLowerCase().includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
      )
    })

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold flex-1">Messages</h1>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={convoSearch}
          onChange={(e) => setConvoSearch(e.target.value)}
          placeholder="Search conversations…"
          className="w-full h-10 rounded-xl bg-muted/60 border border-border/40 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
        {convoSearch && (
          <button onClick={() => setConvoSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setConvoFilter('all')}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition',
            convoFilter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-accent'
          )}
        >
          <MailOpen className="h-3.5 w-3.5" />
          All
        </button>
        <button
          onClick={() => setConvoFilter('unread')}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition',
            convoFilter === 'unread'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-accent'
          )}
        >
          <Mail className="h-3.5 w-3.5" />
          Unread
          {convos.filter((c) => c.unread).length > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
          : filtered.length === 0
          ? <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{convoSearch ? 'No conversations match your search' : convoFilter === 'unread' ? 'No unread conversations' : 'No conversations yet'}</p>
              {!convoSearch && convoFilter === 'all' && <p className="text-xs text-muted-foreground mt-1">Start a chat by placing an order</p>}
            </div>
          : filtered.map((c) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setView('conversation', { id: c.id })}
                className="w-full text-left active:scale-[0.99] transition"
              >
                <Card className={clsx('p-3 flex items-center gap-3', c.unread && 'border-primary/40 bg-primary/5')}>
                  <div className="relative h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {c.other?.avatarUrl && <img src={c.other.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />}
                    {c.unread && (
                      <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className={clsx('text-sm truncate', c.unread ? 'font-bold' : 'font-semibold')}>
                        {c.other?.displayName || c.other?.username || 'Unknown'}
                      </p>
                      {c.other?.isVerified && <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />}
                      {c.type === 'order' && (
                        <span className="ml-auto text-[10px] text-muted-foreground">Order chat</span>
                      )}
                    </div>
                    <p className={clsx('text-xs truncate mt-0.5', c.unread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {c.lastMessage?.type === 'image' ? '📷 Photo' :
                       c.lastMessage?.type === 'file' ? '📎 File' :
                       c.lastMessage?.type === 'voice' ? '🎤 Voice' :
                       c.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {c.lastMessage && (
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {c.unread && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  )}
                </Card>
              </motion.button>
            ))}
      </div>
    </div>
  )
}
