# OFOS Migration Status

## Current Status Overview
- **Active Phase:** **MIGRATION COMPLETED & ACCEPTED** (All Phases 0 through 11 Verified & Approved)
- **Target Stack:** NestJS REST API, React SPA (Vite 6), PostgreSQL (`ofos_platform_dev`), Prisma 7 ORM
- **Target Database:** `ofos_platform_dev` (PostgreSQL 17 on `localhost:5432`)
- **Legacy Implementation:** Express 5 + EJS + MySQL (untouched behavioral reference in `src/`, `views/`, `prisma/`)
- **Product Name:** OFOS

---

## Phase Checklist

| Phase | Description | Status | Deliverables / Notes |
|---|---|---|---|
| **Phase 0** | Database & Environment Setup | **COMPLETED** | PostgreSQL 17 verified, `ofos_platform_dev` created, `.env` & `.env.example` configured |
| **Phase 1** | Application Inventory & Architecture Alignment | **COMPLETED** | Inventory completed, [STATUS.md](file:///E:/My%20Projects/ofos/docs/migration/STATUS.md) & [FEATURE-MAP.md](file:///E:/My%20Projects/ofos/docs/migration/FEATURE-MAP.md) created, architecture approved |
| **Phase 2** | Foundation Skeleton (Backend, Frontend, Prisma/PG) | **COMPLETED & VERIFIED** | PostgreSQL schema migrated (70 tables, 31 enums), seed executed, NestJS running on port 3000, Vite React running on port 5173 |
| **Phase 3** | Vertical Slice 1: Identity, Auth & RBAC | **COMPLETED & VERIFIED** | 23 REST endpoints implemented, JWT cookies & refresh rotation, multi-role RBAC guards, customer/owner/driver flows, React login/register/reset views, all reviewer findings resolved |
| **Phase 4** | Vertical Slice 2: Restaurant Discovery & Public Menus | **COMPLETED & VERIFIED** | Public restaurant & branch discovery, categories, dynamic modifier modal with min/max selection validation, live search & feed, zero data leakage checks, reviewer remediations applied |
| **Phase 5** | Vertical Slice 3: Restaurant Management & Operations | **COMPLETED & VERIFIED** | Owner portal & metrics, branch CRUD & multi-branch switching, operating hours schedule, delivery zones, kitchen staff roster, self-approval security gate |
| **Phase 6** | Vertical Slice 4: Cart, Coupons & Checkout | **COMPLETED & VERIFIED** | Single-restaurant branch cart enforcement, dynamic modifiers & price breakdowns, coupon application (`PERCENTAGE`, `FLAT`, `FREE_DELIVERY`, `BOGO`), customer address CRUD with default management, 15-minute checkout sessions, drawer & checkout page, reviewer remediations applied |
| **Phase 7** | Vertical Slice 5: End-to-End Order & Delivery Flow | **COMPLETED & VERIFIED** | Atomic 7-table order placement, AES-256 encrypted customer OTP, 7-step kitchen/driver state machine, auto rider assignment, IDOR protection, live tracking & kitchen Kanban views |
| **Phase 8** | Vertical Slice 6: Delivery Partner & Fleet Manager | **COMPLETED & VERIFIED** | Duty status toggle, GPS tracking points, issue reporting, earnings calculation, Fleet Manager live map, manual dispatch & reassignments |
| **Phase 9** | Vertical Slice 7: Payments, Refunds, Finance & Reviews | **COMPLETED & VERIFIED** | Payment verification, Razorpay/Stripe HMAC SHA256 signatures, customer refunds ledger & approval, weekly restaurant settlement engine, weekly rider disbursements, multi-criteria reviews & owner replies |
| **Phase 10** | Vertical Slice 8: Admin Portal & AI Assistant | **COMPLETED & VERIFIED** | User/Restaurant approvals, Tickets, Audit logs, Configs, Gemini AI Assistant, AdminDashboard & AIChatDrawer |
| **Phase 11** | End-to-End Verification & Final Cutover | **COMPLETED & ACCEPTED** | Master integration suite passed, zero legacy branding, builds clean, independent review APPROVED |
| **Production Ready** | Containerization, Hardening & Showcase | **COMPLETED & VERIFIED** | Docker Compose (4 services), Render Blueprint (`render.yaml`), GitHub Actions CI/CD, 1-Click Recruiter Demo Bar, Helmet, Throttler, sanitized error filter, dual JWT auth, enterprise README & DEPLOYMENT guide |

---

## Phase 11 Verification & Final Acceptance (End-to-End Verification & Cutover)
- **Master End-to-End Test Suite Execution (`scratch/test_master_e2e.cjs`)**:
  - Validated complete cross-domain lifecycle in a unified automated execution across all 10 slices and 7 roles.
  - Step 1: System Health & PostgreSQL 17 verification (`GET /health` -> `product: "OFOS"`, `status: "ok"`, `database: "connected"`).
  - Step 2: Multi-role authentication (Customer registration, seeded Admin, Owner, Driver, and Finance Manager logins).
  - Step 3: Discovery engine (Approved restaurants query, dynamic branch menus, dishes, and categories).
  - Step 4: Cart & Checkout (Single-restaurant isolation, 10-digit customer delivery address creation, 15-minute checkout session).
  - Step 5: Atomic Order Placement (7-table transaction with delivery OTP encryption).
  - Step 6: Kitchen Order State Machine (`ACCEPTED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `HANDOVER`).
  - Step 7: Delivery Telemetry & Verification (Driver duty toggle, assignment accept, GPS breadcrumb ingestion, out-for-delivery, and verified delivery OTP with automated COD cash ledger transaction).
  - Step 8: Customer Review & Rating (5-star multi-criteria submission with driver average rating recalculation).
  - Step 9: Finance Hub Operations (Automated weekly restaurant settlement engine with 10% platform commission deduction and weekly partner disbursement).
  - Step 10: Admin Governance & AI Assistant (Executive KPI ledger, dynamic system configuration with immutable audit logs, OFOS AI Food Assistant conversation with schema-compliant tool execution, and session reset).
- **Brand & Architectural Strictness Audit**:
  - Global source search confirmed zero occurrences of legacy product naming in new backend, frontend, configuration, or documentation files.
  - Target architecture verified: NestJS REST API, React SPA (zero server-rendered EJS), PostgreSQL 17 (`ofos_platform_dev`), Prisma 7 ORM.
## Production Hardening, Containerization & Portfolio Showcase
- **Recruiter Demo Bar (`frontend/src/components/demo/DemoBar.tsx`)**:
  - 1-click live demo switcher allowing instant testing of all 6 platform roles (`Customer`, `Restaurant Owner`, `Delivery Partner`, `Fleet Manager`, `Finance Manager`, `Platform Admin`) without manual typing or credential lookups.
  - Quick links to interactive Swagger REST API documentation (`/api/docs`).
- **Resilient Client Architecture**:
  - `frontend/src/components/common/ErrorBoundary.tsx` catching uncaught React tree exceptions with graceful recovery screen.
  - Dual Bearer token + Cookie authentication interceptors in `frontend/src/api/client.ts` guaranteeing cross-domain resilience (e.g. Vercel frontend + Render backend).
  - Modernized `frontend/index.html` with SVG favicon, responsive OpenGraph and Twitter card metadata.
- **Enterprise Security Hardening**:
  - `helmet` security headers with Content Security Policy tuned for Swagger UI and embedded previews.
  - `compression` response middleware (Gzip / Deflate).
  - `@nestjs/throttler` (120 req/min per client IP) protecting against brute force.
  - Global sanitized `AllExceptionsFilter` hiding database and internal stack traces.
- **Production Containerization**:
  - `backend/Dockerfile`: Multi-stage Alpine container running as non-root `node` user with `dumb-init` and `/health` healthcheck.
  - `frontend/Dockerfile`: Multi-stage build with Nginx 1.27 Alpine static host, SPA fallback routing, and asset caching.
  - `docker-compose.yml`: Orchestrates PostgreSQL 17, Redis 7, NestJS API, and React Frontend with healthchecks.
  - `render.yaml`: 1-click Render cloud deployment Blueprint.
- **CI/CD Pipeline**:
  - `.github/workflows/ci.yml`: Automated GitHub Actions workflow running on push and PR (Prisma validation, backend build, frontend build).
- **Documentation**:
  - Full-length, enterprise-grade `README.md` with system architecture Mermaid diagrams, engineering highlights, role workflows, and quickstart commands.
  - Comprehensive `DEPLOYMENT.md` detailing Docker Compose, Render Blueprint, and Decoupled cloud topologies.
  - All documentation synchronized in `STATUS.md` and `FEATURE-MAP.md`.

---

## Phase 10 Verification & Remediations Completed (Vertical Slice 8: Admin Portal & AI Assistant)
- **Platform Administration & KPIs (`/admin/kpis`, `/admin/overview`)**:
  - High-level platform health & operational metrics: total registered users, active users, total restaurants, pending verification count, total orders, active orders in transit, gross merchandise value (GMV), total refunds processed, and open customer support tickets.
- **User Roster & Access Control (`/admin/users`, `/admin/users/:id`)**:
  - Filter by search keywords, multi-tenant roles (`Admin`, `Restaurant_owner`, `Branch_manager`, `Delivery_partner`, `Fleet_manager`, `Finance_manager`, `Customer`), and status (`ACTIVE`, `SUSPENDED`, `LOCKED`, `DELETED`).
  - Detailed profile view with user badges, verification flags, and complete addresses list.
  - Role status assignment/suspension and account status toggling with immutable audit logging.
- **Restaurant Onboarding & Compliance Verification (`/admin/restaurants`)**:
  - List pending restaurants with business descriptions, owner user details, and branches.
  - Compliance document verification (`/admin/restaurants/:id/documents/:docId/status`) for FSSAI licenses and GSTIN certificates with reason logging.
  - Approval / Rejection actions (`/admin/restaurants/:id/status`) transitioning verification status with administrative audit notes.
- **Support Ticket Operations (`/admin/tickets`)**:
  - Customer ticket creation (`POST /admin/tickets`) with strict order ownership validation (`order.customerUserId === userId`), eliminating IDOR ticket injection.
  - Ticket query with filtering by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) and priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`, `CRITICAL`).
  - Administrative response threading (`PATCH /admin/tickets/:id/respond`) and official ticket resolution (`PATCH /admin/tickets/:id/resolve`) with resolution remarks.
- **Dynamic System Configuration Engine (`/admin/configs`, `/admin/config`)**:
  - Live runtime key-value management for platform commissions, surge multipliers, base delivery fees, and radius constraints.
  - In-place configuration creation, updates, and deletions wrapped in database transactions with comprehensive `AuditLog` generation.
- **Immutable Platform Audit Ledger (`/admin/audit-logs`)**:
  - Paginated audit log viewer detailing actor user IDs, entity types, entity IDs, administrative actions, client IP addresses, and JSON diffs of previous/new states.
- **OFOS AI Food Assistant (`/ai/chat`, `/ai/reset`)**:
  - Integration with `@google/genai` (system prompt: "You are OFOS AI Food Assistant").
  - Google GenAI function-calling tools (`search_restaurants`, `get_restaurant_details`, `get_restaurant_menu`, `search_menu_items`, `get_user_orders`, `get_user_cart`, `add_item_to_cart`, `clear_cart`, `get_restaurant_reviews`).
  - Wrapped all tool responses in Struct objects (`{ items: ... }` / `{ result: ... }`) conforming strictly to Google GenAI function response JSON Schema specifications.
  - Deep-copied conversation turns in `getHistory()` preventing cross-turn state leaks.
  - Built-in heuristic local fallback engine returning structured tags (`<restaurants>` and `<menu_items>`) when `GEMINI_API_KEY` is not defined or quota fails.
  - Conversation reset endpoint clearing user history.
- **Frontend Admin & AI SPAs**:
  - `AdminDashboard.tsx`: Comprehensive administrative console featuring KPI cards, tabbed views for Users & Roles, Restaurant Approvals & Document Auditing, Support Queue, System Configuration Engine, and Immutable Audit Ledger.
  - `AIChatDrawer.tsx`: Customer-facing floating AI food assistant drawer with Markdown rendering, interactive `<restaurants>` cards with direct navigation, and interactive `<menu_items>` cards with direct "+ Add to Cart" integration. Removed external `react-router-dom` dependency in favor of root state-based navigation callback.
  - `Navbar.tsx` & `App.tsx`: Admin navigation button protected by `Admin` role guard, and global `<AIChatDrawer onSelectRestaurant={handleSelectRestaurant} />` mounting.
  - `vite.config.ts`: Configured proxy rules for `/admin` and `/ai`.
- **Independent Review Verdict**: PASS WITH REMEDIATIONS -> All 11 reviewer findings remediated and verified with native test suites.

---

## Phase 9 Verification & Remediations Completed (Vertical Slice 7: Payments, Refunds, Finance & Reviews)
- **Online Payment Initiation & Gateway Verification (`/payments`)**:
  - All orders start with `paymentStatus: PENDING` and `paymentGatewayStatus: INITIATED`. Eliminated immediate capture bypass on placement.
  - Strict cryptographic HMAC SHA256 signature verification enforced for Razorpay payments when gateway secret is configured, preventing unauthorized `PAID` state tampering.
  - Atomic transaction verification with concurrency locks guarantees idempotency under duplicate callback submissions.
- **Cash-on-Delivery (COD) Reconciliation on Delivery**:
  - `verifyAndDeliver` in `order.service.ts` atomically transitions pending COD payment records to `PaymentGatewayStatus.CAPTURED` and records a `FinancialTransaction` entry with response code `CASH_COLLECTED`, ensuring 100% of collected cash is accounted for in platform GMV and revenue metrics.
- **Refund Lifecycle & Ledger Synchronization (`/finance/refunds`)**:
  - Customer cancellation or kitchen rejection of paid orders initiates an audit-tracked `Refund` record in `status: INITIATED` without prematurely marking order payment status as `REFUNDED`.
  - Finance Manager approval (`PATCH /finance/refunds/:id/status` -> `COMPLETED`) atomically synchronizes `Order.paymentStatus = REFUNDED`, `Payment.status = REFUNDED`, and generates ledger financial transactions.
- **Weekly Restaurant Settlements Engine (`/finance/payouts/restaurants/process-weekly`)**:
  - Tallies unpayouted delivered orders per restaurant, deducts statutory 10% platform commission, factors in GST and completed refunds.
  - Reconciled line item shares (`restaurantPayoutItem.restaurantShare`) so that sum of individual item shares strictly matches `restaurantPayout.netAmount`.
  - Concurrency guard inside atomic transaction prevents double-payout race conditions.
- **Weekly Delivery Partner Disbursements (`/finance/payouts/partners/process-weekly`)**:
  - Aggregates pending rider earnings (`PartnerEarning`), creates `PartnerPayout` disbursement records, transitions earnings status to `PAID`, and logs ledger transactions.
  - Manual status transitions (`updatePartnerPayoutStatus`, `updateRestaurantPayoutStatus`) create ledger financial transactions upon reaching `PAID`.
- **Customer Reviews & Owner Replies (`/reviews`)**:
  - Tri-criteria rating (`foodRating: 1-5`, `deliveryRating: 1-5`, `packagingRating: 1-5`), comment text, and optional photo URLs (`@ArrayMaxSize(5)`).
  - Automatically filters delivery partner assignment to `status: COMPLETED` and recalculates rider `averageRating`.
  - Public restaurant reviews query with aggregate star ratings and owner replies.
  - Owner reviews query and response posting (`POST /reviews/:reviewId/reply`).
- **Frontend SPAs & Integrations**:
  - `ReviewOrderModal.tsx`: Interactive multi-criteria star rating selector, photo attachments, and direct review submission.
  - `OrderTrackingPage.tsx`: Integrated "Rate & Review" button, persistent review status detection preventing duplicate review submissions.
  - `FinanceManagerDashboard.tsx`: Financial KPI summary cards, tabbed views for Customer Refund Ledger, Restaurant Settlements Engine, and Rider Disbursements with action controls.
  - `Navbar.tsx` & `App.tsx`: Role-based navigation for Finance Managers and Admins.
- **Independent Review Verdict**: PASS WITH REMEDIATIONS -> All 12 reviewer findings remediated and verified with native test suites.

---

## Phase 8 Verification & Remediations Completed (Vertical Slice 6: Delivery Partner & Fleet Manager)
- **Delivery Partner Duty Toggle (`updateStatus`)**: Allows active partners to toggle `isOnline` with audit tracking in `PartnerStatusLog`. Enforced account verification gate preventing unverified (`PENDING_VERIFICATION`) or suspended riders from toggling duty online.
- **Rider Telemetry & GPS Ingest (`updateLocation`)**: Restricted location ingestion to assignments strictly in `ACCEPTED` state with bounded coordinate validation (`@Min(-90) @Max(90)`, `@Min(-180) @Max(180)`).
- **Incident & Issue Reporting (`reportDeliveryIssue`)**: Logs `DeliveryEvent` with issue reason (`VEHICLE_BREAKDOWN`, `TRAFFIC_DELAY`, `CUSTOMER_UNREACHABLE`). Critical breakdowns automatically mark the active assignment `DECLINED` for dispatcher intervention.
- **Automated Earnings Credit**: Delivered orders automatically compute and credit `PartnerEarning` (base trip pay + delivery fee + tips) with `PAYABLE` status inside the atomic delivery transaction.
- **Fleet Command Live Telemetry Radar (`getLiveMap`)**: Provides aggregate KPIs (Online, In Transit, Idle, Unassigned) and full GPS coordinates of all on-duty riders. Expanded unassigned orders filter to include breakdown orders in transit (`PICKED_UP`, `OUT_FOR_DELIVERY`) that lost active rider assignments.
- **Manual Dispatch & Reassignment**:
  - `assignDelivery`: Allows Fleet Managers to manually assign unassigned orders to on-duty riders.
  - `reassignDelivery`: Atomically declines previous assignments, creates new manual assignments, and logs audit events. Added state guards preventing reassignment of completed or cancelled orders.
- **Rider Administration & Forced Suspension**: Supports updating rider account status (`ACTIVE`, `SUSPENDED`). Forced suspension sets `isOnline: false` and writes an audit log in `PartnerStatusLog`.
- **Frontend Delivery & Fleet SPAs**:
  - `DeliveryPartnerDashboard.tsx`: Duty switch, live active delivery waypoints, call restaurant/customer links, GPS pinger, report issue modal, OTP verification modal, earnings ledger.
  - `FleetManagerDashboard.tsx`: Live radar, unassigned orders queue with manual dispatch modal, live rider cards, and fleet roster management.
- **Independent Review Verdict**: PASS WITH REMEDIATIONS -> All 5 reviewer findings remediated and verified with native test suites.

---

---

## Phase 7 Verification & Remediations Completed (Vertical Slice 5: End-to-End Order & Delivery Flow)
- **Atomic Order Placement (`placeOrder`)**: Wrapped all 7 mutation operations (`tx.order.create`, `tx.orderItem.create`, `tx.orderItemModifier.create`, `tx.orderAddress.create`, `tx.payment.create`, `tx.orderStatusHistory.create`, `tx.couponUsage.create`) in an atomic Prisma transaction. Added atomic `tx.cart.updateMany` with `status: ACTIVE` check to prevent race conditions or duplicate checkouts.
- **Delivery OTP Security & Reversible Encryption**: Stored delivery OTP using AES-256-CBC reversible cipher keyed to the application secret. Plain 6-digit OTP is decrypted and exposed exclusively to authenticated customers and admins (`GET /orders/:id/tracking` and `placeOrder`), surviving page refreshes without hash degradation.
- **OTP Leakage Prevention**: Explicitly sanitized driver assignment responses in `acceptAssignment`, preventing `otpHash` or cipher text from leaking to riders.
- **IDOR / BOLA Prevention on Tracking**: Enforced strict authorization guard in `getOrderTracking` allowing access only to the ordering customer, assigned delivery partner, branch staff/owner, or platform admin; rejected unauthorized third-party tracking with 403 Forbidden.
- **7-Step Lifecycle State Machine**: Enforced sequential transitions (`PLACED` -> `ACCEPTED` -> `PREPARING` -> `READY_FOR_PICKUP` -> `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`). Automatic delivery partner assignment triggered on kitchen `READY_FOR_PICKUP`.
- **Customer Cancellation Safeguard**: Allowed customer cancellation strictly during `PLACED` state; rejected cancellation attempts after kitchen acceptance with 400 Bad Request.
- **Delivery Verification Invariant**: Enforced OTP matching in `verifyAndDeliver`. Incorrect OTPs rejected with 400; valid OTP records `deliveredAt`, sets `paymentStatus: PAID`, and increments driver delivery count.
- **Frontend Tracking & Kitchen Live Feeds**:
  - `OrderTrackingPage.tsx`: Live 7-step tracker, customer OTP card, driver contact badge, itemized breakdown, and 5s auto-polling.
  - `OrderHistoryPage.tsx`: Chronological customer order list with status badges and deep links to live tracking.
  - `KitchenOrdersManager.tsx`: Live kitchen Kanban queue tabs ("Incoming", "Cooking", "Ready for Pickup", "Dispatched") with action controls ("Accept", "Reject", "Start Cooking", "Ready", "Handover").
  - `Navbar.tsx` & `App.tsx`: Added "My Orders" customer navigation and checkout-to-tracking transition.
- **Independent Review Verdict**: PASS WITH REMEDIATIONS -> All 6 reviewer findings remediated and verified with native test suites.

---

## Phase 6 Verification & Remediations Completed
- **Direct Add for Modifier-Free Dishes:** `handleItemAddClick` in `RestaurantDetailPage.tsx` now calls `addToCart` directly for dishes without modifier groups, eliminating the silent failure bug.
- **Cross-Tenant Coupon Protection:** `createCoupon` in `CouponService` validates that non-admin restaurant owners must supply `restaurantIds` and can only create coupons for restaurants they own (`ownerUserId === userId`), preventing unauthorized platform-wide discounts or targeting competitor restaurants.
- **Isolated Tax & Discount Calculations:** 5% GST is applied exclusively to taxable food subtotal `Math.max(0, subtotal - foodDiscount) * 0.05`. Free delivery discounts waive the delivery fee without reducing food tax. Cart modifications dynamically re-verify coupon eligibility and minimum order thresholds.
- **Takeaway vs Delivery Fee Handling:** Choosing Takeaway / Pickup automatically waives the delivery fee, sets preparation duration to 15 minutes, and prevents double-discounting on checkout sessions.
- **Coupon Validation Parity:** `validateCoupon` supports all four coupon types: `PERCENTAGE`, `FLAT`, `FREE_DELIVERY`, and `BOGO`.
- **Branch-Scoped Modifier Security:** `addToCart` validates that all selected `modifierOptionId`s belong to modifier groups owned by the targeted restaurant branch.
- **Geographic Coordinate Bounds:** `latitude` and `longitude` in `CreateAddressDto` are constrained by `@Min(-90) @Max(90)` and `@Min(-180) @Max(180)`, preventing PostgreSQL `Decimal(10,8)` numeric overflow crashes.
- **Coupon Continuity in Cart State:** `getCart` returns `appliedCoupon` with its code and ID, allowing `CheckoutPage` to link active coupons to checkout sessions.
- **Session Expiration Guard:** `estimateDelivery` enforces checkout session validity (`new Date() <= session.expiresAt`).
- **Independent Review Verdict:** PASS WITH REMEDIATIONS -> All remediations applied, verified with 0 build errors across NestJS and React, and 100% of live integration tests passed.

---

## Phase 5 Verification & Remediations Completed
- **Self-Approval Privilege Escalation Blocked:** `resumeRestaurant` strictly prevents non-admin users from approving unverified (`PENDING_VERIFICATION`) or rejected (`REJECTED`) restaurants, requiring verified admin approval. `pauseRestaurant` requires existing `APPROVED` status.
- **Operating Hours Timezone Stability:** Time inputs validated with strict regex (`HH:mm:ss`), stored with explicit UTC `Z` specifiers, and deduplicated by `dayOfWeek` to eliminate timezone drift and prevent unique constraint collisions.
- **Transactional Restaurant Creation:** `createRestaurant` executes restaurant creation and initial main branch creation atomically in `prisma.$transaction()`, preventing orphaned un-branched restaurants.
- **Statutory Regulatory Fields:** `gstin` and `fssaiLicenseNumber` added to `UpdateBranchDto` and `updateBranch` logic, enabling owners to update placeholder values.
- **Delivery Zone Boundary Checks:** Added `@Max(100)` to `radiusKm` to prevent decimal overflow, and added invariant verification ensuring `minimumDeliveryTimeMinutes <= maximumDeliveryTimeMinutes`.
- **Accurate AOV Metric:** Average Order Value KPI divides revenue exclusively by paid orders (`PaymentStatus.PAID`), preventing metric deflation from cancelled or rejected orders.
- **Multi-Branch Operations in UI:** `RestaurantOwnerDashboard` includes a multi-branch selector tab bar, dynamic re-initialization of hours/zones per branch, an "Add Branch" modal, an empty-state restaurant registration flow, and a 7-day revenue trend bar chart.

---

## Phase 4 Verification & Remediations Completed
- **Modifier Selection Validation:** Customization modal enforces `isRequired`, `minSelection`, and `maxSelection` constraints. Single-select radio behavior replaces choices, multi-select checkboxes prevent selections exceeding group maximums, and item confirmation validates required counts with visible validation banners.
- **Hierarchy Safety & Data Leakage Prevention:** All public menu, dish search, and feed endpoints filter by active category, active branch (`isActive: true`, `deletedAt: null`), and approved restaurant (`status: APPROVED`, `deletedAt: null`), preventing inactive or deleted entities from appearing in discovery.
- **Ratings & Scoring Integrity:** Unreviewed restaurants return `0.0` rather than misleading default 4.5 scores. UI renders a distinct "★ New" badge for restaurants with zero reviews.
- **Filter & Search Support:** Search and listing endpoints honor `cuisine`, `minRating`, and `sort` (rating, newest). `GetGlobalMenuItemsDto` with validation decorators created for global item queries.
- **Operational Availability in UI:** Dishes with `isAvailable: false` render disabled "Sold Out" states. Branches with `isAcceptingOrders: false` render warning banners and badges.
- **Pagination & Navigation:** Top-level and metadata pagination standard `{ total, page, limit, totalPages, data, meta }` unified across backend and frontend, with page navigation controls in `RestaurantListingPage`.
- **Independent Review Verdict:** PASS WITH REMEDIATIONS -> Remediations applied and verified by clean builds and live endpoint testing.

---

## Phase 3 Verification & Remediations Completed
- **Privilege Escalation Resolved:** Unapproved admin/manager registrations assign `UserRoleStatus.REQUESTED` and do not issue tokens or cookies; login attempts while pending return 403 Forbidden.
- **Vite Proxy Activated:** Added `/auth` proxy rule to `frontend/vite.config.ts`, enabling seamless API communication from `http://localhost:5173`.
- **Account Lockout Window:** Implemented 15-minute automatic reset window for failed login attempts, preventing permanent lockout DoS.
- **Active Role Enforcement:** Fixed `RolesGuard` to strictly require `activeRole` to match `requiredRoles` when activeRole cookie is present.
- **Duplicate Checks:** Added email uniqueness check in `registerStaff`.
- **Encapsulation & Validation:** Replaced string-indexed DB queries with typed `AuthService` methods; validated `sessionId` format in session deletion.
- **Cookie Security:** Enforced matching `COOKIE_OPTIONS` on `clearCookie` and revoked DB sessions upon logout.
