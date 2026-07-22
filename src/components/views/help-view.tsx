'use client'

import { useState } from 'react'
import { api, ApiError } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Search, HelpCircle, FileText, MessageSquare, ChevronDown, ChevronRight, Send, LifeBuoy, BookOpen, Shield } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const FAQS = [
  { q: 'How do I buy SkillCredits?', a: 'Go to your Wallet, tap "Buy Credits", choose a package, and complete the purchase. Credits are instantly added to your wallet.' },
  { q: 'How do I transfer SkillCredits to another user?', a: 'Go to Wallet → Send, enter the recipient\'s username or user ID (or scan their QR code), enter the amount and your PIN.' },
  { q: 'What happens to my credits when I order a service?', a: 'Credits are moved to "reserved" (escrow) when you order. They\'re released to the seller when you approve the delivery, or refunded if you cancel.' },
  { q: 'How do I become a seller?', a: 'Every account can buy and sell. Just go to Profile → Create a Service to list your first offering.' },
  { q: 'What is a transaction PIN?', a: 'Your 4-digit PIN secures all wallet transfers and purchases. Set it during registration and change it in Settings → Security.' },
  { q: 'How do refunds work?', a: 'If you cancel an order before delivery, your escrowed credits are instantly refunded. For disputes, our team reviews and may issue refunds.' },
  { q: 'Can I withdraw SkillCredits as cash?', a: 'No. SkillCredits are a virtual currency used only within SkillMarket and cannot be withdrawn as real money.' },
  { q: 'How do I enable 2FA?', a: 'Go to Settings → Security → Two-Factor Auth. Scan the QR code with an authenticator app and enter the 6-digit code to verify.' },
]

const QUICK_LINKS = [
  { slug: 'terms', label: 'Terms of Service', icon: FileText },
  { slug: 'privacy', label: 'Privacy Policy', icon: Shield },
  { slug: 'faq', label: 'FAQ Page', icon: HelpCircle },
]

export function HelpView() {
  const { setView, user } = useApp()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(0)
  const [showContact, setShowContact] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [submitting, setSubmitting] = useState(false)

  const filtered = FAQS.filter((f) =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  )

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) return toast.error('Subject and message required')
    setSubmitting(true)
    try {
      await api.post('/api/support/tickets', { subject, message, priority })
      toast.success('Support ticket submitted!')
      setSubject('')
      setMessage('')
      setShowContact(false)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Failed to submit'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('profile')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Help & Support</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 text-center"
        >
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 text-primary items-center justify-center mb-3">
            <LifeBuoy className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">How can we help?</h2>
          <p className="text-xs text-muted-foreground mt-1">Find answers, browse FAQs, or contact support</p>
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles…"
            className="w-full h-11 rounded-2xl bg-muted/60 border border-border/40 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2">
          {QUICK_LINKS.map((l) => (
            <button
              key={l.slug}
              onClick={() => setView('cms-page', { slug: l.slug, from: 'help' })}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/40 hover:bg-accent active:scale-95 transition"
            >
              <span className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <l.icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold text-center">{l.label}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Frequently Asked Questions</h3>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No results for "{search}"</p>
          ) : (
            filtered.map((f, i) => (
              <Card key={i} className="overflow-hidden p-0">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center gap-2 p-3 text-left active:bg-accent/50 transition"
                >
                  <span className="flex-1 text-sm font-semibold">{f.q}</span>
                  {expanded === i ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {expanded === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))
          )}
        </div>

        {/* Contact support */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Still need help?</h3>
          </div>
          {!showContact ? (
            <Button onClick={() => setShowContact(true)} variant="outline" className="w-full rounded-2xl">
              <MessageSquare className="h-4 w-4 mr-2" /> Contact Support
            </Button>
          ) : (
            <Card className="p-4 space-y-3">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue in detail…" className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {['low', 'normal', 'high', 'urgent'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={clsx(
                        'flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition',
                        priority === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowContact(false)} variant="outline" className="flex-1 rounded-2xl">Cancel</Button>
                <Button onClick={submitTicket} disabled={submitting} className="flex-1 rounded-2xl">
                  {submitting ? 'Sending…' : <><Send className="h-4 w-4 mr-1" /> Submit</>}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
