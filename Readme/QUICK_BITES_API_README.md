# Quick Bites — Backend API Reference

> **Version:** 1.0  
> **Status:** Draft — For Internal Development Use  
> **Platform:** Online Food Ordering System (OFOS)  
> **Base URL:** `https://api.quickbites.in/v1`  
> **Prepared For:** Backend Engineering Team  
> **Classification:** Confidential — Internal Use Only

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Authentication Strategy](#3-authentication-strategy)
4. [Global Standards & Conventions](#4-global-standards--conventions)
5. [API Modules Summary](#5-api-modules-summary)
6. [Module 01 — Auth & Sessions](#module-01--auth--sessions)
7. [Module 02 — Customer Profile & Addresses](#module-02--customer-profile--addresses)
8. [Module 03 — Restaurant Discovery & Search](#module-03--restaurant-discovery--search)
9. [Module 04 — Menu Browsing](#module-04--menu-browsing)
10. [Module 05 — Cart](#module-05--cart)
11. [Module 06 — Checkout & Orders](#module-06--checkout--orders)
12. [Module 07 — Real-Time Order Tracking](#module-07--real-time-order-tracking)
13. [Module 08 — Order History & Reordering](#module-08--order-history--reordering)
14. [Module 09 — Reviews & Ratings](#module-09--reviews--ratings)
15. [Module 10 — Promotions, Coupons & Loyalty](#module-10--promotions-coupons--loyalty)
16. [Module 11 — Payments & Refunds](#module-11--payments--refunds)
17. [Module 12 — Restaurant Onboarding & Profile](#module-12--restaurant-onboarding--profile)
18. [Module 13 — Menu Management (Restaurant)](#module-13--menu-management-restaurant)
19. [Module 14 — Order Management (Restaurant)](#module-14--order-management-restaurant)
20. [Module 15 — Restaurant Analytics & Finance](#module-15--restaurant-analytics--finance)
21. [Module 16 — Delivery Partner Portal](#module-16--delivery-partner-portal)
22. [Module 17 — Fleet Manager](#module-17--fleet-manager)
23. [Module 18 — Admin — User & Restaurant Management](#module-18--admin--user--restaurant-management)
24. [Module 19 — Admin — Dispute & Refund Management](#module-19--admin--dispute--refund-management)
25. [Module 20 — Admin — Platform Analytics & Config](#module-20--admin--platform-analytics--config)
26. [Module 21 — Notifications](#module-21--notifications)
27. [WebSocket Events Reference](#websocket-events-reference)
28. [Error Codes Reference](#error-codes-reference)
29. [Database Table → API Mapping](#database-table--api-mapping)

---

## 1. Project Overview

Quick Bites is a multi-sided food ordering platform connecting **customers**, **restaurants**, **delivery partners**, and **administrators**. The backend exposes a RESTful API consumed by four distinct portals:

| Portal | Primary Users |
|---|---|
| Customer Portal | Customers, Guest Users |
| Restaurant Portal | Restaurant Owners, Restaurant Staff |
| Delivery Partner Portal | Delivery Partners, Fleet Managers |
| Admin Portal | Platform Admins, Finance Managers |

All APIs follow REST conventions. Real-time features (order tracking, delivery GPS, order status push) are handled via **WebSocket** connections.

---

## 2. Architecture & Tech Stack

| Layer | Technology |
|---|---|
| API Framework | Node.js (Express) — primary services |
| ML/Recommendation | Python (FastAPI) |
| Primary Database | MySQL (InnoDB, utf8mb4) |
| Cache / Sessions / Cart | Redis |
| Search Engine | Elasticsearch |
| Message Queue | RabbitMQ |
| File Storage | AWS S3 + CloudFront CDN |
| Payment Gateways | Razorpay (India), Stripe (International) |
| Maps & Routing | Google Maps Platform (Directions API, Distance Matrix API) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| SMS | Twilio |
| Email | SendGrid |
| Auth | JWT (Access + Refresh tokens), OAuth 2.0 (Google, Facebook) |
| Real-Time | WebSocket (Socket.IO or native WS) |

### Service Boundaries

```
api.quickbites.in/v1
        │
        ├── /auth                  → Auth Service
        ├── /customers             → Customer Service
        ├── /restaurants           → Catalog Service
        ├── /search                → Search Service (Elasticsearch)
        ├── /cart                  → Cart Service (Redis-backed)
        ├── /orders                → Order Service
        ├── /deliveries            → Delivery Service
        ├── /payments              → Payment Service
        ├── /reviews               → Review Service
        ├── /promotions            → Promotions Service
        ├── /notifications         → Notification Service
        └── /admin                 → Admin Service
```

---

## 3. Authentication Strategy

### JWT Token Pair

Every authenticated request must include the access token in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

| Token | Expiry | Storage |
|---|---|---|
| Access Token | 15 minutes | Memory / HTTP-only cookie |
| Refresh Token | 30 days of inactivity | `auth_tokens` table (hashed) |

### Role Enum (from `users.role`)

```
customer | restaurant_owner | restaurant_staff |
delivery_partner | fleet_manager | platform_admin | finance_manager
```

Each route specifies which roles are permitted under `Roles Allowed`.

### OAuth 2.0

Social sign-in flows (Google, Facebook) use the standard OAuth 2.0 authorization code flow. Provider tokens are exchanged server-side and stored in `user_social_accounts`.

---

## 4. Global Standards & Conventions

### Request Format
- Content-Type: `application/json`
- Date fields: ISO 8601 (`2026-05-01T10:30:00Z`)
- Currency: amounts in **paise** (integer) for Razorpay, **smallest unit** for Stripe; display layer converts
- Coordinates: `{ "lat": 23.0225, "lng": 72.5714 }`

### Response Envelope

All responses follow this envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  },
  "message": "Optional human-readable message"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "mobile_number is required",
    "details": [ ... ]
  }
}
```

### Pagination

All list endpoints support:

| Query Param | Default | Description |
|---|---|---|
| `page` | 1 | Page number |
| `per_page` | 20 | Items per page (max 100) |
| `sort_by` | varies | Field to sort by |
| `sort_dir` | `desc` | `asc` or `desc` |

### Soft Deletes

Tables with `deleted_at` column use soft deletes. Deleted records are excluded from all list queries unless `?include_deleted=true` is passed (admin-only).

---

## 5. API Modules Summary

| # | Module | Route Prefix | # Routes | DB Tables Involved |
|---|---|---|---|---|
| 01 | Auth & Sessions | `/auth` | 11 | `users`, `auth_tokens`, `otp_verifications`, `user_social_accounts`, `user_sessions` |
| 02 | Customer Profile & Addresses | `/customers` | 10 | `customers`, `customer_addresses`, `customer_payment_methods` |
| 03 | Restaurant Discovery & Search | `/restaurants`, `/search` | 8 | `restaurants`, `restaurant_branches`, `restaurant_operating_hours` |
| 04 | Menu Browsing | `/restaurants/:id/menu` | 5 | `menu_categories`, `menu_items`, `modifier_groups`, `modifiers` |
| 05 | Cart | `/cart` | 6 | Redis (cart state), `menu_items` |
| 06 | Checkout & Orders | `/orders` | 7 | `orders`, `order_items`, `order_item_modifiers`, `coupons`, `transactions` |
| 07 | Real-Time Tracking | `/orders/:id/track` + WS | 3 | `orders`, `deliveries`, `delivery_partners` |
| 08 | Order History & Reordering | `/orders/history` | 5 | `orders`, `order_items` |
| 09 | Reviews & Ratings | `/reviews` | 6 | `reviews`, `review_photos`, `review_replies` |
| 10 | Promotions, Coupons & Loyalty | `/promotions`, `/loyalty` | 8 | `coupons`, `customer_loyalty_transactions`, `customer_referrals` |
| 11 | Payments & Refunds | `/payments` | 6 | `transactions`, `refunds`, `dispute_tickets` |
| 12 | Restaurant Onboarding & Profile | `/restaurant-portal/profile` | 8 | `restaurants`, `restaurant_branches`, `restaurant_operating_hours`, `restaurant_owners` |
| 13 | Menu Management (Restaurant) | `/restaurant-portal/menu` | 12 | `menu_categories`, `menu_items`, `modifier_groups`, `modifiers` |
| 14 | Order Management (Restaurant) | `/restaurant-portal/orders` | 8 | `orders`, `order_items` |
| 15 | Restaurant Analytics & Finance | `/restaurant-portal/analytics` | 7 | `orders`, `transactions`, `reviews` |
| 16 | Delivery Partner Portal | `/delivery` | 10 | `delivery_partners`, `deliveries`, `delivery_issue_reports` |
| 17 | Fleet Manager | `/fleet` | 5 | `deliveries`, `delivery_partners` |
| 18 | Admin — Users & Restaurants | `/admin/users`, `/admin/restaurants` | 10 | `users`, `restaurants`, `admin_profiles`, `admin_audit_logs` |
| 19 | Admin — Disputes & Refunds | `/admin/disputes` | 7 | `dispute_tickets`, `dispute_messages`, `refunds` |
| 20 | Admin — Analytics & Config | `/admin/analytics`, `/admin/config` | 10 | `admin_audit_logs`, `coupons`, all reporting tables |
| 21 | Notifications | `/notifications` | 4 | (FCM / Twilio / SendGrid integrations) |
| **Total** | | | **~156 routes** | |

---

## Module 01 — Auth & Sessions

**Route Prefix:** `/auth`  
**DB Tables:** `users`, `auth_tokens`, `otp_verifications`, `user_social_accounts`, `user_sessions`  
**FRD References:** CUST-FR-001 to 008

---

### POST `/auth/register`

**Description:** New customer self-registration. Creates a `users` record and a `customers` profile. Triggers OTP SMS to mobile number.

**Roles Allowed:** Public (no token required)

**Request Body:**
```json
{
  "display_name": "Ravi Shah",
  "email": "ravi@example.com",
  "mobile_number": "+919876543210",
  "password": "SecurePass@123"
}
```

**Business Logic:**
- Validate email uniqueness against `users.email`
- Validate mobile uniqueness against `users.mobile_number`
- Hash password with bcrypt (cost factor ≥ 12)
- Insert `users` row with `role = 'customer'`, `is_active = false`
- Insert `customers` row with default preferences
- Generate 6-digit OTP, store in `otp_verifications` with `purpose = 'registration'`, `expires_at = NOW() + 60 seconds`
- Dispatch OTP SMS via Twilio
- Return `user_id` and `requires_otp_verification: true`

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "user_id": 1001,
    "requires_otp_verification": true,
    "message": "OTP sent to +91987654****"
  }
}
```

---

### POST `/auth/verify-otp`

**Description:** Verifies the 6-digit OTP sent during registration or login. Activates account on first use.

**Roles Allowed:** Public

**Request Body:**
```json
{
  "mobile_number": "+919876543210",
  "otp_code": "482910",
  "purpose": "registration"
}
```

**Business Logic:**
- Query `otp_verifications` for matching `mobile_number + otp_code + purpose` where `is_verified = false AND expires_at > NOW()`
- If not found → `400 OTP_INVALID_OR_EXPIRED`
- Mark `is_verified = true`
- If `purpose = 'registration'` → set `users.is_active = true`
- Issue access token + refresh token pair
- Create `auth_tokens` row with hashed refresh token, `expires_at = NOW() + 30 days`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "dGhp...",
    "expires_in": 900,
    "user": {
      "user_id": 1001,
      "role": "customer",
      "display_name": "Ravi Shah"
    }
  }
}
```

---

### POST `/auth/login`

**Description:** Login with email/mobile + password.

**Roles Allowed:** Public

**Request Body:**
```json
{
  "identifier": "ravi@example.com",
  "password": "SecurePass@123",
  "device_info": "Chrome 124 / Windows 11"
}
```

**Business Logic:**
- Look up user by `email` or `mobile_number`
- If `locked_until > NOW()` → `423 ACCOUNT_LOCKED`, return unlock info
- Compare bcrypt hash
- On failure → increment `failed_login_attempts`; if reaches 5 → set `locked_until = NOW() + 30 minutes`, send unlock email
- On success → reset `failed_login_attempts = 0`, issue token pair
- Create `user_sessions` row and `auth_tokens` row

**Response `200`:** Same as `/auth/verify-otp` success response.

---

### POST `/auth/social-login`

**Description:** Google or Facebook OAuth sign-in. Creates account if first time.

**Roles Allowed:** Public

**Request Body:**
```json
{
  "provider": "google",
  "provider_token": "ya29.a0AfH6...",
  "device_info": "Safari / iPhone"
}
```

**Business Logic:**
- Exchange `provider_token` with Google/Facebook API to get `provider_user_id`, email, name
- Check `user_social_accounts` for existing record
- If not found → create `users` + `customers` + `user_social_accounts` row
- Issue token pair

---

### POST `/auth/refresh-token`

**Description:** Exchange a valid refresh token for a new access token.

**Roles Allowed:** Any authenticated user (via refresh token)

**Request Body:**
```json
{ "refresh_token": "dGhp..." }
```

**Business Logic:**
- Hash incoming token, look up in `auth_tokens` where `is_revoked = false AND expires_at > NOW()`
- Issue new access token (15 min)
- Rotate refresh token (update `auth_tokens` row)

---

### POST `/auth/logout`

**Description:** Revokes the current session's refresh token.

**Roles Allowed:** All authenticated roles

**Request Body:**
```json
{ "refresh_token": "dGhp..." }
```

**Business Logic:**
- Set `auth_tokens.is_revoked = true` for the matching hashed token
- Delete corresponding `user_sessions` row

---

### POST `/auth/forgot-password`

**Description:** Sends a time-limited (15 min) password reset link to registered email.

**Roles Allowed:** Public

**Request Body:**
```json
{ "email": "ravi@example.com" }
```

**Business Logic:**
- Look up `users` by email
- Generate a signed JWT (sub = user_id, exp = 15 min) as reset token
- Send reset link email via SendGrid: `https://quickbites.in/reset-password?token=<jwt>`
- Always return `200` regardless of whether email exists (prevent enumeration)

---

### POST `/auth/reset-password`

**Description:** Resets password using the secure token from the reset email.

**Roles Allowed:** Public

**Request Body:**
```json
{
  "reset_token": "eyJ...",
  "new_password": "NewSecure@456"
}
```

**Business Logic:**
- Verify JWT signature and expiry
- Hash new password, update `users.password_hash`
- Revoke all existing `auth_tokens` for the user (force re-login everywhere)

---

### GET `/auth/sessions`

**Description:** Lists all active sessions for the authenticated user.

**Roles Allowed:** `customer`, `restaurant_owner`, `delivery_partner`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "session_id": "uuid-here",
      "device_name": "Chrome / MacBook",
      "ip_address": "103.x.x.x",
      "last_activity_at": "2026-05-30T14:22:00Z",
      "is_current": true
    }
  ]
}
```

---

### DELETE `/auth/sessions/:session_id`

**Description:** Terminates a specific session (from another device).

**Roles Allowed:** `customer`, `restaurant_owner`, `delivery_partner`

**Business Logic:**
- Verify `user_sessions.user_id` matches authenticated user
- Delete `user_sessions` row
- Revoke corresponding `auth_tokens` row

---

### POST `/auth/resend-otp`

**Description:** Resends OTP to mobile number (rate-limited: max 3/hour per mobile).

**Roles Allowed:** Public

**Request Body:**
```json
{
  "mobile_number": "+919876543210",
  "purpose": "registration"
}
```

---

## Module 02 — Customer Profile & Addresses

**Route Prefix:** `/customers`  
**DB Tables:** `customers`, `customer_addresses`, `customer_payment_methods`  
**FRD References:** CUST-FR-009 to 014

---

### GET `/customers/me`

**Description:** Fetches the authenticated customer's full profile.

**Roles Allowed:** `customer`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user_id": 1001,
    "display_name": "Ravi Shah",
    "email": "ravi@example.com",
    "mobile_number": "+919876543210",
    "profile_photo_url": "https://cdn.quickbites.in/...",
    "dietary_preference": "vegetarian",
    "communication_email": true,
    "communication_sms": true,
    "communication_push": true,
    "loyalty_points_balance": 250
  }
}
```

---

### PATCH `/customers/me`

**Description:** Updates profile fields (name, photo, dietary preference, communication preferences).

**Roles Allowed:** `customer`

**Request Body (all fields optional):**
```json
{
  "display_name": "Ravi K. Shah",
  "dietary_preference": "vegan",
  "communication_push": false
}
```

---

### POST `/customers/me/photo`

**Description:** Uploads profile photo to S3, updates `customers.profile_photo_url`.

**Roles Allowed:** `customer`

**Request:** `multipart/form-data`, field `photo` (max 5 MB, JPEG/PNG/WebP)

---

### GET `/customers/me/addresses`

**Description:** Lists all saved delivery addresses.

**Roles Allowed:** `customer`

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "label": "home",
      "address_line_1": "301, Shivalay Apt",
      "address_line_2": "Near Paldi Cross Roads",
      "city": "Ahmedabad",
      "postal_code": "380007",
      "coordinates": { "lat": 23.0225, "lng": 72.5714 },
      "is_default": true
    }
  ]
}
```

---

### POST `/customers/me/addresses`

**Description:** Adds a new delivery address. Supports manual entry, GPS coordinates, or Google Places.

**Roles Allowed:** `customer`

**Request Body:**
```json
{
  "label": "work",
  "address_line_1": "701, Safal Profitaire",
  "address_line_2": "Corporate Road, Prahlad Nagar",
  "city": "Ahmedabad",
  "postal_code": "380015",
  "coordinates": { "lat": 23.0352, "lng": 72.5073 },
  "is_default": false
}
```

**Business Logic:**
- Store `coordinates` as MySQL `POINT` with SRID 4326
- If `is_default = true` → set all other addresses for this customer to `is_default = false`
- Max 10 addresses per customer (soft limit, return `400` if exceeded)

---

### PUT `/customers/me/addresses/:address_id`

**Description:** Updates an existing address.

**Roles Allowed:** `customer`

---

### DELETE `/customers/me/addresses/:address_id`

**Description:** Soft-deletes an address (physically deletes from `customer_addresses`).

**Roles Allowed:** `customer`

**Business Logic:**
- Verify address belongs to authenticated customer
- Cannot delete address currently in use by an active order

---

### PATCH `/customers/me/addresses/:address_id/set-default`

**Description:** Sets an address as the default delivery address.

**Roles Allowed:** `customer`

---

### GET `/customers/me/payment-methods`

**Description:** Lists saved payment methods.

**Roles Allowed:** `customer`

---

### DELETE `/customers/me/payment-methods/:method_id`

**Description:** Removes a saved payment method (sets `status = 'removed'`).

**Roles Allowed:** `customer`

---

## Module 03 — Restaurant Discovery & Search

**Route Prefix:** `/restaurants`, `/search`  
**DB Tables:** `restaurants`, `restaurant_branches`, `restaurant_operating_hours`  
**FRD References:** CUST-FR-015 to 023

---

### GET `/restaurants`

**Description:** Returns the personalized homepage feed of restaurants deliverable to the customer's active address.

**Roles Allowed:** `customer` (guest gets generic list)

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `lat` | float | Customer latitude (required) |
| `lng` | float | Customer longitude (required) |
| `page` | int | Pagination |
| `per_page` | int | Default 20 |

**Business Logic:**
- Filter branches using `ST_CONTAINS(delivery_radius_polygon, POINT(lng, lat))` spatial query
- Annotate with operating hours → `is_open` flag
- Sort by composite relevance score (order history weight + rating + proximity)
- Include homepage sections: `top_picks`, `trending_this_week`, `order_again` for returning customers

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "section_type": "order_again",
        "title": "Order Again",
        "restaurants": [ { ... } ]
      },
      {
        "section_type": "top_picks",
        "title": "Top Picks Near You",
        "restaurants": [ { ... } ]
      }
    ],
    "all_restaurants": [ { ... } ]
  }
}
```

Each restaurant object:
```json
{
  "branch_id": 12,
  "restaurant_id": 4,
  "business_name": "Honest by Anupam",
  "branch_name": "Satellite Branch",
  "primary_cuisine": "Gujarati",
  "average_rating": 4.3,
  "review_count": 1240,
  "estimated_delivery_minutes": 28,
  "minimum_order_value": 150.00,
  "delivery_fee": 30.00,
  "is_open": true,
  "is_currently_closed_badge": false,
  "cover_photo_url": "https://cdn.quickbites.in/..."
}
```

---

### GET `/search/restaurants`

**Description:** Full-text search for restaurants and dishes. Backed by Elasticsearch with fuzzy matching (within 2 character edits).

**Roles Allowed:** Public

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Search keyword (required) |
| `lat` | float | Required for delivery radius filter |
| `lng` | float | Required for delivery radius filter |
| `cuisine` | string | Comma-separated cuisine tags |
| `min_rating` | float | 3, 4, or 4.5 |
| `price_range` | string | `budget`, `mid`, `premium` |
| `dietary` | string | `veg`, `vegan`, `gluten-free`, `halal`, `jain` |
| `max_delivery_minutes` | int | Max ETA filter |
| `sort_by` | string | `relevance` (default), `rating`, `delivery_time`, `price_asc`, `price_desc` |

**Business Logic:**
- Query Elasticsearch `restaurants` index for fuzzy match
- Apply location filter (ST_CONTAINS spatial on MySQL or geo_distance on ES)
- Results must be within delivery radius
- Return within 1.5 seconds (SLA: CUST-FR-016)

---

### GET `/search/suggest`

**Description:** Predictive search suggestions as the customer types.

**Roles Allowed:** Public (enhanced for authenticated customers)

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Partial search string |
| `lat` | float | |
| `lng` | float | |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "type": "dish", "text": "Paneer Butter Masala", "restaurant": "Honest Kitchen" },
      { "type": "restaurant", "text": "Honest by Anupam" },
      { "type": "cuisine", "text": "Gujarati Thali" }
    ]
  }
}
```

---

### GET `/restaurants/:branch_id`

**Description:** Full detail page for a restaurant branch including operating hours and delivery info.

**Roles Allowed:** Public

**Response includes:** branch info, operating hours per weekday, is_open, delivery radius, minimum order value, delivery fee, overall rating.

---

### GET `/restaurants/map`

**Description:** Returns restaurant pins for the interactive map view.

**Roles Allowed:** Public (Low priority feature — CUST-FR-022)

**Query Parameters:** `lat`, `lng`, `radius_km` (default 5)

**Response:** Array of `{ branch_id, lat, lng, business_name, is_open, average_rating }`

---

## Module 04 — Menu Browsing

**Route Prefix:** `/restaurants/:branch_id/menu`  
**DB Tables:** `menu_categories`, `menu_items`, `modifier_groups`, `modifiers`, `menu_item_modifier_groups`  
**FRD References:** CUST-FR-024 to 032

---

### GET `/restaurants/:branch_id/menu`

**Description:** Returns the full menu grouped by categories for customer view.

**Roles Allowed:** Public

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `dietary` | string | Filter by food type: `veg`, `non-veg`, `vegan`, `gluten-free` |
| `q` | string | Local menu search |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "branch_id": 12,
    "categories": [
      {
        "id": 3,
        "category_name": "Starters",
        "sort_order": 1,
        "items": [
          {
            "id": 55,
            "sku_identifier": "QB-SAT-055",
            "name": "Paneer Tikka",
            "description": "Marinated cottage cheese grilled in tandoor",
            "price": 220.00,
            "food_type": "veg",
            "photo_url": "https://cdn.quickbites.in/...",
            "is_available": true,
            "is_bestseller": true,
            "modifier_groups": [ { ... } ]
          }
        ]
      }
    ]
  }
}
```

---

### GET `/restaurants/:branch_id/menu/items/:item_id`

**Description:** Full detail for a single menu item including all modifier groups and options.

**Roles Allowed:** Public

**Response includes modifier groups:**
```json
{
  "modifier_groups": [
    {
      "id": 7,
      "group_name": "Choose Base",
      "min_selections": 1,
      "max_selections": 1,
      "modifiers": [
        { "id": 21, "option_name": "Thin Crust", "extra_charge": 0.00 },
        { "id": 22, "option_name": "Thick Crust", "extra_charge": 20.00 }
      ]
    }
  ]
}
```

---

### GET `/restaurants/:branch_id/menu/search`

**Description:** Local search within a restaurant's menu.

**Roles Allowed:** Public

**Query Parameters:** `q` (search string)

---

## Module 05 — Cart

**Route Prefix:** `/cart`  
**Storage:** Redis (key: `cart:{customer_id}`)  
**DB Tables:** `menu_items` (for validation)  
**FRD References:** CUST-FR-033 to 039

> **Note:** Cart state lives entirely in Redis for performance. The cart is validated against MySQL on checkout. Cart keys expire after 7 days of inactivity.

---

### GET `/cart`

**Description:** Returns the current cart contents for the authenticated customer.

**Roles Allowed:** `customer`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "branch_id": 12,
    "restaurant_name": "Honest by Anupam",
    "items": [
      {
        "menu_item_id": 55,
        "name": "Paneer Tikka",
        "quantity": 2,
        "unit_price": 220.00,
        "selected_modifiers": [
          { "modifier_id": 21, "option_name": "Thin Crust", "extra_charge": 0.00 }
        ],
        "special_instructions": "Extra spicy please",
        "item_subtotal": 440.00
      }
    ],
    "subtotal": 440.00,
    "tax_amount": 79.20,
    "delivery_fee": 30.00,
    "discount_amount": 0.00,
    "total_amount": 549.20,
    "minimum_order_value": 150.00,
    "minimum_order_met": true
  }
}
```

---

### POST `/cart/items`

**Description:** Adds an item to the cart (or increments quantity if already present).

**Roles Allowed:** `customer`

**Request Body:**
```json
{
  "branch_id": 12,
  "menu_item_id": 55,
  "quantity": 1,
  "selected_modifiers": [
    { "modifier_id": 21 }
  ],
  "special_instructions": "Extra spicy"
}
```

**Business Logic:**
- If cart already has items from a **different** `branch_id` → return `409 CART_RESTAURANT_CONFLICT` with `clear_cart_required: true`
- Validate `menu_item.is_available = true` and `menu_item.deleted_at IS NULL`
- Validate modifier selections against `modifier_groups.min_selections` / `max_selections`
- Store in Redis; update subtotal, tax, delivery fee in cart object

---

### PATCH `/cart/items/:menu_item_id`

**Description:** Updates quantity of a specific item in the cart.

**Roles Allowed:** `customer`

**Request Body:**
```json
{ "quantity": 3 }
```

**Business Logic:** Setting `quantity = 0` removes the item.

---

### DELETE `/cart/items/:menu_item_id`

**Description:** Removes a specific item from the cart.

**Roles Allowed:** `customer`

---

### DELETE `/cart`

**Description:** Clears the entire cart.

**Roles Allowed:** `customer`

---

### POST `/cart/validate`

**Description:** Pre-checkout validation. Checks all items are still available, prices are current, minimum order is met. Called before rendering the checkout page.

**Roles Allowed:** `customer`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "unavailable_items": [],
    "price_changes": [],
    "minimum_order_met": true
  }
}
```

---

## Module 06 — Checkout & Orders

**Route Prefix:** `/orders`  
**DB Tables:** `orders`, `order_items`, `order_item_modifiers`, `coupons`, `transactions`, `customer_addresses`  
**FRD References:** CUST-FR-040 to 049, BR-ORD-01 to 04

---

### POST `/orders`

**Description:** Places a new order. This is the core order creation endpoint. Atomically creates `orders`, `order_items`, and `order_item_modifiers` records. Triggers payment processing.

**Roles Allowed:** `customer`

**Request Body:**
```json
{
  "branch_id": 12,
  "delivery_address_id": 5,
  "order_type": "asap",
  "scheduled_slot_start": null,
  "payment_method": "upi",
  "payment_gateway": "razorpay",
  "payment_token": "pay_xyz123",
  "coupon_code": "SAVE50",
  "special_instructions": "Please ring doorbell twice",
  "cart_snapshot": { ... }
}
```

**Business Logic (in DB transaction):**
1. Re-validate cart against current `menu_items` prices and availability
2. Validate coupon (if provided): expiry, min_cart_value, per_user_limit, total_usage_cap
3. Check business rule: customer must not have > 3 active orders (BR-ORD-01)
4. For `order_type = 'scheduled'`, validate `scheduled_slot_start ≥ NOW() + 1 hour` (BR-ORD-02)
5. Calculate: `subtotal`, `tax_amount` (GST), `delivery_fee`, `discount_amount`, `total_amount`
6. Call payment gateway API to charge
7. On payment success → insert `orders` row with `order_status = 'order_placed'`
8. Insert `order_items` and `order_item_modifiers` rows
9. Increment `coupons.total_used_counter`
10. Generate `order_id_uuid` (UUID v4) for public tracking
11. Publish `order.created` event to RabbitMQ → Notification Service sends confirmation email + SMS within 30 seconds
12. Return confirmation within 5 seconds (CUST-FR-048)

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "order_id": 8812,
    "order_id_uuid": "a3f1c2d4-...",
    "order_status": "order_placed",
    "estimated_delivery_time": "2026-05-30T15:05:00Z",
    "tracking_url": "/orders/a3f1c2d4-.../track",
    "total_amount": 549.20
  }
}
```

---

### GET `/orders/:order_id_uuid`

**Description:** Full order detail for the authenticated customer.

**Roles Allowed:** `customer` (own orders only)

---

### POST `/orders/:order_id_uuid/cancel`

**Description:** Customer cancels an order (only allowed before restaurant acceptance).

**Roles Allowed:** `customer`

**Business Logic:**
- If `order_status != 'order_placed'` → return `409 ORDER_CANNOT_BE_CANCELLED` (BR-ORD-04)
- Update `order_status = 'cancelled'`
- Trigger full refund via Payment Service
- Publish cancellation notification event

---

### POST `/orders/:order_id_uuid/apply-coupon`

**Description:** Applies or changes a coupon code during checkout (before payment).

**Roles Allowed:** `customer`

**Request Body:**
```json
{ "coupon_code": "FREEDEL100" }
```

**Response includes:** `discount_amount`, updated `total_amount`, or rejection reason.

---

### GET `/orders/:order_id_uuid/invoice`

**Description:** Generates and returns a signed S3 URL to a PDF invoice for a completed order.

**Roles Allowed:** `customer`

---

### POST `/orders/:order_id_uuid/reorder`

**Description:** Pre-populates cart with items from a past order, flagging unavailable items.

**Roles Allowed:** `customer`

**Response includes:** `items_added`, `items_unavailable` (items no longer available on the menu).

---

### GET `/orders/validate-coupon`

**Description:** Real-time coupon validation for the checkout page.

**Roles Allowed:** `customer`

**Query Parameters:** `coupon_code`, `cart_total`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "coupon_type": "flat_amount_discount",
    "discount_value": 50.00,
    "discount_applied": 50.00,
    "rejection_reason": null
  }
}
```

---

## Module 07 — Real-Time Order Tracking

**Route Prefix:** `/orders/:order_id_uuid/track`  
**DB Tables:** `orders`, `deliveries`, `delivery_partners`  
**FRD References:** CUST-FR-050 to 057

---

### GET `/orders/:order_id_uuid/track`

**Description:** Returns snapshot of current order tracking state (for initial page load or polling fallback).

**Roles Allowed:** `customer`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "order_status": "out_for_delivery",
    "status_updated_at": "2026-05-30T14:55:00Z",
    "estimated_delivery_time": "2026-05-30T15:10:00Z",
    "delivery_partner": {
      "name": "Arjun D.",
      "phone_masked": "+91-98****3456",
      "vehicle_type": "motorcycle",
      "current_coordinates": { "lat": 23.028, "lng": 72.569 }
    },
    "restaurant_coordinates": { "lat": 23.041, "lng": 72.558 },
    "delivery_coordinates": { "lat": 23.0225, "lng": 72.5714 }
  }
}
```

---

### GET `/orders/:order_id_uuid/track/eta`

**Description:** Returns recalculated ETA using Google Maps Distance Matrix API. Called every 2 minutes by the client.

**Roles Allowed:** `customer`

---

### POST `/orders/:order_id_uuid/contact-partner`

**Description:** Sends a pre-defined message to the delivery partner (masked communication).

**Roles Allowed:** `customer`

**Request Body:**
```json
{ "message_type": "be_at_gate" }
```

Predefined messages: `be_at_gate`, `call_on_arrival`, `leave_at_door`

---

### WebSocket: Order Status Channel

See [WebSocket Events Reference](#websocket-events-reference) — `order:status_update`, `delivery:location_update`.

---

## Module 08 — Order History & Reordering

**Route Prefix:** `/orders/history`  
**DB Tables:** `orders`, `order_items`, `order_item_modifiers`  
**FRD References:** CUST-FR-058 to 061

---

### GET `/orders/history`

**Description:** Paginated list of past orders for the authenticated customer.

**Roles Allowed:** `customer`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by status |
| `from_date` | date | |
| `to_date` | date | |
| `page` | int | |
| `per_page` | int | Default 10 |

---

### GET `/orders/history/:order_id_uuid`

**Description:** Full itemized detail of a past order.

**Roles Allowed:** `customer`

---

### GET `/orders/history/:order_id_uuid/invoice`

**Description:** Download PDF invoice. Returns pre-signed S3 URL.

**Roles Allowed:** `customer`

---

## Module 09 — Reviews & Ratings

**Route Prefix:** `/reviews`  
**DB Tables:** `reviews`, `review_photos`, `review_replies`  
**FRD References:** CUST-FR-062 to 067, BR-REV-01 to 03

---

### POST `/reviews`

**Description:** Submits a review for a delivered order.

**Roles Allowed:** `customer`

**Request Body:**
```json
{
  "order_id": 8812,
  "rating_food": 4,
  "rating_delivery": 5,
  "rating_packaging": 4,
  "review_text": "Food was delicious, packaging was excellent!",
  "photo_urls": ["https://s3.../upload1.jpg"]
}
```

**Business Logic:**
- Validate: `order_id` must exist, belong to authenticated customer, and have `order_status = 'delivered'` (BR-REV-01)
- Validate: no existing review for this `order_id` (UNIQUE constraint on `reviews.order_id`)
- Check for profanity in `review_text` → set `moderation_status = 'flagged_pending'` if detected
- Insert `reviews` row; insert `review_photos` rows
- Update branch's cached average rating in Redis

---

### PATCH `/reviews/:review_id`

**Description:** Edits a review (only within 48 hours of submission — BR-REV-02).

**Roles Allowed:** `customer` (own reviews only)

**Business Logic:**
- Check `reviews.created_at + 48 hours > NOW()`; if not → `403 REVIEW_LOCKED`

---

### GET `/restaurants/:branch_id/reviews`

**Description:** Paginated list of approved reviews for a restaurant branch.

**Roles Allowed:** Public

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `rating` | int | Filter by star rating |
| `sort_by` | string | `most_recent` (default), `most_helpful`, `highest_rating`, `lowest_rating` |

---

### POST `/restaurants/:branch_id/reviews/:review_id/reply`

**Description:** Restaurant posts a public reply to a customer review.

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

**Request Body:**
```json
{ "reply_text": "Thank you for your kind words, Ravi!" }
```

**Business Logic:**
- Verify `reviews.branch_id` belongs to the authenticated owner's restaurant
- Insert `review_replies` row (one reply per review — PRIMARY KEY on `review_id`)

---

### GET `/restaurants/:branch_id/rating-summary`

**Description:** Returns overall rating and breakdown by category.

**Roles Allowed:** Public

**Response:**
```json
{
  "average_rating": 4.3,
  "total_reviews": 1240,
  "rating_distribution": { "5": 580, "4": 390, "3": 180, "2": 60, "1": 30 },
  "average_food": 4.4,
  "average_delivery": 4.1,
  "average_packaging": 4.3
}
```

---

## Module 10 — Promotions, Coupons & Loyalty

**Route Prefix:** `/promotions`, `/loyalty`  
**DB Tables:** `coupons`, `customer_loyalty_transactions`, `customer_referrals`  
**FRD References:** CUST-FR-068 to 073, BR-PAY-04

---

### GET `/promotions/available`

**Description:** Returns all active, applicable promotions for a customer's current cart context.

**Roles Allowed:** `customer`

**Query Parameters:** `branch_id`, `cart_total`

---

### GET `/promotions/coupons/validate`

**Description:** Real-time coupon validation. See Module 06 checkout endpoint — `/orders/validate-coupon`.

---

### GET `/loyalty/balance`

**Description:** Returns the customer's current loyalty point balance.

**Roles Allowed:** `customer`

---

### GET `/loyalty/transactions`

**Description:** Paginated transaction history of points earned and redeemed.

**Roles Allowed:** `customer`

---

### GET `/loyalty/referral-code`

**Description:** Returns the customer's unique referral code; generates one if it doesn't exist.

**Roles Allowed:** `customer`

---

### POST `/loyalty/apply-referral`

**Description:** Applies a referral code during registration.

**Roles Allowed:** Public (during registration flow)

**Request Body:**
```json
{ "referral_code": "RAVI2026" }
```

**Business Logic:**
- Look up `customer_referrals` by `referral_code`
- Create `customer_referrals` row with `referral_status = 'registered'`
- Reward is granted after referred customer's first order completes

---

## Module 11 — Payments & Refunds

**Route Prefix:** `/payments`  
**DB Tables:** `transactions`, `refunds`, `dispute_tickets`, `dispute_messages`  
**FRD References:** PAY-FR-001 to 005, CUST-FR-074 to 078

---

### POST `/payments/initiate`

**Description:** Creates a payment order with Razorpay/Stripe before charging. Returns gateway order ID for client-side SDK.

**Roles Allowed:** `customer`

**Request Body:**
```json
{
  "amount": 54920,
  "currency": "INR",
  "payment_method": "upi",
  "gateway": "razorpay"
}
```

**Business Logic:**
- Call Razorpay/Stripe API to create order/payment intent
- Insert `transactions` row with `transaction_status = 'initiated'`
- Return `gateway_order_id` to client for SDK

---

### POST `/payments/webhook/razorpay`

**Description:** Razorpay webhook for payment status updates. **Do not authenticate with JWT** — use Razorpay webhook signature validation.

**Roles Allowed:** Internal (Razorpay IP whitelist only)

**Business Logic:**
- Verify HMAC signature of webhook payload
- Update `transactions.transaction_status` to `'success'` or `'failed'`
- On success → publish `payment.success` event to RabbitMQ → Order Service creates order

---

### POST `/payments/webhook/stripe`

**Description:** Stripe webhook for international payment status updates.

**Roles Allowed:** Internal (Stripe signature validation)

---

### POST `/payments/disputes`

**Description:** Customer raises a dispute/refund request for a delivered order.

**Roles Allowed:** `customer`

**Request Body:**
```json
{
  "order_id": 8812,
  "category": "missing_items",
  "description": "Paneer Tikka was missing from the order",
  "affected_item_ids": [55],
  "photo_url": "https://s3.../evidence.jpg"
}
```

**Business Logic:**
- Validate order is `delivered` and `created_at` is within 24 hours (BR-PAY-03)
- Generate `ticket_number` (UUID)
- Insert `dispute_tickets` row with `status = 'open'`
- If `category = 'missing_items'` → auto-credit 50% of affected item value as loyalty points (UC-04 step 4)
- Publish event to Notification Service (notify admin team)

---

### GET `/payments/disputes/:ticket_number`

**Description:** Returns status and messages for a dispute ticket.

**Roles Allowed:** `customer` (own tickets only)

---

### GET `/payments/refunds/:order_id`

**Description:** Returns the refund status for an order (`initiated`, `processing`, `completed`, `failed`).

**Roles Allowed:** `customer`

---

## Module 12 — Restaurant Onboarding & Profile

**Route Prefix:** `/restaurant-portal/profile`  
**DB Tables:** `restaurants`, `restaurant_branches`, `restaurant_operating_hours`, `restaurant_owners`  
**FRD References:** REST-FR-001 to 007

---

### POST `/restaurant-portal/register`

**Description:** Restaurant owner submits onboarding application.

**Roles Allowed:** Public (unauthenticated)

**Request Body:**
```json
{
  "legal_full_name": "Anupam Mehta",
  "company_name": "Honest Foods Pvt. Ltd.",
  "contact_number": "+919898001234",
  "business_name": "Honest by Anupam",
  "gstin": "24AAHCR4849R1ZN",
  "fssai_license_number": "11223344556677",
  "bank_account_number": "00112233445566",
  "bank_ifsc_code": "HDFC0001234",
  "email": "owner@honest.in",
  "password": "OwnerSecure@789"
}
```

**Business Logic:**
- Create `users` row with `role = 'restaurant_owner'`
- Create `restaurant_owners` row
- Create `restaurants` row with `verification_status = 'pending_verification'`
- Notify admin team for KYC review

---

### GET `/restaurant-portal/profile`

**Description:** Returns the authenticated owner's restaurant and profile data.

**Roles Allowed:** `restaurant_owner`

---

### PATCH `/restaurant-portal/profile`

**Description:** Updates public-facing restaurant profile (logo, cover photo, description, cuisine tags).

**Roles Allowed:** `restaurant_owner`

---

### GET `/restaurant-portal/branches`

**Description:** Lists all branches under the authenticated owner's restaurant.

**Roles Allowed:** `restaurant_owner`

---

### POST `/restaurant-portal/branches`

**Description:** Creates a new branch.

**Roles Allowed:** `restaurant_owner`

**Request Body includes:** `branch_name`, `contact_number`, `address_text`, `coordinates`, `delivery_radius_polygon` (GeoJSON polygon), `minimum_order_value`, `delivery_fee_base`

---

### PATCH `/restaurant-portal/branches/:branch_id`

**Description:** Updates branch details including delivery radius polygon.

**Roles Allowed:** `restaurant_owner`

---

### PUT `/restaurant-portal/branches/:branch_id/operating-hours`

**Description:** Sets operating hours for all 7 days for a branch. Replaces existing hours.

**Roles Allowed:** `restaurant_owner`

**Request Body:**
```json
{
  "hours": [
    { "day_of_week": "monday", "opening_time": "09:00", "closing_time": "22:00" },
    { "day_of_week": "tuesday", "opening_time": "09:00", "closing_time": "22:00" },
    { "day_of_week": "sunday", "opening_time": null, "closing_time": null }
  ]
}
```

**Business Logic:** `NULL` times mark the day as closed.

---

### POST `/restaurant-portal/branches/:branch_id/pause-orders`

**Description:** Temporarily pauses order acceptance and optionally sets auto-resume time.

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

**Request Body:**
```json
{
  "auto_resume_at": "2026-05-30T16:00:00Z"
}
```

**Business Logic:** Sets `restaurant_branches.is_accepting_orders = false` and `auto_resume_at`

---

## Module 13 — Menu Management (Restaurant)

**Route Prefix:** `/restaurant-portal/menu`  
**DB Tables:** `menu_categories`, `menu_items`, `modifier_groups`, `modifiers`, `menu_item_modifier_groups`  
**FRD References:** REST-FR-008 to 015

---

### GET `/restaurant-portal/menu/categories`

**Description:** Lists all categories for a branch.

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

**Query Parameters:** `branch_id`

---

### POST `/restaurant-portal/menu/categories`

**Description:** Creates a new menu category.

**Roles Allowed:** `restaurant_owner`

**Request Body:**
```json
{
  "branch_id": 12,
  "category_name": "Starters",
  "sort_order": 1
}
```

---

### PATCH `/restaurant-portal/menu/categories/:category_id`

**Description:** Updates category name, sort order, or active status.

**Roles Allowed:** `restaurant_owner`

---

### DELETE `/restaurant-portal/menu/categories/:category_id`

**Description:** Deletes a category (cascades soft-delete to menu items).

**Roles Allowed:** `restaurant_owner`

---

### GET `/restaurant-portal/menu/items`

**Description:** Lists all menu items for a branch (paginated, with filters).

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

**Query Parameters:** `branch_id`, `category_id`, `is_available`, `food_type`

---

### POST `/restaurant-portal/menu/items`

**Description:** Creates a new menu item.

**Roles Allowed:** `restaurant_owner`

**Request Body:**
```json
{
  "category_id": 3,
  "sku_identifier": "QB-SAT-055",
  "name": "Paneer Tikka",
  "description": "Marinated cottage cheese grilled in tandoor",
  "price": 220.00,
  "food_type": "veg",
  "photo_url": "https://cdn...",
  "is_available": true,
  "is_bestseller": false,
  "available_from": "11:00",
  "available_until": "23:00"
}
```

---

### PATCH `/restaurant-portal/menu/items/:item_id`

**Description:** Updates a menu item's details, price, or availability.

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

**Business Logic:**
- Changes to `is_available` must propagate to customer-facing menus within 30 seconds (update Redis cache + Elasticsearch)

---

### DELETE `/restaurant-portal/menu/items/:item_id`

**Description:** Soft-deletes a menu item (`deleted_at = NOW()`).

**Roles Allowed:** `restaurant_owner`

---

### PATCH `/restaurant-portal/menu/items/:item_id/toggle-availability`

**Description:** Quick toggle to mark item available or unavailable instantly.

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

---

### POST `/restaurant-portal/menu/items/bulk-import`

**Description:** Bulk imports menu items via CSV upload.

**Roles Allowed:** `restaurant_owner`

**Request:** `multipart/form-data`, field `csv_file`. CSV columns: `category_name`, `sku`, `name`, `description`, `price`, `food_type`, `is_available`.

**Response:** `{ items_created: 42, items_failed: 2, errors: [...] }`

---

### POST `/restaurant-portal/menu/modifier-groups`

**Description:** Creates a modifier group (e.g., "Choose Size").

**Roles Allowed:** `restaurant_owner`

**Request Body:**
```json
{
  "branch_id": 12,
  "group_name": "Choose Crust",
  "min_selections": 1,
  "max_selections": 1,
  "modifiers": [
    { "option_name": "Thin Crust", "extra_charge": 0.00 },
    { "option_name": "Thick Crust", "extra_charge": 20.00 }
  ]
}
```

---

### POST `/restaurant-portal/menu/items/:item_id/modifier-groups`

**Description:** Links existing modifier groups to a menu item.

**Roles Allowed:** `restaurant_owner`

**Request Body:**
```json
{ "modifier_group_ids": [7, 8] }
```

---

## Module 14 — Order Management (Restaurant)

**Route Prefix:** `/restaurant-portal/orders`  
**DB Tables:** `orders`, `order_items`, `order_item_modifiers`  
**FRD References:** REST-FR-016 to 023

---

### GET `/restaurant-portal/orders`

**Description:** Real-time order queue for the restaurant dashboard.

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `branch_id` | int | Required |
| `status` | string | `pending`, `in_progress`, `ready`, `completed`, `cancelled` |
| `date` | date | Filter by date (default: today) |
| `order_type` | string | `asap`, `scheduled` |

**Response includes:** new orders with audible/visual alert data.

---

### GET `/restaurant-portal/orders/:order_id`

**Description:** Full order detail including item list with customizations, special instructions, customer name (first name + last initial), payment status.

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

---

### POST `/restaurant-portal/orders/:order_id/accept`

**Description:** Accepts an incoming order within the 5-minute window.

**Roles Allowed:** `restaurant_staff`, `restaurant_owner`

**Business Logic:**
- Validate `order_status = 'order_placed'`
- If called after 5 minutes → return `409 ORDER_ACCEPTANCE_WINDOW_EXPIRED`
- Update `order_status = 'restaurant_confirmed'`
- Publish event → Notification Service notifies customer
- Optionally print/display KOT

---

### POST `/restaurant-portal/orders/:order_id/reject`

**Description:** Rejects an incoming order.

**Roles Allowed:** `restaurant_staff`, `restaurant_owner`

**Request Body:**
```json
{ "rejection_reason": "Item out of stock" }
```

**Business Logic:**
- Update `order_status = 'cancelled'`
- Trigger full refund
- Notify customer with rejection reason

---

### PATCH `/restaurant-portal/orders/:order_id/status`

**Description:** Updates order status through the preparation pipeline.

**Roles Allowed:** `restaurant_staff`, `restaurant_owner`

**Request Body:**
```json
{ "status": "preparing" }
```

**Allowed transitions:**
- `restaurant_confirmed` → `preparing`
- `preparing` → `ready_for_pickup`
- `ready_for_pickup` → (system auto-transitions to `picked_up` when delivery partner confirms)

---

### POST `/restaurant-portal/orders/:order_id/items/:item_id/mark-unavailable`

**Description:** Marks a specific item as unavailable mid-order. Notifies customer and triggers partial refund.

**Roles Allowed:** `restaurant_staff`, `restaurant_owner`

**Business Logic:**
- Set `order_items.is_available_mid_order = false`
- Calculate refund amount for this item
- Publish event → customer notified, partial refund initiated

---

### GET `/restaurant-portal/orders/history`

**Description:** Historical order search with filters (date, status, order ID, payment method).

**Roles Allowed:** `restaurant_owner`, `restaurant_staff`

---

## Module 15 — Restaurant Analytics & Finance

**Route Prefix:** `/restaurant-portal/analytics`  
**FRD References:** REST-FR-027 to 032

---

### GET `/restaurant-portal/analytics/kpis`

**Description:** Real-time KPI summary: orders today, revenue today, average order value, acceptance rate.

**Roles Allowed:** `restaurant_owner`

**Query Parameters:** `branch_id`

---

### GET `/restaurant-portal/analytics/revenue`

**Description:** Revenue trend report by day/week/month with period-over-period comparison.

**Roles Allowed:** `restaurant_owner`

**Query Parameters:** `branch_id`, `period` (`day` | `week` | `month`), `from_date`, `to_date`

---

### GET `/restaurant-portal/analytics/top-items`

**Description:** Top selling items ranked by units sold, revenue, and average rating.

**Roles Allowed:** `restaurant_owner`

---

### GET `/restaurant-portal/analytics/customers`

**Description:** Customer demographics: order frequency, new vs. returning split, peak hours heatmap.

**Roles Allowed:** `restaurant_owner`

---

### GET `/restaurant-portal/analytics/coupons`

**Description:** Coupon performance: redemption count, total discount granted, average order value with coupon.

**Roles Allowed:** `restaurant_owner`

---

### GET `/restaurant-portal/finance/payouts`

**Description:** Payout history with commission deductions itemized per order.

**Roles Allowed:** `restaurant_owner`

---

### POST `/restaurant-portal/analytics/export`

**Description:** Exports any report as PDF or CSV.

**Roles Allowed:** `restaurant_owner`

**Request Body:**
```json
{
  "report_type": "revenue",
  "format": "csv",
  "from_date": "2026-05-01",
  "to_date": "2026-05-31",
  "branch_id": 12
}
```

---

## Module 16 — Delivery Partner Portal

**Route Prefix:** `/delivery`  
**DB Tables:** `delivery_partners`, `deliveries`, `delivery_issue_reports`  
**FRD References:** DEL-FR-001 to 017

---

### POST `/delivery/register`

**Description:** Delivery partner registration. Initiates document verification.

**Roles Allowed:** Public

**Request Body:**
```json
{
  "full_name": "Arjun Desai",
  "mobile_number": "+919898005678",
  "vehicle_type": "motorcycle",
  "vehicle_registration_number": "GJ01AB1234",
  "government_id_url": "https://s3.../aadhar.jpg",
  "email": "arjun@example.com",
  "password": "Rider@2026"
}
```

**Business Logic:**
- Create `users` with `role = 'delivery_partner'`, `is_active = false`
- Create `delivery_partners` row with `is_verified = false`
- Notify admin for document review

---

### PATCH `/delivery/me/status`

**Description:** Toggles delivery partner availability (Online / Offline).

**Roles Allowed:** `delivery_partner`

**Request Body:**
```json
{ "work_status": "online" }
```

---

### PATCH `/delivery/me/location`

**Description:** Updates the partner's GPS coordinates (called every 10 seconds when active order exists).

**Roles Allowed:** `delivery_partner`

**Request Body:**
```json
{ "lat": 23.028, "lng": 72.569 }
```

**Business Logic:**
- Update `delivery_partners.current_coordinates`
- Update Redis real-time location cache for WebSocket broadcast to customer tracking page

---

### GET `/delivery/me/assignments`

**Description:** Returns the current active delivery assignment for the partner.

**Roles Allowed:** `delivery_partner`

---

### POST `/delivery/assignments/:delivery_id/accept`

**Description:** Partner accepts an assigned delivery within 60 seconds.

**Roles Allowed:** `delivery_partner`

**Business Logic:**
- Validate acceptance window (60 seconds from assignment)
- Update `deliveries.assignment_status = 'accepted'`
- Publish event → restaurant and customer notified

---

### POST `/delivery/assignments/:delivery_id/decline`

**Description:** Partner declines an assigned delivery.

**Roles Allowed:** `delivery_partner`

**Business Logic:**
- Update `deliveries.assignment_status = 'declined'`
- Increment `deliveries.failed_attempts_count`
- If `failed_attempts_count >= 2` → set `assignment_status = 'escalated'` → notify Fleet Manager (DEL-FR-007)
- Re-run assignment algorithm for next available partner

---

### POST `/delivery/assignments/:delivery_id/pickup-confirmed`

**Description:** Partner confirms order pickup from the restaurant.

**Roles Allowed:** `delivery_partner`

**Business Logic:**
- Set `deliveries.pickup_confirmed_at = NOW()`
- Update `orders.order_status = 'picked_up'`
- Notify customer: order picked up

---

### POST `/delivery/assignments/:delivery_id/delivered`

**Description:** Partner marks the order as delivered.

**Roles Allowed:** `delivery_partner`

**Request Body (high-value orders):**
```json
{
  "confirmation_type": "otp",
  "customer_otp": "847291"
}
```

OR

```json
{
  "confirmation_type": "photo",
  "delivery_proof_url": "https://s3.../proof.jpg"
}
```

**Business Logic:**
- For orders with `total_amount >= 1000` (INR) → require OTP or photo (BR-DEL-03)
- Validate OTP against `otp_verifications` table (`purpose = 'delivery_confirmation'`)
- Set `deliveries.delivery_confirmed_at = NOW()` and `delivery_proof_url`
- Update `orders.order_status = 'delivered'`
- Credit delivery earnings to partner's account balance
- Publish event → customer gets "Order Delivered" notification + review prompt

---

### POST `/delivery/assignments/:delivery_id/report-issue`

**Description:** Partner reports a delivery issue (customer unavailable, wrong address, etc.).

**Roles Allowed:** `delivery_partner`

**Request Body:**
```json
{
  "issue_type": "customer_unavailable",
  "reporter_comments": "Called 3 times, no answer",
  "reported_at_coordinates": { "lat": 23.0225, "lng": 72.5714 },
  "proof_image_url": "https://s3.../gate_locked.jpg"
}
```

**Business Logic:**
- Insert `delivery_issue_reports` row
- Auto-notify customer and support team
- For `customer_unavailable`: initiate 3-attempt protocol

---

### GET `/delivery/me/earnings`

**Description:** Returns earnings dashboard: today, this week, this month, delivery count, tips.

**Roles Allowed:** `delivery_partner`

---

### GET `/delivery/me/earnings/history`

**Description:** Itemized earning history per delivery (base pay + distance bonus + tips).

**Roles Allowed:** `delivery_partner`

---

## Module 17 — Fleet Manager

**Route Prefix:** `/fleet`  
**DB Tables:** `deliveries`, `delivery_partners`  
**FRD References:** DEL-FR-007 to 008

---

### GET `/fleet/dashboard`

**Description:** Live map view of all online delivery partners and their assignment status.

**Roles Allowed:** `fleet_manager`

---

### GET `/fleet/escalated-orders`

**Description:** Lists orders that have been escalated (2+ partner declines) and require manual assignment.

**Roles Allowed:** `fleet_manager`

---

### POST `/fleet/orders/:delivery_id/assign`

**Description:** Manually assigns an order to a specific delivery partner.

**Roles Allowed:** `fleet_manager`

**Request Body:**
```json
{ "delivery_partner_id": 301 }
```

---

### GET `/fleet/partners`

**Description:** Lists all delivery partners with status, current location, and performance rating.

**Roles Allowed:** `fleet_manager`

---

### PATCH `/fleet/partners/:partner_id/status`

**Description:** Admin/Fleet Manager overrides a partner's active status (e.g., suspend for policy violations).

**Roles Allowed:** `fleet_manager`, `platform_admin`

---

## Module 18 — Admin — User & Restaurant Management

**Route Prefix:** `/admin/users`, `/admin/restaurants`  
**DB Tables:** `users`, `restaurants`, `restaurant_branches`, `admin_profiles`, `admin_audit_logs`  
**FRD References:** ADMIN-FR-001 to 004

> All admin actions are logged to `admin_audit_logs` automatically by middleware.

---

### GET `/admin/users`

**Description:** Paginated list of all users with search and filter.

**Roles Allowed:** `platform_admin`

**Query Parameters:** `role`, `is_active`, `search` (email/name/mobile), `from_date`, `to_date`

---

### GET `/admin/users/:user_id`

**Description:** Detailed profile for any user.

**Roles Allowed:** `platform_admin`

---

### PATCH `/admin/users/:user_id/status`

**Description:** Approves, suspends, or deactivates a user account.

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "action": "suspend",
  "reason": "Multiple policy violations reported by customers"
}
```

**Allowed actions:** `approve`, `suspend`, `deactivate`

**Business Logic:**
- `reason` field is mandatory (ADMIN-FR-002)
- Log to `admin_audit_logs` with `changes_json` containing old/new status

---

### GET `/admin/restaurants`

**Description:** Lists all restaurants with verification status filter.

**Roles Allowed:** `platform_admin`

**Query Parameters:** `verification_status`, `search`, `subscription_tier`

---

### PATCH `/admin/restaurants/:restaurant_id/verify`

**Description:** Approves or rejects a restaurant onboarding application.

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "action": "approved",
  "reason": "All documents verified"
}
```

---

### PATCH `/admin/restaurants/:restaurant_id/override`

**Description:** Admin overrides menu availability, operating hours, or temporarily delists a restaurant.

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "override_type": "delist",
  "reason": "FSSAI license expired",
  "duration_hours": 48
}
```

---

### POST `/admin/coupons`

**Description:** Creates a new platform-wide coupon code.

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "coupon_code": "FREEDEL100",
  "coupon_type": "free_delivery",
  "discount_value": 0.00,
  "min_cart_value": 199.00,
  "per_user_limit": 1,
  "total_usage_cap": 5000,
  "valid_from": "2026-06-01T00:00:00Z",
  "valid_until": "2026-06-30T23:59:59Z"
}
```

---

### PATCH `/admin/coupons/:coupon_id`

**Description:** Updates or deactivates a coupon.

**Roles Allowed:** `platform_admin`

---

### GET `/admin/delivery-partners`

**Description:** Lists all delivery partner applications pending verification.

**Roles Allowed:** `platform_admin`

---

### PATCH `/admin/delivery-partners/:partner_id/verify`

**Description:** Approves or rejects a delivery partner after document review.

**Roles Allowed:** `platform_admin`

---

## Module 19 — Admin — Dispute & Refund Management

**Route Prefix:** `/admin/disputes`  
**DB Tables:** `dispute_tickets`, `dispute_messages`, `refunds`, `transactions`  
**FRD References:** ADMIN-FR-008

---

### GET `/admin/disputes`

**Description:** Paginated list of all dispute tickets with status and priority filters.

**Roles Allowed:** `platform_admin`

**Query Parameters:** `status`, `priority`, `category`, `from_date`, `to_date`, `assigned_to`

---

### GET `/admin/disputes/:ticket_number`

**Description:** Full dispute detail including order info, all messages, and refund history.

**Roles Allowed:** `platform_admin`

---

### POST `/admin/disputes/:ticket_number/messages`

**Description:** Admin posts a message on the dispute ticket (visible to customer or internal-only).

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "message_text": "We have reviewed the photos you shared. Refund approved.",
  "is_internal_only": false
}
```

---

### PATCH `/admin/disputes/:ticket_number/assign`

**Description:** Assigns a dispute ticket to a specific admin.

**Roles Allowed:** `platform_admin`

---

### POST `/admin/disputes/:ticket_number/resolve`

**Description:** Resolves a dispute ticket with a refund decision.

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "resolution": "resolved_refunded",
  "refund_amount": 220.00,
  "reason_code": "item_undelivered",
  "resolution_summary": "Missing Paneer Tikka confirmed via restaurant KOT. Full item refund approved."
}
```

**Business Logic:**
- Update `dispute_tickets.status` and `resolution_summary`
- Insert `refunds` row with `status = 'initiated'`
- Call payment gateway to process refund
- Notify customer via email and SMS

---

### GET `/admin/refunds`

**Description:** Lists all refunds with status tracking.

**Roles Allowed:** `platform_admin`, `finance_manager`

---

### GET `/admin/audit-logs`

**Description:** Immutable audit trail of all admin actions.

**Roles Allowed:** `platform_admin`

**Query Parameters:** `admin_user_id`, `action_type`, `target_entity`, `from_date`, `to_date`

---

## Module 20 — Admin — Platform Analytics & Config

**Route Prefix:** `/admin/analytics`, `/admin/config`  
**FRD References:** ADMIN-FR-010 to 017

---

### GET `/admin/analytics/platform-kpis`

**Description:** Platform-wide KPIs: GMV, total orders, active customers, new restaurants, average delivery time, cancellation rate.

**Roles Allowed:** `platform_admin`, `finance_manager`

**Query Parameters:** `from_date`, `to_date`

---

### GET `/admin/analytics/financial-reconciliation`

**Description:** Financial reconciliation report: gross sales, platform commission, restaurant payouts, delivery partner payouts by period.

**Roles Allowed:** `finance_manager`, `platform_admin`

---

### GET `/admin/analytics/order-monitoring`

**Description:** Real-time active order dashboard: all active orders across the platform with status, restaurant, partner, elapsed time, and SLA breach alerts.

**Roles Allowed:** `platform_admin`

---

### GET `/admin/analytics/geo-heatmap`

**Description:** Geographic order density heatmap data by service area.

**Roles Allowed:** `platform_admin`

**Query Parameters:** `from_date`, `to_date`, `city`

---

### POST `/admin/analytics/scheduled-reports`

**Description:** Sets up automated report delivery to email recipients.

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "report_type": "financial_reconciliation",
  "frequency": "weekly",
  "recipients": ["finance@quickbites.in", "ceo@quickbites.in"]
}
```

---

### GET `/admin/config/platform-settings`

**Description:** Returns current global platform configuration.

**Roles Allowed:** `platform_admin`

---

### PATCH `/admin/config/platform-settings`

**Description:** Updates global settings: default delivery radius, commission percentages by tier, minimum delivery fee, loyalty points earning rate.

**Roles Allowed:** `platform_admin`

**Request Body:**
```json
{
  "default_delivery_radius_km": 8,
  "commission_standard": 15.00,
  "commission_premium": 20.00,
  "commission_enterprise": 25.00,
  "minimum_delivery_fee": 20.00,
  "loyalty_points_per_rupee": 1,
  "loyalty_rupee_per_point": 0.25
}
```

---

### GET `/admin/config/notification-templates`

**Description:** Lists all notification templates (email, SMS, push).

**Roles Allowed:** `platform_admin`

---

### PATCH `/admin/config/notification-templates/:template_id`

**Description:** Updates a notification template via WYSIWYG editor content.

**Roles Allowed:** `platform_admin`

---

### PATCH `/admin/config/cuisine-tags`

**Description:** Manages list of supported cuisine types and dietary tags.

**Roles Allowed:** `platform_admin`

---

## Module 21 — Notifications

**Route Prefix:** `/notifications`  
**Integration:** FCM (push), Twilio (SMS), SendGrid (email)  
**FRD References:** CUST-FR-047, 055, 056; Section 8.1

---

### GET `/notifications/me`

**Description:** Paginated list of in-app notifications for the authenticated user.

**Roles Allowed:** All authenticated roles

---

### PATCH `/notifications/:notification_id/read`

**Description:** Marks a notification as read.

**Roles Allowed:** All authenticated roles

---

### PATCH `/notifications/read-all`

**Description:** Marks all notifications as read for the user.

**Roles Allowed:** All authenticated roles

---

### POST `/notifications/device-token`

**Description:** Registers or updates FCM device token for push notifications.

**Roles Allowed:** All authenticated roles

**Request Body:**
```json
{
  "fcm_token": "dBUkV...",
  "platform": "web"
}
```

---

## WebSocket Events Reference

**Namespace:** `wss://api.quickbites.in/v1/ws`  
**Authentication:** Pass JWT as query param: `?token=<access_token>`

---

### Connection Channels

| Channel | Subscribe Event | Description |
|---|---|---|
| `order:{order_id_uuid}` | `join_order` | Customer/restaurant track an order |
| `branch:{branch_id}` | `join_branch` | Restaurant receives new order alerts |
| `delivery:{partner_id}` | `join_delivery` | Partner receives assignment notifications |

---

### Server → Client Events

| Event Name | Channel | Payload | Triggered When |
|---|---|---|---|
| `order:status_update` | `order:{id}` | `{ order_status, updated_at, estimated_delivery_time }` | Any order status change |
| `delivery:location_update` | `order:{id}` | `{ lat, lng, updated_at }` | Partner location update (every 10s) |
| `order:new_assignment` | `delivery:{id}` | `{ delivery_id, restaurant_name, pickup_address, estimated_earnings }` | New delivery assigned to partner |
| `branch:new_order` | `branch:{id}` | `{ order_id, order_type, total_amount, items_count }` | New order placed at a branch |
| `order:eta_update` | `order:{id}` | `{ estimated_delivery_time, recalculated_at }` | ETA recalculated (every 2 min) |
| `order:partner_assigned` | `order:{id}` | `{ partner_name, partner_phone_masked, vehicle_type }` | Delivery partner accepted assignment |

---

### Client → Server Events

| Event Name | Payload | Description |
|---|---|---|
| `join_order` | `{ order_id_uuid }` | Subscribe to an order's tracking channel |
| `leave_order` | `{ order_id_uuid }` | Unsubscribe |
| `partner:location` | `{ lat, lng }` | Partner sends GPS update |

---

## Error Codes Reference

| HTTP Code | Error Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body/param validation failed |
| 400 | `OTP_INVALID_OR_EXPIRED` | OTP not found or expired |
| 400 | `CART_EMPTY` | Checkout attempted with empty cart |
| 400 | `MINIMUM_ORDER_NOT_MET` | Cart below restaurant's minimum order value |
| 400 | `COUPON_INVALID` | Coupon code not found |
| 400 | `COUPON_EXPIRED` | Coupon validity period passed |
| 400 | `COUPON_LIMIT_REACHED` | Per-user or total usage cap hit |
| 401 | `UNAUTHORIZED` | No or invalid JWT |
| 403 | `FORBIDDEN` | Authenticated but insufficient role |
| 403 | `REVIEW_LOCKED` | Review edit window (48h) expired |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CART_RESTAURANT_CONFLICT` | Cart contains items from a different restaurant |
| 409 | `ORDER_CANNOT_BE_CANCELLED` | Order already in preparing/later state |
| 409 | `ORDER_ACCEPTANCE_WINDOW_EXPIRED` | 5-minute acceptance window passed |
| 409 | `MAX_ACTIVE_ORDERS_EXCEEDED` | Customer has 3+ active orders (BR-ORD-01) |
| 409 | `DUPLICATE_REVIEW` | Review already submitted for this order |
| 409 | `ITEM_UNAVAILABLE` | Menu item marked unavailable |
| 422 | `PAYMENT_FAILED` | Payment gateway returned failure |
| 422 | `SCHEDULED_ORDER_TOO_SOON` | Scheduled slot < 1 hour from now |
| 423 | `ACCOUNT_LOCKED` | Account locked after 5 failed login attempts |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server error |
| 503 | `PAYMENT_GATEWAY_UNAVAILABLE` | Both Razorpay and Stripe unreachable |

---

## Database Table → API Mapping

| Database Table | Primary API Module(s) |
|---|---|
| `users` | Module 01 (Auth), Module 18 (Admin Users) |
| `user_sessions` | Module 01 (Sessions) |
| `user_social_accounts` | Module 01 (Social Login) |
| `auth_tokens` | Module 01 (Token Refresh/Logout) |
| `otp_verifications` | Module 01 (Register/Verify OTP), Module 16 (Delivery OTP) |
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
| `menu_categories` | Module 04 (Browsing), Module 13 (Management) |
| `menu_items` | Module 04 (Browsing), Module 13 (Management), Module 05 (Cart) |
| `modifier_groups` | Module 04 (Browsing), Module 13 (Management) |
| `modifiers` | Module 04 (Browsing), Module 13 (Management) |
| `menu_item_modifier_groups` | Module 04 (Browsing), Module 13 (Management) |
| `orders` | Module 06 (Checkout), Module 07 (Tracking), Module 08 (History), Module 14 (Restaurant) |
| `order_items` | Module 06 (Checkout), Module 08 (History) |
| `order_item_modifiers` | Module 06 (Checkout), Module 08 (History) |
| `delivery_partners` | Module 16 (Delivery Portal), Module 17 (Fleet) |
| `deliveries` | Module 07 (Tracking), Module 16 (Delivery Portal), Module 17 (Fleet) |
| `delivery_issue_reports` | Module 16 (Issue Reporting) |
| `coupons` | Module 10 (Promotions), Module 06 (Checkout), Module 18 (Admin) |
| `transactions` | Module 11 (Payments) |
| `dispute_tickets` | Module 11 (Customer Disputes), Module 19 (Admin Disputes) |
| `dispute_messages` | Module 19 (Admin Disputes) |
| `refunds` | Module 11 (Refunds), Module 19 (Admin) |
| `reviews` | Module 09 (Reviews) |
| `review_photos` | Module 09 (Reviews) |
| `review_replies` | Module 09 (Reviews) |
| `admin_audit_logs` | Module 18 (Admin — auto-logged by middleware) |

---

*— End of Quick Bites Backend API Reference v1.0 —*

*Document prepared for internal engineering team. All routes, payloads, and business logic are derived from the FRD v1.0 (May 2026) and the `quick_bites_db` schema.*
