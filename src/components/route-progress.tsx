'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setVisible(true)
    setProgress(0)

    const slowTick = () => {
      setProgress((p) => {
        if (p >= 90) return p
        const increment = Math.random() * 10 + 5
        return Math.min(p + increment, 90)
      })
    }

    timeoutRef.current = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setVisible(false), 200)
    }, 300)

    const interval = setInterval(slowTick, 200)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      clearInterval(interval)
    }
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
