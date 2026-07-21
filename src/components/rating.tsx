'use client'

import { Star } from 'lucide-react'
import { clsx } from 'clsx'

export function Rating({ value, count, size = 'sm', showCount = true }: {
  value: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}) {
  const sizes = { sm: 'h-3 w-3', md: 'h-3.5 w-3.5', lg: 'h-4 w-4' }
  const text = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
  return (
    <span className="inline-flex items-center gap-1">
      <Star className={clsx(sizes[size], value >= 4 ? 'fill-amber-400 text-amber-400' : value >= 3 ? 'fill-amber-300 text-amber-300' : 'fill-muted-foreground text-muted-foreground')} />
      <span className={clsx('font-semibold tabular-nums', text[size])}>
        {value > 0 ? value.toFixed(1) : 'New'}
      </span>
      {showCount && count !== undefined && count > 0 && (
        <span className={clsx('text-muted-foreground', text[size])}>({count})</span>
      )}
    </span>
  )
}
