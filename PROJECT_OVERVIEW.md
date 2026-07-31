# SkillMarket (`skillcart.shop`) — Detailed Project Overview

## 1. Project Mission & Summary

**SkillMarket** ([skillcart.shop](https://skillcart.shop)) is a peer-to-peer (P2P) digital service marketplace built with Next.js 16, TypeScript, Tailwind CSS v4, and Prisma ORM.

The platform enables users to register as buyers or sellers, browse digital services across creative & technical categories, purchase **SkillCredits** via Razorpay integration, and order services seamlessly. Sellers and buyers communicate in real-time order workrooms featuring message history, screenshot uploads with automatic server-side WebP image compression, deliverable submissions, and dispute resolution mechanisms.

---

## 2. Core Features & Capabilities

### User Authentication & Account Management
- Email & password authentication with bcrypt hashing.
- Role-based authorization (`user` vs `admin`).
- Optional 2-Factor Authentication (TOTP via `otpauth`).
- Profile management (avatar, display name, bio, skills, verified badges).
- User referral codes with automatic referral tracking.

### SkillCredits Virtual Currency System & Wallet
- Internal virtual currency **SkillCredits** (1 SC = 1 Unit).
- Double-entry ledger architecture (`LedgerEntry`) tracking all credit movements:
  - Credit Purchases
  - Order Escrow Locks
  - Seller Earnings
  - Transfers between users
- Interactive Wallet View with transaction history, QR code sharing, and exportable statement reports.

### Service Discovery & Marketplace Catalog
- Categorized service listings (Design, Web Development, Copywriting, Marketing, Video Editing, AI Services).
- Search, multi-criteria filtering, pricing tiers (Basic, Standard, Premium), and package comparisons.
- Interactive service creation wizard for sellers with image galleries and delivery timeline options.

### Automated Seamless Credit Top-Up & Service Fulfillment
- If a buyer clicks **"Order Now"** or **"Buy Now"** on any service or tier with zero or insufficient credits:
  - The system automatically captures the pending order parameters (`sm_pending_order`) in browser state.
  - The user is redirected to top up their SkillCredits wallet via Razorpay.
  - Upon successful payment verification, the platform **automatically executes the service purchase** and redirects the user directly into the active order workroom.

### Order Workroom & Real-Time Messaging
- Dedicated order workspace per transaction.
- Interactive chat between buyer and seller.
- Deliverable submissions, revision requests, and order completions.
- Integrated file & screenshot uploader powered by `sharp` server-side image optimization (resizes to max 1920px and converts to WebP format at 82% quality).
- Dispute escalation mechanism to platform admin.

### Administrative Control Panel
- Platform dashboard for system administrators (`/admin`).
- User management (view, edit, block, unblock, promote/demote roles).
- System settings configuration (commission rate, platform name, maintenance mode).
- **Razorpay API Key Management UI**: Dynamic configuration of Razorpay Key ID, Key Secret, and Webhook Secret directly from the admin panel without rebuilding the application.
- Dispute arbitration & transaction auditing.

---

## 3. Technology Stack & Architecture

```
[ Client Browser ]
       │
       ▼ (HTTPS / TLS 1.3)
[ Nginx Proxy Manager (Port 80/443) ]
       │
       ▼ (HTTP Forwarding to Port 8085)
[ Dokploy Traefik HTTP Router ]
       │
       ▼ (Port 3000)
[ Next.js 16 Application Container (Nixpacks Node 20) ]
       │
       ├── API Handlers (`src/app/api/...`)
       ├── Authentication & JWT (`src/lib/auth.ts`)
       ├── Image Processing Engine (`sharp`)
       ├── Razorpay Payment Gateway (`src/lib/razorpay.ts`)
       └── Prisma ORM Client (`@prisma/client`)
               │
               ▼ (File Storage)
       [ SQLite Database (`/data/skillmarket.db`) ]
```

### Database Schema Entity Relationship Overview
- **`User`**: Account identity, credentials hash, status, referral code, 2FA settings.
- **`Profile`**: Public display metadata, bio, avatar URL, skills, verification state.
- **`Wallet`**: Available balance, reserved/escrow balance, lifetime earnings/spent metrics.
- **`LedgerEntry`**: Immutable transaction log for double-entry financial accounting.
- **`Service`**: Marketed listing details, category, pricing tiers, delivery days, media gallery.
- **`Package`**: Tiered offerings per service (Basic, Standard, Premium).
- **`Order`**: Service purchase instance, current state (`pending`, `in_progress`, `delivered`, `completed`, `disputed`), escrow amount.
- **`Message`**: Real-time order workroom message with optional file attachment URL.
- **`Review`**: Rating (1-5 stars) and feedback text left by buyers upon order completion.
- **`RazorpayKey`**: Encrypted API credentials for live/test Razorpay payment processing.
