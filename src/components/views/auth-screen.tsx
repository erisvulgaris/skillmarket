'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Coins, Eye, EyeOff, User, Mail, Lock, ShieldCheck, Gift, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export function AuthScreen() {
  const { refreshUser } = useApp()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    emailOrUsername: '',
    email: '',
    username: '',
    password: '',
    transactionPin: '',
    referralCode: '',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      if (mode === 'login') {
        const res = await api.post<any>('/api/auth/login', {
          emailOrUsername: form.emailOrUsername,
          password: form.password,
          twoFactorCode: twoFactorRequired ? twoFactorCode : undefined,
        })
        if (res.requiresTwoFactor) {
          setTwoFactorRequired(true)
          setLoading(false)
          toast.info('Enter your 2FA code')
          return
        }
      } else {
        await api.post('/api/auth/register', {
          email: form.email,
          username: form.username,
          password: form.password,
          transactionPin: form.transactionPin,
          referralCode: form.referralCode || undefined,
        })
      }
      await refreshUser()
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-chart-4/10 blur-3xl" />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 items-center justify-center shadow-xl shadow-primary/30 mb-4">
            <Coins className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">SkillMarket</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buy & sell digital services with SkillCredits
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card/80 glass border border-border/50 rounded-3xl p-6 shadow-2xl"
        >
          {/* Tab switch */}
          <div className="flex p-1 bg-muted rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'register' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'login' ? (
              <Field
                icon={<User className="h-4 w-4" />}
                placeholder="Email or username"
                value={form.emailOrUsername}
                onChange={(v) => setForm({ ...form, emailOrUsername: v })}
                required
              />
            ) : (
              <>
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  required
                />
                <Field
                  icon={<User className="h-4 w-4" />}
                  placeholder="Username (3-20 chars)"
                  value={form.username}
                  onChange={(v) => setForm({ ...form, username: v })}
                  required
                />
              </>
            )}

            <Field
              icon={<Lock className="h-4 w-4" />}
              type={showPwd ? 'text' : 'password'}
              placeholder="Password (min 8 chars)"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              required
              trailing={
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {mode === 'login' && twoFactorRequired && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">Two-factor authentication required. Enter the 6-digit code from your authenticator app.</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full h-14 rounded-2xl bg-background border border-border/60 text-center text-2xl tracking-[0.3em] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </motion.div>
            )}

            {mode === 'register' && (
              <>
                <Field
                  icon={<ShieldCheck className="h-4 w-4" />}
                  type="password"
                  inputMode="numeric"
                  placeholder="Transaction PIN (4 digits)"
                  value={form.transactionPin}
                  onChange={(v) => setForm({ ...form, transactionPin: v.replace(/\D/g, '').slice(0, 4) })}
                  required
                />
                <Field
                  icon={<Gift className="h-4 w-4" />}
                  placeholder="Referral code (optional)"
                  value={form.referralCode}
                  onChange={(v) => setForm({ ...form, referralCode: v })}
                />
              </>
            )}

            {/* Inline error message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* Demo credentials hint */}
            {mode === 'login' && !errorMsg && (
              <div className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                Admin: admin@skillmarket.app / admin12345<br />
                Buyer: buyer@example.com / password123
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Please wait…</span>
                </>
              ) : (
                mode === 'login' ? (twoFactorRequired ? 'Verify & Sign In' : 'Sign In') : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setTwoFactorRequired(false); setTwoFactorCode(''); setErrorMsg('') }}
              className="text-primary font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-6 leading-relaxed px-6">
          SkillCredits are a virtual currency used only within SkillMarket. They cannot be withdrawn as cash.
        </p>
      </div>
    </div>
  )
}

function Field({ icon, placeholder, value, onChange, type = 'text', required, trailing, inputMode }: {
  icon?: React.ReactNode
  placeholder?: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  trailing?: React.ReactNode
  inputMode?: 'text' | 'numeric' | 'email'
}) {
  return (
    <div className="relative flex items-center h-12 rounded-2xl bg-background border border-border/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
      {icon && <span className="pl-4 text-muted-foreground">{icon}</span>}
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="flex-1 h-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground/70"
      />
      {trailing && <span className="pr-4">{trailing}</span>}
    </div>
  )
}
