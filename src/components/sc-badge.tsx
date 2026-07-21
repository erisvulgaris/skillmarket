'use client'

import { clsx } from 'clsx'
import { Coins } from 'lucide-react'

export function SkillCredits({ amount, className, showIcon = true, size = 'md' }: {
  amount: number
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const fmt = new Intl.NumberFormat('en-US').format(amount)
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 font-semibold tabular-nums', sizes[size], className)}>
      {showIcon && <Coins className={clsx(size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5', 'text-primary')} />}
      {fmt}
    </span>
  )
}

export function formatSC(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount)
}
