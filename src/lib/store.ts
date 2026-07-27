'use client'

import { create } from 'zustand'
import type { User, Notification } from './api-client'
import { api } from './api-client'

export type View =
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
  | 'cms-page'
  | 'help'
  | 'my-services'
  | 'compare'

type Message = {
  id: string
  senderId: string
  type: string
  content: string
  attachmentUrl: string | null
  createdAt: string
  status: string
}

let lastFetch = 0

interface AppState {
  user: User | null
  loading: boolean
  view: View
  viewParams: Record<string, any>
  notifications: Notification[]
  unreadCount: number
  unreadMessages: number
  toastShown: boolean
  messages: Record<string, Message[]>
  convoFilter: string
  convoSearch: string

  setUser: (u: User | null) => void
  setLoading: (b: boolean) => void
  setView: (v: View, params?: Record<string, any>) => void
  refreshUser: () => Promise<void>
  loadNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  loadUnreadMessages: () => Promise<void>
  markAllRead: () => Promise<void>
  setConvoFilter: (f: string) => void
  setConvoSearch: (s: string) => void
  sendMessageOptimistic: (conversationId: string, content: string, tempId: string) => Promise<void>
  invalidateUnreadOnOpen: (_conversationId: string) => void
}

export const useApp = create<AppState>((set, get) => ({
  user: null,
  loading: true,
  view: 'marketplace',
  viewParams: {},
  notifications: [],
  unreadCount: 0,
  unreadMessages: 0,
  toastShown: false,
  messages: {},
  convoFilter: 'all',
  convoSearch: '',

  setConvoFilter: (f) => set({ convoFilter: f }),
  setConvoSearch: (s) => set({ convoSearch: s }),

  setUser: (u) => set({ user: u }),
  setLoading: (b) => set({ loading: b }),
  setView: (v, params = {}) => set({ view: v, viewParams: params }),
  refreshUser: async () => {
    const now = Date.now()
    if (now - lastFetch < 30000 && get().user) return
    lastFetch = now
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
  loadUnreadMessages: async () => {
    try {
      const data = await api.get<{ conversations: any[] }>('/api/messages/conversations?limit=50')
      const unread = data.conversations.filter((c) => c.unread).length
      set({ unreadMessages: unread })
    } catch {}
  },
  sendMessageOptimistic: async (conversationId, content, tempId) => {
    const { user } = get()
    if (!user) return
    const optimistic: Message = {
      id: tempId,
      senderId: user.id,
      type: 'text',
      content,
      attachmentUrl: null,
      createdAt: new Date().toISOString(),
      status: 'sent',
    }
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] || []), optimistic],
      },
    }))
    try {
      const res = await api.post<{ message: Message }>(`/api/messages/conversations/${conversationId}`, {
        type: 'text',
        content,
      })
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] || []).map((m) =>
            m.id === tempId ? res.message : m
          ),
        },
      }))
    } catch {
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: (s.messages[conversationId] || []).filter((m) => m.id !== tempId),
        },
      }))
    }
  },
  invalidateUnreadOnOpen: (_conversationId) => {
    set((s) => ({
      unreadMessages: Math.max(0, s.unreadMessages - 1),
    }))
    get().loadUnreadMessages()
  },
}))
