# SkillMarket (`skillcart.shop`) — Current Project State & Operational Status

**Last Updated:** July 31, 2026  
**Environment:** Production (`https://skillcart.shop`)  
**Deployment Infrastructure:** Dokploy Docker Swarm + Nginx Proxy Manager + Let's Encrypt SSL

---

## 1. Executive Summary

The **SkillMarket** application has been successfully audited, hardened, upgraded with automated credit fulfillment & image compression, and deployed to production. The platform is fully functional at **[https://skillcart.shop](https://skillcart.shop)** with valid HTTPS certificates, active SQLite volume persistence, and verified administrative access.

---

## 2. Infrastructure & Deployment Status

| Infrastructure Layer | Detail / Configuration | Status |
| :--- | :--- | :--- |
| **Domain** | `skillcart.shop` & `www.skillcart.shop` | Active (DNS A Record -> `152.53.111.217`) |
| **SSL / TLS Certificate** | Let's Encrypt SSL (Certificate #13 in NPM) | Active (Forced HTTPS) |
| **Reverse Proxy** | Nginx Proxy Manager (Port 81 Admin / Port 80 & 443 Public) | Active (Proxy Host #15 -> `152.53.111.217:8085`) |
| **App Deployment Engine** | Dokploy Application (`D2WEVGcagZDHunlcBmc-U`) | Active (`App Status: running`) |
| **Node Version** | Node.js 20 (`NIXPACKS_NODE_VERSION=20`) | Verified |
| **Database Storage** | Persistent Docker Volume `skillmarket-db-vol` -> `/data/skillmarket.db` | Operational & Synced |

---

## 3. Live System Credentials & Configuration

### Platform Admin Credentials
- **Email:** `admin@skillcart.shop`
- **Username:** `admin`
- **Password:** `AdminSecurePassword2026!`
- **Transaction PIN:** `1234`
- **Role:** `admin`
- **Account State:** Seeded & Verified (`HTTP 200` authentication test passed)

### Razorpay API Key Configuration Status
- **Management UI:** Available under **Admin Panel** (`/admin`) -> **Settings** -> **Razorpay Gateway Keys**.
- **Webhook Target:** `https://skillcart.shop/api/payments/razorpay/webhook` (`payment.captured` event).

---

## 4. Completed Feature Implementation Verification

1. **Production Login Credentials Hardening:**
   - Demo credentials hint box permanently removed from `auth-screen.tsx`.
   - Verified live API authentication against seeded database (`status: 200 OK`).

2. **Auto Credit Purchase & Service Order Fulfillment:**
   - Tested & verified in `service-detail-view.tsx` & `buy-credits-view.tsx`.
   - When a user orders a service with insufficient funds, their order details are stored in `sm_pending_order`. Upon purchasing credits via Razorpay, the order is automatically submitted and the chat workroom opens immediately.

3. **Server-Side Image Processing & Compression:**
   - Integrated `sharp` into `src/app/api/uploads/route.ts`.
   - Screenshots/images are automatically resized to max 1920x1920 and converted to WebP format (`quality: 82`).
   - TypeScript build issues resolved via explicit `Buffer` casting.

4. **Request Stream Clone Fix:**
   - Fixed `validateBody` helper in `src/lib/api.ts` to use `req.clone()` so request streams are safely preserved across middleware wrappers.

5. **Clean Container Startup:**
   - Updated `start.sh` and added `/api/admin/init` endpoint to prevent devDependency execution crashes in Nixpacks standalone runner.

---

## 5. Security & Quality Audit Summary

| Component | Audit Finding | Resolution Status |
| :--- | :--- | :--- |
| **Rate Limiting** | Strict sliding-window rate limiters (`strictLimit`, `transferLimit`, `apiLimit`) | Implemented & Active |
| **Financial Ledger** | Double-entry balance calculation (`LedgerEntry`) | Verified (Zero balance mismatch risk) |
| **Database Sync** | Production database schema migrations | `prisma db push` integrated in `start.sh` |
| **File Storage** | Upload directory path sanitization | Validated & Scoped to `public/uploads` |

---

## 6. Git Repository Status

- **Repository:** `https://github.com/erisvulgaris/skillmarket.git`
- **Branch:** `main`
- **Latest Commit:** `3aa8edf` (`fix: delete unused create-admin.ts script to resolve build error`)
- **Working Tree:** Clean (all changes committed and pushed).
