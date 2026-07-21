'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, AlertTriangle, Shield, FileText, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const REASONS = [
  'Seller is unresponsive',
  'Delivered work does not match description',
  'Quality below expectations',
  'Delivery past deadline',
  'Other (describe in detail)',
]

export function DisputeView() {
  const { viewParams, setView } = useApp()
  const orderId = viewParams.id as string
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async () => {
    if (!reason) return toast.error('Please select a reason')
    setLoading(true)
    try {
      await api.post(`/api/orders/${orderId}/dispute`, { reason, detail: detail || undefined })
      setSuccess(true)
      toast.success('Dispute filed. Our team will review it.')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to file dispute'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen slide-enter">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('order-detail', { id: orderId })} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">File a Dispute</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 pb-24 space-y-4">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-bold">Dispute Filed Successfully</p>
                <p className="text-xs text-muted-foreground mt-1">Our moderation team will review your case and respond within 24 hours.</p>
              </div>
              <Button onClick={() => setView('order-detail', { id: orderId })} className="w-full rounded-2xl">
                Back to Order
              </Button>
            </Card>
          </motion.div>
        ) : (
          <>
            <Card className="p-4 bg-amber-500/5 border-amber-500/30">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-600">Before you dispute</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try resolving with the seller via chat first. Disputes are reviewed by our team and may take up to 24 hours.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold">Dispute Details</h2>
              </div>

              <div className="space-y-2">
                <Label>Reason *</Label>
                <div className="space-y-1.5">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left p-3 rounded-xl border-2 text-sm transition ${
                        reason === r ? 'border-primary bg-primary/5 font-semibold' : 'border-border'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional details (optional)</Label>
                <Textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Provide any additional context, evidence references, or specifics…"
                  className="min-h-[100px]"
                  maxLength={2000}
                />
                <p className="text-[10px] text-muted-foreground text-right">{detail.length}/2000</p>
              </div>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-bold uppercase text-muted-foreground">What happens next</p>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Your dispute is sent to our moderation team</li>
                <li>Both parties will be notified</li>
                <li>The seller has 48 hours to respond</li>
                <li>If unresolved, funds may be refunded or released</li>
              </ol>
            </Card>

            <Button onClick={submit} disabled={loading || !reason} className="w-full rounded-2xl h-12">
              {loading ? 'Filing…' : 'Submit Dispute'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
