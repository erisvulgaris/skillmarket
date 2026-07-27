'use client'

import dynamic from 'next/dynamic'
import { useApp } from '@/lib/store'
import { BottomNav } from '@/components/bottom-nav'
import { TopBar } from '@/components/top-bar'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { ViewErrorBoundary } from '@/components/error-boundary'
import { MarketplaceView } from '@/components/views/marketplace-view'
import { WalletView } from '@/components/views/wallet-view'
import { OrdersView } from '@/components/views/orders-view'
import { MessagesView } from '@/components/views/messages-view'
import { ProfileView } from '@/components/views/profile-view'
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
import { SettingsView } from '@/components/views/settings-view'
import { ActivityView } from '@/components/views/activity-view'
import { CmsPageView } from '@/components/views/cms-page-view'
import { HelpView } from '@/components/views/help-view'
import { MyServicesView } from '@/components/views/my-services-view'
import { CompareView } from '@/components/views/compare-view'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

const AdminView = dynamic(() => import('@/components/views/admin-view').then(m => m.AdminView), { ssr: false })
const AnalyticsView = dynamic(() => import('@/components/views/analytics-view').then(m => m.AnalyticsView), { ssr: false })
const OnboardingTour = dynamic(() => import('@/components/onboarding-tour').then(m => m.OnboardingTour), { ssr: false })

export function AppShell() {
  const view = useApp(s => s.view)
  const user = useApp(s => s.user)
  const { prefersReduced } = useReducedMotion()

  const fullScreenViews = ['service-detail', 'order-detail', 'conversation', 'transfer', 'buy-credits', 'create-service', 'seller-profile', 'dispute', 'settings', 'activity', 'analytics', 'cms-page', 'help', 'my-services', 'compare']
  const isFullScreen = fullScreenViews.includes(view)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isFullScreen && view !== 'admin' && <TopBar />}
      {view === 'admin' && null}

      <main className="flex-1 w-full mx-auto max-w-md pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : -8 }}
            transition={{ duration: prefersReduced ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ViewErrorBoundary key={view} label={view.replace(/-/g, ' ')}>
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
              {view === 'settings' && <SettingsView />}
              {view === 'activity' && <ActivityView />}
              {view === 'analytics' && <AnalyticsView />}
              {view === 'cms-page' && <CmsPageView />}
              {view === 'help' && <HelpView />}
              {view === 'my-services' && <MyServicesView />}
              {view === 'compare' && <CompareView />}
            </ViewErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {!isFullScreen && <BottomNav />}

      <footer className="mt-auto text-center text-[10px] text-muted-foreground/60 py-2 pb-safe">
        SkillMarket · Powered by SkillCredits
      </footer>

      <OnboardingTour />
      <PwaInstallPrompt />
    </div>
  )
}
