'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { AuthScreen } from '@/components/views/auth-screen'
import { AppShell } from '@/components/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

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
      loadNotifications()
      loadUnreadMessages()
      const t = setInterval(() => {
        loadNotifications()
        loadUnreadMessages()
      }, 30000)
      return () => clearInterval(t)
    }
  }, [user, loadNotifications, loadUnreadMessages])

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
