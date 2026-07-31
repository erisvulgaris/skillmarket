# SkillMarket / SkillCart — Developer & Agent Instructions (`AGENTS.md`)

Welcome to the **SkillMarket** project codebase. This file establishes operational standards, architectural patterns, deployment workflows, and coding directives for AI agents and human developers maintaining this application.

---

## 1. System Architecture & Tech Stack

### Core Technologies
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS v4 + Vanilla CSS Design Tokens
- **UI Components:** Lucide Icons, Framer Motion, Radix Primitives / shadcn UI
- **Database & ORM:** SQLite (`/data/skillmarket.db`) managed via Prisma ORM
- **Authentication:** Custom JWT-in-HTTP-Only-Cookie + Session Store + bcryptjs
- **Image Processing:** `sharp` (auto-resize max 1920px & WebP 82% quality compression)
- **Payments:** Razorpay API & Webhooks (`/api/payments/razorpay`)
- **Deployment Platform:** Dokploy Swarm Instance (`152.53.111.217:3005`) behind Nginx Proxy Manager + Let's Encrypt SSL

---

## 2. Directory Structure

```
temp_skillmarket/
├── prisma/
│   └── schema.prisma        # Database schema definitions
├── public/
│   ├── logo.svg             # Brand assets & icons
│   └── uploads/             # Compressed user media & screenshots
├── src/
│   ├── app/                 # Next.js App Router endpoints & routes
│   │   ├── api/             # RESTful API handlers (auth, wallet, orders, etc.)
│   │   ├── admin/           # Admin panel view
│   │   └── page.tsx         # Main marketplace single-page application router
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI primitives (buttons, dialogs, cards)
│   │   └── views/           # Full view components (service detail, buy credits, chat, auth)
│   ├── lib/                 # Shared utilities, database connection & middleware
│   │   ├── api.ts           # Response wrappers (ok, err, validateBody, handleError)
│   │   ├── auth.ts          # Password hashing, JWT creation & session guards
│   │   ├── db.ts            # Prisma client instance & shutdown handlers
│   │   ├── razorpay.ts      # Razorpay payment gateway integration
│   │   └── rate-limit.ts    # In-memory sliding window rate limiters
│   └── scripts/             # Administrative scripts
├── start.sh                 # Docker container boot & DB sync script
├── nixpacks.toml            # Nixpacks build dependencies (openssl)
└── package.json             # Scripts & dependencies
```

---

## 3. Mandatory Development Rules

### Rule 1: API Response Contracts
All API route handlers under `src/app/api/` **MUST** use standard helpers from `@/lib/api`:
```ts
// Success:
return ok({ key: value }, 200) // { success: true, data: { ... } }

// Error:
return err('ERROR_CODE_OR_MESSAGE', 400) // { success: false, error: "..." }

// Automatic Error Handling:
return handleError(error)
```

### Rule 2: Request Body Validation
Always validate incoming request bodies using Zod schemas with `validateBody`:
```ts
const { data, error } = await validateBody(mySchema, req)
if (error) return err(error, 422)
```
*Note: `validateBody` safely clones the Request object so stream reading never fails.*

### Rule 3: Session & Auth Guards
Use server guards from `@/lib/auth`:
- `getCurrentUser()` — Returns logged-in `User` with profile/wallet or `null`.
- `requireUser()` — Throws `UNAUTHORIZED` (401) if not logged in.
- `requireAdmin()` — Throws `FORBIDDEN` (403) if user is not `admin`.

### Rule 4: Storage & Image Handling
All user-uploaded images/screenshots must pass through `src/app/api/uploads/route.ts` which uses `sharp` to convert and compress images to WebP format (`quality: 82`). Do not bypass this compression layer.

### Rule 5: Docker Container Startup
When modifying `start.sh`:
- **Never** use shell chaining operators (`&&`, `;`) inside Dokploy start commands directly.
- Execute commands line-by-line inside `start.sh` with Unix `LF` line endings.
- Do not run dev-dependency tools like `tsx` in `start.sh`; use standard compiled Node execution or API hooks.

---

## 4. Operational & Deployment Guide

### Deployment Server Details
- **Server IP:** `152.53.111.217`
- **Dokploy Dashboard:** `http://152.53.111.217:3005`
- **Dokploy API Key:** `UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl`
- **Nginx Proxy Manager:** `http://152.53.111.217:81`
- **Live Domain:** `https://skillcart.shop` (SSL forced via Let's Encrypt)

### Git & Deployment Workflow
1. Commit changes to `main` branch on repository `https://github.com/erisvulgaris/skillmarket.git`.
2. Run `python monitor_dokploy.py` from root workspace `c:\AppDev 2026\41.DrHuxon`.
3. Verify live HTTP/HTTPS status using `curl -s -i https://skillcart.shop`.
