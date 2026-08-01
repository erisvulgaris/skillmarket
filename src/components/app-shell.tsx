'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/store'
import { BottomNav } from '@/components/bottom-nav'
import { TopBar } from '@/components/top-bar'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { ViewErrorBoundary } from '@/components/error-boundary'
import { QuickAuthModal } from '@/components/quick-auth-modal'
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
import { AuthScreen } from '@/components/views/auth-screen'
import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { Lock, LogIn, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const AdminView = dynamic(() => import('@/components/views/admin-view').then(m => m.AdminView), { ssr: false })
const AnalyticsView = dynamic(() => import('@/components/views/analytics-view').then(m => m.AnalyticsView), { ssr: false })
const OnboardingTour = dynamic(() => import('@/components/onboarding-tour').then(m => m.OnboardingTour), { ssr: false })

export function AppShell() {
  const view = useApp(s => s.view)
  const user = useApp(s => s.user)
  const setView = useApp(s => s.setView)
  const { prefersReduced } = useReducedMotion()

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [pendingIntent, setPendingIntent] = useState<(() => void) | null>(null)

  useEffect(() => {
    const handleAuthReq = () => setIsAuthModalOpen(true)
    window.addEventListener('sm_require_auth', handleAuthReq)
    return () => window.removeEventListener('sm_require_auth', handleAuthReq)
  }, [])

  const fullScreenViews = ['service-detail', 'order-detail', 'conversation', 'transfer', 'buy-credits', 'create-service', 'seller-profile', 'dispute', 'settings', 'activity', 'analytics', 'cms-page', 'help', 'my-services', 'compare']
  const isFullScreen = fullScreenViews.includes(view)

  // Protected views requiring account login
  const protectedViews = ['wallet', 'orders', 'messages', 'profile', 'admin', 'create-service', 'settings', 'transfer', 'my-services', 'activity', 'analytics']
  const isProtectedView = protectedViews.includes(view) && !user

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isFullScreen && view !== 'admin' && (
        <TopBar onOpenAuth={() => setIsAuthModalOpen(true)} />
      )}

      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : -8 }}
            transition={{ duration: prefersReduced ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <ViewErrorBoundary key={view} label={view.replace(/-/g, ' ')}>
              {/* If user accesses a protected view without being logged in */}
              {isProtectedView ? (
                <ProtectedGuestPrompt onSignIn={() => setIsAuthModalOpen(true)} />
              ) : (
                <>
                  {view === 'marketplace' && <MarketplaceView onRequireAuth={(intent) => { setPendingIntent(() => intent); setIsAuthModalOpen(true) }} />}
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
                </>
              )}
            </ViewErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      {!isFullScreen && <BottomNav />}

      <footer className="mt-auto text-center text-xs text-muted-foreground/70 py-6 border-t border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-xs">S</div>
            <span className="font-bold text-sm">SkillCart</span>
            <span className="text-muted-foreground">· Public Digital Marketplace</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2026 SkillCart. All rights reserved. SkillCredits virtual currency platform.
          </p>
        </div>
      </footer>

      {/* Quick Auth Modal triggered on purchase intent or sign in */}
      <QuickAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          if (pendingIntent) {
            pendingIntent()
            setPendingIntent(null)
          }
        }}
      />

      <OnboardingTour />
      <PwaInstallPrompt />
    </div>
  )
}

function ProtectedGuestPrompt({ onSignIn }: { onSignIn: () => void }) {
  const setView = useApp(s => s.setView)
  return (
    <Card className="max-w-md mx-auto my-12 p-8 text-center space-y-5 border-emerald-500/30 bg-card/80 backdrop-blur-md shadow-2xl rounded-3xl">
      <div className="inline-flex h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-emerald-500">
        <Lock className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black tracking-tight">Account Required</h2>
        <p className="text-xs text-muted-foreground">
          Sign in or create an account to access your wallet, orders, messages, and seller features.
        </p>
      </div>

      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-left">
        <Sparkles className="h-4 w-4 flex-shrink-0" />
        <span>Get 100 free bonus SkillCredits automatically when you sign in!</span>
      </div>

      <div className="space-y-2">
        <Button onClick={onSignIn} className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-500/20">
          <LogIn className="h-4 w-4 mr-2" /> Sign In / Quick Signup
        </Button>
        <Button variant="ghost" onClick={() => setView('marketplace')} className="w-full h-10 rounded-2xl text-xs text-muted-foreground">
          Continue Browsing Storefront
        </Button>
      </div>
    </Card>
  )
}
