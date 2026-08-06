'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { CheckCircle2, ShieldCheck, Zap, Lock, CreditCard, Sparkles, AlertCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { loadRazorpayScript } from '@/lib/razorpay-client'

type PaymentLinkData = {
  id: string
  title: string
  description?: string | null
  amountCredits: number
  amountFiat: number
  slug: string
  seller: {
    id: string
    username: string
    profile?: {
      displayName?: string | null
      avatarUrl?: string | null
      isVerified?: boolean
    } | null
  }
  service?: {
    id: string
    title: string
    images?: string | null
  } | null
}

export default function PublicPaymentPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [link, setLink] = useState<PaymentLinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [customCredits, setCustomCredits] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    api.get<{ link: PaymentLinkData }>(`/api/payment-links/${slug}`)
      .then((res) => {
        setLink(res.link)
        setCustomCredits(String(res.link.amountCredits))
      })
      .catch((err) => {
        setError(err.message || 'Payment link not found or expired')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    const creditsToPay = Number(customCredits) || link?.amountCredits || 0
    if (creditsToPay <= 0) {
      toast.error('Please enter a valid SkillCredits amount')
      return
    }

    setIsProcessing(true)
    try {
      // 1. Initiate zero-friction checkout
      const checkoutRes = await api.post<{
        order: any
        transactionId: string
        keyId: string
        user: any
      }>(`/api/payment-links/${slug}/checkout`, {
        email: email.trim(),
        customAmountCredits: creditsToPay,
      })

      const { order, transactionId, keyId } = checkoutRes

      // 2. Load Razorpay script
      const rzpLoaded = await loadRazorpayScript()
      if (!rzpLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your network.')
        setIsProcessing(false)
        return
      }

      // 3. Launch Razorpay modal
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillCart',
        description: `Payment for ${link?.title || 'Service'} (${creditsToPay} SC)`,
        order_id: order.id,
        prefill: {
          email: email.trim(),
        },
        theme: {
          color: '#10b981', // emerald-500
        },
        handler: async function (response: any) {
          try {
            toast.loading('Verifying payment...', { id: 'verify-pl' })
            const verifyRes = await api.post<{ success: boolean }>('/api/payment-links/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              transactionId,
            })

            if (verifyRes.success) {
              toast.success('Payment completed successfully!', { id: 'verify-pl' })
              setPaymentSuccess(true)
            } else {
              toast.error('Payment verification failed', { id: 'verify-pl' })
            }
          } catch (e: any) {
            toast.error(e.message || 'Payment verification error', { id: 'verify-pl' })
          } finally {
            setIsProcessing(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false)
            toast.info('Checkout cancelled')
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (e: any) {
      toast.error(e.message || 'Failed to initiate checkout')
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full rounded-xl bg-slate-800" />
          <Skeleton className="h-64 w-full rounded-2xl bg-slate-800" />
        </div>
      </div>
    )
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <Card className="w-full max-w-md p-8 bg-slate-900 border-slate-800 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Link Unavailable</h2>
          <p className="text-sm text-slate-400">{error || 'This payment link has expired or does not exist.'}</p>
          <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white" onClick={() => window.location.href = '/'}>
            Return to Marketplace
          </Button>
        </Card>
      </div>
    )
  }

  const creditsToPay = Number(customCredits) || link.amountCredits
  const fiatEquivalent = creditsToPay // 1 SC = ₹1

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <Card className="w-full max-w-md p-8 bg-slate-900 border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="h-20 w-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Payment Successful!</h1>
            <p className="text-sm text-slate-400">
              You paid <span className="text-emerald-400 font-bold">₹{fiatEquivalent}</span> ({creditsToPay} SC) to{' '}
              <span className="text-white font-semibold">{link.seller.profile?.displayName || link.seller.username}</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Title</span>
              <span className="text-white font-medium">{link.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Payer Email</span>
              <span className="text-white font-medium">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Seller</span>
              <span className="text-emerald-400 font-medium">@{link.seller.username}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">A receipt has been sent to {email}. Account auto-activated!</p>

          <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold" onClick={() => window.location.href = '/'}>
            Explore SkillCart Marketplace <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
      <Card className="w-full max-w-md p-6 sm:p-8 bg-slate-900 border-slate-800 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header / Seller Profile */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg font-bold border border-emerald-500/30">
            {link.seller.profile?.avatarUrl ? (
              <img src={link.seller.profile.avatarUrl} alt={link.seller.username} className="h-full w-full rounded-full object-cover" />
            ) : (
              (link.seller.profile?.displayName || link.seller.username)[0].toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base">{link.seller.profile?.displayName || link.seller.username}</span>
              {link.seller.profile?.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />}
            </div>
            <span className="text-xs text-slate-400">@{link.seller.username}</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{link.title}</h1>
          {link.description && <p className="text-xs text-slate-400 leading-relaxed">{link.description}</p>}
        </div>

        {/* Amount Input / Display */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SkillCredits Amount</span>
            <span className="text-emerald-400 font-semibold">1 SC = ₹1 INR</span>
          </div>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              value={customCredits}
              onChange={(e) => setCustomCredits(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white font-mono text-2xl font-bold h-12 text-right"
              placeholder="Enter amount"
            />
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" /> SC
            </div>
          </div>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-900 text-slate-400">
            <span>Total Payable:</span>
            <span className="text-white font-bold text-lg">₹{fiatEquivalent} INR</span>
          </div>
        </div>

        {/* Form: Email & Checkout */}
        <form onSubmit={handlePay} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
              Your Email Address <span className="text-emerald-400">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 h-11"
            />
            <p className="text-[10px] text-slate-500">No account creation needed. Enter email and pay instantly.</p>
          </div>

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-base rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Initiating Razorpay...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" /> Pay ₹{fiatEquivalent} via Razorpay
              </>
            )}
          </Button>
        </form>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Fulfillment</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
