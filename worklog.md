# SkillMarket — Project Worklog

## Project Overview
A production-ready, mobile-first P2P digital service marketplace PWA powered by an internal virtual currency called **SkillCredits**. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), and a socket.io mini-service for real-time messaging.

## Current Project Status
**Phase 1 — Core Foundation Complete**

### Architecture
- Single-page app at `/` (per constraints) with client-side view routing via Zustand store
- All backend logic via `/api/*` REST routes
- Real-time messaging via socket.io mini-service on port 3003 (started separately)
- Prisma + SQLite with a fully normalized schema (30+ models) ready for PostgreSQL migration
- Double-entry ledger wallet engine with atomic transactions
- PWA: manifest.json + service worker

### Database (Prisma schema)
Models: User, Profile, Session, Device, Wallet, WalletTransaction, LedgerEntry,
CreditPurchase, Transfer, Category, Service, SavedService, Order, OrderStatusHistory,
OrderAttachment, OrderActivity, Conversation, ConversationMember, Message, Review,
Notification, Announcement, AnnouncementAck, Report, Dispute, DisputeEvidence,
SupportTicket, SupportTicketNote, ReferralReward, AuditLog, FeatureFlag, Setting, CmsPage.

All models use cuid() PKs, createdAt/updatedAt, and soft-delete where appropriate.

### Auth
- Session-based with httpOnly JWT cookies (jose) + DB session records
- bcryptjs password + transaction PIN hashing
- Referral code auto-generation, referral reward on signup (50 SC)

### Wallet Engine (`src/lib/wallet.ts`)
- Double-entry ledger (debit/credit entries, conservation enforced)
- Atomic transfers with balance checks, frozen-wallet checks, PIN verification
- Escrow flow for orders (available → reserved → released/refunded)
- Credit purchases with idempotency keys
- Admin adjustments with audit logging
- Referral rewards

### API Routes
- Auth: register, login, logout, me
- Wallet: balance, transactions, buy, transfer (with recipient preview), QR, export CSV
- Marketplace: categories, services (sort/filter/pagination), search (users/services/categories)
- Services: detail, create, reviews, save/unsave
- Orders: list/create, detail + actions (accept, deliver, complete, cancel)
- Messages: conversations list, conversation messages + send
- Notifications: list, mark read
- Referrals: stats + rewards
- QR: dynamic generation (user/service/wallet)
- Admin: dashboard, users (view/suspend/verify/ban/reset-pin), wallets (view/freeze/adjust),
  services (feature/hide/remove), orders, audit, feature-flags, settings, notifications (broadcast),
  reports, disputes, cms

### Frontend Views (all mobile-first, premium 2026 UI)
- AuthScreen (login/register with glassmorphism, animated gradients)
- MarketplaceView (hero, categories, featured carousel, trending tabs, service grid)
- WalletView (gradient balance card, quick actions, lifetime stats, filterable transactions)
- ServiceDetailView (image header, seller card, description, tags, FAQs, reviews, sticky CTA)
- OrdersView (tabs: all/buying/selling, status badges)
- OrderDetailView (timeline, status banner, accept/deliver/complete/cancel actions, review form)
- MessagesView (conversation list)
- ConversationView (real-time socket.io chat, typing indicator, read receipts, optimistic UI)
- ProfileView (QR code, stats, menu, admin entry)
- AdminView (dashboard with charts, user/wallet/service/audit management)
- CreateServiceView (full form with tags, skills, images, FAQs)
- TransferView (recipient lookup + verification, PIN, success receipt; receive via QR)
- BuyCreditsView (6 packages, bonus credits, simulated gateway)
- ReferralsView (code, share, stats, referral list, how-it-works)
- NotificationsView (typed icons, mark read/all)
- SavedView, SearchView (global search with recent searches)

### Mini Services
- `mini-services/chat-service/` — socket.io on port 3003, presence, typing, real-time delivery

### Seed Data
Run `bun run prisma/seed.ts` — creates admin, 5 sellers, 1 buyer, 8 services, categories, feature flags, settings, CMS pages.
- Admin: admin@skillmarket.app / admin12345 (PIN 1234)
- Buyer: buyer@example.com / password123 (PIN 1234)
- Seller: maya@example.com / password123 (PIN 1234)

## Verification Results
- ✅ Lint passes (0 errors)
- ✅ Dev server starts on port 3000
- ✅ Chat service starts on port 3003
- ✅ Database seeded (admin, 5 sellers, 1 buyer, 8 services, categories, flags, settings, CMS)
- ✅ Auth screen renders with glassmorphism + animated gradients
- ✅ Login as buyer works (5,000 SC balance shown)
- ✅ Marketplace renders: hero, categories, featured carousel, trending tabs, service grid
- ✅ Service detail renders: image header, seller card, description, FAQs, sticky CTA
- ✅ Order creation works (escrow deducted, reserved balance increased)
- ✅ Order detail renders with timeline, status banner, action buttons
- ✅ Wallet view: gradient balance card, lifetime stats, transaction list with filters
- ✅ Wallet transfer API works (recipient preview + PIN-verified transfer with receipt)
- ✅ Double-entry ledger balances (available + reserved = total)
- ✅ Admin dashboard: 7 users, 105k credits sold, 8 services, 1 order, daily charts, activity feed
- ✅ Admin user/wallet/service/audit management tabs functional

### Bugs Found & Fixed During Verification
1. **Nested Prisma transaction timeout** — `escrowForOrder` opened its own `$transaction` inside the order creation transaction, causing a 5s timeout. Fixed by inlining escrow logic into the order transaction.
2. **Order detail crash** — the `/api/orders/:id` query didn't include the `seller` relation, causing `counterparty.username` to throw. Fixed by adding `seller: { include: { profile: true } }`.
3. **Missing auth-screen.tsx** — initial write failed because the views directory didn't exist. Re-created.
4. **Transaction timeout** — increased Prisma transaction timeout to 15s as a safety net.
5. **Order-detail chat button** — referenced non-existent `order.conversationId`. Fixed to look up conversation by orderId.

## Unresolved Issues / Risks / Next Steps
1. **No file upload endpoint yet** — image URLs must be pasted manually in create-service; should add `/api/uploads` with local storage.
2. **Saved services** — no dedicated saved-list API endpoint; SavedView is approximated.
3. **Voice notes / file messages** — UI buttons exist but upload not wired.
4. **2FA** — fields exist in schema but not implemented in flow.
5. **Email notifications** — only in-app notifications; no email transport.
6. **Rate limiting** — not yet implemented on API routes.
7. **Fraud detection** — dashboard shows counts but no automated rules engine.
8. **Admin: disputes/reports/CMS/feature-flags/settings UI** — API exists but only dashboard/users/wallets/services/audit have UI.
9. **Tests** — no automated tests written yet.
10. **PostgreSQL migration** — schema is portable; update `datasource` provider when ready.

### Priority Recommendations for Next Phase
- Add file upload endpoint + wire into create-service & messaging
- Implement remaining admin UI (disputes, reports, CMS, settings, feature-flags panels)
- Add rate limiting middleware
- Add automated tests for wallet integrity (transfers, escrow, double-entry balance)
- Polish: skeleton loading states on all views, pull-to-refresh, optimistic updates
