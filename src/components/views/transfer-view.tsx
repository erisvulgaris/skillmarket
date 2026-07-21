'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, QrCode, ShieldCheck, Camera, Check, X, ScanLine, Image as ImageIcon } from 'lucide-react'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import jsQR from 'jsqr'

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
  const [showScanner, setShowScanner] = useState(false)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<any>(null)

  const handleScannedData = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data)
      if (parsed.t === 'wallet' && parsed.uid) {
        setRecipient(parsed.uid)
        setShowScanner(false)
        stopCamera()
        toast.success('QR scanned! Recipient found.')
        // Auto-lookup
        setTimeout(() => lookupRecipientById(parsed.uid), 300)
        return
      }
      if (parsed.t === 'user' && parsed.uid) {
        setRecipient(parsed.uid)
        setShowScanner(false)
        stopCamera()
        toast.success('QR scanned! User found.')
        setTimeout(() => lookupRecipientById(parsed.uid), 300)
        return
      }
    } catch {
      // Not JSON, maybe it's a plain user ID or username
      if (data && data.length > 3) {
        setRecipient(data)
        setShowScanner(false)
        stopCamera()
        toast.success('QR scanned!')
        setTimeout(() => lookupRecipientById(data), 300)
        return
      }
    }
    toast.error('Invalid QR code. Expected a SkillMarket wallet QR.')
  }, [])

  const lookupRecipientById = async (id: string) => {
    try {
      const d = await api.get<{ recipient: any }>(`/api/wallet/transfer?recipient=${encodeURIComponent(id)}`)
      setPreview(d.recipient)
    } catch (e: any) {
      toast.error(e.message || 'Recipient not found')
    }
  }

  const startCamera = async () => {
    setScanning(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }
      // Start scanning loop
      scanIntervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          canvas.width = videoRef.current.videoWidth
          canvas.height = videoRef.current.videoHeight
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)
          if (code) {
            handleScannedData(code.data)
          }
        }
      }, 200)
    } catch (e: any) {
      toast.error('Camera access denied. Try uploading an image instead.')
      setScanning(false)
    }
  }

  const stopCamera = () => {
    setScanning(false)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const scanFromFile = (file: File) => {
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        handleScannedData(code.data)
      } else {
        toast.error('No QR code found in image')
      }
    }
    img.src = URL.createObjectURL(file)
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

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
                    <Button variant="outline" onClick={() => { setShowScanner(true); setTimeout(startCamera, 100) }} className="px-3">
                      <ScanLine className="h-4 w-4" />
                    </Button>
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

      {/* QR Scanner Modal */}
      <canvas ref={canvasRef} className="hidden" />
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowScanner(false); stopCamera() }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl p-6 max-w-sm w-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-primary" />
                  Scan QR Code
                </h3>
                <button onClick={() => { setShowScanner(false); stopCamera() }} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black">
                {scanning ? (
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Camera className="h-12 w-12" />
                  </div>
                )}
                {/* Scanner overlay */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-primary/60 rounded-2xl">
                      <div className="absolute top-0 left-0 h-6 w-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                      <div className="absolute top-0 right-0 h-6 w-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 h-6 w-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 h-6 w-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      <motion.div
                        animate={{ y: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-x-0 h-0.5 bg-primary shadow-lg shadow-primary/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {!scanning && (
                <Button onClick={startCamera} className="w-full rounded-2xl">
                  <Camera className="h-4 w-4 mr-2" /> Start Camera
                </Button>
              )}

              <div className="text-center text-xs text-muted-foreground">
                <span>or</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) scanFromFile(file)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full rounded-2xl">
                <ImageIcon className="h-4 w-4 mr-2" /> Upload QR Image
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Point your camera at a SkillMarket wallet QR code to instantly fill the recipient.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
