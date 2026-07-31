'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { AppShell } from '@/components/app-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function Home() {
  const { user, loading, refreshUser, loadNotifications, loadUnreadMessages } = useApp()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  useEffect(() => {
    refreshUser()
    const timeout = setTimeout(() => {
      setLoadingTimeout(true)
    }, 4000)
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

  // Public-first rendering: show loading skeleton briefly, then open AppShell for guests & users alike
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background">
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center animate-pulse border border-emerald-500/20">
          <span className="text-2xl font-black text-emerald-500">S</span>
        </div>
        <Skeleton className="h-4 w-36 rounded-full" />
      </div>
    )
  }

  return <AppShell />
}
