# OFOS Production Deployment Guide

This guide details the procedures for deploying the **OFOS (Online Food Ordering System)** platform into production. OFOS is built on **NestJS**, **React (Vite)**, **PostgreSQL 17**, **Prisma ORM**, and **Redis**.

---

## Architecture Topology

```
                  ┌─────────────────────────────────────────┐
                  │            End Users / Clients          │
                  │   (Desktop, Mobile Browsers, PWA)       │
                  └────────────────────┬────────────────────┘
                                       │ HTTPS / WSS
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       Reverse Proxy / Cloud CDN         │
                  │       (Nginx, Cloudflare, Vercel Edge)  │
                  └────────────┬───────────────────┬────────┘
                               │                   │
                     /api/*    │                   │ /* (Static SPA)
                               ▼                   ▼
    ┌───────────────────────────────────┐    ┌─────────────────────────────────┐
    │     OFOS NestJS REST API Engine   │    │        OFOS React 18 SPA        │
    │  - Helmet security headers        │    │  - Vite production bundle       │
    │  - Throttler rate limiting        │    │  - Recruiter 1-click Demo Bar   │
    │  - JWT Bearer + Cookie Auth       │    │  - Tailwind CSS UI              │
    │  - Swagger OpenAPI docs           │    │  - Error Boundary protection    │
    └──────────────┬────────────────────┘    └─────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL 17   │  │   Redis 7 Store  │
│  - Prisma ORM    │  │  - Cache         │
│  - Multi-tenant  │  │  - Lock Mgr      │
│  - ACID Txns     │  │  - Rate limits   │
└──────────────────┘  └──────────────────┘
```

---

## Deployment Strategy Options

| Strategy | Best For | Typical Services | Setup Time |
|---|---|---|---|
| **Option 1: Docker Compose** | VPS (DigitalOcean Droplet, AWS EC2, Hetzner) | Single multi-container VM | 5 minutes |
| **Option 2: Cloud PaaS (Render / Railway)** | Quick Live Demo & Resume Showcase | Render Blueprint (`render.yaml`) | 3 minutes |
| **Option 3: Decoupled Edge** | High-traffic global production | Vercel (Frontend) + Render (API) + Supabase (Postgres) + Upstash (Redis) | 10 minutes |

---

## Option 1: Docker Compose (VPS / Server Deployment)

### Prerequisites
- Docker Engine 24+ and Docker Compose v2+ installed
- Git
- Open inbound ports `80` (HTTP), `443` (HTTPS), and optionally `3000` (API)

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/your-username/ofos.git
cd ofos

# Create production environment
cp .env.production.example .env
```

Edit `.env` and configure your database passwords and secure secrets:
```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_db_password
POSTGRES_DB=ofos_platform_dev
JWT_ACCESS_SECRET=generate_with_openssl_rand_hex_32
JWT_REFRESH_SECRET=generate_with_openssl_rand_hex_32
ALLOWED_ORIGINS=http://your-server-ip,https://your-domain.com
```

### Step 2: Build and Start Containers
```bash
# Build and launch all 4 services in daemon mode
docker compose up -d --build

# Verify container health
docker compose ps
```

### Step 3: Run Database Migrations and Seed Demo Data
```bash
# Execute Prisma migrations inside the backend container
docker compose exec backend npx prisma migrate deploy --config=prisma.config.ts

# Populate sample restaurants, menus, driver telemetry, and demo roles
docker compose exec backend npm run seed
```

### Step 4: Verify Deployment
- **Frontend Application:** `http://your-server-ip`
- **REST API Healthcheck:** `http://your-server-ip/api/health`
- **Swagger Documentation:** `http://your-server-ip/api/docs`

---

## Option 2: Render Blueprint Deployment (Recommended for Resume Showcase)

The repository includes a ready-to-use [`render.yaml`](file:///E:/My%20Projects/ofos/render.yaml) Blueprint.

1. Fork or push this repository to GitHub.
2. Sign in to [Render.com](https://render.com).
3. Click **Blueprints** &rarr; **New Blueprint Instance**.
4. Select your `ofos` repository.
5. Render will automatically detect `render.yaml` and provision:
   - **`ofos-db`**: Managed PostgreSQL 16 database.
   - **`ofos-backend`**: NestJS Node.js Web Service.
   - **`ofos-frontend`**: React Single Page Application (Static Site).
6. Fill in optional environment variables:
   - `GEMINI_API_KEY`: For the conversational AI assistant drawer.
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: For live payment gateway testing.
7. Click **Apply**.
8. Once the build completes, run the seed script from the Render backend service shell:
   ```bash
   npm run seed
   ```

---

## Option 3: Decoupled Cloud Deployment (Vercel + Supabase / Neon)

### 1. Database (Supabase / Neon)
1. Create a PostgreSQL project on [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Copy the Connection Pooling URL (with `sslmode=require`).
3. Set `DATABASE_URL` in your backend host environment.

### 2. Backend (Render / Railway / AWS App Runner)
1. Set Root Directory to `backend`.
2. Build Command: `npm ci && npx prisma generate --config=prisma.config.ts && npm run build`
3. Start Command: `npx prisma migrate deploy --config=prisma.config.ts && node dist/main.js`
4. Set Environment Variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your-postgres-uri>`
   - `JWT_ACCESS_SECRET=<random-64-char-string>`
   - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`

### 3. Frontend (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Framework Preset: **Vite**.
4. Set Environment Variable:
   - `VITE_API_URL=https://your-backend-service.onrender.com`
5. Click **Deploy**.

---

## Production Security & Hardening Checklist

- [x] **Rate Limiting:** NestJS Throttler guard active (`120 requests/minute` per IP).
- [x] **Security Headers:** Helmet enabled with CSP and frame protections.
- [x] **Data Compression:** Gzip / Deflate enabled for both API payloads and static assets.
- [x] **CORS Isolation:** Dynamic origin validation accepting only verified client domains.
- [x] **Sanitized Errors:** Production `AllExceptionsFilter` masks database and internal stack traces.
- [x] **Container Isolation:** Multi-stage builds running on Alpine Linux as non-root user `node`.
- [x] **Zero Plaintext Secrets:** Passwords hashed with Bcrypt (salt=10); OTP encrypted via AES-256-GCM cipher.

---

## Live Demo Test Credentials

Recruiters and evaluators can instantly switch roles using the **1-Click Demo Bar** in the live UI or sign in with:

| Role | Email Identifier | Default Password | Initial View |
|---|---|---|---|
| **Customer** | `customer@ofos.com` | `Password@123` | Restaurant Discovery & Cart |
| **Restaurant Owner** | `owner@ofos.com` | `Password@123` | Kitchen Kanban & Menu Editor |
| **Delivery Partner** | `driver_phase7@ofos.com` | `Password@123` | Dispatch Radar & Handover OTP |
| **Fleet Manager** | `fleet@ofos.com` | `Password@123` | Driver Heatmap & Telemetry |
| **Finance Manager** | `finance@ofos.com` | `Password@123` | Ledger & Payout Runs |
| **Platform Admin** | `admin@ofos.com` | `Password@123` | KYC Audits & Global Config |
