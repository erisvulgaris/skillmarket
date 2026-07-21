'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Mic, ShieldCheck, Check, CheckCheck } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

type Message = {
  id: string
  senderId: string
  type: string
  content: string
  attachmentUrl: string | null
  createdAt: string
  status: string
}

export function ConversationView() {
  const { viewParams, setView, user } = useApp()
  const id = viewParams.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [other, setOther] = useState<any>(null)
  const [online, setOnline] = useState(false)
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingTimer = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: Message[] }>(`/api/messages/conversations/${id}?limit=100`)
      setMessages(data.items)
      // fetch conversation meta
      const convos = await api.get<{ conversations: any[] }>('/api/messages/conversations?limit=50')
      const convo = convos.conversations.find((c) => c.id === id)
      if (convo) setOther(convo.other)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
    // connect socket
    const socket = io('/?XTransformPort=3003', { path: '/', transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => {
      if (user) socket.emit('auth', { userId: user.id, username: user.username })
      socket.emit('join', id)
    })
    socket.on('message', (msg: Message) => {
      if (msg.conversationId === id || !msg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      }
    })
    socket.on('presence', (data: { userId: string; online: boolean }) => {
      if (other && data.userId === other.id) setOnline(data.online)
    })
    socket.on('typing', ({ userIds }: { conversationId: string; userIds: string[] }) => {
      setTyping(userIds.length > 0 && (other ? userIds.includes(other.id) : false))
    })
    socket.on('read', () => {
      setMessages((prev) => prev.map((m) => (m.senderId === user?.id ? { ...m, status: 'read' } : m)))
    })

    return () => {
      socket.emit('leave', id)
      socket.disconnect()
    }
  }, [id, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    // optimistic
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      senderId: user!.id,
      type: 'text',
      content,
      attachmentUrl: null,
      createdAt: new Date().toISOString(),
      status: 'sent',
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const res = await api.post<{ message: Message }>(`/api/messages/conversations/${id}`, {
        type: 'text',
        content,
      })
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)))
      // emit via socket
      socketRef.current?.emit('message', {
        conversationId: id,
        messageId: res.message.id,
        senderId: user!.id,
        senderUsername: user!.username,
        content,
        type: 'text',
        createdAt: res.message.createdAt,
      })
    } catch (e: any) {
      toast.error(e.message || 'Failed to send')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setText(content)
    } finally {
      setSending(false)
    }
  }

  const onType = (v: string) => {
    setText(v)
    socketRef.current?.emit('typing', { conversationId: id, userId: user?.id, isTyping: true })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', { conversationId: id, userId: user?.id, isTyping: false })
    }, 1500)
  }

  return (
    <div className="flex flex-col h-screen slide-enter">
      {/* Header */}
      <header className="glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('messages')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {other?.avatarUrl && <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold truncate">{other?.displayName || other?.username || 'Chat'}</p>
              {other?.isVerified && <ShieldCheck className="h-3 w-3 text-primary" />}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {typing ? 'typing…' : online ? 'online' : 'offline'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-area max-w-md mx-auto w-full px-3 py-4 space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted/40 rounded-2xl animate-pulse" style={{ width: '60%' }} />)
          : messages.map((m) => {
              const mine = m.senderId === user?.id
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={clsx('flex', mine ? 'justify-end' : 'justify-start')}
                >
                  <div className={clsx(
                    'max-w-[78%] px-3.5 py-2 rounded-2xl text-sm',
                    mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border/40 rounded-bl-md'
                  )}>
                    {m.type === 'image' && m.attachmentUrl ? (
                      <img src={m.attachmentUrl} alt="" className="rounded-lg max-w-full" />
                    ) : m.type === 'file' && m.attachmentUrl ? (
                      <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="underline flex items-center gap-1">
                        <Paperclip className="h-3.5 w-3.5" /> {m.content}
                      </a>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                    <div className={clsx('flex items-center gap-1 mt-0.5', mine ? 'justify-end' : 'justify-start')}>
                      <span className="text-[9px] opacity-70">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {mine && (m.status === 'read' ? <CheckCheck className="h-3 w-3 opacity-70" /> : <Check className="h-3 w-3 opacity-70" />)}
                    </div>
                  </div>
                </motion.div>
              )
            })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="glass border-t border-border/40 p-3 pb-safe">
        <div className="max-w-md mx-auto flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const fd = new FormData()
              fd.append('file', file)
              setUploading(true)
              try {
                const res = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' })
                const json = await res.json()
                if (json.success) {
                  const isImage = file.type.startsWith('image/')
                  const msg = await api.post<{ message: Message }>(`/api/messages/conversations/${id}`, {
                    type: isImage ? 'image' : 'file',
                    content: file.name,
                    attachmentUrl: json.data.url,
                    attachmentName: file.name,
                  })
                  setMessages((prev) => [...prev, msg.message])
                  socketRef.current?.emit('message', {
                    conversationId: id,
                    messageId: msg.message.id,
                    senderId: user!.id,
                    senderUsername: user!.username,
                    content: file.name,
                    type: isImage ? 'image' : 'file',
                    attachmentUrl: json.data.url,
                    createdAt: msg.message.createdAt,
                  })
                } else {
                  toast.error(json.error || 'Upload failed')
                }
              } catch (err: any) {
                toast.error(err.message || 'Upload failed')
              } finally {
                setUploading(false)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-accent transition flex-shrink-0 disabled:opacity-50"
          >
            {uploading ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Paperclip className="h-5 w-5 text-muted-foreground" />}
          </button>
          <div className="flex-1 min-h-10 max-h-32 rounded-2xl bg-muted/60 border border-border/40 flex items-end px-3 py-2">
            <textarea
              value={text}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Message…"
              rows={1}
              className="flex-1 bg-transparent text-sm outline-none resize-none max-h-24"
            />
          </div>
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition disabled:opacity-40 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
