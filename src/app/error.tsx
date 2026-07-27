'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Home, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-sm w-full text-center space-y-8">
        <div className="relative">
          <svg
            viewBox="0 0 200 160"
            className="w-48 h-40 mx-auto text-muted-foreground/30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="60" y="30" width="80" height="100" rx="12" stroke="currentColor" strokeWidth="2" />
            <rect x="70" y="50" width="60" height="6" rx="3" fill="currentColor" opacity="0.3" />
            <rect x="70" y="65" width="40" height="6" rx="3" fill="currentColor" opacity="0.2" />
            <rect x="70" y="80" width="50" height="6" rx="3" fill="currentColor" opacity="0.2" />
            <circle cx="100" cy="105" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path
              d="M95 105 L100 110 L108 100"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.5"
            />
            <path d="M40 50 L20 40 M160 50 L180 40 M40 130 L20 140 M160 130 L180 140" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">500</h1>
          <p className="text-lg text-muted-foreground">
            Something went wrong
          </p>
          <p className="text-sm text-muted-foreground/60">
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span className="block mt-1 text-xs text-muted-foreground/40 font-mono">
                Error ref: {error.digest}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
