'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Store, Wallet, MessageSquare, ShieldCheck, Sparkles, X } from 'lucide-react'

const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome to SkillMarket',
    desc: 'Buy and sell digital services using SkillCredits — our internal virtual currency.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Store,
    title: 'Browse the Marketplace',
    desc: 'Discover services across categories. Save your favorites, search by name, or explore trending picks.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Wallet,
    title: 'Your Wallet',
    desc: 'Buy SkillCredits, send transfers via QR or username, and track every transaction with double-entry ledger security.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Messaging',
    desc: 'Chat with buyers and sellers. Send text, images, files, and voice notes — all in real time.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Protected',
    desc: 'Transaction PIN, optional 2FA, escrow payments, and fraud detection keep your account safe.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Coins,
    title: 'Earn SkillCredits',
    desc: 'Sell your skills, complete orders, and earn credits. Refer friends to get 50 SC for each signup!',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
]

export function OnboardingTour() {
  const { user, setView } = useApp()
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const seen = typeof window !== 'undefined' && localStorage.getItem('sm_onboarding_seen')
  const visible = !!user && !seen && !dismissed

  const close = () => {
    localStorage.setItem('sm_onboarding_seen', 'true')
    setDismissed(true)
  }

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      close()
    }
  }

  const skip = () => close()

  if (!visible) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={close}
      >
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl"
        >
          {/* Skip button */}
          <button
            onClick={skip}
            className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon */}
          <div className={`inline-flex h-20 w-20 rounded-3xl ${current.bg} ${current.color} items-center justify-center mx-auto`}>
            <Icon className="h-10 w-10" />
          </div>

          {/* Content */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 h-11 rounded-2xl bg-secondary text-sm font-semibold text-muted-foreground hover:bg-accent transition"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 active:scale-[0.98] transition"
            >
              {isLast ? 'Get Started' : 'Next'}
            </button>
          </div>

          {/* Step counter */}
          <p className="text-center text-[10px] text-muted-foreground">
            {step + 1} of {STEPS.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
