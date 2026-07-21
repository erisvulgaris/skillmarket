'use client'

import { useApp } from '@/lib/store'
import { BottomNav } from '@/components/bottom-nav'
import { TopBar } from '@/components/top-bar'
import { MarketplaceView } from '@/components/views/marketplace-view'
import { WalletView } from '@/components/views/wallet-view'
import { OrdersView } from '@/components/views/orders-view'
import { MessagesView } from '@/components/views/messages-view'
import { ProfileView } from '@/components/views/profile-view'
import { AdminView } from '@/components/views/admin-view'
import { ServiceDetailView } from '@/components/views/service-detail-view'
import { OrderDetailView } from '@/components/views/order-detail-view'
import { ConversationView } from '@/components/views/conversation-view'
import { SavedView } from '@/components/views/saved-view'
import { SearchView } from '@/components/views/search-view'
import { CreateServiceView } from '@/components/views/create-service-view'
import { ReferralsView } from '@/components/views/referrals-view'
import { NotificationsView } from '@/components/views/notifications-view'
import { TransferView } from '@/components/views/transfer-view'
import { BuyCreditsView } from '@/components/views/buy-credits-view'
import { SellerProfileView } from '@/components/views/seller-profile-view'
import { DisputeView } from '@/components/views/dispute-view'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'

export function AppShell() {
  const { view, user } = useApp()

  const fullScreenViews = ['service-detail', 'order-detail', 'conversation', 'transfer', 'buy-credits', 'create-service', 'seller-profile', 'dispute']
  const isFullScreen = fullScreenViews.includes(view)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isFullScreen && view !== 'admin' && <TopBar />}
      {view === 'admin' && null}

      <main className="flex-1 w-full mx-auto max-w-md pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {view === 'marketplace' && <MarketplaceView />}
            {view === 'wallet' && <WalletView />}
            {view === 'orders' && <OrdersView />}
            {view === 'messages' && <MessagesView />}
            {view === 'profile' && <ProfileView />}
            {view === 'admin' && user?.role === 'admin' && <AdminView />}
            {view === 'saved' && <SavedView />}
            {view === 'search' && <SearchView />}
            {view === 'service-detail' && <ServiceDetailView />}
            {view === 'order-detail' && <OrderDetailView />}
            {view === 'conversation' && <ConversationView />}
            {view === 'create-service' && <CreateServiceView />}
            {view === 'referrals' && <ReferralsView />}
            {view === 'notifications' && <NotificationsView />}
            {view === 'transfer' && <TransferView />}
            {view === 'buy-credits' && <BuyCreditsView />}
            {view === 'seller-profile' && <SellerProfileView />}
            {view === 'dispute' && <DisputeView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isFullScreen && <BottomNav />}

      <footer className="mt-auto text-center text-[10px] text-muted-foreground/60 py-2 pb-safe">
        SkillMarket · Powered by SkillCredits
      </footer>
    </div>
  )
}
