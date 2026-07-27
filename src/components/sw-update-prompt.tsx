'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function SwUpdatePrompt() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast('New version available', {
                description: 'Refresh to get the latest features.',
                action: {
                  label: 'Reload',
                  onClick: () => {
                    newWorker.postMessage('SKIP_WAITING')
                  },
                },
                duration: Infinity,
              })
            }
          })
        })
      } catch {
        // SW registration failed silently
      }
    }

    registerSW()

    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })
  }, [])

  return null
}
