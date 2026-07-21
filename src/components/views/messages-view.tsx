'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, ShieldCheck } from 'lucide-react'
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

  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
          : convos.length === 0
          ? <div className="text-center py-16">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Start a chat by placing an order</p>
            </div>
          : convos.map((c) => (
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
