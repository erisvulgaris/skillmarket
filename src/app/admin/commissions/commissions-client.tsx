'use client'

import { useState, useMemo } from 'react'
import { api } from '@/lib/api-client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search, DollarSign, Percent, ShoppingCart, TrendingUp, Save,
} from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { formatSC } from '@/components/sc-badge'

interface CommissionOrder {
  id: string
  orderNo: string
  serviceTitle: string
  buyerUsername: string
  sellerUsername: string
  amount: number
  commission: number
  commissionRate: number
  netToSeller: number
  status: string
  createdAt: string
}

interface CommissionsClientProps {
  orders: CommissionOrder[]
  defaultRate: number
  totalCollected: number
  avgCommissionRate: number
  ordersWithCommission: number
}

export function CommissionsClient({
  orders,
  defaultRate: initialRate,
  totalCollected,
  avgCommissionRate,
  ordersWithCommission,
}: CommissionsClientProps) {
  const [search, setSearch] = useState('')
  const [editingRate, setEditingRate] = useState(false)
  const [rateValue, setRateValue] = useState(String(initialRate))
  const [savingRate, setSavingRate] = useState(false)
  const [currentRate, setCurrentRate] = useState(initialRate)

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase()
    return orders.filter(
      (o) => o.orderNo.toLowerCase().includes(q) || o.sellerUsername.toLowerCase().includes(q)
    )
  }, [orders, search])

  const saveDefaultRate = async () => {
    const rate = parseFloat(rateValue)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return toast.error('Enter a valid rate between 0 and 100')
    }
    setSavingRate(true)
    try {
      await api.patch('/api/admin/settings', {
        key: 'commission_default_rate',
        value: String(rate),
        type: 'float',
      })
      toast.success(`Default commission rate set to ${rate}%`)
      setCurrentRate(rate)
      setEditingRate(false)
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSavingRate(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Collected</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">{formatSC(totalCollected)}</p>
              <p className="text-[10px] text-muted-foreground">Last 50 orders</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Percent className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Commission Rate</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">{avgCommissionRate}%</p>
              <p className="text-[10px] text-muted-foreground">Default rate</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orders with Commission</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">{ordersWithCommission}</p>
              <p className="text-[10px] text-muted-foreground">Out of {orders.length} orders</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-bold">Global Default Commission Rate</p>
              <p className="text-xs text-muted-foreground">Applied to all new orders unless overridden per user</p>
            </div>
          </div>
          {editingRate ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  className="h-9 w-24 text-sm text-right pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              <Button size="sm" className="h-9" onClick={saveDefaultRate} disabled={savingRate}>
                {savingRate ? '...' : <Save className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="outline" className="h-9" onClick={() => { setEditingRate(false); setRateValue(String(currentRate)) }}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold tabular-nums">{currentRate}%</span>
              <Button size="sm" variant="outline" className="h-9" onClick={() => setEditingRate(true)}>
                <TrendingUp className="h-3.5 w-3.5 mr-1" /> Change
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or seller..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground">Order #</th>
                <th className="px-3 py-3 text-left font-semibold text-xs uppercase text-muted-foreground hidden md:table-cell">Seller</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">Amount</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground">Commission</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground hidden sm:table-cell">Rate</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground hidden sm:table-cell">Net to Seller</th>
                <th className="px-3 py-3 text-right font-semibold text-xs uppercase text-muted-foreground hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-sm text-muted-foreground">
                    No commission data found
                  </td>
                </tr>
              )}
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-3">
                    <div>
                      <p className="text-sm font-semibold font-mono">{order.orderNo}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{order.serviceTitle}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">@{order.sellerUsername}</span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums">
                    {formatSC(order.amount)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={clsx(
                      'text-sm font-bold tabular-nums',
                      order.commission > 0 ? 'text-amber-600' : 'text-muted-foreground'
                    )}>
                      {formatSC(order.commission)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-muted-foreground hidden sm:table-cell tabular-nums">
                    {order.commissionRate}%
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-emerald-600 hidden sm:table-cell tabular-nums">
                    {formatSC(order.netToSeller)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-muted-foreground hidden lg:table-cell">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
