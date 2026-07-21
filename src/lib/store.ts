'use client'

import { create } from 'zustand'
import type { User, Notification } from './api-client'
import { api } from './api-client'

type View =
  | 'marketplace'
  | 'wallet'
  | 'orders'
  | 'messages'
  | 'profile'
  | 'admin'
  | 'saved'
  | 'search'
  | 'service-detail'
  | 'order-detail'
  | 'conversation'
  | 'create-service'
  | 'referrals'
  | 'notifications'
  | 'transfer'
  | 'buy-credits'
  | 'seller-profile'
  | 'dispute'
  | 'settings'
  | 'activity'
  | 'analytics'

interface AppState {
  user: User | null
  loading: boolean
  view: View
  viewParams: Record<string, any>
  notifications: Notification[]
  unreadCount: number
  toastShown: boolean

  setUser: (u: User | null) => void
  setLoading: (b: boolean) => void
  setView: (v: View, params?: Record<string, any>) => void
  refreshUser: () => Promise<void>
  loadNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

export const useApp = create<AppState>((set, get) => ({
  user: null,
  loading: true,
  view: 'marketplace',
  viewParams: {},
  notifications: [],
  unreadCount: 0,
  toastShown: false,

  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),
  setView: (v, params = {}) => set({ view: v, viewParams: params }),
  refreshUser: async () => {
    try {
      const data = await api.get<{ user: User | null }>('/api/auth/me')
      set({ user: data.user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },
  loadNotifications: async () => {
    try {
      const data = await api.get<{ items: Notification[]; unread: number }>('/api/notifications?limit=20')
      set({ notifications: data.items, unreadCount: data.unread })
    } catch {}
  },
  markNotificationRead: async (id) => {
    await api.post(`/api/notifications/${id}/read`)
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
  },
  markAllRead: async () => {
    const { notifications } = get()
    await Promise.all(
      notifications.filter((n) => !n.readAt).map((n) => api.post(`/api/notifications/${n.id}/read`))
    )
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })),
      unreadCount: 0,
    }))
  },
}))
