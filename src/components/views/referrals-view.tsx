'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api-client'
import { useApp } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Gift, Copy, Users, Check, Share2 } from 'lucide-react'
import { SkillCredits, formatSC } from '@/components/sc-badge'
import { toast } from 'sonner'

export function ReferralsView() {
  const { setView, user } = useApp()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const d = await api.get<any>('/api/referrals')
      setData(d)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '')
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const share = async () => {
    const link = `${window.location.origin}/register?ref=${user?.referralCode}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join SkillMarket', text: `Use my referral code ${user?.referralCode} and get 50 SC bonus!`, url: link })
      } catch {}
    } else {
      navigator.clipboard.writeText(link)
      toast.success('Referral link copied!')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/40 pt-safe">
        <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
          <button onClick={() => setView('profile')} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-accent active:scale-90 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Refer & Earn</h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4 pb-24">
        {/* Hero */}
        <Card className="p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent -z-10" />
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 items-center justify-center shadow-xl shadow-primary/20 mb-3">
            <Gift className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Give 50 SC, Get 50 SC</h2>
          <p className="text-sm text-muted-foreground mt-1">Invite friends and you both earn SkillCredits when they sign up.</p>

          <div className="mt-4 p-3 rounded-xl bg-background border border-border flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Your code</p>
              <p className="text-lg font-black tracking-wider text-primary">{user?.referralCode}</p>
            </div>
            <Button onClick={copyCode} variant="outline" className="rounded-xl">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <Button onClick={share} className="w-full rounded-2xl mt-3">
            <Share2 className="h-4 w-4 mr-2" /> Share Invite Link
          </Button>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{data?.count || 0}</p>
            <p className="text-xs text-muted-foreground">Friends referred</p>
          </Card>
          <Card className="p-4 text-center">
            <Gift className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{formatSC(data?.totalEarned || 0)}</p>
            <p className="text-xs text-muted-foreground">SC earned</p>
          </Card>
        </div>

        {/* Referral list */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold">Your referrals</h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
          ) : data?.referrals?.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No referrals yet. Share your code to start earning!</p>
            </Card>
          ) : (
            data?.referrals?.map((r: any) => (
              <Card key={r.id} className="p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                  {r.profile?.avatarUrl && <img src={r.profile.avatarUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">@{r.username}</p>
                  <p className="text-xs text-muted-foreground">Joined {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* How it works */}
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-bold">How it works</h3>
          <Step n={1} title="Share your code" desc="Send your referral code or link to friends." />
          <Step n={2} title="They sign up" desc="Your friend creates an account using your code." />
          <Step n={3} title="You both earn" desc="You get 50 SC and they get 50 SC instantly." />
        </Card>
      </div>
    </div>
  )
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
