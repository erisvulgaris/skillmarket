'use client'

import { useEffect, useState } from 'react'

/**
 * Hook that returns true if the user prefers reduced motion.
 * Also returns a `disableAnimations` flag and `spring` config to use with Framer Motion.
 */
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return {
    prefersReduced,
    /** Set to 0 duration when user prefers reduced motion */
    getTransitionDuration: (normal: number) => prefersReduced ? 0 : normal,
    /** Spring config with no animation when reduced */
    getSpringTransition: (base?: object) => prefersReduced ? { duration: 0 } : (base || { type: 'spring', damping: 25, stiffness: 300 }),
  }
}

/**
 * Framer Motion transition that respects prefers-reduced-motion
 */
export function motionSafeTransition(durationMs = 300): object {
  return {
    duration: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0
      : durationMs / 1000,
    ease: [0.16, 1, 0.3, 1],
  }
}
