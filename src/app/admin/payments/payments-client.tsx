'use client'

import { useState, useMemo, Fragment } from 'react'
import { api } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search, ChevronLeft, ChevronRight, DollarSign, CheckCircle2, XCircle,
  ArrowUpDown, CreditCard, Banknote, Receipt, ChevronDown, ChevronUp,
} from 'lucide-react'
import { clsx } from 'clsx'
import { formatSC } from '@/components/sc-badge'

interface PaymentItem {
  id: string
  razorpayPaymentId: string
  orderId: string
  userId: string
  username: string
  amount: number
  amountFiat: number
  currency: string
  method: string
  status: string
  bank?: string
  vpa?: string
  fee?: number
  tax?: number
  createdAt: string
  description?: string
}

interface PaymentsClientProps {
  initialPayments: PaymentItem[]
  initialTotal: number
  initialPage: number
  initialLimit: number
}

export function PaymentsClient({ initialPayments, initialTotal, initialPage, initialLimit }: PaymentsClientProps) {
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.razorpayPaymentId.toLowerCase().includes(q) &&
            !p.orderId.toLowerCase().includes(q) &&
            !p.username.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [payments, search, statusFilter])

  const totalPages = Math.ceil(total / limit)

  const totalPayments = payments.length
  const totalCollectedInr = payments.reduce((s, p) => s + (p.amountFiat || 0), 0)
  const successfulCount = payments.filter((p) => p.status === 'captured').length
  const failedCount = payments.filter((p) => p.status === 'failed').length

  const loadPage = async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const d = await api.get<{ items: PaymentItem[]; total: number }>(`/api/admin/payments?${params}`)
      setPayments(d.items)
      setTotal(d.total)
      setPage(p)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Payments</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">{totalPayments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Collected</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">₹{totalCollectedInr.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Successful</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">{successfulCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Failed</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">{failedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['all', 'captured', 'failed', 'created', 'attempted'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); loadPage(1) }}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition',
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by payment ID, order ID, or username..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">Payment ID</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden md:table-cell">Order</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">User</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">Amount</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden sm:table-cell">Method</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Date</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No payments found
                  </td>
                </tr>
              )}
              {!loading && filtered.map((payment) => (
                <Fragment key={payment.id}>
                  <tr
                    className="hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === payment.id ? null : payment.id)}
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-mono text-xs">{payment.razorpayPaymentId.slice(0, 16)}...</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-sm font-mono text-xs text-muted-foreground">{payment.orderId.slice(0, 12)}...</span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">@{payment.username}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-sm font-semibold tabular-nums">
                        ₹{payment.amountFiat.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground capitalize">{payment.method || '-'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                        payment.status === 'captured' ? 'bg-emerald-500/10 text-emerald-600' :
                        payment.status === 'failed' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-muted-foreground hidden lg:table-cell">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {expandedId === payment.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground inline" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground inline" />
                      )}
                    </td>
                  </tr>
                  {expandedId === payment.id && (
                    <tr key={`${payment.id}-detail`} className="bg-muted/20">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">Payment ID</p>
                            <p className="font-mono">{payment.razorpayPaymentId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">Order ID</p>
                            <p className="font-mono">{payment.orderId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">Amount</p>
                            <p className="font-semibold">₹{payment.amountFiat.toLocaleString('en-IN')} / {formatSC(payment.amount)} SC</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">Currency</p>
                            <p>{payment.currency || 'INR'}</p>
                          </div>
                          {payment.bank && (
                            <div>
                              <p className="text-muted-foreground font-medium mb-0.5">Bank</p>
                              <p>{payment.bank}</p>
                            </div>
                          )}
                          {payment.vpa && (
                            <div>
                              <p className="text-muted-foreground font-medium mb-0.5">VPA</p>
                              <p className="font-mono">{payment.vpa}</p>
                            </div>
                          )}
                          {payment.fee !== undefined && (
                            <div>
                              <p className="text-muted-foreground font-medium mb-0.5">Fee</p>
                              <p>₹{payment.fee.toFixed(2)}</p>
                            </div>
                          )}
                          {payment.tax !== undefined && (
                            <div>
                              <p className="text-muted-foreground font-medium mb-0.5">Tax</p>
                              <p>₹{payment.tax.toFixed(2)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">Date</p>
                            <p>{new Date(payment.createdAt).toLocaleString()}</p>
                          </div>
                          {payment.description && (
                            <div className="col-span-full">
                              <p className="text-muted-foreground font-medium mb-0.5">Description</p>
                              <p>{payment.description}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-3 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {total} total · Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1 || loading}
              onClick={() => loadPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages || loading}
              onClick={() => loadPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

