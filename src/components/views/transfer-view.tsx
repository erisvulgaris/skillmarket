'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, QrCode, ShieldCheck, Camera, Check } from 'lucide-react'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export function TransferView() {
  const { viewParams, setView, user, refreshUser } = useApp()
  const initialTab = viewParams.tab === 'receive' ? 'receive' : 'send'
  const [tab, setTab] = useState<'send' | 'receive'>(initialTab)
  const [recipient, setRecipient] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      api.get<{ dataUrl: string }>('/api/wallet/qr').then((d) => setQrUrl(d.dataUrl)).catch(() => {})
    }
  }, [user])

  const lookupRecipient = async () => {
    if (!recipient.trim()) return
    try {
      const d = await api.get<{ recipient: any }>(`/api/wallet/transfer?recipient=${encodeURIComponent(recipient.trim())}`)
      setPreview(d.recipient)
    } catch (e: any) {
      setPreview(null)
      toast.error(e.message || 'Recipient not found')
    }
  }

  const send = async () => {
    if (!preview) return toast.error('Look up recipient first')
    const amt = Number(amount)
    if (!amt || amt <= 0) return toast.error('Invalid amount')
    if (amt > (user?.wallet?.availableBalance || 0)) return toast.error('Insufficient balance')
    if (pin.length !== 4) return toast.error('Enter 4-digit PIN')

    setLoading(true)
    try {
      const res = await api.post<{ transfer: any; senderBalance: number }>('/api/wallet/transfer', {
        recipient: preview.id,
        amount: amt,
        note: note || undefined,
        pin,
      })
      setSuccess({ ...res.transfer, senderBalance: res.senderBalance })
      await refreshUser()
      setPin('')
      setAmount('')
      setNote('')
      setRecipient('')
      setPreview(null)
      toast.success('Transfer successful!')
    } catch (e: any) {
      toast.error(e.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('wallet')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">SkillCredits Transfer</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-6 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <Check className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transfer Successful</p>
                <p className="text-3xl font-bold mt-1">{formatSC(success.amount)} SC</p>
                <p className="text-xs text-muted-foreground mt-1">Receipt #{success.receiptNo}</p>
              </div>
              <div className="text-left text-xs space-y-1 pt-4 border-t">
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(success.createdAt).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-emerald-500 font-semibold">Completed</span></div>
              </div>
              <Button onClick={() => setView('wallet')} className="w-full rounded-2xl">Done</Button>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="flex p-1 bg-muted rounded-2xl">
              <button onClick={() => setTab('send')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${tab === 'send' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Send</button>
              <button onClick={() => setTab('receive')} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${tab === 'receive' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Receive</button>
            </div>

            {tab === 'send' ? (
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Recipient (username or ID)</label>
                  <div className="flex gap-2">
                    <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="@username or user ID" />
                    <Button variant="outline" onClick={lookupRecipient}>Check</Button>
                  </div>
                </div>

                {preview && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <div className="h-12 w-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {preview.avatarUrl && <img src={preview.avatarUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold">@{preview.username}</p>
                        {preview.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{preview.displayName || 'Verified recipient'}</p>
                    </div>
                    <Check className="h-5 w-5 text-emerald-500" />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Amount (SC)</label>
                  <Input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
                  <p className="text-[10px] text-muted-foreground">Available: {formatSC(user?.wallet?.availableBalance || 0)} SC</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Note (optional)</label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thanks for the service!" maxLength={280} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Transaction PIN</label>
                  <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="••••" maxLength={4} />
                </div>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">You send</span>
                    <SkillCredits amount={Number(amount) || 0} size="sm" />
                  </div>
                </div>

                <Button onClick={send} disabled={loading || !preview} className="w-full rounded-2xl h-12">
                  {loading ? 'Sending…' : (<><Send className="h-4 w-4 mr-2" /> Send Transfer</>)}
                </Button>
              </Card>
            ) : (
              <Card className="p-6 text-center space-y-4">
                <p className="text-sm font-bold">Your SkillCredits QR</p>
                <p className="text-xs text-muted-foreground">Share this code to receive instant transfers</p>
                {qrUrl ? (
                  <div className="inline-block p-3 bg-white rounded-2xl">
                    <img src={qrUrl} alt="My QR" className="h-48 w-48" />
                  </div>
                ) : (
                  <div className="h-48 w-48 mx-auto bg-muted rounded-2xl animate-pulse" />
                )}
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Your username</p>
                  <p className="text-sm font-bold">@{user?.username}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">ID: {user?.id}</p>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
