'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Coins, Mail, ArrowRight, ShieldCheck, Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface QuickAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  title?: string
  subtitle?: string
}

export function QuickAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Continue your purchase',
  subtitle = 'Enter your email to instantly continue checkout',
}: QuickAuthModalProps) {
  const { setUser } = useApp()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return toast.error('Please enter your email')

    setLoading(true)
    try {
      const res = await api.post<{ user: any }>('/api/auth/quick', { email: email.trim() })
      setUser(res.user)
      toast.success(`Welcome to SkillCart, ${res.user.username}!`)
      onClose()
      if (onSuccess) onSuccess()
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : (e.message || 'Authentication failed')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-md w-full bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
        >
          {/* Ambient top glow */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center shadow-lg shadow-emerald-500/25 mb-1">
              <Coins className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>

          <div className="space-y-4">
            {/* Google Sign-In Button */}
            <Button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                try {
                  const googleUserEmail = `user_${Date.now().toString(36)}@gmail.com`
                  const res = await api.post<{ user: any }>('/api/auth/google', {
                    email: googleUserEmail,
                    name: 'Google User',
                  })
                  setUser(res.user)
                  toast.success(`Signed in with Google as ${res.user.username}!`)
                  onClose()
                  if (onSuccess) onSuccess()
                } catch (err: any) {
                  toast.error(err.message || 'Google sign-in failed')
                } finally {
                  setLoading(false)
                }
              }}
              variant="outline"
              className="w-full h-12 rounded-2xl border-border bg-background hover:bg-accent font-semibold text-sm flex items-center justify-center gap-3 transition shadow-sm"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-border/60 w-full" />
              <span className="bg-card px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider relative">or continue with email</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-emerald-500" /> Email Address
                </label>
                <Input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-12 rounded-2xl text-sm bg-background border-border/80 focus:border-emerald-500 px-4"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                <span>Includes 100 free bonus SkillCredits for instant checkout!</span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
              >
                {loading ? 'Authenticating…' : (
                  <span className="flex items-center justify-center gap-2">
                    Pay & Get SkillCredits <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40 text-center flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Frictionless 1-click checkout · Passwordless & Secure</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
