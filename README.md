# OFOS — Enterprise Multi-Tenant Food Ordering & Delivery Platform

[![Node.js 22](https://img.shields.io/badge/Node.js-v22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS 11](https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React 18](https://img.shields.io/badge/React-v18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL 17](https://img.shields.io/badge/PostgreSQL-v17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma 7](https://img.shields.io/badge/Prisma-v7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis 7](https://img.shields.io/badge/Redis-v7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS 3](https://img.shields.io/badge/TailwindCSS-v3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Docker Multi-Stage](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![CI Pipeline](https://img.shields.io/badge/GitHub_Actions-Automated_CI-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)

OFOS is a production-grade, distributed food ordering, dispatch, and financial settlement platform engineered for multi-tenant enterprise operations. It supports the full delivery lifecycle across **6 specialized role personas**, backed by ACID database transactions, real-time GPS fleet telemetry, Gemini GenAI conversational search, and double-entry ledger bookkeeping.

---

## Live Demo & Interview Showcase

The live demo contains an integrated **1-Click Recruiter Demo Bar** allowing evaluators to jump between all 6 system roles instantly without manual account registration or authentication friction.

| Role | Test Account | Credentials | Core Flow Under Test |
|---|---|---|---|
| 👤 **Customer** | `customer@ofos.com` | `Password@123` | Dynamic restaurant menus, modifier modals, cart synchronization, multi-provider checkout, live OTP delivery tracking. |
| 🏪 **Restaurant Owner** | `owner@ofos.com` | `Password@123` | Live Kitchen Kanban (`PREPARING` &rarr; `READY_FOR_PICKUP`), modifier groups, price tier controls, stock toggles. |
| 🛵 **Delivery Partner** | `driver_phase7@ofos.com` | `Password@123` | Order offer radar, real-time GPS coordinate telemetry ingestion, encrypted customer delivery OTP verification. |
| 🛰️ **Fleet Manager** | `fleet@ofos.com` | `Password@123` | City-wide dispatch dashboard, driver status monitoring, live fleet heatmap, manual order reassignments. |
| 💼 **Finance Manager** | `finance@ofos.com` | `Password@123` | Platform Gross Merchandise Value (GMV), restaurant commission reconciliation, weekly payout batch execution. |
| 🛡️ **Platform Admin** | `admin@ofos.com` | `Password@123` | Restaurant KYC & FSSAI document verification desk, dispute mediation, system-wide audit trail logs. |

---

## Architectural Blueprint

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 18 SPA)"]
        UI["Tailwind CSS Modern UI"]
        Demo["1-Click Recruiter Demo Bar"]
        AuthCtx["Auth Context (JWT + Cookies)"]
        CartCtx["Optimistic Cart Sync Engine"]
        ErrB["React Error Boundary"]
    end

    subgraph Gateway["Edge & Gateway Tier"]
        Nginx["Nginx Reverse Proxy & Static Host"]
        Helmet["Helmet Security Headers & CSP"]
        Throttle["NestJS Throttler (120 req/min)"]
        CORS["Dynamic Origin Whitelist"]
    end

    subgraph Backend["Application Tier (NestJS 11 REST API)"]
        AuthMod["Auth & RBAC Module (Passport/JWT)"]
        RestMod["Restaurant & Dynamic Menu Catalog"]
        OrderMod["Order Orchestrator & State Machine"]
        FleetMod["Fleet Radar & Telemetry Engine"]
        FinMod["Finance & Double-Entry Ledger Engine"]
        AdminMod["Governance, KYC & Audit Logging"]
        AIMod["Google GenAI 2.5 Flash Agent"]
    end

    subgraph Data["Persistence & In-Memory Tier"]
        PG[("PostgreSQL 17 Database\n(Prisma 7 ORM)")]
        Redis[("Redis 7 In-Memory Store\n(Locks, Cache & Rate Limiting)")]
    end

    subgraph Integrations["Third-Party Integrations"]
        Gemini["Google Gemini AI API"]
        Razorpay["Razorpay Payment Gateway (HMAC SHA-256)"]
    end

    UI --> Nginx
    Nginx --> Helmet
    Helmet --> Throttle
    Throttle --> CORS
    CORS --> Backend
    Backend --> PG
    Backend --> Redis
    AIMod --> Gemini
    OrderMod --> Razorpay
```

---

## Key Engineering Highlights

### 1. Atomic Multi-Table ACID Checkout Transactions
Orders are executed inside a single PostgreSQL database transaction using Prisma's transactional isolation. A single `placeOrder` call atomically verifies item availability, validates menu pricing snapshots, consumes promotional voucher quotas, creates the master `Order`, generates child `OrderItem` and `OrderItemModifier` rows, initializes an `OrderPayment` ledger row, records an initial `OrderStatusHistory` event, and wipes the user's cart in one indivisible operation.

### 2. High-Frequency GPS Telemetry & Rider Dispatch
Delivery partners broadcast high-frequency geolocation coordinates (`latitude`, `longitude`, `speed`, `heading`) to `/delivery/location`. The dispatch engine indexes the partner's latest fix, updates active assignment estimates, and allows fleet managers to visualize live driver coordinates across active delivery zones.

### 3. Cryptographically Secure Handover via AES-256 OTP
To eliminate fraudulent handovers, orders generate an encrypted 4-digit Delivery Handover OTP. The customer views the unmasked OTP on their live tracking dashboard, while the delivery partner must submit and verify the code against the encrypted record via `/delivery/orders/:id/deliver` before an order can enter the `DELIVERED` terminal state.

### 4. Double-Entry Platform Financial Ledger & Payout Batching
Every monetary event (card authorization, refund deduction, COD cash collection, platform commissions) creates an immutable `FinancialTransaction` record. The platform finance engine computes restaurant net payables (`gross_sales - commission_fee - refund_reversals`), detects duplicate payout windows using atomic database locks, and batches payouts with individual audit trail IDs.

### 5. Conversational GenAI Assistant with Structured Function Calling
Powered by **Google Gemini 2.5 Flash**, the platform includes a floating interactive AI concierge (`AIChatDrawer.tsx`). The assistant uses structured function calling tools (`searchRestaurants`, `getRestaurantMenu`, `checkDeliveryAvailability`) to parse user cravings, query real-time database menus, and return direct recommendations with 1-click navigation.

### 6. Production Hardening & Defense-in-Depth
- **Helmet:** Enforces modern HTTP security headers including Content Security Policy, X-Content-Type-Options, and Referrer-Policy.
- **Throttling:** Integrated `@nestjs/throttler` with a 120-request/minute rolling bucket to protect against brute-force and DDoS vectors.
- **Dynamic CORS:** Supports multi-domain environments (`localhost`, `*.vercel.app`, `*.onrender.com`, `*.railway.app`).
- **Sanitized Global Filter:** Catches and logs all unhandled exceptions on the server while returning sanitized RFC-compliant error envelopes to the client.
- **Dual Bearer + Cookie Auth:** Seamless cross-domain authentication resilience regardless of browser third-party cookie restrictions.

---

## Repository Structure

```
ofos/
├── backend/                      # NestJS REST API Application
│   ├── src/
│   │   ├── auth/                 # Authentication, JWT, RBAC guards
│   │   ├── restaurants/          # Restaurants, operating hours, menus, modifiers
│   │   ├── orders/               # Order state machine, checkout, tracking
│   │   ├── delivery/             # Delivery partner radar & telemetry ingestion
│   │   ├── fleet/                # Fleet manager monitoring & reassignment
│   │   ├── finance/              # GMV ledger, commissions, payout batches
│   │   ├── admin/                # Restaurant KYC, disputes, system configs
│   │   ├── ai/                   # Gemini 2.5 Flash conversational assistant
│   │   ├── common/               # Throttlers, filters, interceptors, decorators
│   │   └── prisma/               # Prisma service and database module
│   ├── prisma/
│   │   ├── schema.prisma         # PostgreSQL 17 schema (48 models)
│   │   ├── migrations/           # Applied migrations source of truth
│   │   └── seed.ts               # Production-grade seed data (all 6 roles)
│   ├── Dockerfile                # Multi-stage production container
│   └── package.json
│
├── frontend/                     # React 18 Single Page Application
│   ├── src/
│   │   ├── api/                  # Axios HTTP client with Bearer/Cookie interceptor
│   │   ├── components/
│   │   │   ├── demo/             # 1-Click Recruiter Demo Role Switcher
│   │   │   ├── common/           # Error Boundary, Navigation, Feedback Modals
│   │   │   ├── cart/             # Optimistic cart drawer, modifier popups
│   │   │   └── ai/               # Interactive Gemini Chatbot Drawer
│   │   ├── context/              # AuthContext and CartContext state engines
│   │   └── pages/
│   │       ├── customer/         # Restaurants, detail, checkout, order tracking
│   │       ├── owner/            # Live Kitchen Kanban, menu management
│   │       ├── driver/           # Delivery partner radar & handover verification
│   │       ├── fleet/            # Fleet manager overview & dispatch
│   │       ├── finance/          # Finance GMV dashboard & payout batching
│   │       └── admin/            # Partner KYC, disputes desk, system configs
│   ├── nginx.conf                # Production Nginx reverse proxy configuration
│   ├── Dockerfile                # Multi-stage build & Nginx runtime
│   └── package.json
│
├── .github/
│   └── workflows/ci.yml          # Automated CI workflow (Build & Typecheck)
├── docker-compose.yml            # Full-stack 4-container production topology
├── render.yaml                   # 1-Click Cloud Deployment Blueprint
├── DEPLOYMENT.md                 # Complete Cloud & Server Deployment Manual
└── README.md
```

---

## Local Development Quickstart

### Prerequisites
- Node.js 22+
- PostgreSQL 17 (or run via Docker)
- Redis 7 (or run via Docker)

### 1. Database Setup
Ensure PostgreSQL is running, then create the database:
```sql
CREATE DATABASE ofos_platform_dev;
```

### 2. Configure Environment
```bash
cp .env.example backend/.env
```

Ensure `DATABASE_URL` matches your local PostgreSQL credentials:
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ofos_platform_dev?schema=public"
```

### 3. Backend Setup & Seeding
```bash
cd backend
npm install
npx prisma generate --config=prisma.config.ts
npx prisma migrate dev --config=prisma.config.ts
npm run seed
npm run start:dev
```
The NestJS API will be accessible at `http://localhost:3000`.
Interactive Swagger API documentation will be available at `http://localhost:3000/api/docs`.

### 4. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The React application will be accessible at `http://localhost:5173`.

---

## Quickstart via Docker Compose

To run the entire platform (PostgreSQL 17, Redis 7, NestJS API, and React Frontend) in isolated production containers:

```bash
docker compose up -d --build
```

Run migrations and seed the database container:
```bash
docker compose exec backend npx prisma migrate deploy --config=prisma.config.ts
docker compose exec backend npm run seed
```

Access the application:
- **Web Application:** `http://localhost`
- **REST API:** `http://localhost:3000`
- **Swagger Docs:** `http://localhost:3000/api/docs`

---

## Automated Verification & Test Coverage

The platform includes an automated comprehensive End-to-End verification script (`scratch/test_master_e2e.cjs`) covering all vertical slices:
- System Healthcheck & PostgreSQL connectivity
- Authentication, Token generation, and Role switching
- Restaurant & Menu discovery with Category filtering
- Multi-item Cart creation, Modifier selection & Price calculations
- Atomic Checkout, Order creation & Razorpay payment simulation
- Restaurant Owner Kitchen Kanban state progression (`CONFIRMED` &rarr; `READY_FOR_PICKUP`)
- Delivery Partner Dispatch, Radar Acceptance & GPS location broadcasts
- Customer Handover verification via AES-256 OTP match
- Finance Ledger reconciliation, GMV analytics & Payout batch creation
- Platform Admin KYC document approval & system audit trail verification

To run the master verification suite:
```bash
node scratch/test_master_e2e.cjs
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
