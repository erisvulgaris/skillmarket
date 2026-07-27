# Enterprise Admin Panel Implementation Plan

**Goal:** Build a separate enterprise-grade admin panel at `/admin/*` with commission system (Fiverr-style), Razorpay payment gateway, bulk editing, and API key management.

**Architecture:** New `/admin/*` route group with dedicated layout, 6 tab views (Dashboard, Users, Services, Commissions, Payments, Settings), all behind requireAdmin guard. Commission deducted from seller payout on escrow release. Razorpay integrated as dual-purpose: credit purchase + direct service payment.

**Tech Stack:** Next.js App Router, Prisma (SQLite), Zod, Razorpay API, shadcn/ui data tables

## Tasks

### Task 1: Database Schema
- Create: `prisma/schema.prisma` additions
- Add: CommissionConfig, RazorpayKey, RazorpayPayment, AppConfig models
- Run: prisma db push

### Task 2: Admin Layout & Navigation
- Create: `src/app/admin/layout.tsx` with sidebar
- Create: `src/app/admin/page.tsx` dashboard redirect
- Create: 6 tab view components under `src/components/admin/`

### Task 3: Commission System
- Modify: `src/lib/wallet.ts` — deduct commission on escrow release
- Create: commission calculation helpers
- Create: admin commission settings API

### Task 4: Razorpay Integration
- Create: `src/lib/razorpay.ts` — API client
- Create: `src/app/api/payments/razorpay/*` — order creation, webhook
- Create: `src/app/api/admin/settings/route.ts` — key management
- Add: encrypted storage for API keys

### Task 5: Bulk Editing
- Create: BulkSelectTable component
- Create: bulk action API endpoints
- Integrate with users and services admin views

### Task 6: Admin Settings Page
- Create: Razorpay key configuration UI
- Create: Commission rate default settings
- Create: System configuration panel
