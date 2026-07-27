'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { AuthScreen } from '@/components/views/auth-screen'
import { AppShell } from '@/components/app-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'

export default function Home() {
  const { user, loading, refreshUser, loadNotifications, loadUnreadMessages } = useApp()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  useEffect(() => {
    refreshUser()
    // Fallback: if loading takes more than 5 seconds, show auth screen
    const timeout = setTimeout(() => {
      setLoadingTimeout(true)
    }, 5000)
    return () => clearTimeout(timeout)
  }, [refreshUser])

  useEffect(() => {
    if (user) {
      let mounted = true
      loadNotifications()
      loadUnreadMessages()
      const t = setInterval(() => {
        if (!mounted) return
        loadNotifications()
        loadUnreadMessages()
      }, 30000)
      return () => {
        mounted = false
        clearInterval(t)
      }
    }
  }, [user, loadNotifications, loadUnreadMessages])

  useEffect(() => {
    if (!user || !('PushManager' in window) || !('serviceWorker' in navigator)) return
    const registerPush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) return

        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          // const sub = existing.toJSON()
          // await api.post('/api/push/subscribe', sub)
          return
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        })

        const sub = subscription.toJSON()
        await api.post('/api/push/subscribe', sub)
      } catch {}
    }
    registerPush()
  }, [user])

  // If loading is stuck for too long, force show auth screen
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="text-2xl font-black text-primary">S</span>
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return <AppShell />
}
