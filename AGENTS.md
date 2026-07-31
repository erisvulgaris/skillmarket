# SkillMarket / SkillCart — Developer & Agent Instructions (`AGENTS.md`)

Welcome to the **SkillMarket** project workspace. This file establishes operational standards, architectural patterns, deployment workflows, and coding directives for AI agents and human developers maintaining this application.

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
41.DrHuxon/
├── temp_skillmarket/        # Next.js Application Source Code
│   ├── prisma/              # Prisma DB schemas
│   ├── public/              # Static assets & compressed uploads
│   ├── src/                 # Next.js App Router code & API handlers
│   ├── start.sh             # Container startup script
│   └── package.json         # Project dependencies
├── dokploy_agent_guide.md   # Dokploy infrastructure & API reference
├── monitor_dokploy.py       # Automated deployment trigger & status monitor
├── ssh_run.py               # Remote server SSH management tool
├── AGENTS.md                # AI Agent guidelines (this file)
├── PROJECT_OVERVIEW.md      # Comprehensive architecture & features overview
└── PROJECT_STATE.md         # Live deployment state & operational status
```

---

## 3. Mandatory Development Rules

### Rule 1: API Response Contracts
All API route handlers under `src/app/api/` **MUST** use standard helpers from `@/lib/api`:
```ts
// Success:
return ok({ key: value }, 200)

// Error:
return err('ERROR_CODE_OR_MESSAGE', 400)

// Automatic Error Handling:
return handleError(error)
```

### Rule 2: Request Body Validation
Always validate incoming request bodies using Zod schemas with `validateBody`:
```ts
const { data, error } = await validateBody(mySchema, req)
if (error) return err(error, 422)
```

### Rule 3: Session & Auth Guards
Use server guards from `@/lib/auth`:
- `getCurrentUser()` — Returns logged-in `User` or `null`.
- `requireUser()` — Throws `UNAUTHORIZED` (401) if not logged in.
- `requireAdmin()` — Throws `FORBIDDEN` (403) if user is not `admin`.

### Rule 4: Docker Container Startup
When modifying `start.sh`:
- **Never** use shell chaining operators (`&&`, `;`) directly in Dokploy Start Command fields.
- Keep `start.sh` clean and executable with Unix `LF` line endings.
- Do not run dev-dependency tools like `tsx` inside `start.sh`.

---

## 4. Operational & Deployment Guide

### Deployment Server Details
- **Server IP:** `152.53.111.217`
- **Dokploy Dashboard:** `http://152.53.111.217:3005`
- **Dokploy API Key:** `UIoOLzCywHozJQVxSkRSkCGxIgETYcxjfjGJBohBeolAVXaONCWvJtcLFVrInDxl`
- **Nginx Proxy Manager:** `http://152.53.111.217:81`
- **Live Domain:** `https://skillcart.shop` (SSL forced via Let's Encrypt)
