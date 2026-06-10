# Quick Bites — Backend Engineering Reference

> **Version:** 1.0 | **Status:** Draft — Internal Development Use
> **Stack:** Node.js · Express · TypeScript · Prisma ORM · MySQL
> **Base URL:** `https://api.quickbites.in/v1`
> **Classification:** Confidential — Internal Use Only

---

## Table of Contents

1. [Project Folder Structure](#1-project-folder-structure)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Prisma & Database Setup](#3-prisma--database-setup)
4. [Authentication Strategy](#4-authentication-strategy)
5. [Global Conventions](#5-global-conventions)
6. [Models (Prisma Schema Reference)](#6-models-prisma-schema-reference)
7. [Module Summary — Routes, Controllers & Services](#7-module-summary--routes-controllers--services)
8. [API Routes Reference](#8-api-routes-reference)
   - [Module 01 — Auth & Sessions](#module-01--auth--sessions)
   - [Module 02 — Customer Profile & Addresses](#module-02--customer-profile--addresses)
   - [Module 03 — Restaurant Discovery & Search](#module-03--restaurant-discovery--search)
   - [Module 04 — Menu Browsing](#module-04--menu-browsing)
   - [Module 05 — Cart](#module-05--cart)
   - [Module 06 — Checkout & Orders](#module-06--checkout--orders)
   - [Module 07 — Real-Time Order Tracking](#module-07--real-time-order-tracking)
   - [Module 08 — Order History](#module-08--order-history)
   - [Module 09 — Reviews & Ratings](#module-09--reviews--ratings)
   - [Module 10 — Promotions, Coupons & Loyalty](#module-10--promotions-coupons--loyalty)
   - [Module 11 — Payments & Refunds](#module-11--payments--refunds)
   - [Module 12 — Restaurant Portal: Onboarding & Profile](#module-12--restaurant-portal-onboarding--profile)
   - [Module 13 — Restaurant Portal: Menu Management](#module-13--restaurant-portal-menu-management)
   - [Module 14 — Restaurant Portal: Order Management](#module-14--restaurant-portal-order-management)
   - [Module 15 — Restaurant Portal: Analytics & Finance](#module-15--restaurant-portal-analytics--finance)
   - [Module 16 — Delivery Partner Portal](#module-16--delivery-partner-portal)
   - [Module 17 — Fleet Manager](#module-17--fleet-manager)
   - [Module 18 — Admin: User & Restaurant Management](#module-18--admin-user--restaurant-management)
   - [Module 19 — Admin: Dispute & Refund Management](#module-19--admin-dispute--refund-management)
   - [Module 20 — Admin: Analytics & Config](#module-20--admin-analytics--config)
   - [Module 21 — Notifications](#module-21--notifications)
9. [WebSocket Events Reference](#9-websocket-events-reference)
10. [Middleware Reference](#10-middleware-reference)
11. [Error Codes Reference](#11-error-codes-reference)
12. [DB Table → Module Mapping](#12-db-table--module-mapping)

---

## 1. Project Folder Structure

```
quick-bites-backend/
├── prisma/
│   ├── schema.prisma                 # Prisma data model (all tables)
│   ├── migrations/                   # Auto-generated migration files
│   └── seed.ts                       # DB seed script (admin user, cuisine tags, etc.)
│
├── src/
│   ├── index.ts                      # App entry point — Express + Socket.IO bootstrap
│   ├── app.ts                        # Express app factory (middleware, routers, error handler)
│   │
│   ├── config/
│   │   ├── env.ts                    # Validated env vars via zod / dotenv
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── redis.ts                  # Redis client singleton (ioredis)
│   │   ├── elasticsearch.ts          # Elasticsearch client singleton
│   │   ├── rabbitmq.ts               # RabbitMQ connection + channel factory
│   │   ├── s3.ts                     # AWS S3 client config
│   │   └── socket.ts                 # Socket.IO server initialization
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validator.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── customer/
│   │   │   ├── customer.routes.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── customer.validator.ts
│   │   │   └── customer.types.ts
│   │   │
│   │   ├── restaurant/
│   │   │   ├── restaurant.routes.ts
│   │   │   ├── restaurant.controller.ts
│   │   │   ├── restaurant.service.ts
│   │   │   ├── restaurant.validator.ts
│   │   │   └── restaurant.types.ts
│   │   │
│   │   ├── search/
│   │   │   ├── search.routes.ts
│   │   │   ├── search.controller.ts
│   │   │   ├── search.service.ts
│   │   │   └── search.types.ts
│   │   │
│   │   ├── menu/
│   │   │   ├── menu.routes.ts
│   │   │   ├── menu.controller.ts
│   │   │   ├── menu.service.ts
│   │   │   ├── menu.validator.ts
│   │   │   └── menu.types.ts
│   │   │
│   │   ├── cart/
│   │   │   ├── cart.routes.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── cart.validator.ts
│   │   │   └── cart.types.ts
│   │   │
│   │   ├── order/
│   │   │   ├── order.routes.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── order.service.ts
│   │   │   ├── order.validator.ts
│   │   │   └── order.types.ts
│   │   │
│   │   ├── tracking/
│   │   │   ├── tracking.routes.ts
│   │   │   ├── tracking.controller.ts
│   │   │   ├── tracking.service.ts
│   │   │   └── tracking.types.ts
│   │   │
│   │   ├── review/
│   │   │   ├── review.routes.ts
│   │   │   ├── review.controller.ts
│   │   │   ├── review.service.ts
│   │   │   ├── review.validator.ts
│   │   │   └── review.types.ts
│   │   │
│   │   ├── promotion/
│   │   │   ├── promotion.routes.ts
│   │   │   ├── promotion.controller.ts
│   │   │   ├── promotion.service.ts
│   │   │   ├── promotion.validator.ts
│   │   │   └── promotion.types.ts
│   │   │
│   │   ├── loyalty/
│   │   │   ├── loyalty.routes.ts
│   │   │   ├── loyalty.controller.ts
│   │   │   ├── loyalty.service.ts
│   │   │   └── loyalty.types.ts
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.routes.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── payment.validator.ts
│   │   │   └── payment.types.ts
│   │   │
│   │   ├── restaurant-portal/
│   │   │   ├── profile/
│   │   │   │   ├── rp-profile.routes.ts
│   │   │   │   ├── rp-profile.controller.ts
│   │   │   │   ├── rp-profile.service.ts
│   │   │   │   └── rp-profile.validator.ts
│   │   │   ├── menu/
│   │   │   │   ├── rp-menu.routes.ts
│   │   │   │   ├── rp-menu.controller.ts
│   │   │   │   ├── rp-menu.service.ts
│   │   │   │   └── rp-menu.validator.ts
│   │   │   ├── orders/
│   │   │   │   ├── rp-orders.routes.ts
│   │   │   │   ├── rp-orders.controller.ts
│   │   │   │   ├── rp-orders.service.ts
│   │   │   │   └── rp-orders.validator.ts
│   │   │   └── analytics/
│   │   │       ├── rp-analytics.routes.ts
│   │   │       ├── rp-analytics.controller.ts
│   │   │       └── rp-analytics.service.ts
│   │   │
│   │   ├── delivery/
│   │   │   ├── delivery.routes.ts
│   │   │   ├── delivery.controller.ts
│   │   │   ├── delivery.service.ts
│   │   │   ├── delivery.validator.ts
│   │   │   └── delivery.types.ts
│   │   │
│   │   ├── fleet/
│   │   │   ├── fleet.routes.ts
│   │   │   ├── fleet.controller.ts
│   │   │   ├── fleet.service.ts
│   │   │   └── fleet.types.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   ├── admin-users.routes.ts
│   │   │   │   ├── admin-users.controller.ts
│   │   │   │   └── admin-users.service.ts
│   │   │   ├── restaurants/
│   │   │   │   ├── admin-restaurants.routes.ts
│   │   │   │   ├── admin-restaurants.controller.ts
│   │   │   │   └── admin-restaurants.service.ts
│   │   │   ├── disputes/
│   │   │   │   ├── admin-disputes.routes.ts
│   │   │   │   ├── admin-disputes.controller.ts
│   │   │   │   └── admin-disputes.service.ts
│   │   │   └── config/
│   │   │       ├── admin-config.routes.ts
│   │   │       ├── admin-config.controller.ts
│   │   │       └── admin-config.service.ts
│   │   │
│   │   └── notification/
│   │       ├── notification.routes.ts
│   │       ├── notification.controller.ts
│   │       ├── notification.service.ts
│   │       └── notification.types.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts           # JWT verification + user attachment
│   │   ├── authorize.ts              # RBAC role guard factory
│   │   ├── validate.ts               # Zod schema request validation wrapper
│   │   ├── rateLimiter.ts            # express-rate-limit instances per route group
│   │   ├── auditLogger.ts            # Auto-logs admin actions to admin_audit_logs
│   │   ├── errorHandler.ts           # Global error handler (maps errors to API envelope)
│   │   └── requestLogger.ts          # HTTP request logging (morgan / pino)
│   │
│   ├── services/
│   │   ├── jwt.service.ts            # Access + refresh token generation & verification
│   │   ├── otp.service.ts            # OTP generation, storage in DB, Twilio dispatch
│   │   ├── email.service.ts          # SendGrid email wrapper
│   │   ├── sms.service.ts            # Twilio SMS wrapper
│   │   ├── push.service.ts           # Firebase Cloud Messaging wrapper
│   │   ├── storage.service.ts        # AWS S3 upload/signed-URL helper
│   │   ├── maps.service.ts           # Google Maps Distance Matrix + Directions API
│   │   ├── razorpay.service.ts       # Razorpay order creation + webhook validation
│   │   ├── stripe.service.ts         # Stripe payment intent + webhook validation
│   │   ├── elasticsearch.service.ts  # Index management + search query builder
│   │   └── rabbitmq.service.ts       # Message publishing helper
│   │
│   ├── events/
│   │   ├── consumers/
│   │   │   ├── order.consumer.ts     # Handles order.created → notify restaurant
│   │   │   ├── payment.consumer.ts   # Handles payment.success → place order
│   │   │   └── delivery.consumer.ts  # Handles delivery events → update status
│   │   └── publishers/
│   │       ├── order.publisher.ts
│   │       ├── payment.publisher.ts
│   │       └── notification.publisher.ts
│   │
│   ├── socket/
│   │   ├── socket.handler.ts         # Main Socket.IO event registration
│   │   ├── order.socket.ts           # order:status_update, delivery:location_update
│   │   ├── branch.socket.ts          # branch:new_order
│   │   └── delivery.socket.ts        # order:new_assignment
│   │
│   ├── utils/
│   │   ├── apiResponse.ts            # Standard success/error envelope builders
│   │   ├── AppError.ts               # Custom error class with HTTP status + error code
│   │   ├── pagination.ts             # Generic paginate() helper for Prisma queries
│   │   ├── hashToken.ts              # SHA-256 hashing for refresh tokens
│   │   ├── invoiceGenerator.ts       # PDF invoice generation (pdfkit)
│   │   └── profanityFilter.ts        # Review text profanity checker
│   │
│   └── types/
│       ├── express.d.ts              # Augments Express Request with `user` property
│       ├── roles.ts                  # UserRole enum
│       └── common.ts                 # Shared TS types (Coordinates, PaginatedResult, etc.)
│
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.ts
│   │   ├── cart.service.test.ts
│   │   └── order.service.test.ts
│   └── integration/
│       ├── auth.routes.test.ts
│       ├── order.routes.test.ts
│       └── payment.webhook.test.ts
│
├── .env                              # Environment variables (never commit)
├── .env.example                      # Template for required env vars
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── jest.config.ts
├── package.json
└── README.md                         # This file
```

---

## 2. Architecture & Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 + TypeScript 5 |
| ORM | Prisma 5 (MySQL connector) |
| Primary Database | MySQL 8 (InnoDB, utf8mb4) |
| Cache / Cart / Sessions | Redis 7 (ioredis) |
| Search Engine | Elasticsearch 8 |
| Message Queue | RabbitMQ 3 (amqplib) |
| File Storage | AWS S3 + CloudFront CDN |
| Payment Gateways | Razorpay (India), Stripe (International) |
| Maps & Routing | Google Maps Platform (Directions API, Distance Matrix API) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| SMS | Twilio |
| Email | SendGrid |
| Auth | JWT (Access + Refresh tokens), OAuth 2.0 (Google, Facebook) |
| Real-Time | Socket.IO 4 (WebSocket) |
| Validation | Zod |
| Testing | Jest + Supertest |
| Process Manager | PM2 |
| Infrastructure | AWS EC2, RDS, S3, CloudFront |

### Service Boundaries

```
api.quickbites.in/v1
        │
        ├── /auth                      → auth module
        ├── /customers                 → customer module
        ├── /restaurants               → restaurant + search module
        ├── /search                    → search module (Elasticsearch)
        ├── /cart                      → cart module (Redis-backed)
        ├── /orders                    → order module
        ├── /payments                  → payment module
        ├── /reviews                   → review module
        ├── /promotions                → promotion module
        ├── /loyalty                   → loyalty module
        ├── /notifications             → notification module
        ├── /delivery                  → delivery module
        ├── /fleet                     → fleet module
        ├── /restaurant-portal         → restaurant-portal/* modules
        └── /admin                     → admin/* modules
```

---

## 3. Prisma & Database Setup

### Initial Setup

```bash
# Install dependencies
npm install

# Create .env with DATABASE_URL
DATABASE_URL="mysql://user:password@localhost:3306/quick_bites_db"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed initial data
npx ts-node prisma/seed.ts
```

### Key Prisma Conventions

- All models use `@@map("table_name")` to map to existing SQL snake_case table names.
- Soft deletes: models with `deletedAt DateTime?` use a global Prisma middleware to filter out deleted records by default.
- Spatial columns (`POINT`, `POLYGON`): handled as raw SQL via `prisma.$queryRaw` — Prisma does not natively support MySQL spatial types.
- Redis is used directly via `ioredis` for cart state; it is not managed by Prisma.

---

## 4. Authentication Strategy

### JWT Token Pair

```
Authorization: Bearer <access_token>
```

| Token | Expiry | Storage |
|---|---|---|
| Access Token | 15 minutes | Memory / HTTP-only cookie |
| Refresh Token | 30 days of inactivity | `auth_tokens` table (SHA-256 hashed) |

### Role Enum

```typescript
// src/types/roles.ts
export enum UserRole {
  CUSTOMER           = 'customer',
  RESTAURANT_OWNER   = 'restaurant_owner',
  RESTAURANT_STAFF   = 'restaurant_staff',
  DELIVERY_PARTNER   = 'delivery_partner',
  FLEET_MANAGER      = 'fleet_manager',
  PLATFORM_ADMIN     = 'platform_admin',
  FINANCE_MANAGER    = 'finance_manager',
}
```

### Middleware Usage

```typescript
// Authenticated route example
router.get('/me', authenticate, authorize(UserRole.CUSTOMER), customerController.getProfile);

// Multi-role route example
router.patch('/:id/status',
  authenticate,
  authorize(UserRole.RESTAURANT_STAFF, UserRole.RESTAURANT_OWNER),
  rpOrdersController.updateStatus
);
```

---

## 5. Global Conventions

### Response Envelope

```typescript
// Success
{ "success": true, "data": { ... }, "meta": { "page": 1, "per_page": 20, "total": 150 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

### Pagination Query Params

| Param | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `per_page` | `20` | Items per page (max 100) |
| `sort_by` | varies | Sort field |
| `sort_dir` | `desc` | `asc` or `desc` |

### Request Format

- **Content-Type:** `application/json`
- **Date fields:** ISO 8601 (`2026-05-01T10:30:00Z`)
- **Currency:** amounts in paise (integer) for Razorpay; display layer converts
- **Coordinates:** `{ "lat": 23.0225, "lng": 72.5714 }`

---

## 6. Models (Prisma Schema Reference)

All models map directly to the `quick_bites_db` MySQL schema. Below is the complete model and field inventory.

| Prisma Model | MySQL Table | Primary Key | Key Relations |
|---|---|---|---|
| `User` | `users` | `id` | → Customer, RestaurantOwner, DeliveryPartner, AdminProfile |
| `UserSession` | `user_sessions` | `id (CHAR36)` | → User |
| `UserSocialAccount` | `user_social_accounts` | `id` | → User |
| `AuthToken` | `auth_tokens` | `id` | → User |
| `OtpVerification` | `otp_verifications` | `id` | — |
| `Customer` | `customers` | `userId` | → User, CustomerAddress[], CustomerPaymentMethod[], Order[] |
| `CustomerAddress` | `customer_addresses` | `id` | → Customer |
| `CustomerPaymentMethod` | `customer_payment_methods` | `id` | → Customer |
| `CustomerLoyaltyTransaction` | `customer_loyalty_transactions` | `id` | → Customer, Order? |
| `CustomerReferral` | `customer_referrals` | `id` | → Customer (referrer), Customer (referred) |
| `RestaurantOwner` | `restaurant_owners` | `userId` | → User, Restaurant[] |
| `AdminProfile` | `admin_profiles` | `userId` | → User |
| `Restaurant` | `restaurants` | `id` | → RestaurantOwner, RestaurantBranch[] |
| `RestaurantBranch` | `restaurant_branches` | `id` | → Restaurant, MenuCategory[], Order[], RestaurantOperatingHour[] |
| `RestaurantStaffProfile` | `restaurant_staff_profiles` | `userId` | → User, RestaurantBranch |
| `RestaurantOperatingHour` | `restaurant_operating_hours` | `id` | → RestaurantBranch |
| `MenuCategory` | `menu_categories` | `id` | → RestaurantBranch, MenuItem[] |
| `MenuItem` | `menu_items` | `id` | → MenuCategory, MenuItemModifierGroup[] |
| `MenuItemModifierGroup` | `menu_item_modifier_groups` | `(menuItemId, modifierGroupId)` | → MenuItem, ModifierGroup |
| `ModifierGroup` | `modifier_groups` | `id` | → RestaurantBranch, Modifier[], MenuItemModifierGroup[] |
| `Modifier` | `modifiers` | `id` | → ModifierGroup |
| `Order` | `orders` | `id` | → Customer, RestaurantBranch, CustomerAddress, Coupon?, OrderItem[], Delivery? |
| `OrderItem` | `order_items` | `id` | → Order, MenuItem, OrderItemModifier[] |
| `OrderItemModifier` | `order_item_modifiers` | `(orderItemId, modifierId)` | → OrderItem, Modifier |
| `DeliveryPartner` | `delivery_partners` | `userId` | → User, Delivery[] |
| `Delivery` | `deliveries` | `id` | → Order, DeliveryPartner?, DeliveryIssueReport[] |
| `DeliveryIssueReport` | `delivery_issue_reports` | `id` | → Delivery, DeliveryPartner |
| `Coupon` | `coupons` | `id` | → Order[] |
| `Transaction` | `transactions` | `id` | → Order |
| `DisputeTicket` | `dispute_tickets` | `id` | → Order, Customer, AdminProfile?, DisputeMessage[], Refund? |
| `DisputeMessage` | `dispute_messages` | `id` | → DisputeTicket, User |
| `Refund` | `refunds` | `id` | → DisputeTicket, Transaction |
| `Review` | `reviews` | `id` | → Order, Customer, RestaurantBranch, ReviewPhoto[], ReviewReply? |
| `ReviewPhoto` | `review_photos` | `id` | → Review |
| `ReviewReply` | `review_replies` | `reviewId` | → Review, RestaurantBranch |
| `AdminAuditLog` | `admin_audit_logs` | `id` | → User (admin) |

---

## 7. Module Summary — Routes, Controllers & Services

| # | Module | Route Prefix | Routes File | Controller File | Service File |
|---|---|---|---|---|---|
| 01 | Auth & Sessions | `/auth` | `auth/auth.routes.ts` | `auth/auth.controller.ts` | `auth/auth.service.ts` |
| 02 | Customer Profile | `/customers` | `customer/customer.routes.ts` | `customer/customer.controller.ts` | `customer/customer.service.ts` |
| 03 | Discovery & Search | `/restaurants`, `/search` | `restaurant/restaurant.routes.ts`, `search/search.routes.ts` | `restaurant/restaurant.controller.ts`, `search/search.controller.ts` | `restaurant/restaurant.service.ts`, `search/search.service.ts` |
| 04 | Menu Browsing | `/restaurants/:id/menu` | `menu/menu.routes.ts` | `menu/menu.controller.ts` | `menu/menu.service.ts` |
| 05 | Cart | `/cart` | `cart/cart.routes.ts` | `cart/cart.controller.ts` | `cart/cart.service.ts` |
| 06 | Checkout & Orders | `/orders` | `order/order.routes.ts` | `order/order.controller.ts` | `order/order.service.ts` |
| 07 | Order Tracking | `/orders/:id/track` | `tracking/tracking.routes.ts` | `tracking/tracking.controller.ts` | `tracking/tracking.service.ts` |
| 08 | Order History | `/orders/history` | *(merged into order.routes.ts)* | `order/order.controller.ts` | `order/order.service.ts` |
| 09 | Reviews & Ratings | `/reviews` | `review/review.routes.ts` | `review/review.controller.ts` | `review/review.service.ts` |
| 10 | Promotions & Loyalty | `/promotions`, `/loyalty` | `promotion/promotion.routes.ts`, `loyalty/loyalty.routes.ts` | `promotion/promotion.controller.ts`, `loyalty/loyalty.controller.ts` | `promotion/promotion.service.ts`, `loyalty/loyalty.service.ts` |
| 11 | Payments & Refunds | `/payments` | `payment/payment.routes.ts` | `payment/payment.controller.ts` | `payment/payment.service.ts` |
| 12 | RP: Profile | `/restaurant-portal/profile` | `restaurant-portal/profile/rp-profile.routes.ts` | `rp-profile.controller.ts` | `rp-profile.service.ts` |
| 13 | RP: Menu Mgmt | `/restaurant-portal/menu` | `restaurant-portal/menu/rp-menu.routes.ts` | `rp-menu.controller.ts` | `rp-menu.service.ts` |
| 14 | RP: Order Mgmt | `/restaurant-portal/orders` | `restaurant-portal/orders/rp-orders.routes.ts` | `rp-orders.controller.ts` | `rp-orders.service.ts` |
| 15 | RP: Analytics | `/restaurant-portal/analytics` | `restaurant-portal/analytics/rp-analytics.routes.ts` | `rp-analytics.controller.ts` | `rp-analytics.service.ts` |
| 16 | Delivery Portal | `/delivery` | `delivery/delivery.routes.ts` | `delivery/delivery.controller.ts` | `delivery/delivery.service.ts` |
| 17 | Fleet Manager | `/fleet` | `fleet/fleet.routes.ts` | `fleet/fleet.controller.ts` | `fleet/fleet.service.ts` |
| 18 | Admin: Users & Restaurants | `/admin/users`, `/admin/restaurants` | `admin/users/admin-users.routes.ts`, `admin/restaurants/admin-restaurants.routes.ts` | `admin-users.controller.ts`, `admin-restaurants.controller.ts` | `admin-users.service.ts`, `admin-restaurants.service.ts` |
| 19 | Admin: Disputes | `/admin/disputes` | `admin/disputes/admin-disputes.routes.ts` | `admin-disputes.controller.ts` | `admin-disputes.service.ts` |
| 20 | Admin: Analytics & Config | `/admin/analytics`, `/admin/config` | `admin/config/admin-config.routes.ts` | `admin-config.controller.ts` | `admin-config.service.ts` |
| 21 | Notifications | `/notifications` | `notification/notification.routes.ts` | `notification/notification.controller.ts` | `notification/notification.service.ts` |

---

## 8. API Routes Reference

---

### Module 01 — Auth & Sessions

**Prefix:** `/auth` | **Controller:** `auth.controller.ts` | **Service:** `auth.service.ts`
**DB Tables:** `users`, `auth_tokens`, `otp_verifications`, `user_social_accounts`, `user_sessions`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `POST` | `/auth/register` | `register` | Public | CUST-FR-001, 002 | New customer self-registration; triggers OTP SMS |
| `POST` | `/auth/verify-otp` | `verifyOtp` | Public | CUST-FR-002 | Verify 6-digit OTP; activates account + issues token pair |
| `POST` | `/auth/login` | `login` | Public | CUST-FR-004, 006 | Email/mobile + password login; enforces lockout after 5 failures |
| `POST` | `/auth/social-login` | `socialLogin` | Public | CUST-FR-003 | Google / Facebook OAuth sign-in; creates account on first use |
| `POST` | `/auth/refresh-token` | `refreshToken` | Any (refresh token) | CUST-FR-007 | Exchange refresh token for new access token (rotates refresh) |
| `POST` | `/auth/logout` | `logout` | All authenticated | — | Revoke current session's refresh token |
| `POST` | `/auth/forgot-password` | `forgotPassword` | Public | CUST-FR-005 | Send 15-min secure reset link to registered email |
| `POST` | `/auth/reset-password` | `resetPassword` | Public | CUST-FR-005 | Reset password via signed JWT token; revokes all existing sessions |
| `POST` | `/auth/resend-otp` | `resendOtp` | Public | CUST-FR-002 | Resend OTP (rate-limited: max 3/hour per mobile) |
| `GET` | `/auth/sessions` | `getSessions` | `customer`, `restaurant_owner`, `delivery_partner` | CUST-FR-008 | List all active sessions for the authenticated user |
| `DELETE` | `/auth/sessions/:session_id` | `terminateSession` | `customer`, `restaurant_owner`, `delivery_partner` | CUST-FR-008 | Terminate a session on another device |

---

### Module 02 — Customer Profile & Addresses

**Prefix:** `/customers` | **Controller:** `customer.controller.ts` | **Service:** `customer.service.ts`
**DB Tables:** `customers`, `customer_addresses`, `customer_payment_methods`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/customers/me` | `getProfile` | `customer` | CUST-FR-009 | Get full profile including loyalty balance |
| `PATCH` | `/customers/me` | `updateProfile` | `customer` | CUST-FR-009, 013, 014 | Update display name, dietary preference, communication preferences |
| `POST` | `/customers/me/photo` | `uploadPhoto` | `customer` | CUST-FR-009 | Upload profile photo to S3; updates `profile_photo_url` |
| `GET` | `/customers/me/addresses` | `getAddresses` | `customer` | CUST-FR-010 | List all saved delivery addresses |
| `POST` | `/customers/me/addresses` | `addAddress` | `customer` | CUST-FR-010, 011 | Add new address (manual / GPS / Google Places) |
| `PUT` | `/customers/me/addresses/:address_id` | `updateAddress` | `customer` | CUST-FR-010 | Update an existing address |
| `DELETE` | `/customers/me/addresses/:address_id` | `deleteAddress` | `customer` | CUST-FR-010 | Remove an address (cannot delete if used in active order) |
| `PATCH` | `/customers/me/addresses/:address_id/set-default` | `setDefaultAddress` | `customer` | CUST-FR-010 | Set an address as default delivery address |
| `GET` | `/customers/me/payment-methods` | `getPaymentMethods` | `customer` | CUST-FR-012 | List saved payment methods |
| `DELETE` | `/customers/me/payment-methods/:method_id` | `removePaymentMethod` | `customer` | CUST-FR-012 | Remove a saved payment method (soft status update) |

---

### Module 03 — Restaurant Discovery & Search

**Prefix:** `/restaurants`, `/search` | **Controllers:** `restaurant.controller.ts`, `search.controller.ts`
**DB Tables:** `restaurants`, `restaurant_branches`, `restaurant_operating_hours`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/restaurants` | `getHomeFeed` | `customer` (guest: generic) | CUST-FR-015, 019, 023 | Personalized homepage feed filtered by delivery radius; includes `order_again`, `top_picks`, `trending_this_week` sections |
| `GET` | `/restaurants/:branch_id` | `getBranchDetail` | Public | CUST-FR-020, 021 | Full branch detail page — operating hours, delivery info, ratings |
| `GET` | `/restaurants/map` | `getMapPins` | Public | CUST-FR-022 | Restaurant pins for interactive map view (Low priority) |
| `GET` | `/restaurants/:branch_id/reviews` | `getBranchReviews` | Public | CUST-FR-065 | Paginated approved reviews for a branch |
| `GET` | `/restaurants/:branch_id/rating-summary` | `getRatingSummary` | Public | CUST-FR-067 | Overall rating + breakdown by category |
| `GET` | `/search/restaurants` | `searchRestaurants` | Public | CUST-FR-016, 017, 018 | Full-text fuzzy search (Elasticsearch); supports filters: cuisine, rating, price range, dietary, delivery time; sort by relevance/rating/time/price |
| `GET` | `/search/suggest` | `getSearchSuggestions` | Public | SRCH-FR-003 | Predictive search suggestions as customer types |

---

### Module 04 — Menu Browsing

**Prefix:** `/restaurants/:branch_id/menu` | **Controller:** `menu.controller.ts` | **Service:** `menu.service.ts`
**DB Tables:** `menu_categories`, `menu_items`, `modifier_groups`, `modifiers`, `menu_item_modifier_groups`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/restaurants/:branch_id/menu` | `getFullMenu` | Public | CUST-FR-024–031 | Full menu grouped by categories; supports `?dietary=` and `?q=` filters |
| `GET` | `/restaurants/:branch_id/menu/items/:item_id` | `getItemDetail` | Public | CUST-FR-027, 028 | Single item detail with all modifier groups and options |
| `GET` | `/restaurants/:branch_id/menu/search` | `searchMenuItems` | Public | CUST-FR-032 | Local search within a restaurant's menu |

---

### Module 05 — Cart

**Prefix:** `/cart` | **Controller:** `cart.controller.ts` | **Service:** `cart.service.ts`
**Storage:** Redis (`cart:{customer_id}` key, expires after 7 days inactivity)

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/cart` | `getCart` | `customer` | CUST-FR-033, 034, 037 | Get current cart with running subtotal, taxes, delivery fee, total |
| `POST` | `/cart/items` | `addItem` | `customer` | CUST-FR-033, 036 | Add item to cart; returns `409 CART_RESTAURANT_CONFLICT` if cross-restaurant |
| `PATCH` | `/cart/items/:menu_item_id` | `updateItemQuantity` | `customer` | CUST-FR-035 | Update quantity (`quantity=0` removes item) |
| `DELETE` | `/cart/items/:menu_item_id` | `removeItem` | `customer` | CUST-FR-035 | Remove specific item from cart |
| `DELETE` | `/cart` | `clearCart` | `customer` | CUST-FR-036 | Clear entire cart |
| `POST` | `/cart/validate` | `validateCart` | `customer` | CUST-FR-038 | Pre-checkout validation — item availability, prices, minimum order check |

---

### Module 06 — Checkout & Orders

**Prefix:** `/orders` | **Controller:** `order.controller.ts` | **Service:** `order.service.ts`
**DB Tables:** `orders`, `order_items`, `order_item_modifiers`, `coupons`, `transactions`, `customer_addresses`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `POST` | `/orders` | `placeOrder` | `customer` | CUST-FR-040–049, BR-ORD-01–04 | Place order — validates cart, applies coupon, charges payment gateway, creates order records atomically, publishes RabbitMQ event |
| `GET` | `/orders/:order_id_uuid` | `getOrderDetail` | `customer` | CUST-FR-059 | Full order detail for authenticated customer |
| `POST` | `/orders/:order_id_uuid/cancel` | `cancelOrder` | `customer` | CUST-FR-074, BR-ORD-04 | Cancel order (only before restaurant acceptance) |
| `POST` | `/orders/:order_id_uuid/apply-coupon` | `applyCoupon` | `customer` | CUST-FR-044 | Apply/change coupon during checkout; returns updated total |
| `GET` | `/orders/validate-coupon` | `validateCoupon` | `customer` | CUST-FR-044 | Real-time coupon validation (`?coupon_code=&cart_total=`) |
| `GET` | `/orders/:order_id_uuid/invoice` | `getInvoice` | `customer` | CUST-FR-060 | Returns pre-signed S3 URL to PDF invoice |
| `POST` | `/orders/:order_id_uuid/reorder` | `reorder` | `customer` | CUST-FR-061 | Pre-populate cart from past order; flags unavailable items |
| `GET` | `/orders/history` | `getOrderHistory` | `customer` | CUST-FR-058 | Paginated past orders list |
| `GET` | `/orders/history/:order_id_uuid` | `getHistoryDetail` | `customer` | CUST-FR-059 | Full itemized detail of a past order |
| `GET` | `/orders/history/:order_id_uuid/invoice` | `downloadInvoice` | `customer` | CUST-FR-060 | Download PDF invoice (pre-signed S3 URL) |

---

### Module 07 — Real-Time Order Tracking

**Prefix:** `/orders/:order_id_uuid/track` | **Controller:** `tracking.controller.ts` | **Service:** `tracking.service.ts`
**DB Tables:** `orders`, `deliveries`, `delivery_partners`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/orders/:order_id_uuid/track` | `getTrackingSnapshot` | `customer` | CUST-FR-050, 051 | Current tracking state: order status, delivery partner location, restaurant & delivery pins |
| `GET` | `/orders/:order_id_uuid/track/eta` | `getEta` | `customer` | CUST-FR-053 | Recalculated ETA via Google Maps Distance Matrix API (called every 2 min by client) |
| `POST` | `/orders/:order_id_uuid/contact-partner` | `contactPartner` | `customer` | CUST-FR-054 | Send a pre-defined message to delivery partner (masked communication) |

> **Real-time updates** are delivered over WebSocket. See [WebSocket Events Reference](#9-websocket-events-reference).

---

### Module 09 — Reviews & Ratings

**Prefix:** `/reviews` | **Controller:** `review.controller.ts` | **Service:** `review.service.ts`
**DB Tables:** `reviews`, `review_photos`, `review_replies`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `POST` | `/reviews` | `submitReview` | `customer` | CUST-FR-062, 063, 064, BR-REV-01 | Submit review for a delivered order (1–5 stars × 3 dimensions, optional text + photos) |
| `PATCH` | `/reviews/:review_id` | `editReview` | `customer` | CUST-FR-063, BR-REV-02 | Edit review (allowed only within 48 hours of submission) |
| `POST` | `/restaurants/:branch_id/reviews/:review_id/reply` | `replyToReview` | `restaurant_owner`, `restaurant_staff` | CUST-FR-066 | Restaurant posts public reply to a customer review |

---

### Module 10 — Promotions, Coupons & Loyalty

**Prefix:** `/promotions`, `/loyalty` | **Controllers:** `promotion.controller.ts`, `loyalty.controller.ts`
**DB Tables:** `coupons`, `customer_loyalty_transactions`, `customer_referrals`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/promotions/available` | `getAvailablePromotions` | `customer` | CUST-FR-070 | All active promotions applicable to current cart context (`?branch_id=&cart_total=`) |
| `GET` | `/loyalty/balance` | `getLoyaltyBalance` | `customer` | CUST-FR-072 | Current loyalty point balance |
| `GET` | `/loyalty/transactions` | `getLoyaltyHistory` | `customer` | CUST-FR-072 | Paginated points earned/redeemed history |
| `GET` | `/loyalty/referral-code` | `getReferralCode` | `customer` | CUST-FR-073 | Get unique referral code (generates if absent) |
| `POST` | `/loyalty/apply-referral` | `applyReferral` | Public | CUST-FR-073 | Apply referral code during registration; reward granted after referred customer's first order |

---

### Module 11 — Payments & Refunds

**Prefix:** `/payments` | **Controller:** `payment.controller.ts` | **Service:** `payment.service.ts`
**DB Tables:** `transactions`, `refunds`, `dispute_tickets`, `dispute_messages`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `POST` | `/payments/initiate` | `initiatePayment` | `customer` | PAY-FR-001 | Create Razorpay/Stripe payment order; returns `gateway_order_id` for client SDK |
| `POST` | `/payments/webhook/razorpay` | `razorpayWebhook` | Internal (HMAC-verified) | PAY-FR-001, 005 | Razorpay webhook; validates HMAC signature, updates transaction status, publishes `payment.success` event |
| `POST` | `/payments/webhook/stripe` | `stripeWebhook` | Internal (Stripe-signed) | PAY-FR-001, 005 | Stripe webhook for international payment status updates |
| `POST` | `/payments/disputes` | `raiseDispute` | `customer` | CUST-FR-077, BR-PAY-03 | Raise dispute/refund request (within 24h of delivery); auto-credits 50% goodwill for missing items |
| `GET` | `/payments/disputes/:ticket_number` | `getDisputeStatus` | `customer` | CUST-FR-078 | Dispute ticket status + messages for authenticated customer |
| `GET` | `/payments/refunds/:order_id` | `getRefundStatus` | `customer` | CUST-FR-078 | Refund status for an order (`initiated` / `processing` / `completed` / `failed`) |

---

### Module 12 — Restaurant Portal: Onboarding & Profile

**Prefix:** `/restaurant-portal` | **Controller:** `rp-profile.controller.ts` | **Service:** `rp-profile.service.ts`
**DB Tables:** `restaurants`, `restaurant_branches`, `restaurant_operating_hours`, `restaurant_owners`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `POST` | `/restaurant-portal/register` | `registerRestaurant` | Public | REST-FR-001, 002 | Submit onboarding application (GSTIN, FSSAI, bank details); sets `pending_verification` |
| `GET` | `/restaurant-portal/profile` | `getProfile` | `restaurant_owner` | REST-FR-003 | Get owner's restaurant and profile data |
| `PATCH` | `/restaurant-portal/profile` | `updateProfile` | `restaurant_owner` | REST-FR-003 | Update logo, cover photo, description, cuisine tags |
| `GET` | `/restaurant-portal/branches` | `getBranches` | `restaurant_owner` | REST-FR-007 | List all branches under the owner's restaurant |
| `POST` | `/restaurant-portal/branches` | `createBranch` | `restaurant_owner` | REST-FR-005, 007 | Create a new branch with address, coordinates, delivery radius polygon |
| `PATCH` | `/restaurant-portal/branches/:branch_id` | `updateBranch` | `restaurant_owner` | REST-FR-005 | Update branch details and delivery radius polygon |
| `PUT` | `/restaurant-portal/branches/:branch_id/operating-hours` | `setOperatingHours` | `restaurant_owner` | REST-FR-004 | Set/replace operating hours for all 7 days (`null` times = closed) |
| `POST` | `/restaurant-portal/branches/:branch_id/pause-orders` | `pauseOrders` | `restaurant_owner`, `restaurant_staff` | REST-FR-006 | Pause order acceptance with optional `auto_resume_at` timestamp |

---

### Module 13 — Restaurant Portal: Menu Management

**Prefix:** `/restaurant-portal/menu` | **Controller:** `rp-menu.controller.ts` | **Service:** `rp-menu.service.ts`
**DB Tables:** `menu_categories`, `menu_items`, `modifier_groups`, `modifiers`, `menu_item_modifier_groups`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/restaurant-portal/menu/categories` | `getCategories` | `restaurant_owner`, `restaurant_staff` | REST-FR-008 | List all categories for a branch (`?branch_id=`) |
| `POST` | `/restaurant-portal/menu/categories` | `createCategory` | `restaurant_owner` | REST-FR-008 | Create a menu category |
| `PATCH` | `/restaurant-portal/menu/categories/:category_id` | `updateCategory` | `restaurant_owner` | REST-FR-008 | Update category name, sort order, or active status |
| `DELETE` | `/restaurant-portal/menu/categories/:category_id` | `deleteCategory` | `restaurant_owner` | REST-FR-008 | Delete category (cascades soft-delete to items) |
| `GET` | `/restaurant-portal/menu/items` | `getItems` | `restaurant_owner`, `restaurant_staff` | REST-FR-008 | Paginated menu items (`?branch_id=`, `?category_id=`, `?is_available=`, `?food_type=`) |
| `POST` | `/restaurant-portal/menu/items` | `createItem` | `restaurant_owner` | REST-FR-009, 010 | Create a new menu item with all fields |
| `PATCH` | `/restaurant-portal/menu/items/:item_id` | `updateItem` | `restaurant_owner`, `restaurant_staff` | REST-FR-009, 012 | Update item fields; availability change propagates to customer menu within 30s |
| `DELETE` | `/restaurant-portal/menu/items/:item_id` | `deleteItem` | `restaurant_owner` | REST-FR-008 | Soft-delete a menu item (`deleted_at = NOW()`) |
| `PATCH` | `/restaurant-portal/menu/items/:item_id/toggle-availability` | `toggleItemAvailability` | `restaurant_owner`, `restaurant_staff` | REST-FR-012 | Quick available/unavailable toggle |
| `POST` | `/restaurant-portal/menu/items/bulk-import` | `bulkImportItems` | `restaurant_owner` | REST-FR-011 | CSV upload for bulk item import; returns `{ items_created, items_failed, errors }` |
| `POST` | `/restaurant-portal/menu/modifier-groups` | `createModifierGroup` | `restaurant_owner` | REST-FR-010 | Create modifier group with modifiers (e.g. "Choose Crust") |
| `POST` | `/restaurant-portal/menu/items/:item_id/modifier-groups` | `linkModifierGroups` | `restaurant_owner` | REST-FR-010 | Link existing modifier groups to a menu item |

---

### Module 14 — Restaurant Portal: Order Management

**Prefix:** `/restaurant-portal/orders` | **Controller:** `rp-orders.controller.ts` | **Service:** `rp-orders.service.ts`
**DB Tables:** `orders`, `order_items`, `order_item_modifiers`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/restaurant-portal/orders` | `getOrderQueue` | `restaurant_owner`, `restaurant_staff` | REST-FR-016, 022 | Real-time order queue (`?branch_id=`, `?status=`, `?date=`, `?order_type=`) |
| `GET` | `/restaurant-portal/orders/history` | `getOrderHistory` | `restaurant_owner`, `restaurant_staff` | REST-FR-023 | Historical order search with filters (date, status, order ID, payment method) |
| `GET` | `/restaurant-portal/orders/:order_id` | `getOrderDetail` | `restaurant_owner`, `restaurant_staff` | REST-FR-017 | Full order detail: item list, customizations, special instructions, payment status |
| `POST` | `/restaurant-portal/orders/:order_id/accept` | `acceptOrder` | `restaurant_owner`, `restaurant_staff` | REST-FR-018 | Accept incoming order within 5-minute window |
| `POST` | `/restaurant-portal/orders/:order_id/reject` | `rejectOrder` | `restaurant_owner`, `restaurant_staff` | REST-FR-018 | Reject order with reason; triggers full refund + customer notification |
| `PATCH` | `/restaurant-portal/orders/:order_id/status` | `updateOrderStatus` | `restaurant_owner`, `restaurant_staff` | REST-FR-020 | Update order through preparation pipeline (`preparing` → `ready_for_pickup`) |
| `POST` | `/restaurant-portal/orders/:order_id/items/:item_id/mark-unavailable` | `markItemUnavailable` | `restaurant_owner`, `restaurant_staff` | REST-FR-021 | Flag item as unavailable mid-order; triggers partial refund + customer notification |

---

### Module 15 — Restaurant Portal: Analytics & Finance

**Prefix:** `/restaurant-portal/analytics` | **Controller:** `rp-analytics.controller.ts` | **Service:** `rp-analytics.service.ts`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/restaurant-portal/analytics/kpis` | `getKpis` | `restaurant_owner` | REST-FR-027 | Real-time KPIs: orders today, revenue today, avg order value, acceptance rate (`?branch_id=`) |
| `GET` | `/restaurant-portal/analytics/revenue` | `getRevenue` | `restaurant_owner` | REST-FR-028 | Revenue trend report by period with period-over-period comparison |
| `GET` | `/restaurant-portal/analytics/top-items` | `getTopItems` | `restaurant_owner` | REST-FR-029 | Top selling items by units sold, revenue, average rating |
| `GET` | `/restaurant-portal/analytics/customers` | `getCustomerReport` | `restaurant_owner` | REST-FR-030 | Demographics: order frequency, new vs. returning split, peak hours heatmap |
| `GET` | `/restaurant-portal/analytics/coupons` | `getCouponPerformance` | `restaurant_owner` | REST-FR-026 | Coupon performance: redemptions, total discount, avg order value with coupon |
| `GET` | `/restaurant-portal/finance/payouts` | `getPayoutHistory` | `restaurant_owner` | REST-FR-032 | Payout history with commission deductions itemized per order |
| `POST` | `/restaurant-portal/analytics/export` | `exportReport` | `restaurant_owner` | REST-FR-031 | Export any report as PDF or CSV (returns signed S3 URL) |

---

### Module 16 — Delivery Partner Portal

**Prefix:** `/delivery` | **Controller:** `delivery.controller.ts` | **Service:** `delivery.service.ts`
**DB Tables:** `delivery_partners`, `deliveries`, `delivery_issue_reports`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `POST` | `/delivery/register` | `registerPartner` | Public | DEL-FR-001, 002 | Partner registration (name, vehicle, registration, govt ID); sets `is_verified = false`, notifies admin |
| `PATCH` | `/delivery/me/status` | `updateWorkStatus` | `delivery_partner` | DEL-FR-003 | Toggle availability (`online` / `offline`) |
| `PATCH` | `/delivery/me/location` | `updateLocation` | `delivery_partner` | DEL-FR-012 | Push GPS coordinates (called every 10s when active order exists); updates Redis + broadcasts via WebSocket |
| `GET` | `/delivery/me/assignments` | `getCurrentAssignment` | `delivery_partner` | DEL-FR-005 | Get current active delivery assignment |
| `POST` | `/delivery/assignments/:delivery_id/accept` | `acceptAssignment` | `delivery_partner` | DEL-FR-006 | Accept delivery within 60-second window |
| `POST` | `/delivery/assignments/:delivery_id/decline` | `declineAssignment` | `delivery_partner` | DEL-FR-006, 007 | Decline delivery; triggers reassignment; escalates after 2 consecutive declines |
| `POST` | `/delivery/assignments/:delivery_id/pickup-confirmed` | `confirmPickup` | `delivery_partner` | DEL-FR-009 | Confirm order pickup from restaurant; updates order status to `picked_up` |
| `POST` | `/delivery/assignments/:delivery_id/delivered` | `confirmDelivery` | `delivery_partner` | DEL-FR-011, BR-DEL-03 | Mark order delivered; requires OTP or delivery photo for orders ≥ ₹1000 |
| `POST` | `/delivery/assignments/:delivery_id/report-issue` | `reportIssue` | `delivery_partner` | DEL-FR-013 | Report delivery issue (customer unavailable, wrong address, etc.); auto-notifies customer + support |
| `GET` | `/delivery/me/earnings` | `getEarningsDashboard` | `delivery_partner` | DEL-FR-014 | Earnings dashboard: today/week/month totals, delivery count, tips |
| `GET` | `/delivery/me/earnings/history` | `getEarningsHistory` | `delivery_partner` | DEL-FR-015 | Itemized earning history per delivery (base pay + distance bonus + tips) |

---

### Module 17 — Fleet Manager

**Prefix:** `/fleet` | **Controller:** `fleet.controller.ts` | **Service:** `fleet.service.ts`
**DB Tables:** `deliveries`, `delivery_partners`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/fleet/dashboard` | `getDashboard` | `fleet_manager` | DEL-FR-008 | Live view of all online delivery partners and assignment status |
| `GET` | `/fleet/escalated-orders` | `getEscalatedOrders` | `fleet_manager` | DEL-FR-007 | Orders escalated after 2+ partner declines; require manual assignment |
| `POST` | `/fleet/orders/:delivery_id/assign` | `manuallyAssign` | `fleet_manager` | DEL-FR-008 | Manually assign an order to a specific partner (`{ delivery_partner_id }`) |
| `GET` | `/fleet/partners` | `getPartners` | `fleet_manager` | DEL-FR-016 | All delivery partners with status, location, and performance rating |
| `PATCH` | `/fleet/partners/:partner_id/status` | `overridePartnerStatus` | `fleet_manager`, `platform_admin` | DEL-FR-002, 016 | Override partner active status (e.g. suspend for policy violations) |

---

### Module 18 — Admin: User & Restaurant Management

**Prefix:** `/admin/users`, `/admin/restaurants` | **Controllers:** `admin-users.controller.ts`, `admin-restaurants.controller.ts`
**DB Tables:** `users`, `restaurants`, `restaurant_branches`, `admin_profiles`, `admin_audit_logs`

> All admin write actions are auto-logged to `admin_audit_logs` by the `auditLogger` middleware.

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/admin/users` | `listUsers` | `platform_admin` | ADMIN-FR-001 | Paginated users with search (`?role=`, `?is_active=`, `?search=`, `?from_date=`, `?to_date=`) |
| `GET` | `/admin/users/:user_id` | `getUserDetail` | `platform_admin` | ADMIN-FR-001 | Detailed profile for any user |
| `PATCH` | `/admin/users/:user_id/status` | `updateUserStatus` | `platform_admin` | ADMIN-FR-002 | Approve, suspend, or deactivate user account; `reason` is mandatory |
| `GET` | `/admin/restaurants` | `listRestaurants` | `platform_admin` | ADMIN-FR-003 | List restaurants with `?verification_status=`, `?search=`, `?subscription_tier=` |
| `PATCH` | `/admin/restaurants/:restaurant_id/verify` | `verifyRestaurant` | `platform_admin` | ADMIN-FR-003 | Approve or reject onboarding application |
| `PATCH` | `/admin/restaurants/:restaurant_id/override` | `overrideRestaurant` | `platform_admin` | ADMIN-FR-004 | Override menu availability, operating hours, or delist restaurant |
| `POST` | `/admin/coupons` | `createCoupon` | `platform_admin` | ADMIN-FR-005, CUST-FR-068, 069 | Create platform-wide coupon with all rule configurations |
| `PATCH` | `/admin/coupons/:coupon_id` | `updateCoupon` | `platform_admin` | ADMIN-FR-005 | Update or deactivate a coupon |
| `GET` | `/admin/delivery-partners` | `listDeliveryPartners` | `platform_admin` | DEL-FR-002 | List delivery partner applications pending verification |
| `PATCH` | `/admin/delivery-partners/:partner_id/verify` | `verifyDeliveryPartner` | `platform_admin` | DEL-FR-002 | Approve or reject a delivery partner after document review |

---

### Module 19 — Admin: Dispute & Refund Management

**Prefix:** `/admin/disputes` | **Controller:** `admin-disputes.controller.ts` | **Service:** `admin-disputes.service.ts`
**DB Tables:** `dispute_tickets`, `dispute_messages`, `refunds`, `transactions`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/admin/disputes` | `listDisputes` | `platform_admin` | ADMIN-FR-008 | Paginated dispute tickets (`?status=`, `?priority=`, `?category=`, `?from_date=`, `?to_date=`, `?assigned_to=`) |
| `GET` | `/admin/disputes/:ticket_number` | `getDisputeDetail` | `platform_admin` | ADMIN-FR-008 | Full dispute detail: order info, all messages, refund history |
| `POST` | `/admin/disputes/:ticket_number/messages` | `postMessage` | `platform_admin` | ADMIN-FR-008 | Post message on ticket (`is_internal_only` flag for internal admin notes) |
| `PATCH` | `/admin/disputes/:ticket_number/assign` | `assignDispute` | `platform_admin` | ADMIN-FR-008 | Assign ticket to a specific admin |
| `POST` | `/admin/disputes/:ticket_number/resolve` | `resolveDispute` | `platform_admin` | ADMIN-FR-008 | Resolve ticket with refund decision; triggers gateway refund + customer notification |
| `GET` | `/admin/refunds` | `listRefunds` | `platform_admin`, `finance_manager` | PAY-FR-004 | All refunds with status tracking |
| `GET` | `/admin/audit-logs` | `getAuditLogs` | `platform_admin` | ADMIN-FR-009 | Immutable admin action audit trail (`?admin_user_id=`, `?action_type=`, `?target_entity=`) |

---

### Module 20 — Admin: Analytics & Config

**Prefix:** `/admin/analytics`, `/admin/config` | **Controller:** `admin-config.controller.ts` | **Service:** `admin-config.service.ts`

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/admin/analytics/platform-kpis` | `getPlatformKpis` | `platform_admin`, `finance_manager` | ADMIN-FR-010 | Platform KPIs: GMV, total orders, active customers, new restaurants, avg delivery time, cancellation rate (`?from_date=`, `?to_date=`) |
| `GET` | `/admin/analytics/financial-reconciliation` | `getFinancialReconciliation` | `finance_manager`, `platform_admin` | ADMIN-FR-011 | Gross sales, platform commission, restaurant payouts, delivery partner payouts by period |
| `GET` | `/admin/analytics/order-monitoring` | `getOrderMonitoring` | `platform_admin` | ADMIN-FR-006, 007 | Real-time active order dashboard with SLA breach alerts |
| `GET` | `/admin/analytics/geo-heatmap` | `getGeoHeatmap` | `platform_admin` | ADMIN-FR-012 | Geographic order density heatmap data (`?from_date=`, `?to_date=`, `?city=`) |
| `POST` | `/admin/analytics/scheduled-reports` | `createScheduledReport` | `platform_admin` | ADMIN-FR-013 | Set up automated report delivery (daily/weekly/monthly) to email recipients |
| `GET` | `/admin/config/platform-settings` | `getPlatformSettings` | `platform_admin` | ADMIN-FR-014 | Current global platform configuration |
| `PATCH` | `/admin/config/platform-settings` | `updatePlatformSettings` | `platform_admin` | ADMIN-FR-014, 017 | Update delivery radius, commission by tier, min delivery fee, loyalty rates |
| `GET` | `/admin/config/notification-templates` | `getNotificationTemplates` | `platform_admin` | ADMIN-FR-015 | List all notification templates (email, SMS, push) |
| `PATCH` | `/admin/config/notification-templates/:template_id` | `updateNotificationTemplate` | `platform_admin` | ADMIN-FR-015 | Update template via WYSIWYG editor content |
| `PATCH` | `/admin/config/cuisine-tags` | `updateCuisineTags` | `platform_admin` | ADMIN-FR-016 | Manage supported cuisine types and dietary tags |

---

### Module 21 — Notifications

**Prefix:** `/notifications` | **Controller:** `notification.controller.ts` | **Service:** `notification.service.ts`
**Integrations:** Firebase FCM (push), Twilio (SMS), SendGrid (email)

| Method | Endpoint | Controller Method | Roles Allowed | FRD Ref | Description |
|---|---|---|---|---|---|
| `GET` | `/notifications/me` | `getNotifications` | All authenticated | Section 8.1 | Paginated in-app notifications for authenticated user |
| `PATCH` | `/notifications/:notification_id/read` | `markRead` | All authenticated | — | Mark a single notification as read |
| `PATCH` | `/notifications/read-all` | `markAllRead` | All authenticated | — | Mark all notifications as read |
| `POST` | `/notifications/device-token` | `registerDeviceToken` | All authenticated | — | Register/update FCM device token for push notifications (`{ fcm_token, platform }`) |

---

## 9. WebSocket Events Reference

**Namespace:** `wss://api.quickbites.in/v1/ws`
**Auth:** Pass JWT as query param — `?token=<access_token>`

### Connection Channels

| Channel | Subscribe Event | Description |
|---|---|---|
| `order:{order_id_uuid}` | `join_order` | Customer/restaurant tracking an order |
| `branch:{branch_id}` | `join_branch` | Restaurant receives new order alerts |
| `delivery:{partner_id}` | `join_delivery` | Partner receives assignment notifications |

### Server → Client Events

| Event Name | Channel | Payload | Triggered When |
|---|---|---|---|
| `order:status_update` | `order:{id}` | `{ order_status, updated_at, estimated_delivery_time }` | Any order status change |
| `delivery:location_update` | `order:{id}` | `{ lat, lng, updated_at }` | Partner location update (every 10s) |
| `order:new_assignment` | `delivery:{id}` | `{ delivery_id, restaurant_name, pickup_address, estimated_earnings }` | New delivery assigned to partner |
| `branch:new_order` | `branch:{id}` | `{ order_id, order_type, total_amount, items_count }` | New order placed at a branch |
| `order:eta_update` | `order:{id}` | `{ estimated_delivery_time, recalculated_at }` | ETA recalculated (every 2 min) |
| `order:partner_assigned` | `order:{id}` | `{ partner_name, partner_phone_masked, vehicle_type }` | Delivery partner accepted assignment |

### Client → Server Events

| Event Name | Payload | Description |
|---|---|---|
| `join_order` | `{ order_id_uuid }` | Subscribe to an order's tracking channel |
| `leave_order` | `{ order_id_uuid }` | Unsubscribe from order channel |
| `partner:location` | `{ lat, lng }` | Partner sends GPS update |

---

## 10. Middleware Reference

| File | Purpose | Applied To |
|---|---|---|
| `authenticate.ts` | Verifies JWT `Authorization: Bearer` header; attaches `req.user` | All protected routes |
| `authorize.ts` | Factory returning role guard: `authorize(UserRole.CUSTOMER, ...)` | Per-route permission check |
| `validate.ts` | Wraps Zod schema validation; returns `400 VALIDATION_ERROR` on failure | Routes with request bodies |
| `rateLimiter.ts` | Per-route rate limiting instances (e.g. OTP: 3/hour, login: 10/min) | Auth routes, payment webhooks |
| `auditLogger.ts` | Auto-inserts row into `admin_audit_logs` after any admin write action | All `/admin/*` mutating routes |
| `errorHandler.ts` | Global Express error handler; maps `AppError` to response envelope; logs unexpected errors | Registered last in `app.ts` |
| `requestLogger.ts` | Structured HTTP access logging (pino-http) | All routes |

---

## 11. Error Codes Reference

| HTTP Code | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request body/param validation failed |
| `400` | `OTP_INVALID_OR_EXPIRED` | OTP not found or expired |
| `400` | `CART_EMPTY` | Checkout attempted with empty cart |
| `400` | `MINIMUM_ORDER_NOT_MET` | Cart below restaurant's minimum order value |
| `400` | `COUPON_INVALID` | Coupon code not found |
| `400` | `COUPON_EXPIRED` | Coupon validity period passed |
| `400` | `COUPON_LIMIT_REACHED` | Per-user or total usage cap hit |
| `401` | `UNAUTHORIZED` | No or invalid JWT |
| `403` | `FORBIDDEN` | Authenticated but insufficient role |
| `403` | `REVIEW_LOCKED` | Review edit window (48h) expired |
| `404` | `NOT_FOUND` | Resource does not exist |
| `409` | `CART_RESTAURANT_CONFLICT` | Cart contains items from a different restaurant |
| `409` | `ORDER_CANNOT_BE_CANCELLED` | Order already in `preparing` or later state (BR-ORD-04) |
| `409` | `ORDER_ACCEPTANCE_WINDOW_EXPIRED` | 5-minute acceptance window passed |
| `409` | `MAX_ACTIVE_ORDERS_EXCEEDED` | Customer has 3+ active orders (BR-ORD-01) |
| `409` | `DUPLICATE_REVIEW` | Review already submitted for this order |
| `409` | `ITEM_UNAVAILABLE` | Menu item marked unavailable |
| `422` | `PAYMENT_FAILED` | Payment gateway returned failure |
| `422` | `SCHEDULED_ORDER_TOO_SOON` | Scheduled slot < 1 hour from now (BR-ORD-02) |
| `423` | `ACCOUNT_LOCKED` | Account locked after 5 failed login attempts |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |
| `503` | `PAYMENT_GATEWAY_UNAVAILABLE` | Both Razorpay and Stripe unreachable |

---

## 12. DB Table → Module Mapping

| MySQL Table | Primary Module(s) |
|---|---|
| `users` | Module 01 (Auth), Module 18 (Admin Users) |
| `user_sessions` | Module 01 (Sessions) |
| `user_social_accounts` | Module 01 (Social Login) |
| `auth_tokens` | Module 01 (Token Refresh / Logout) |
| `otp_verifications` | Module 01 (Register / Verify OTP), Module 16 (Delivery OTP) |
| `customers` | Module 02 (Customer Profile) |
| `customer_addresses` | Module 02 (Addresses), Module 06 (Checkout) |
| `customer_payment_methods` | Module 02 (Payment Methods), Module 06 (Checkout) |
| `customer_loyalty_transactions` | Module 10 (Loyalty) |
| `customer_referrals` | Module 10 (Referral) |
| `restaurant_owners` | Module 12 (Onboarding) |
| `restaurants` | Module 12 (Profile), Module 18 (Admin) |
| `restaurant_branches` | Module 03 (Discovery), Module 12 (Branches) |
| `restaurant_staff_profiles` | Module 12 (Staff), Module 14 (Orders) |
| `restaurant_operating_hours` | Module 03 (Discovery), Module 12 (Hours) |
| `admin_profiles` | Module 18 (Admin) |
| `admin_audit_logs` | Module 18 (auto-logged by middleware) |
| `menu_categories` | Module 04 (Browsing), Module 13 (Management) |
| `menu_items` | Module 04 (Browsing), Module 05 (Cart), Module 13 (Management) |
| `modifier_groups` | Module 04 (Browsing), Module 13 (Management) |
| `modifiers` | Module 04 (Browsing), Module 13 (Management) |
| `menu_item_modifier_groups` | Module 04 (Browsing), Module 13 (Management) |
| `orders` | Module 06 (Checkout), Module 07 (Tracking), Module 08 (History), Module 14 (Restaurant) |
| `order_items` | Module 06 (Checkout), Module 08 (History) |
| `order_item_modifiers` | Module 06 (Checkout), Module 08 (History) |
| `delivery_partners` | Module 16 (Delivery Portal), Module 17 (Fleet) |
| `deliveries` | Module 07 (Tracking), Module 16 (Delivery Portal), Module 17 (Fleet) |
| `delivery_issue_reports` | Module 16 (Issue Reporting) |
| `coupons` | Module 06 (Checkout), Module 10 (Promotions), Module 18 (Admin) |
| `transactions` | Module 11 (Payments) |
| `dispute_tickets` | Module 11 (Customer Disputes), Module 19 (Admin Disputes) |
| `dispute_messages` | Module 19 (Admin Disputes) |
| `refunds` | Module 11 (Refunds), Module 19 (Admin) |
| `reviews` | Module 09 (Reviews) |
| `review_photos` | Module 09 (Reviews) |
| `review_replies` | Module 09 (Reviews) |

---

*— End of Quick Bites Backend Engineering Reference v1.0 —*

*Document prepared for internal engineering team. All routes, controllers, services, and business logic are derived from FRD v1.0 (May 2026), the `quick_bites_db` SQL schema, and the API Reference v1.0.*
