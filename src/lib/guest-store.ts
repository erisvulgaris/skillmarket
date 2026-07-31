'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CartItem {
  serviceId: string
  title: string
  price: number
  packageTier?: 'basic' | 'standard' | 'premium'
  sellerUsername: string
  imageUrl?: string
}

interface GuestState {
  wishlist: string[] // service IDs
  cart: CartItem[]
  recentlyViewed: string[] // service IDs
  savedSearches: string[]

  toggleWishlist: (serviceId: string) => void
  isInWishlist: (serviceId: string) => boolean
  addToCart: (item: CartItem) => void
  removeFromCart: (serviceId: string) => void
  clearCart: () => void
  addRecentlyViewed: (serviceId: string) => void
  addSavedSearch: (query: string) => void
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      cart: [],
      recentlyViewed: [],
      savedSearches: [],

      toggleWishlist: (serviceId) => {
        set((state) => {
          const exists = state.wishlist.includes(serviceId)
          return {
            wishlist: exists
              ? state.wishlist.filter((id) => id !== serviceId)
              : [...state.wishlist, serviceId],
          }
        })
      },

      isInWishlist: (serviceId) => get().wishlist.includes(serviceId),

      addToCart: (item) => {
        set((state) => {
          const exists = state.cart.some((c) => c.serviceId === item.serviceId)
          if (exists) return state
          return { cart: [...state.cart, item] }
        })
      },

      removeFromCart: (serviceId) => {
        set((state) => ({
          cart: state.cart.filter((c) => c.serviceId !== serviceId),
        }))
      },

      clearCart: () => set({ cart: [] }),

      addRecentlyViewed: (serviceId) => {
        set((state) => {
          const filtered = state.recentlyViewed.filter((id) => id !== serviceId)
          return { recentlyViewed: [serviceId, ...filtered].slice(0, 20) }
        })
      },

      addSavedSearch: (query) => {
        if (!query.trim()) return
        set((state) => {
          const filtered = state.savedSearches.filter((s) => s.toLowerCase() !== query.toLowerCase())
          return { savedSearches: [query.trim(), ...filtered].slice(0, 10) }
        })
      },
    }),
    {
      name: 'sm_guest_store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (null as any))),
    }
  )
)
