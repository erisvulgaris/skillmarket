'use client'

import { useState, useRef, useCallback, type ReactNode } from 'react'
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion'
import { ChevronDown, Loader2 } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: ReactNode
  threshold?: number
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const isPulling = useRef(false)
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

  const y = useMotionValue(0)
  const springY = useSpring(y, { stiffness: 300, damping: 30 })
  const opacity = useTransform(springY, [0, threshold], [0, 1])
  const scale = useTransform(springY, [0, threshold], [0.5, 1])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isPulling.current || isRefreshing) return
      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current
      if (diff > 0) {
        const damped = diff * 0.4
        y.set(damped)
        setPullProgress(Math.min(damped / threshold, 1))
      }
    },
    [isRefreshing, threshold, y],
  )

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current || isRefreshing) return
    isPulling.current = false
    const currentY = y.get()
    if (currentY >= threshold) {
      setIsRefreshing(true)
      y.set(threshold)
      Promise.resolve(onRefresh()).finally(() => {
        setIsRefreshing(false)
        y.set(0)
        setPullProgress(0)
      })
    } else {
      y.set(0)
      setPullProgress(0)
    }
  }, [isRefreshing, threshold, y, onRefresh])

  if (!isTouchDevice) {
    return <>{children}</>
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="flex items-center justify-center w-full"
        style={{ y: springY, position: 'absolute', top: -threshold }}
      >
        <motion.div
          className="flex flex-col items-center gap-1 text-muted-foreground"
          style={{ opacity, scale }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <motion.div
              animate={{ rotate: pullProgress >= 1 ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          )}
          <span className="text-xs font-medium">
            {isRefreshing ? 'Refreshing...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </motion.div>
      </motion.div>
      <motion.div style={{ y: springY }}>{children}</motion.div>
    </div>
  )
}
