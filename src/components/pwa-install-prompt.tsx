'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      try {
        if (!localStorage.getItem('sm_pwa_dismissed')) {
          setVisible(true)
          triggerRef.current = document.activeElement as HTMLElement
        }
      } catch {}
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Focus trap for keyboard users
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible || !containerRef.current) return
    if (e.key === 'Escape') {
      dismiss()
      return
    }
    if (e.key === 'Tab') {
      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
  }, [visible])

  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown)
      // Focus the install button
      setTimeout(() => {
        const btn = containerRef.current?.querySelector<HTMLElement>('button')
        btn?.focus()
      }, 100)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Return focus to trigger element
      if (triggerRef.current) {
        triggerRef.current.focus()
        triggerRef.current = null
      }
    }
  }, [visible, handleKeyDown])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem('sm_pwa_dismissed', 'true') } catch {}
  }

  return (
    <AnimatePresence>
      {visible && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 inset-x-4 z-50 max-w-md mx-auto"
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Install app prompt"
        >
          <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Install SkillMarket</p>
              <p className="text-xs text-muted-foreground">Add to home screen for a better experience</p>
            </div>
            <button onClick={install} aria-label="Install app" className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition">
              Install
            </button>
            <button onClick={dismiss} aria-label="Dismiss install prompt" className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
