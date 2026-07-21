# SkillMarket — Project Worklog

## Project Overview
A production-ready, mobile-first P2P digital service marketplace PWA powered by an internal virtual currency called **SkillCredits**. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite), and a socket.io mini-service for real-time messaging.

---

## Phase 2 — Round 2 (Cron Job: 2026-07-22)

### Current Project Status Assessment
Phase 1 was stable. This round focused on: QA testing, fixing bugs found during QA, adding missing infrastructure (file uploads, rate limiting, saved services API), building remaining admin UI panels, adding new features (seller profiles, dispute flow), and improving styling/polish.

### Goals for This Round
1. ✅ QA test the full app with agent-browser
2. ✅ Fix bugs found during QA
3. ✅ Add file upload endpoint
4. ✅ Add saved services API + fix SavedView
5. ✅ Wire file uploads into create-service & messaging
6. ✅ Add rate limiting middleware
7. ✅ Build remaining admin UI (disputes, reports, settings, feature-flags, CMS, broadcast)
8. ✅ Improve styling (animations, skeletons, micro-interactions)
9. ✅ Add new features (seller profile, dispute flow, report service)

### Completed Modifications

#### Bug Fixes
1. **Review submission 500 error** — `db.review.findUnique({ where: { orderId } })` failed because `orderId` is not a `@unique` field. Fixed by using `findFirst` instead.
2. **SavedView showing all services** — no dedicated saved-list endpoint existed. Created `/api/saved` endpoint and rewrote SavedView to use it.
3. **Order detail chat button** — referenced non-existent `order.conversationId`. Already fixed in Phase 1; verified working this round.

#### New API Endpoints
- `GET /api/saved` — list user's saved services with full service + seller data
- `POST /api/uploads` — file upload with validation (5MB max, type whitelist), saves to `/public/uploads/`, audit logged
- `GET /api/profiles/[username]` — public seller profile with stats (completed orders, repeat customers, active listings, lifetime earned), services, reviews
- `POST /api/orders/[id]/dispute` — file a dispute on an order (creates Dispute record, updates order status to 'disputed', notifies respondent + admins)
- `POST /api/services/[id]/report` — report a service (creates Report, notifies admins)

#### Rate Limiting (`src/lib/rate-limit.ts`)
- In-memory token bucket rate limiter with preset configurations:
  - `strictLimit` (10/min) — auth login & register
  - `transferLimit` (20/min) — wallet transfers, purchases, uploads
  - `messageLimit` (60/min) — messaging
  - `apiLimit` (120/min) — general
- Applied to: login, register, wallet transfer, message send, file upload
- Returns 429 with Retry-After header when exceeded

#### File Uploads
- Created `/api/uploads` endpoint with:
  - FormData file upload
  - 5MB size limit
  - Type whitelist (images, PDF, text, audio, video, zip)
  - Saves to `public/uploads/` with timestamped random filenames
  - Full audit logging
- Wired into CreateServiceView — replaced URL input with proper file picker (multi-image upload, preview grid, remove buttons, upload progress spinner)
- Wired into ConversationView — paperclip button now opens file picker, uploads file, sends as image/file message

#### New Frontend Views
1. **SellerProfileView** — full seller profile page with:
   - Cover + avatar with gradient
   - Verified badge, bio, location, languages, response time
   - Stats grid (completed orders, repeat buyers, active listings)
   - Lifetime earned card
   - Skills tags
   - Active listings list
   - Reviews with ratings
   - Message + View Services actions
2. **DisputeView** — dispute filing form with:
   - Reason selection (5 preset reasons)
   - Additional details textarea
   - "What happens next" info card
   - Success confirmation screen

#### Admin Panel Expansion
Rewrote AdminView with 11 tabs (was 5):
- Dashboard, Users, Wallets, Services (existing, preserved)
- **Disputes** (new) — list disputes, resolve for claimant/respondent
- **Reports** (new) — list reports, resolve/dismiss
- **Flags** (new) — feature flag toggles with animated switches
- **Settings** (new) — editable platform settings with inline save
- **CMS** (new) — list CMS pages with publish status
- **Broadcast** (new) — send platform-wide notifications (info/warning/maintenance types)
- Audit (existing, preserved)

#### Styling Improvements
- Added 8 new CSS animations: staggerIn, skeleton-shimmer, press-card, fab-shadow, gradient-text, lift-on-hover, online-dot pulse, slideUp, fadeScale, ticker
- Staggered list animations on marketplace service grid
- Number ticker animation on wallet balance
- Enhanced wallet balance card: larger balance number, reserved escrow indicator, uppercase tracking label
- Bottom nav redesign: floating center "+" (create service) FAB with gradient + shadow, animated active dot with layoutId
- Recently viewed section on marketplace (localStorage tracked)
- Improved empty states with icons
- Service detail: report service link, seller profile link

### Verification Results
- ✅ Lint passes (0 errors)
- ✅ Dev server running on port 3000
- ✅ Chat service running on port 3003
- ✅ Full order lifecycle tested: pending → accepted → delivered → completed → reviewed (201)
- ✅ File upload API works (image saved to /uploads/, audit logged)
- ✅ Seller profile view renders with stats, services, reviews
- ✅ Dispute flow: file dispute → order marked disputed → admin notified
- ✅ Saved services: save → appears in saved list → remove works
- ✅ Rate limiting applied to sensitive endpoints
- ✅ All 11 admin tabs functional (dashboard, users, wallets, services, disputes, reports, flags, settings, cms, broadcast, audit)
- ✅ Marketplace recently viewed section works
- ✅ Bottom nav floating create button works

### Bugs Found & Fixed This Round
1. Review `findUnique` on non-unique field → changed to `findFirst`
2. SavedView had no API → created `/api/saved` endpoint
3. No file upload support → created `/api/uploads` + wired into create-service and messaging

---

## Phase 1 — Core Foundation (Previous Round)

### Architecture
- Single-page app at `/` with client-side view routing via Zustand store
- All backend logic via `/api/*` REST routes
- Real-time messaging via socket.io mini-service on port 3003
- Prisma + SQLite with 33 fully-normalized models (portable to PostgreSQL)
- Double-entry ledger wallet engine with atomic transactions
- PWA: manifest.json + service worker

### Database (Prisma schema)
Models: User, Profile, Session, Device, Wallet, WalletTransaction, LedgerEntry,
CreditPurchase, Transfer, Category, Service, SavedService, Order, OrderStatusHistory,
OrderAttachment, OrderActivity, Conversation, ConversationMember, Message, Review,
Notification, Announcement, AnnouncementAck, Report, Dispute, DisputeEvidence,
SupportTicket, SupportTicketNote, ReferralReward, AuditLog, FeatureFlag, Setting, CmsPage.

### Auth
- Session-based with httpOnly JWT cookies (jose) + DB session records
- bcryptjs password + transaction PIN hashing
- Referral code auto-generation, referral reward on signup (50 SC)

### Wallet Engine (`src/lib/wallet.ts`)
- Double-entry bookkeeping (debit/credit entries, conservation enforced)
- Atomic P2P transfers with PIN verification, frozen-wallet checks
- Escrow flow for orders (available → reserved → released/refunded)
- Credit purchases with idempotency keys
- Admin adjustments with audit logging
- Referral rewards

### Seed Data
Run `bun run prisma/seed.ts` — creates admin, 5 sellers, 1 buyer, 8 services, categories, feature flags, settings, CMS pages.
- Admin: admin@skillmarket.app / admin12345 (PIN 1234)
- Buyer: buyer@example.com / password123 (PIN 1234)
- Seller: maya@example.com / password123 (PIN 1234)

---

## Unresolved Issues / Risks / Next Steps
1. **2FA** — fields exist in schema but not implemented in auth flow.
2. **Email notifications** — only in-app notifications; no email transport.
3. **Fraud detection** — dashboard shows counts but no automated rules engine.
4. **Tests** — no automated tests written yet (wallet integrity, transfers, escrow).
5. **Voice notes** — UI for voice messages not implemented (file upload supports audio but no recorder UI).
6. **QR scanner** — QR generation works but scanning/importing QR codes to initiate transfers not implemented.
7. **PostgreSQL migration** — schema is portable; update `datasource` provider when ready.
8. **Admin: order detail view** — admin can't view order timelines from admin panel (only from user side).
9. **Admin: wallet adjust UI** — the adjust endpoint exists but the UI input for credit adjustments is not in the wallets tab.
10. **Search filters** — categoryId filter from marketplace doesn't apply in search view.

### Priority Recommendations for Next Phase
- Implement 2FA flow (TOTP with qr enrollment)
- Add automated tests for wallet integrity (double-entry balance conservation)
- Build QR scanner for receiving transfers
- Add voice note recorder in messaging
- Wire admin wallet credit adjustment UI
- Add email notification transport (Resend/SendGrid)
- Implement fraud detection rules (velocity checks, multiple devices)
