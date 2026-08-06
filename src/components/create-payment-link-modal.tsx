'use client'

import { useState } from 'react'
import { api } from '@/lib/api-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Copy, Check, Link as LinkIcon, ExternalLink, QrCode } from 'lucide-react'
import { toast } from 'sonner'

interface CreatePaymentLinkModalProps {
  isOpen: boolean
  onClose: () => void
  initialServiceId?: string
  initialTitle?: string
  initialAmount?: number
  onSuccess?: () => void
}

export function CreatePaymentLinkModal({
  isOpen,
  onClose,
  initialServiceId,
  initialTitle = '',
  initialAmount = 500,
  onSuccess,
}: CreatePaymentLinkModalProps) {
  const [title, setTitle] = useState(initialTitle || '')
  const [description, setDescription] = useState('')
  const [amountCredits, setAmountCredits] = useState<number>(initialAmount || 500)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please enter a payment link title')
      return
    }
    if (amountCredits <= 0) {
      toast.error('Please enter a valid SkillCredits amount')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await api.post<{ link: any; shareUrl: string }>('/api/payment-links', {
        title: title.trim(),
        description: description.trim() || undefined,
        amountCredits,
        serviceId: initialServiceId || undefined,
      })

      setCreatedUrl(res.shareUrl)
      toast.success('Payment link generated!')
      if (onSuccess) onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create payment link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = () => {
    if (!createdUrl) return
    navigator.clipboard.writeText(createdUrl)
    setCopied(true)
    toast.success('Payment link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setCreatedUrl(null)
    setTitle('')
    setDescription('')
    setAmountCredits(500)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <LinkIcon className="w-5 h-5 text-emerald-400" />
            {createdUrl ? 'Share Payment Link' : 'Generate Payment Link'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {createdUrl
              ? 'Send this link to anyone. Payers can pay instantly via Razorpay without creating an account.'
              : 'Create a custom payment link with any SkillCredits amount. Anyone with the link can pay.'}
          </DialogDescription>
        </DialogHeader>

        {createdUrl ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <Label className="text-xs text-slate-400 font-semibold">Your Unique Payment Link</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={createdUrl} className="bg-slate-900 border-slate-700 text-emerald-400 font-mono text-xs h-10" />
                <Button onClick={handleCopy} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-1 px-4">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 p-3 rounded-lg bg-slate-800/50">
              <span>Payers need email only</span>
              <span className="text-emerald-400 font-bold">1 SC = ₹1 INR</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={handleReset}>
                Close
              </Button>
              <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white gap-1.5" onClick={() => window.open(createdUrl, '_blank')}>
                Open Link <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold text-slate-300">
                Payment Title <span className="text-emerald-400">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Website Design Deposit, Custom Telegram Bot"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-semibold text-slate-300">
                Manual SkillCredits Amount <span className="text-emerald-400">*</span>
              </Label>

              <div className="flex items-center gap-2">
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={amountCredits}
                  onChange={(e) => setAmountCredits(Number(e.target.value))}
                  required
                  className="bg-slate-950 border-slate-800 text-white font-mono text-lg font-bold text-right"
                />
                <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" /> SC
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-right">
                Payer pays: <span className="text-white font-semibold">₹{amountCredits || 0} INR</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-semibold text-slate-300">
                Description / Notes (Optional)
              </Label>
              <Textarea
                id="desc"
                placeholder="Describe deliverables, terms, or scope of work..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold h-11 text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" /> Generate Payment Link
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
