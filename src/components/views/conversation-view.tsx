'use client'

import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, Mic, ShieldCheck, Check, CheckCheck, X, Smile, Package, ChevronRight, Search, MoreVertical, Bell, BellOff, User, Flag, Clock, Edit3, Trash2, Download, FileImage, FileText, File } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const EMOJIS = ['😀', '😂', '🥰', '😍', '🤔', '😎', '🤝', '👍', '👎', '❤️', '🔥', '✨', '🎉', '💪', '🙏', '👀', '💯', '⭐', '🚀', '💡', '✅', '❌', '💰', '🎨', '💻', '📱', '🔔', '📦', '🎯', '⏰']

// Simple notification beep using Web Audio API
function playMessageSound(senderId?: string) {
  try {
    if (typeof window === 'undefined') return
    let soundPref: string | null = 'on'
    try { soundPref = localStorage.getItem('sm_message_sound') } catch {}
    if (soundPref === 'off') return
    if (senderId) {
      let muted: string[] = []
      try { muted = JSON.parse(localStorage.getItem('sm_muted_users') || '[]') } catch {}
      if (muted.includes(senderId)) return
    }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch {}
}

type Message = {
  id: string
  senderId: string
  type: string
  content: string
  attachmentUrl: string | null
  attachmentName: string | null
  createdAt: string
  status: string
  editedAt: string | null
  deletedAt: string | null
}

export function ConversationView() {
  const { viewParams, setView, user } = useApp()
  const id = viewParams.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [other, setOther] = useState<any>(null)
  const [online, setOnline] = useState(false)
  const [typing, setTyping] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showMsgSearch, setShowMsgSearch] = useState(false)
  const [msgSearch, setMsgSearch] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  // Rate limiting state
  const [rateCooldown, setRateCooldown] = useState(0)
  const lastSentAt = useRef<number>(0)
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  // Typing polling
  const [isComposing, setIsComposing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingTimer = useRef<any>(null)
  const typingPollRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<any>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new (globalThis.File as any)([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        // Upload the voice note
        const fd = new FormData()
        fd.append('file', file)
        setUploading(true)
        try {
          const res = await fetch('/api/uploads', { method: 'POST', body: fd, credentials: 'include' })
          const json = await res.json()
          if (json.success) {
            const msg = await api.post<{ message: Message }>(`/api/messages/conversations/${id}`, {
              type: 'voice',
              content: 'Voice message',
              attachmentUrl: json.data.url,
              attachmentName: file.name,
            })
            setMessages((prev) => [...prev, msg.message])
            socketRef.current?.emit('message', {
              conversationId: id,
              messageId: msg.message.id,
              senderId: user!.id,
              senderUsername: user!.username,
              content: 'Voice message',
              type: 'voice',
              attachmentUrl: json.data.url,
              createdAt: msg.message.createdAt,
            })
          }
        } catch (e: any) {
          toast.error(e.message || 'Voice upload failed')
        } finally {
          setUploading(false)
        }
      }
      recorder.start()
      setRecording(true)
      setRecordTime(0)
      recordTimerRef.current = setInterval(() => {
        setRecordTime((t) => t + 1)
      }, 1000)
    } catch (e: any) {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        // Don't process the audio
        mediaRecorderRef.current.ondataavailable = null
        mediaRecorderRef.current.onstop = null
      }
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: Message[] }>(`/api/messages/conversations/${id}?limit=100`)
      setMessages(data.items)
      // fetch conversation meta
      const convos = await api.get<{ conversations: any[] }>('/api/messages/conversations?limit=50')
      const convo = convos.conversations.find((c) => c.id === id)
      if (convo) {
        setOther(convo.other)
        // If this is an order conversation, fetch order info
        if (convo.orderId) {
          try {
            const orderData = await api.get<{ order: any }>(`/api/orders/${convo.orderId}`)
            setOrderInfo(orderData.order)
          } catch {}
        }
      }
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
    socket.on('message', (msg: any) => {
      if (msg.conversationId === id || !msg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Play notification sound for messages from others
        if (msg.senderId !== user?.id && msg.senderUsername !== user?.username) {
          playMessageSound(msg.senderId)
        }
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

    // Client-side rate limit: 1 second between messages
    const now = Date.now()
    const elapsed = now - lastSentAt.current
    if (elapsed < 1000) {
      const remaining = Math.ceil((1000 - elapsed) / 1000)
      setRateCooldown(remaining)
      toast.error(`You're sending too fast — wait ${remaining}s`)
      const interval = setInterval(() => {
        setRateCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return
    }

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
      attachmentName: null,
      createdAt: new Date().toISOString(),
      status: 'sent',
      editedAt: null,
      deletedAt: null,
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const res = await api.post<{ message: Message }>(`/api/messages/conversations/${id}`, {
        type: 'text',
        content,
      })
      lastSentAt.current = Date.now()
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...res.message, attachmentName: res.message.attachmentName || null, editedAt: res.message.editedAt || null, deletedAt: res.message.deletedAt || null } : m)))
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
      // Handle 429 rate limit specifically
      if (e.status === 429) {
        toast.error(`You're sending too fast — slow down`)
        setRateCooldown(3)
        const interval = setInterval(() => {
          setRateCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        toast.error(e.message || 'Failed to send')
      }
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setText(content)
    } finally {
      setSending(false)
    }
  }

  const onType = (v: string) => {
    setText(v)
    const isNowComposing = v.trim().length > 0
    setIsComposing(isNowComposing)
    socketRef.current?.emit('typing', { conversationId: id, userId: user?.id, isTyping: isNowComposing })
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', { conversationId: id, userId: user?.id, isTyping: false })
      setIsComposing(false)
    }, 1500)
  }

  // Edit message
  const handleEdit = async (messageId: string) => {
    if (!editText.trim() || savingEdit) return
    setSavingEdit(true)
    try {
      const res = await api.patch<{ message: Message }>(`/api/messages/conversations/${id}`, {
        messageId,
        content: editText.trim(),
      })
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...res.message, attachmentName: res.message.attachmentName || null, editedAt: res.message.editedAt || null, deletedAt: res.message.deletedAt || null } : m)))
      setEditingId(null)
      setEditText('')
      toast.success('Message edited')
    } catch (e: any) {
      toast.error(e.message || 'Failed to edit message')
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete message (soft delete)
  const handleDelete = async (messageId: string) => {
    try {
      await api.delete(`/api/messages/conversations/${id}?messageId=${messageId}`)
      // Update locally for immediate feedback
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: '[deleted]', deletedAt: new Date().toISOString() } : m)))
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete message')
    }
  }

  // Typing polling: while user is composing, poll for other user's typing status every 2s
  useEffect(() => {
    if (!isComposing || !id) return
    const poll = async () => {
      try {
        const res = await fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: id }),
          credentials: 'include',
        })
        const json = await res.json()
        if (json.success && json.data?.typingUserIds) {
          setTyping(json.data.typingUserIds.length > 0 && (other ? json.data.typingUserIds.includes(other.id) : false))
        }
      } catch {}
    }
    poll() // immediate first call
    typingPollRef.current = setInterval(poll, 2000)
    return () => {
      if (typingPollRef.current) clearInterval(typingPollRef.current)
    }
  }, [isComposing, id, other])

  return (
    <div className="flex flex-col h-screen slide-enter">
      {/* Header */}
      <header className="glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('messages')} aria-label="Go back" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
            {other?.avatarUrl && <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-semibold truncate">{other?.displayName || other?.username || 'Chat'}</p>
              {other?.isVerified && <ShieldCheck className="h-3 w-3 text-primary" />}
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              {typing ? (
                <>
                  <span className="text-[10px]">{other?.displayName?.split(' ')[0] || other?.username || 'User'} is typing</span>
                  <span className="flex items-center gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1 w-1 rounded-full bg-muted-foreground/60"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
                      />
                    ))}
                  </span>
                </>
              ) : online ? (
                'online'
              ) : (
                'offline'
              )}
            </p>
          </div>
          <button
            onClick={() => setShowMsgSearch(!showMsgSearch)}
            className={clsx('h-8 w-8 rounded-full flex items-center justify-center transition flex-shrink-0', showMsgSearch ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent transition flex-shrink-0"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
        {/* More options menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} role="presentation" tabIndex={-1} />
            <div className="absolute right-3 top-14 z-50 bg-card border border-border/40 rounded-2xl shadow-xl py-1 w-48 fade-scale">
              <button
                onClick={() => {
                  let muted: string[] = []
                  try { muted = JSON.parse(localStorage.getItem('sm_muted_users') || '[]') } catch {}
                  if (muted.includes(other?.id)) {
                    try { localStorage.setItem('sm_muted_users', JSON.stringify(muted.filter((id: string) => id !== other?.id))) } catch {}
                    toast.success('User unmuted')
                  } else {
                    try { localStorage.setItem('sm_muted_users', JSON.stringify([...muted, other?.id])) } catch {}
                    toast.success('User muted — no sound on new messages')
                  }
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition text-xs text-left"
              >
                {(function() { try { return JSON.parse(localStorage.getItem('sm_muted_users') || '[]').includes(other?.id) } catch { return false } })() ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                {(function() { try { return JSON.parse(localStorage.getItem('sm_muted_users') || '[]').includes(other?.id) } catch { return false } })() ? 'Unmute' : 'Mute Notifications'}
              </button>
              <button
                onClick={() => {
                  setView('seller-profile', { username: other?.username })
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition text-xs text-left"
              >
                <User className="h-3.5 w-3.5" /> View Profile
              </button>
              <button
                onClick={() => {
                  const reason = window.prompt('Report this user for:')
                  if (reason && reason.trim().length >= 5) {
                    api.post('/api/services/' + (orderInfo?.serviceId || 'unknown') + '/report', { reason: `User report: ${reason.trim()}` }).catch(() => {})
                    toast.success('Report submitted')
                  }
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition text-xs text-left text-rose-500"
              >
                <Flag className="h-3.5 w-3.5" /> Report User
              </button>
            </div>
          </>
        )}
        {/* Message search bar */}
        {showMsgSearch && (
          <div className="max-w-md mx-auto px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                placeholder="Search in conversation…"
                className="w-full h-9 rounded-lg bg-muted/60 border border-border/40 pl-9 pr-3 text-xs outline-none focus:border-primary"
              />
              {msgSearch && (
                <button onClick={() => setMsgSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Order context banner */}
      {orderInfo && (
        <div className="bg-primary/5 border-b border-primary/20">
          <button
            onClick={() => setView('order-detail', { id: orderInfo.id })}
            className="max-w-md mx-auto w-full px-3 py-2 flex items-center gap-2 active:bg-accent/50 transition"
          >
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold truncate">{orderInfo.service?.title || 'Order'}</p>
              <p className="text-[10px] text-muted-foreground">{orderInfo.orderNo} · {orderInfo.status}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-area max-w-md mx-auto w-full px-3 py-4 space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted/40 rounded-2xl animate-pulse" style={{ width: '60%' }} />)
          : (msgSearch.trim() ? messages.filter((m) => m.content.toLowerCase().includes(msgSearch.toLowerCase())) : messages).map((m) => (
              <MessageBubble key={m.id} message={m} mine={m.senderId === user?.id} msgSearch={msgSearch} editingId={editingId} editText={editText} setEditingId={setEditingId} setEditText={setEditText} savingEdit={savingEdit} handleEdit={handleEdit} handleDelete={handleDelete} />
            ))}
        {msgSearch.trim() && !loading && (
          <div className="text-center text-[10px] text-muted-foreground py-2">
            {messages.filter((m) => m.content.toLowerCase().includes(msgSearch.toLowerCase())).length} result(s)
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      {!text.trim() && !recording && messages.length > 0 && (
        <div className="px-3 pb-2 max-w-md mx-auto">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {['Hello! 👋', 'Thanks!', 'Got it ✅', 'Can you share more details?', 'I\'ll get started right away', 'Looks great!'].map((q) => (
              <button
                key={q}
                onClick={() => { setText(q); onType(q) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/40 text-xs font-medium hover:bg-accent active:scale-95 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-3 pb-2 max-w-md mx-auto"
          >
            <div className="bg-card border border-border/40 rounded-2xl p-2 grid grid-cols-8 gap-0.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { setText((prev) => prev + e); onType(text + e) }}
                  className="h-9 w-9 flex items-center justify-center text-xl hover:bg-accent rounded-lg active:scale-90 transition"
                >
                  {e}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            {recording ? (
              <div className="flex-1 flex items-center gap-2 py-1">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-3 w-3 rounded-full bg-rose-500"
                />
                <span className="text-sm font-mono tabular-nums text-rose-500">
                  {Math.floor(recordTime / 60)}:{String(recordTime % 60).padStart(2, '0')}
                </span>
                <span className="text-xs text-muted-foreground ml-2">Recording…</span>
              </div>
            ) : (
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
            )}
            {!recording && (
              <button
                onClick={() => setShowEmojis(!showEmojis)}
                className={clsx('h-7 w-7 rounded-full flex items-center justify-center transition flex-shrink-0', showEmojis ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                <Smile className="h-4 w-4" />
              </button>
            )}
          </div>
          {recording ? (
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => stopRecording(true)}
                className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center active:scale-90 transition"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => stopRecording(false)}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : text.trim() ? (
            <button
              onClick={send}
              disabled={sending || rateCooldown > 0}
              className={clsx(
                'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition',
                rateCooldown > 0
                  ? 'bg-muted-foreground/30 text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground active:scale-90'
              )}
            >
              {rateCooldown > 0 ? (
                <span className="text-xs font-mono">{rateCooldown}</span>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={uploading}
              className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-accent transition flex-shrink-0 disabled:opacity-50"
            >
              {uploading ? <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Mic className="h-5 w-5 text-muted-foreground" />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const MessageBubble = memo(function MessageBubble({
  message, mine, msgSearch, editingId, editText, setEditingId, setEditText, savingEdit, handleEdit, handleDelete,
}: {
  message: Message; mine: boolean; msgSearch: string; editingId: string | null; editText: string;
  setEditingId: (id: string | null) => void; setEditText: (t: string) => void; savingEdit: boolean;
  handleEdit: (id: string) => Promise<void>; handleDelete: (id: string) => Promise<void>;
}) {
  const [showActions, setShowActions] = useState(false)
  const isDeleted = !!message.deletedAt

  // Highlight text matching search
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
    if (parts.length === 1) return text
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-500/20 rounded-sm px-0.5">{part}</mark>
        : part
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('flex', mine ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={clsx(
        'max-w-[78%] px-3.5 py-2 rounded-2xl text-sm relative group',
        mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border/40 rounded-bl-md'
      )}>
        {/* Edit/Delete buttons — only on own messages */}
        {mine && !isDeleted && showActions && (
          <div className={clsx('absolute -top-2 flex gap-1 z-10', mine ? 'right-0' : 'left-0')}>
            {/* Edit button — only within 5 minutes */}
            {Date.now() - new Date(message.createdAt).getTime() < 5 * 60 * 1000 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingId(message.id)
                  setEditText(message.content)
                }}
                className="h-7 w-7 rounded-full bg-background border border-border/60 shadow-sm flex items-center justify-center hover:bg-accent transition"
                title="Edit"
              >
                <Edit3 className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Delete this message?')) handleDelete(message.id)
              }}
              className="h-7 w-7 rounded-full bg-background border border-border/60 shadow-sm flex items-center justify-center hover:bg-rose-50 transition"
              title="Delete"
            >
              <Trash2 className="h-3 w-3 text-rose-500" />
            </button>
          </div>
        )}

        {/* Editing state */}
        {editingId === message.id ? (
          <div className="flex flex-col gap-1">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={clsx(
                'w-full bg-transparent text-sm outline-none resize-none rounded-md p-1',
                mine ? 'text-primary-foreground placeholder-primary-foreground/50' : 'text-foreground'
              )}
              rows={2}
              autoFocus
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => { setEditingId(null); setEditText('') }}
                className="px-2 py-0.5 text-[10px] rounded-md bg-muted/60 hover:bg-accent transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(message.id)}
                disabled={savingEdit || !editText.trim()}
                className="px-2 py-0.5 text-[10px] rounded-md bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-40"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : isDeleted ? (
          <p className="italic opacity-60 text-xs">[deleted]</p>
        ) : message.type === 'image' && message.attachmentUrl ? (
          <div>
            <img src={message.attachmentUrl} alt="" className="rounded-lg max-w-full" loading="lazy" decoding="async" />
            {message.content && message.content !== 'Image' && (
              <p className="text-xs mt-1 opacity-70">{message.content}</p>
            )}
          </div>
        ) : message.type === 'voice' && message.attachmentUrl ? (
          <div className="flex items-center gap-2 min-w-[160px]">
            <button
              onClick={(e) => {
                const audio = (e.currentTarget.parentElement?.querySelector('audio') as HTMLAudioElement)
                if (audio) {
                  if (audio.paused) audio.play()
                  else audio.pause()
                }
              }}
              className={clsx('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', mine ? 'bg-white/20' : 'bg-primary/10 text-primary')}
            >
              <Mic className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-0.5 h-6">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className={clsx('flex-1 rounded-full', mine ? 'bg-white/40' : 'bg-muted-foreground/40')}
                    style={{ height: `${4 + Math.abs(Math.sin(i * 0.8)) * 12}px` }}
                  />
                ))}
              </div>
              <audio src={message.attachmentUrl} controls className="hidden" />
            </div>
          </div>
        ) : message.type === 'file' && message.attachmentUrl ? (
          <div className="flex items-center gap-2">
            {message.attachmentUrl.match(/\.(png|jpg|jpeg|gif|webp|svg|avif)(\?.*)?$/i) ? (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <img src={message.attachmentUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{message.content || 'Image'}</p>
                </div>
              </div>
            ) : message.attachmentUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z)$/i) ? (
              <div className="flex items-center gap-2">
                <div className={clsx('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', mine ? 'bg-white/20' : 'bg-muted')}>
                  {message.attachmentUrl.match(/\.(pdf)$/i) ? <FileText className="h-5 w-5" /> :
                   message.attachmentUrl.match(/\.(doc|docx)$/i) ? <FileText className="h-5 w-5" /> :
                   <File className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{message.content || 'File'}</p>
                </div>
                <a href={message.attachmentUrl} target="_blank" rel="noreferrer" download className={clsx('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition', mine ? '' : 'hover:bg-accent')}>
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="underline flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" /> {message.content}
              </a>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">
            {highlightText(message.content, msgSearch)}
          </p>
        )}
        <div className={clsx('flex items-center gap-1.5 mt-0.5', mine ? 'justify-end' : 'justify-start')}>
          <span className="text-[9px] opacity-70">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.editedAt && <span className="text-[9px] opacity-50">(edited)</span>}
          {mine && !isDeleted && (
            message.status === 'read' ? <CheckCheck className="h-3 w-3 text-blue-400" /> :
            message.status === 'delivered' ? <CheckCheck className="h-3 w-3 opacity-70" /> :
            <Clock className="h-3 w-3 opacity-70" />
          )}
        </div>
      </div>
    </motion.div>
  )
})
