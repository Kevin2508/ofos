# OFOS / Epicure Project Overview

## 1. Executive summary

This repository contains a TypeScript and Express application for a multi-role food ordering and restaurant operations platform branded **Epicure** in `package.json` and the AI prompt. The app combines server-rendered EJS pages with JSON APIs. It covers customer discovery and ordering, restaurant and branch administration, menus, delivery operations, payments and refunds, finance, reviews, loyalty, support, and admin controls.

The intended end-to-end order and delivery workflow is also described in [`flow.txt`](flow.txt). Several of its core concepts appear in the schema and services, but the implementation is not uniformly complete; the final section records evidence-based gaps and caveats.

## 2. Technology stack

| Area | Technologies found |
|---|---|
| Runtime / language | Node.js, TypeScript (ES modules, NodeNext resolution) |
| HTTP server | Express 5 |
| HTML rendering | EJS templates |
| Database | MySQL, Prisma 7 with the Prisma MariaDB adapter (`@prisma/adapter-mariadb`) |
| Cache / geo | Redis, `redis` client; JSON cache and GEO commands are wrapped in `src/services/redisService.ts` |
| Authentication | JWT in cookies, `bcrypt`/`bcryptjs`, Passport Google OAuth strategy is present but not connected to routes |
| Validation | Joi; validation schemas converted to Swagger schemas using `joi-to-swagger` |
| API documentation | `swagger-autogen`, `swagger-ui-express`, served at `/docs` |
| Uploads | Multer for files and CSV; files are served from `/uploads` |
| AI | Google GenAI (`@google/genai`) with function calling and Redis-backed chat history |
| Browser assets / CSS | Tailwind CSS 4, PostCSS, Autoprefixer, static CSS and JavaScript |
| Other libraries | Axios, cookie-parser, CORS, csv-parser, dotenv, mysql2, jsonwebtoken |

There is no dedicated React/Vue/Angular frontend in the repository. The user interface is primarily EJS-rendered HTML with static CSS/JS. `backend/` contains a small, separate CommonJS package manifest with Express and Prisma dependencies, but no source code was found there; the application entry points are at the repository root under `src/`.

## 3. Repository structure

```text
src/
  app.ts, server.ts               Express app wiring and process startup
  config/                         Environment, Prisma, Redis, Swagger setup
  middlewares/                    Authentication, validation, uploads, errors
  modules/                        Feature modules (API/controller/service/repository)
  routes/                         EJS page routes grouped by role
  services/                       Redis and periodic background work
  jobs/                           Order timeout polling job
  types/                          Express request type extensions
  swagger-output.json             Checked-in/generated API specification
prisma/
  schema.prisma                   Data model and enums
  migrations/                     SQL migration history
  seed.ts                         Database seed script
views/                            EJS pages and shared partials
public/                           CSS, JavaScript, and images
uploads/                          Runtime upload directory (content not inventoried)
schema.sql, schema/               Additional SQL schema artifacts
backfill-branches.ts              Branch backfill utility
flow.txt                          Product/workflow notes
```

Most API feature directories follow a layered pattern: `*.routes.ts` maps endpoints to middleware/controllers; `*.controller.ts` handles HTTP input/output; `*.service.ts` contains business logic; `*.repository.ts` accesses Prisma; and `*.validation.ts`, `*.dto.ts`, `*.interface.ts` define validation and data shapes. This pattern is not identical in every feature.

## 4. Startup and request flow

1. `src/server.ts` imports the Express app, calls Swagger generation, mounts Swagger UI at `/docs`, starts listening on `PORT` or `3999`, then connects Redis and starts periodic jobs.
2. `src/app.ts` configures CORS for `http://localhost:5173` with credentials, URL-encoded and JSON parsers, cookie parsing, EJS, static `public/`, and static `/uploads`.
3. `/health` returns a small JSON health response; `/users` is a simple echo endpoint.
4. API routers are mounted at the prefixes listed below. EJS page routers are mounted afterward (`/c`, `/d`, `/a`, `/ro`, `/rs`, `/fl`, `/fi`, plus root routes).
5. The error middleware is registered before the final catch-all EJS 404 handler.

## 5. Feature modules and API routes

All paths below are relative to the stated mount prefix. Authentication requirements are stated where they are explicit in the route definitions. Some routes do not attach authentication middleware at the route layer; controller behavior may add checks, so this list should not be treated as a complete authorization guarantee.

### Authentication — `/auth`

- `POST /login`, `POST /register`, `POST /register/admin`, `POST /register/restaurant-owner`, `POST /register/restaurant-staff`, `POST /register/delivery-partner`, `POST /register/fleet-manager`, `POST /register/finance-manager`
- `POST /forgot-password`, `POST /reset-password/:resetToken`
- `POST /send-otp`, `POST /verify-otp`, `POST /check-phone`, `POST /check-email`
- `GET /logout`, `GET /me`, `POST /refresh`, `POST /select-role`
- `PATCH /profile`, `POST /change-password`, `GET /sessions`, `DELETE /sessions/:id`, `DELETE /delete-account`

Uses validation on many account actions and multipart uploads for owner logos/covers and partner government-ID documents. Access and refresh tokens are handled as cookies in the auth middleware and services.

### Restaurant discovery — `/restaurant`

- `GET /`, `GET /featured`, `GET /global-menu-items`
- `GET /:id`, `GET /:id/menu`
- `GET /branch/:id`, `GET /branch/:id/menu`

### Restaurant management — `/restaurant-management`

- `POST /`, `GET /mine`, `GET /dashboard-stats`, `GET /finance-stats`
- `PATCH /:id`, `DELETE /:id`
- `POST /:id/logo`, `POST /:id/cover`, `POST /:id/documents`
- `PATCH /:id/pause`, `PATCH /:id/resume`

### Branches — `/restaurant-management/:restaurantId/branches`

- `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`
- `GET /:branchId/hours`, `PUT /:branchId/hours`, `PATCH /:branchId/hours/:dayOfWeek`
- `GET /:branchId/delivery-zone`, `PUT /:branchId/delivery-zone`

### Restaurant staff — `/restaurant-staff`

- `GET /branches/:branchId/staff`, `POST /branches/:branchId/staff`
- `PATCH /branches/:branchId/staff/:id`, `DELETE /branches/:branchId/staff/:id`

### Menu categories — `/menu-category`

- `GET /branches/:branchId/categories`, `POST /branches/:branchId/categories`
- `PATCH /branches/:branchId/categories/reorder`
- `PATCH /branches/:branchId/categories/:id`, `DELETE /branches/:branchId/categories/:id`
- `POST /branches/:branchId/categories/:id/duplicate`
- `PATCH /branches/:branchId/categories/:id/availability`

### Menu items — `/menu-item`

- `GET /categories/:categoryId/items`, `POST /categories/:categoryId/items`
- `POST /branches/:branchId/menu-items/import` (CSV)
- `GET /menu-items/:id`, `PATCH /menu-items/:id`, `DELETE /menu-items/:id`
- `POST /menu-items/:id/duplicate`
- `PATCH /menu-items/:id/availability`, `PATCH /menu-items/:id/bestseller`
- `GET /menu-items/:id/availability-schedules`, `POST /menu-items/:id/availability-schedules`, `DELETE /menu-items/:id/availability-schedules/:scheduleId`
- `POST /menu-items/:id/images`, `DELETE /menu-items/:id/images/:imageId`

### Modifiers — `/modifier`

- `GET /branches/:id`
- `POST /branches/:id/modifier-group`, `PATCH /branches/modifier-groups/:id`, `DELETE /modifier-groups/:id`
- `POST /modifier-groups/:groupId/options`, `PATCH /modifier-options/:id`, `DELETE /modifier-options/:id`
- `POST /menu-items/:itemId/modifier-groups`, `DELETE /menu-items/:itemId/modifier-groups/:groupId`

### Customer profile, preferences, and discovery — `/customer`

- Addresses: `GET /address`, `POST /addresses`, `GET /addresses/:id`, `PATCH /addresses/:id`, `DELETE /addresses/:id`, `PATCH /address/:id`
- Profile and security: `POST /setup-profile`, `GET /profile-data`, `POST /change-password`, `GET /sessions`, `DELETE /sessions/:id`
- Preferences: `GET /preferences`, `PATCH /preferences`
- Payment methods: `GET /payment-methods`, `POST /payment-methods`, `DELETE /payment-methods/:id`
- Discovery: `GET /feed`, `GET /search`, `GET /search/suggestions`

### Cart — `/cart`

- `GET /`, `POST /items`, `PATCH /items/:itemId`, `DELETE /items/:itemId`, `DELETE /`
- `POST /apply-coupon`, `DELETE /coupon`, `GET /price-breakdown`

### Checkout — `/checkout` (router applies authentication to all routes)

- `POST /initiate`, `GET /:sessionId`
- `POST /:sessionId/estimate-delivery`, `POST /:sessionId/place-order`

### Orders — `/orders`

- `GET /`, `GET /:id`, `GET /:id/tracking`, `POST /`, `POST /:id/reorder`
- `PATCH /:id/cancel`, `POST /:id/dispute`
- Restaurant-side: `GET /restaurant`, `GET /restaurant/:id`
- Staff workflow: `PATCH /:id/accept`, `/reject`, `/preparing`, `/ready`, `/items/:itemId/unavailable`, `/handover`

Order endpoints use authentication middleware; staff workflow endpoints also check owner/staff roles.

### Payments and refunds — `/payments`, `/refund`

- Payments: `POST /initiate`, `POST /verify`, `GET /:orderId`
- Refunds: `POST /`, `GET /:orderId`, `GET /`, `PATCH /:refundId/status`

### Coupons and loyalty — `/coupons`, `/loyalty`

- Coupons: `POST /validate`, `POST /`, `GET /`, `PATCH /:id`, `DELETE /:id`, `GET /:id/usage`
- Restaurant coupons: `GET /restaurant-coupons`, `POST /restaurant-coupons`, `PATCH /restaurant-coupons/:id`, `DELETE /restaurant-coupons/:id`
- Loyalty: `GET /`, `POST /apply`, `POST /remove`

### Reviews — `/reviews`

- `GET /restaurants/:restaurantId`, `POST /orders/:orderId`
- `GET /owner`, `POST /:reviewId/reply`

Review submission explicitly requires Customer role and supports up to three uploaded images. Owner review listing/replies require Restaurant_owner.

### Delivery partner — `/delivery-partner` (router requires authenticated Delivery_partner role)

- `GET /profile`, `PATCH /update/profile`, `PATCH /update/status`, `POST /documents`
- `GET /assignments/all`, `GET /assignments/:assignmentId`
- `PATCH /assignments/:assignmentId/accept`, `/decline`, `/pickup`, `/out-for-delivery`, `/deliver`
- `POST /assignments/:assignmentId/report-issue`, `POST /assignments/:assignmentId/location`
- `GET /earnings`, `GET /earnings/history`, `GET /performance`

### Fleet manager — `/fleet-manager` (router requires authenticated Fleet_manager role)

- `GET /delivery-partners/all`, `GET /delivery-partner/:id`, `PATCH /delivery-partner/:id/update/status`
- `GET /all/assignments`, `POST /:orderId/assign`, `PATCH /:id/reassign`, `GET /live-map`

### Finance — `/finance`

- `GET /overview`
- `GET /payouts/restaurants`, `PATCH /payouts/restaurants/:id/status`
- `GET /payouts/partners`, `PATCH /payouts/partners/:id/status`, `POST /payouts/partners/process-weekly`
- `GET /refunds`, `PATCH /refunds/:id/status`

### Admin — `/admin`

- Users: `GET /users`, `GET /user/:id`, plus user status/role update actions
- Restaurants: `GET /restaurants/pending`, `GET /restaurants`, plus restaurant decision/status actions
- Configuration: `GET /config`, `PATCH /config`, and configuration create/delete actions
- Audit/support: `GET /audit-logs`, `GET /tickets`, `PATCH /tickets/:id/respond`, `PATCH /tickets/:id/resolve`
- Finance and content: `POST /disputes/refund`, coupon CRUD, `PATCH /menu/:id/override`, `PATCH /hours/:id/override`
- Reporting: `GET /kpis`, `GET /reports/finance`, `GET /reports/heatmap`

The exact paths for some admin mutation routes are spread across multiline route declarations; consult [`admin.routes.ts`](src/modules/admin/admin.routes.ts) for the definitive source.

### AI assistant — `/api/ai`

- `POST /chat`, `POST /reset`

The assistant can search restaurants and food, fetch restaurant details/menus/reviews, read customer order/cart data, and add or clear cart items through server-side function calls. Chat history is cached in Redis with a one-hour TTL.

## 6. Server-rendered page routes

Page routers render EJS templates; they are not the JSON API routes above.

- Root/auth pages: `/loginPage`, `/forgotPasswordPage`, `/resetPasswordPage`, `/registerPage` and role-specific registration pages, `/phone-otp`, `/setup-profile`, `/role-selection`, `/apply-role`
- Default pages: `/pendingVerificationPage`, `/email-simulation`, `/phone-simulation`
- User browsing: `/`, `/restaurant/:id`, `/branchPage/:id`
- Customer (`/c`): cart, checkout, restaurants, tracking, order confirmation, order list/detail, profile
- Delivery partner (`/d`): dashboard, assignments, earnings, profile
- Admin (`/a`): dashboard, users, restaurants, orders, configs, audit logs, tickets, coupons, financial reports, heatmap
- Restaurant owner (`/ro`): dashboard, restaurants, orders, menu, profile, reviews, finance, promotions
- Restaurant staff (`/rs`): dashboard, orders, profile
- Fleet manager (`/fl`): dashboard, partners, assignments, profile
- Finance (`/fi`): dashboard, restaurant payouts, partner payouts, refunds, profile

## 7. Database/domain model

The Prisma schema targets MySQL and generates its client under `src/generated/prisma`. It defines the following model groups:

- **Identity and access:** `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `UserSession`, `OtpVerification`
- **Restaurants and menus:** `Restaurant`, `RestaurantBranch`, `RestaurantDocument`, `RestaurantOperatingHour`, `RestaurantDeliveryZone`, `RestaurantStaff`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `MenuItemModifierGroup`, `MenuItemAvailability`, `MenuItemImage`
- **Customer profile:** `CustomerProfile`, `CustomerAddress`, `CustomerPreference`, `CustomerNotificationPreference`, `CustomerPaymentMethod`, `CustomerFavoriteRestaurant`
- **Cart and checkout:** `Cart`, `CartItem`, `CartItemModifier`, `CheckoutSession`, `CartPriceBreakdown`
- **Orders and payments:** `Order`, `OrderAddress`, `OrderItem`, `OrderItemModifier`, `OrderStatusHistory`, `OrderCancellation`, `OrderEvent`, `Payment`, `PaymentEvent`, `Refund`, `FinancialTransaction`
- **Promotions and retention:** `Coupon`, `CouponRestaurant`, `CouponUsage`, `LoyaltyAccount`, `LoyaltyTransaction`, `Referral`
- **Delivery:** `DeliveryPartner`, `DeliveryPartnerDocument`, `PartnerStatusLog`, `DeliveryAssignment`, `DeliveryTrackingPoint`, `DeliveryEvent`, `PartnerEarning`
- **Feedback and support:** `Review`, `ReviewImage`, `ReviewReply`, `ReviewItem`, `SupportTicket`, `SupportMessage`, `SupportAttachment`
- **Finance and administration:** `RestaurantPayout`, `RestaurantPayoutItem`, `PartnerPayout`, `PartnerPayoutItem`, `AuditLog`, `SystemConfiguration`, `ReportExport`

Key enums include user and role status, OTP purpose, restaurant and document verification status, food type, cart/order/payment/refund status, coupon and loyalty transaction types, delivery assignment and earnings status, support ticket classification, and payout status. The schema includes BigInt identifiers, mapped snake_case SQL columns/table names, relational indexes, monetary Decimal columns, and JSON fields for event/audit data.

The repository has 11 Prisma migration directories from the initial migration through July 2026, including role status, OTP datatype/purpose, assignment status, delivery partner status, and optional email changes. `schema.sql` and `schema/INDEX2.SQL` are additional SQL artifacts; Prisma's declared source of truth is `prisma/schema.prisma`.

## 8. Background jobs and external integrations

- **Order timeout worker:** `src/jobs/orderTimeout.job.ts` polls once a minute and calls `processPendingOrderTimeouts()` from the order service.
- **Periodic service jobs:** `src/services/cronService.ts` checks once per minute for restaurant branches whose pause timer expired; also auto-rejects placed orders older than five minutes and creates a refund record for captured payments. A third timer processes pending delivery partner earnings every five minutes.
- **Redis:** used for AI history/cache and GEO helpers (partner proximity/location features). Connection starts after the HTTP listener begins.
- **Google GenAI:** food assistant with eight declared tools; operations call existing restaurant/order/cart/review services.
- **Google OAuth:** Passport strategy is defined in `auth/google.passport.ts`, but its auth endpoints/middleware are not mounted in `app.ts` or `auth.routes.ts` (the Google route is commented out).
- **Payments:** payment service creates internal provider IDs and accepts a client verification result. No gateway SDK, gateway HTTP integration, or webhook route is evident in the inspected payment implementation.
- **Email/SMS/push:** template and simulation pages exist; periodic payout logs describe SMS/push and bank transfer, but those log statements are not delivery integrations.

## 9. Build and developer commands

From the root package:

- `npm run dev` — run `src/server.ts` with `tsx --watch`
- `npm run build` — TypeScript build command (configured with `noEmit: true`)
- `npm run seed` — run Prisma seed via `tsx`
- `npm run swagger` — generate Swagger output
- `npm run dev:swagger` — generate Swagger, then start dev server
- `npm run build:css` — run PostCSS in watch mode
- `npm start` — configured as `node src/server.js`; the repository entry source is TypeScript, so this script expects a JS file that is not present in the listed source tree

The package's `test` script is a placeholder that exits with an error; no project test suite is configured in the inspected package manifest. TypeScript strict checks are enabled, including `noImplicitReturns` and `noUnusedLocals`.

## 10. Workflow coverage compared with `flow.txt`

The flow notes describe: restaurant accept/reject, preparation, nearby partner dispatch with reassignment and fleet escalation, live customer tracking, delivery OTP, delivery issue reporting, and customer rating that updates item/branch/partner ratings.

| Workflow requirement | Evidence in current project | Assessment |
|---|---|---|
| Restaurant accepts/rejects, prepares, marks ready, handover | Order status endpoints and order status/history/event models | Implemented in API surface; exact customer-side polling/UI behavior is not established by route declarations alone |
| Assign delivery partner; accept/decline and escalate | Fleet assign/reassign routes, partner accept/decline routes, delivery assignments | Assignment flows exist; automatic retry count and escalation after exactly two declines need verification in service logic |
| Nearby online partner search / live location | Redis GEO helper, partner location endpoint, fleet live-map endpoint, tracking-point model | Building blocks exist; no map SDK/client integration identified in package or public assets inventory |
| Customer sees order tracking | `GET /orders/:id/tracking`, customer tracking page, delivery tracking model | Tracking surfaces exist; live push transport is not evidenced (no WebSocket dependency found; polling is described in `flow.txt`) |
| Delivery OTP validation | OTP verification infrastructure exists generally, but delivery-specific OTP field/check is not apparent in the model list or delivery route names | Not confirmed; inspect order service/controller before relying on it |
| Partner reports delivery issue visible to fleet manager | `POST /delivery-partner/assignments/:assignmentId/report-issue`, support/event models, fleet assignment views | Issue reporting API exists; a specific issue review/queue in fleet manager is not clear from route list |
| Post-delivery rating for order/partner/restaurant/items | Review model has order, partner, restaurant and item-level ratings; review submission API and owner reply API exist | Rating capture is represented; automatic recalculation/persistence of aggregate ratings should be checked in review service |

These are a source inspection summary, not an execution-based feature test.

## 11. Notable implementation caveats

These observations are intended to guide follow-up work; they are not a complete security or code quality audit.

1. **Swagger output paths differ:** `src/config/swagger.ts` writes `./swagger-output.json` at the working directory, while `src/server.ts` imports `./config/swagger-output.json`. Verify that generation updates the file actually served.
2. **Server start script mismatch:** `npm start` points to `src/server.js`, but checked-in source and dev command use `src/server.ts`; build configuration also has `noEmit: true`.
3. **Cookie signing key is hard-coded:** `app.ts` passes literal `'secret'` to `cookieParser`, while refresh cookies are read as signed cookies. Production should source this key from configuration.
4. **Auth conventions are uneven:** some API routers enforce authentication and roles centrally, while other routes omit route-level authentication. Review controllers and all mutation paths before exposing the app publicly.
5. **Payment gateway is a stub-like flow:** provider IDs are generated locally, and verification is based on a request payload; there is no visible provider signature verification/webhook integration in the inspected service.
6. **Scheduled payout behavior is demo-oriented:** the cron comment explicitly says weekly payouts run every five minutes for development/demo. Its “bank transfer” and notification operations are console logs.
7. **Redis is required during startup path:** Redis connection is initiated when the server starts; readiness/failure handling should be considered for deployments without Redis.
8. **Separate backend directory appears unused:** its package manifest has no implementation files in the repository listing. Root `src/` is the active backend.
9. **Documentation is sparse:** root `README.md` is empty, and `flow.txt` is a workflow note rather than setup/API documentation.

## 12. Configuration variables

`src/config/env.ts` reads `PORT`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`. Other code reads database credentials, Redis host/port/password, `JWT_ACCESS_SECRET`, and `NODE_ENV` directly from `process.env`. `prisma.config.ts` expects `DATABASE_URL`. `flow.txt` also mentions `POLLING_INTERVAL_MS=5000`; its use should be checked in the browser/client implementation. Actual `.env` values are intentionally not reproduced here.

---

**Generated from repository source inspection.** File paths and endpoint behavior can change; use route files, controllers, services, and `prisma/schema.prisma` as the authoritative implementation references.
