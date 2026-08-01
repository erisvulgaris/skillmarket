'use client'

import { useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Check, Zap } from 'lucide-react'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { QuickAuthModal } from '@/components/quick-auth-modal'

const PACKAGES = [
  { credits: 100, price: 100, bonus: 0, popular: false },
  { credits: 500, price: 500, bonus: 25, popular: false },
  { credits: 1000, price: 1000, bonus: 100, popular: true },
  { credits: 2500, price: 2500, bonus: 350, popular: false },
  { credits: 5000, price: 5000, bonus: 800, popular: false },
  { credits: 10000, price: 10000, bonus: 2000, popular: false },
]

export function BuyCreditsView() {
  const { setView, refreshUser, user } = useApp()
  const [selected, setSelected] = useState(2)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const buy = async () => {
    // Zero-friction auth check: if user is guest, pop up auth modal right away!
    if (!user) {
      setShowAuthModal(true)
      return
    }

    const pkg = PACKAGES[selected]
    setLoading(true)
    try {
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        toast.error('Failed to load Razorpay payment SDK')
        setLoading(false)
        return
      }

      // 1. Create order on server
      const order = await api.post<{ orderId: string; amount: number; currency: string; key: string }>('/api/wallet/razorpay/create-order', {
        amountCredits: pkg.credits + pkg.bonus,
        amountFiat: pkg.price,
      })

      // 2. Launch Razorpay Checkout Modal
      const options = {
        key: order.key || 'rzp_live_RyhshDxLuZASF6',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'SkillCart Marketplace',
        description: `Top up ${formatSC(pkg.credits + pkg.bonus)} SkillCredits`,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            setLoading(true)
            toast.loading('Verifying Razorpay payment signature…')
            await api.post('/api/wallet/razorpay/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amountCredits: pkg.credits + pkg.bonus,
              amountFiat: pkg.price,
            })
            await refreshUser()
            setSuccess(true)
            toast.dismiss()
            toast.success(`+${formatSC(pkg.credits + pkg.bonus)} SC added to your wallet!`)

            // Auto-fulfill pending order if stored
            try {
              const rawPending = localStorage.getItem('sm_pending_order')
              if (rawPending) {
                const pending = JSON.parse(rawPending)
                localStorage.removeItem('sm_pending_order')
                toast.info('Completing your pending service purchase…')
                const res = await api.post<{ order: any; conversationId: string }>('/api/orders', {
                  serviceId: pending.serviceId,
                  packageId: pending.packageId || undefined,
                  requirements: pending.requirements || undefined,
                })
                toast.success('Service ordered successfully!')
                setTimeout(() => setView('order-detail', { id: res.order.id }), 1200)
              }
            } catch (e) {
              console.error('Pending order auto-completion failed:', e)
            }
          } catch (err: any) {
            toast.dismiss()
            toast.error(err.message || 'Payment verification failed')
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          email: user?.email || '',
          name: user?.profile?.displayName || user?.username || '',
        },
        theme: {
          color: '#10b981',
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (resp: any) {
        toast.error(`Payment Failed: ${resp.error?.description || 'Transaction cancelled'}`)
        setLoading(false)
      })
      rzp.open()
    } catch (e: any) {
      toast.error(e.message || 'Payment initiation failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('wallet')} aria-label="Go back" className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Buy SkillCredits</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <Check className="h-10 w-10" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Complete</p>
                <p className="text-2xl font-bold mt-1">Credits added!</p>
              </div>
              <Button onClick={() => setView('wallet')} className="w-full rounded-2xl">View Wallet</Button>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 items-center justify-center shadow-xl shadow-primary/20 mb-3">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold">Top up your wallet</h2>
              <p className="text-xs text-emerald-500 font-semibold mt-1">Exchange Rate: 1 SC = ₹1 (1 SkillCredit = ₹1 INR)</p>
            </div>

            <div className="space-y-2">
              {PACKAGES.map((pkg, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(i)}
                  className={clsx(
                    'w-full text-left p-4 rounded-2xl border-2 transition relative',
                    selected === i ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold">POPULAR</span>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center', selected === i ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
                        <Plus className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold">{formatSC(pkg.credits)} SC</p>
                        {pkg.bonus > 0 && <p className="text-xs text-emerald-500 font-semibold">+{formatSC(pkg.bonus)} bonus</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-500">₹{pkg.price.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-muted-foreground">1 SC = ₹1</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <Card className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Package</span>
                <span className="font-semibold">{formatSC(PACKAGES[selected].credits)} SC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bonus</span>
                <span className="font-semibold text-emerald-500">+{formatSC(PACKAGES[selected].bonus)} SC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-bold text-primary">{formatSC(PACKAGES[selected].credits + PACKAGES[selected].bonus)} SC</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-emerald-500">₹{PACKAGES[selected].price.toLocaleString('en-IN')}</span>
              </div>
            </Card>

            <Button onClick={buy} disabled={loading} className="w-full rounded-2xl h-12">
              {loading ? 'Processing…' : `Pay ₹${PACKAGES[selected].price.toLocaleString('en-IN')} & Get ${formatSC(PACKAGES[selected].credits + PACKAGES[selected].bonus)} SC`}
            </Button>

            <p className="text-center text-[10px] text-muted-foreground px-6 leading-relaxed">
              1 SkillCredit = ₹1 INR. SkillCredits are virtual currency used within SkillCart. Purchases are instant. By continuing you agree to our Terms of Service.
            </p>
          </>
        )}
      </div>
      <QuickAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          setTimeout(() => buy(), 150)
        }}
        title="Quick Account Sign In"
        subtitle="Enter your email ID or sign in with Google to accept payment"
      />
    </div>
  )
}
