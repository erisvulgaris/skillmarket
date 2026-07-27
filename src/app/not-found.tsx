import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
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
            <circle cx="100" cy="80" r="60" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
            <path
              d="M70 55 Q100 30 130 55"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="82" cy="75" r="4" fill="currentColor" />
            <circle cx="118" cy="75" r="4" fill="currentColor" />
            <path
              d="M90 95 Q100 105 110 95"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M40 30 L50 20 M160 30 L150 20 M30 120 L20 135 M170 120 L180 135"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />
            <circle cx="45" cy="25" r="2" fill="currentColor" opacity="0.3" />
            <circle cx="155" cy="25" r="2" fill="currentColor" opacity="0.3" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <p className="text-lg text-muted-foreground">
            Page drifted away
          </p>
          <p className="text-sm text-muted-foreground/60">
            The page you are looking for doesn&apos;t exist or has been moved to another orbit.
          </p>
        </div>

        <Link
          href="/"
          className="relative flex items-center rounded-xl border border-input bg-transparent px-3 py-3 text-base shadow-xs transition-colors hover:bg-accent"
        >
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground shrink-0" />
          <span className="ml-7 text-muted-foreground text-sm">Search marketplace...</span>
        </Link>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
