'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
      <p className="text-base font-semibold">Something went wrong</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{error.message || 'An unexpected error occurred while loading this page.'}</p>
      <Button size="sm" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}