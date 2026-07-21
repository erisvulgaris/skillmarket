'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SkillCredits } from '@/components/sc-badge'
import { ArrowLeft, Clock, Package, CheckCircle2, XCircle, MessageSquare, Star, ShieldCheck, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function OrderDetailView() {
  const { viewParams, setView, user } = useApp()
  const id = viewParams.id as string
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [deliverNote, setDeliverNote] = useState('')
  const [showDeliver, setShowDeliver] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ order: any }>(`/api/orders/${id}`)
      setOrder(data.order)
    } catch {
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const doAction = async (action: string, body?: any) => {
    setActionLoading(true)
    try {
      await api.post(`/api/orders/${id}?action=${action}`, body || {})
      toast.success(`Order ${action} successful`)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const submitReview = async () => {
    setActionLoading(true)
    try {
      await api.post(`/api/services/${order.serviceId}/reviews`, {
        orderId: order.id,
        rating,
        comment: reviewComment,
      })
      toast.success('Review submitted!')
      setReviewing(false)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Review failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (!order) return <div className="p-8 text-center text-sm text-muted-foreground">Order not found</div>

  const isBuyer = order.buyerId === user?.id
  const counterparty = isBuyer ? order.seller : order.buyer
  const hasReview = order.reviews?.length > 0
  const canReview = isBuyer && order.status === 'completed' && !hasReview

  const openChat = async () => {
    try {
      const data = await api.get<{ conversations: any[] }>('/api/messages/conversations?limit=50')
      const convo = data.conversations.find((c) => c.orderId === order.id)
      if (convo) {
        setView('conversation', { id: convo.id })
      } else {
        toast.info('Conversation not found')
      }
    } catch {
      toast.error('Failed to open chat')
    }
  }

  return (
    <div className="pb-32 slide-enter">
      <header className="sticky top-0 z-20 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('orders')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold">{order.orderNo}</p>
            <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4 max-w-md mx-auto">
        {/* Status banner */}
        <StatusBanner status={order.status} paymentStatus={order.paymentStatus} />

        {/* Service summary */}
        <Card className="p-4 flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center text-2xl">🎨</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold line-clamp-2">{order.service.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isBuyer ? 'Seller' : 'Buyer'}: @{counterparty.username}
            </p>
          </div>
          <SkillCredits amount={order.price} size="md" />
        </Card>

        {/* Requirements */}
        {order.requirements && (
          <Card className="p-4 space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Requirements</p>
            <p className="text-sm whitespace-pre-wrap">{order.requirements}</p>
          </Card>
        )}

        {/* Timeline */}
        <Card className="p-4 space-y-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">Timeline</p>
          <div className="space-y-3">
            {order.statusHistory?.map((h: any, i: number) => (
              <div key={h.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  {i < order.statusHistory.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="pb-1">
                  <p className="text-sm font-semibold capitalize">{h.status.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(h.createdAt).toLocaleString()}</p>
                  {h.note && <p className="text-xs text-muted-foreground mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Deliver form (seller) */}
        {showDeliver && !isBuyer && order.status === 'in_progress' && (
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Deliver Work</p>
            <Textarea
              value={deliverNote}
              onChange={(e) => setDeliverNote(e.target.value)}
              placeholder="Add a note about your delivery…"
              className="min-h-[80px]"
            />
            <Button
              onClick={() => { doAction('deliver', { note: deliverNote }); setShowDeliver(false); setDeliverNote('') }}
              disabled={actionLoading}
              className="w-full"
            >
              Mark as Delivered
            </Button>
          </Card>
        )}

        {/* Review form */}
        {reviewing && canReview && (
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Leave a Review</p>
            <div className="flex gap-1 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1)}>
                  <Star className={`h-7 w-7 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                </button>
              ))}
            </div>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience…"
              className="min-h-[80px]"
            />
            <Button onClick={submitReview} disabled={actionLoading} className="w-full">
              Submit Review
            </Button>
          </Card>
        )}

        {/* Existing review */}
        {hasReview && (
          <Card className="p-4 space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Your Review</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < order.reviews[0].rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
              ))}
            </div>
            {order.reviews[0].comment && <p className="text-sm">{order.reviews[0].comment}</p>}
          </Card>
        )}

        {/* Attachments */}
        {order.attachments?.length > 0 && (
          <Card className="p-4 space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Deliverables</p>
            <div className="space-y-2">
              {order.attachments.map((a: any) => (
                <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm flex-1 truncate">{a.filename}</span>
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 inset-x-0 z-30 glass border-t border-border/40 p-3 pb-safe">
        <div className="max-w-md mx-auto flex gap-2">
          <Button
            variant="outline"
            onClick={openChat}
            className="flex-1 rounded-2xl"
          >
            <MessageSquare className="h-4 w-4 mr-1" /> Chat
          </Button>

          {/* Seller actions */}
          {!isBuyer && order.status === 'pending' && (
            <Button onClick={() => doAction('accept')} disabled={actionLoading} className="flex-1 rounded-2xl">
              Accept Order
            </Button>
          )}
          {!isBuyer && order.status === 'in_progress' && !showDeliver && (
            <Button onClick={() => setShowDeliver(true)} className="flex-1 rounded-2xl">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Deliver
            </Button>
          )}

          {/* Buyer actions */}
          {isBuyer && order.status === 'delivered' && (
            <Button onClick={() => doAction('complete')} disabled={actionLoading} className="flex-1 rounded-2xl">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
            </Button>
          )}
          {canReview && !reviewing && (
            <Button onClick={() => setReviewing(true)} variant="outline" className="flex-1 rounded-2xl">
              <Star className="h-4 w-4 mr-1" /> Review
            </Button>
          )}

          {/* Cancel */}
          {(order.status === 'pending' || order.status === 'in_progress') && (
            <Button onClick={() => doAction('cancel')} disabled={actionLoading} variant="destructive" className="rounded-2xl">
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBanner({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  const map: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: <Clock className="h-5 w-5" />, label: 'Awaiting seller acceptance' },
    in_progress: { color: 'text-blue-600', bg: 'bg-blue-500/10', icon: <Package className="h-5 w-5" />, label: 'Work in progress' },
    delivered: { color: 'text-violet-600', bg: 'bg-violet-500/10', icon: <CheckCircle2 className="h-5 w-5" />, label: 'Delivered — review and approve' },
    completed: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: <CheckCircle2 className="h-5 w-5" />, label: 'Order completed' },
    cancelled: { color: 'text-muted-foreground', bg: 'bg-muted', icon: <XCircle className="h-5 w-5" />, label: 'Order cancelled — refunded' },
    disputed: { color: 'text-rose-600', bg: 'bg-rose-500/10', icon: <AlertTriangle className="h-5 w-5" />, label: 'Under dispute' },
  }
  const m = map[status] || map.pending
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`flex items-center gap-3 p-4 rounded-2xl ${m.bg}`}>
      <span className={m.color}>{m.icon}</span>
      <div>
        <p className={`text-sm font-bold capitalize ${m.color}`}>{status.replace(/_/g, ' ')}</p>
        <p className="text-xs text-muted-foreground">{m.label} · {paymentStatus}</p>
      </div>
    </motion.div>
  )
}
