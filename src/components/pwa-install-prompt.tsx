'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Check if user hasn't dismissed before
      if (!localStorage.getItem('sm_pwa_dismissed')) {
        setVisible(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

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
    localStorage.setItem('sm_pwa_dismissed', 'true')
  }

  return (
    <AnimatePresence>
      {visible && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 inset-x-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-card border border-border/40 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Install SkillMarket</p>
              <p className="text-xs text-muted-foreground">Add to home screen for a better experience</p>
            </div>
            <button onClick={install} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold active:scale-95 transition">
              Install
            </button>
            <button onClick={dismiss} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
