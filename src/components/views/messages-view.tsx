'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, ShieldCheck, Search, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type Convo = {
  id: string
  type: string
  orderId: string | null
  updatedAt: string
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
  const { setView } = useApp()
  const [convos, setConvos] = useState<Convo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

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

  const filtered = search.trim()
    ? convos.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.other?.username?.toLowerCase().includes(q) ||
          c.other?.displayName?.toLowerCase().includes(q) ||
          c.lastMessage?.content?.toLowerCase().includes(q)
        )
      })
    : convos

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold flex-1">Messages</h1>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={clsx('h-9 w-9 rounded-full flex items-center justify-center transition', showSearch ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
        >
          {showSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full h-10 rounded-xl bg-muted/60 border border-border/40 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </motion.div>
      )}

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
          : filtered.length === 0
          ? <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{search ? 'No conversations match your search' : 'No conversations yet'}</p>
              {!search && <p className="text-xs text-muted-foreground mt-1">Start a chat by placing an order</p>}
            </div>
          : filtered.map((c) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setView('conversation', { id: c.id })}
                className="w-full text-left active:scale-[0.99] transition"
              >
                <Card className="p-3 flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                    {c.other?.avatarUrl && <img src={c.other.avatarUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold truncate">
                        {c.other?.displayName || c.other?.username || 'Unknown'}
                      </p>
                      {c.other?.isVerified && <ShieldCheck className="h-3 w-3 text-primary flex-shrink-0" />}
                      {c.type === 'order' && (
                        <span className="ml-auto text-[10px] text-muted-foreground">Order chat</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.lastMessage?.type === 'image' ? '📷 Photo' :
                       c.lastMessage?.type === 'file' ? '📎 File' :
                       c.lastMessage?.type === 'voice' ? '🎤 Voice' :
                       c.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  {c.lastMessage && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </Card>
              </motion.button>
            ))}
      </div>
    </div>
  )
}
