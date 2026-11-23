# OFOS Feature Map

This document maps all existing Express routes, EJS pages, models, workflows, roles, and integrations to their target implementation in the OFOS remake (NestJS + React + PostgreSQL + Prisma).

---

## 1. Role Inventory & RBAC Matrix

| Role Name | Legacy Representation | Target Role Enum | Access Scope |
|---|---|---|---|
| **Customer** | `Customer` | `CUSTOMER` | Public browsing, Cart, Checkout, Order Tracking, Reviews, Profile |
| **Restaurant Owner** | `Restaurant_owner` | `RESTAURANT_OWNER` | Restaurant onboarding, Branch setup, Hours, Delivery zones, Menu management, Orders, Analytics, Reviews |
| **Restaurant Staff** | `Restaurant_staff` | `RESTAURANT_STAFF` | Branch order management (Accept, Reject, Preparing, Ready, Handover) |
| **Delivery Partner** | `Delivery_partner` | `DELIVERY_PARTNER` | Duty status, Assignment accept/decline, Pickup, Live tracking, Delivery OTP, Earnings |
| **Fleet Manager** | `Fleet_manager` | `FLEET_MANAGER` | Partner monitoring, Live map, Manual dispatch, Assignment reassignments, Issue escalations |
| **Finance Manager** | `Finance_manager` | `FINANCE_MANAGER` | Restaurant payouts, Partner payouts, Refund approvals, Financial overviews |
| **Admin** | `Admin` | `ADMIN` | User management, Restaurant verification, System config, Support tickets, Audit logs, KPI reports |

---

## 2. API Routes Mapping

### 2.1 Authentication & Profile (`/auth`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `POST /auth/register` | `auth.controller.ts:register` | `AuthController.registerCustomer` | Migrated |
| `POST /auth/register/:role` | `auth.controller.ts:register[Role]` | `AuthController.registerRole` | Migrated |
| `POST /auth/login` | `auth.controller.ts:login` | `AuthController.login` | Migrated |
| `POST /auth/refresh` | `auth.controller.ts:refresh` | `AuthController.refresh` | Migrated |
| `GET /auth/logout` | `auth.controller.ts:logout` | `AuthController.logout` | Migrated |
| `GET /auth/me` | `auth.controller.ts:me` | `AuthController.getMe` | Migrated |
| `POST /auth/send-otp` | `auth.controller.ts:sendOtp` | `AuthController.sendOtp` | Migrated |
| `POST /auth/verify-otp` | `auth.controller.ts:verifyOtp` | `AuthController.verifyOtp` | Migrated |
| `POST /auth/check-phone` | `auth.controller.ts:checkPhone` | `AuthController.checkPhone` | Migrated |
| `POST /auth/check-email` | `auth.controller.ts:checkEmail` | `AuthController.checkEmail` | Migrated |
| `POST /auth/forgot-password` | `auth.controller.ts:forgotPassword` | `AuthController.forgotPassword` | Migrated |
| `POST /auth/reset-password/:token`| `auth.controller.ts:resetPassword` | `AuthController.resetPassword` | Migrated |
| `POST /auth/select-role` | `auth.controller.ts:selectRole` | `AuthController.selectRole` | Migrated |
| `PATCH /auth/profile` | `auth.controller.ts:updateProfile` | `AuthController.updateProfile` | Migrated |
| `POST /auth/change-password` | `auth.controller.ts:changePassword`| `AuthController.changePassword` | Migrated |
| `GET /auth/sessions` | `auth.controller.ts:getSessions` | `AuthController.getSessions` | Migrated |
| `DELETE /auth/sessions/:id` | `auth.controller.ts:deleteSession`| `AuthController.revokeSession` | Migrated |
| `DELETE /auth/delete-account` | `auth.controller.ts:deleteAccount`| `AuthController.deleteAccount` | Migrated |

### 2.2 Customer & Discovery (`/customer`, `/restaurant`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `GET /restaurant` | `restaurant.controller.ts:list` | `RestaurantController.getRestaurants` | Migrated |
| `GET /restaurant/featured` | `restaurant.controller.ts:featured`| `RestaurantController.getFeatured` | Migrated |
| `GET /restaurant/global-menu-items` | `menuItem.controller.ts` | `RestaurantController.getGlobalMenuItems` | Migrated |
| `GET /restaurant/:id` | `restaurant.controller.ts:getById` | `RestaurantController.getRestaurant` | Migrated |
| `GET /restaurant/:id/menu` | `restaurant.controller.ts:getMenu` | `RestaurantController.getRestaurantMenu` | Migrated |
| `GET /restaurant/branch/:id` | `restaurant.controller.ts:branch` | `RestaurantController.getBranchDetails` | Migrated |
| `GET /restaurant/branch/:id/menu` | `restaurant.controller.ts:branchMenu` | `RestaurantController.getBranchMenu` | Migrated |
| `GET /customer/feed` | `customer.controller.ts:feed` | `RestaurantController.getFeed` | Migrated |
| `GET /customer/search` | `customer.controller.ts:search` | `RestaurantController.search` | Migrated |
| `GET /customer/search/suggestions`| `customer.controller.ts:suggest` | `RestaurantController.getSearchSuggestions` | Migrated |
| `GET /customer/address` | `customer.controller.ts:addresses` | `CustomerController.getAddresses` | Migrated & Verified |
| `POST /customer/addresses` | `customer.controller.ts:addAddress`| `CustomerController.createAddress` | Migrated & Verified |
| `PATCH /customer/addresses/:id` | `customer.controller.ts:editAddress`| `CustomerController.setDefaultAddress` | Migrated & Verified |
| `DELETE /customer/addresses/:id`| `customer.controller.ts:delAddress` | `CustomerController.deleteAddress` | Migrated & Verified |
| `GET /customer/preferences` | `customer.controller.ts:getPref` | `CustomerController.getPreferences` | Unmigrated |
| `PATCH /customer/preferences` | `customer.controller.ts:updatePref`| `CustomerController.updatePreferences`| Unmigrated |

### 2.3 Menu, Categories & Modifiers (`/menu-category`, `/menu-item`, `/modifier`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `GET /menu-category/branches/:branchId/categories` | `menuCategory.controller.ts` | `MenuCategoryController.findByBranch` | Unmigrated |
| `POST /menu-category/branches/:branchId/categories`| `menuCategory.controller.ts` | `MenuCategoryController.create` | Unmigrated |
| `PATCH /menu-category/branches/:branchId/categories/:id`| `menuCategory.controller.ts` | `MenuCategoryController.update` | Unmigrated |
| `DELETE /menu-category/branches/:branchId/categories/:id`| `menuCategory.controller.ts` | `MenuCategoryController.delete` | Unmigrated |
| `POST /menu-category/branches/:branchId/categories/:id/duplicate`| `menuCategory.controller.ts` | `MenuCategoryController.duplicate` | Unmigrated |
| `GET /menu-item/categories/:categoryId/items` | `menuItem.controller.ts` | `MenuItemController.findByCategory` | Unmigrated |
| `POST /menu-item/categories/:categoryId/items` | `menuItem.controller.ts` | `MenuItemController.create` | Unmigrated |
| `PATCH /menu-item/menu-items/:id` | `menuItem.controller.ts` | `MenuItemController.update` | Unmigrated |
| `DELETE /menu-item/menu-items/:id` | `menuItem.controller.ts` | `MenuItemController.delete` | Unmigrated |
| `POST /menu-item/branches/:branchId/menu-items/import`| `menuItem.controller.ts` | `MenuItemController.importCsv` | Unmigrated |
| `GET /modifier/branches/:id` | `modifier.controller.ts` | `ModifierController.findByBranch` | Unmigrated |
| `POST /modifier/branches/:id/modifier-group` | `modifier.controller.ts` | `ModifierController.createGroup` | Unmigrated |
| `POST /modifier/modifier-groups/:groupId/options` | `modifier.controller.ts` | `ModifierController.createOption` | Unmigrated |

### 2.4 Cart & Checkout (`/cart`, `/checkout`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `GET /cart` | `cart.controller.ts:getCart` | `CartController.getCart` | Migrated & Verified |
| `POST /cart/items` | `cart.controller.ts:addItem` | `CartController.addToCart` | Migrated & Verified |
| `PATCH /cart/items/:itemId` | `cart.controller.ts:updateItem` | `CartController.updateCartItem` | Migrated & Verified |
| `DELETE /cart/items/:itemId` | `cart.controller.ts:removeItem` | `CartController.removeCartItem` | Migrated & Verified |
| `DELETE /cart` | `cart.controller.ts:clearCart` | `CartController.clearCart` | Migrated & Verified |
| `POST /cart/apply-coupon` | `cart.controller.ts:applyCoupon` | `CartController.applyCoupon` | Migrated & Verified |
| `DELETE /cart/coupon` | `cart.controller.ts:removeCoupon` | `CartController.removeCoupon` | Migrated & Verified |
| `GET /cart/price-breakdown` | `cart.controller.ts:priceBreakdown`| `CartController.getPriceBreakdown` | Migrated & Verified |
| `POST /checkout/initiate` | `checkout.controller.ts:initiate`| `CheckoutController.initiate` | Migrated & Verified |
| `GET /checkout/:sessionId` | `checkout.controller.ts:getSession`| `CheckoutController.getSession` | Migrated & Verified |
| `POST /checkout/:sessionId/estimate-delivery`| `checkout.controller.ts:estimate`| `CheckoutController.estimateDelivery` | Migrated & Verified |
| `POST /checkout/:sessionId/place-order` | `checkout.controller.ts:placeOrder`| `CheckoutController.placeOrder` | Migrated & Verified |

### 2.5 Orders & Delivery Lifecycle (`/orders`, `/delivery-partner`, `/fleet-manager`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `GET /orders` | `order.controller.ts:list` | `OrderController.getCustomerOrders` | Migrated & Verified |
| `GET /orders/branch` | `order.controller.ts:branchOrders` | `OrderController.getBranchOrders` | Migrated & Verified |
| `GET /orders/:id` | `order.controller.ts:getById` | `OrderController.getOrderDetails` | Migrated & Verified |
| `GET /orders/:id/tracking` | `order.controller.ts:tracking` | `OrderController.getOrderTracking` | Migrated & Verified |
| `PATCH /orders/:id/cancel` | `order.controller.ts:cancel` | `OrderController.cancelOrder` | Migrated & Verified |
| `PATCH /orders/:id/accept` | `order.controller.ts:accept` | `OrderController.acceptOrder` | Migrated & Verified |
| `PATCH /orders/:id/reject` | `order.controller.ts:reject` | `OrderController.rejectOrder` | Migrated & Verified |
| `PATCH /orders/:id/preparing` | `order.controller.ts:preparing` | `OrderController.markPreparing` | Migrated & Verified |
| `PATCH /orders/:id/ready` | `order.controller.ts:ready` | `OrderController.markReady` | Migrated & Verified |
| `PATCH /orders/:id/handover` | `order.controller.ts:handover` | `OrderController.handoverOrder` | Migrated & Verified |
| `PATCH /orders/assignments/:id/accept` | `dp.controller.ts:accept` | `OrderController.acceptAssignment` | Migrated & Verified |
| `PATCH /orders/assignments/:id/decline` | `dp.controller.ts:decline` | `OrderController.declineAssignment` | Migrated & Verified |
| `PATCH /orders/:id/out-for-delivery` | `dp.controller.ts:outForDelivery` | `OrderController.markOutForDelivery` | Migrated & Verified |
| `PATCH /orders/:id/deliver` | `dp.controller.ts:deliver` (OTP) | `OrderController.verifyAndDeliver` | Migrated & Verified |
| `GET /delivery-partner/profile` | `dp.controller.ts:profile` | `DeliveryPartnerController.getProfile` | Migrated & Verified |
| `PATCH /delivery-partner/status` | `dp.controller.ts:updateStatus` | `DeliveryPartnerController.updateStatus` | Migrated & Verified |
| `GET /delivery-partner/assignments/active` | `dp.controller.ts:active` | `DeliveryPartnerController.getActiveAssignment` | Migrated & Verified |
| `GET /delivery-partner/assignments/all`| `dp.controller.ts:assignments` | `DeliveryPartnerController.getAllAssignments`| Migrated & Verified |
| `POST /delivery-partner/assignments/:id/location`| `dp.controller.ts:location` | `DeliveryPartnerController.updateLocation`| Migrated & Verified |
| `POST /delivery-partner/assignments/:id/report-issue`| `dp.controller.ts:issue` | `DeliveryPartnerController.reportIssue` | Migrated & Verified |
| `GET /delivery-partner/earnings` | `dp.controller.ts:earnings` | `DeliveryPartnerController.getEarnings` | Migrated & Verified |
| `GET /fleet-manager/live-map` | `fm.controller.ts:liveMap` | `FleetManagerController.getLiveMap` | Migrated & Verified |
| `GET /fleet-manager/riders` | `fm.controller.ts:riders` | `FleetManagerController.getRiders` | Migrated & Verified |
| `PATCH /fleet-manager/riders/:id/status`| `fm.controller.ts:status` | `FleetManagerController.updateRiderStatus` | Migrated & Verified |
| `POST /fleet-manager/:orderId/assign`| `fm.controller.ts:manualAssign` | `FleetManagerController.assignDelivery` | Migrated & Verified |
| `PATCH /fleet-manager/assignments/:id/reassign`| `fm.controller.ts:reassign` | `FleetManagerController.reassignDelivery` | Migrated & Verified |

### 2.6 Restaurant Management & Operations (`/restaurant-management`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `POST /restaurant-management` | `management.controller.ts:create`| `RestaurantManagementController.createRestaurant`| Migrated |
| `GET /restaurant-management/mine`| `management.controller.ts:mine`| `RestaurantManagementController.getMyRestaurants`| Migrated |
| `GET /restaurant-management/dashboard-stats`| `management.controller.ts:stats`| `RestaurantManagementController.getDashboardStats`| Migrated |
| `PATCH /restaurant-management/:id`| `management.controller.ts:update`| `RestaurantManagementController.updateRestaurant`| Migrated |
| `PATCH /restaurant-management/:id/pause`| `management.controller.ts:pause`| `RestaurantManagementController.pauseRestaurant`| Migrated |
| `PATCH /restaurant-management/:id/resume`| `management.controller.ts:resume`| `RestaurantManagementController.resumeRestaurant`| Migrated |
| `DELETE /restaurant-management/:id`| `management.controller.ts:deactivate`| `RestaurantManagementController.deactivateRestaurant`| Migrated |
| `GET /restaurant-management/:id/branches`| `branch.controller.ts:list`| `RestaurantManagementController.getBranches`| Migrated |
| `POST /restaurant-management/:id/branches`| `branch.controller.ts:create`| `RestaurantManagementController.createBranch`| Migrated |
| `PATCH /restaurant-management/branches/:id`| `branch.controller.ts:update`| `RestaurantManagementController.updateBranch`| Migrated |
| `PATCH /restaurant-management/branches/:id/toggle-orders`| `branch.controller.ts:toggleOrders`| `RestaurantManagementController.toggleOrders`| Migrated |
| `GET /restaurant-management/branches/:id/hours`| `branch.controller.ts:getHours`| `RestaurantManagementController.getOperatingHours`| Migrated |
| `PUT /restaurant-management/branches/:id/hours`| `branch.controller.ts:setHours`| `RestaurantManagementController.replaceOperatingHours`| Migrated |
| `GET /restaurant-management/branches/:id/delivery-zone`| `branch.controller.ts:getZone`| `RestaurantManagementController.getDeliveryZone`| Migrated |
| `PUT /restaurant-management/branches/:id/delivery-zone`| `branch.controller.ts:setZone`| `RestaurantManagementController.upsertDeliveryZone`| Migrated |
| `GET /restaurant-management/branches/:id/staff`| `restaurantStaff.controller.ts:list`| `RestaurantManagementController.getBranchStaff`| Migrated |
| `POST /restaurant-management/branches/:id/staff`| `restaurantStaff.controller.ts:create`| `RestaurantManagementController.addBranchStaff`| Migrated |
| `DELETE /restaurant-management/branches/:id/staff/:staffId`| `restaurantStaff.controller.ts:delete`| `RestaurantManagementController.removeBranchStaff`| Migrated |
| `POST /restaurant-staff/branches/:bId/staff`| `staff.controller.ts:create`| `RestaurantStaffController.create` | Unmigrated |

### 2.7 Payments, Refunds, Finance & Reviews (`/payments`, `/refund`, `/finance`, `/reviews`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `POST /payments/initiate` | `payment.controller.ts:initiate`| `PaymentController.initiatePayment` | **Completed & Verified** |
| `POST /payments/verify` | `payment.controller.ts:verify` | `PaymentController.verifyPayment` | **Completed & Verified** |
| `GET /payments/:orderId` | `payment.controller.ts:getDetails` | `PaymentController.getPaymentDetails` | **Completed & Verified** |
| `POST /refund` | `refund.controller.ts:create` | `FinanceController.createRefund` | **Completed & Verified** |
| `GET /refund` | `refund.controller.ts:list` | `FinanceController.getRefunds` | **Completed & Verified** |
| `PATCH /refunds/:id/status` | `refund.controller.ts:updateStatus` | `FinanceController.updateRefundStatus` | **Completed & Verified** |
| `GET /finance/overview` | `finance.controller.ts:overview` | `FinanceController.getOverview` | **Completed & Verified** |
| `GET /finance/payouts/restaurants`| `finance.controller.ts:payouts`| `FinanceController.getRestaurantPayouts`| **Completed & Verified** |
| `PATCH /finance/payouts/restaurants/:id/status`| `finance.controller.ts:updatePayout`| `FinanceController.updateRestaurantPayoutStatus`| **Completed & Verified** |
| `POST /finance/payouts/restaurants/process-weekly`| `finance.service.ts:weeklyPayout`| `FinanceController.processWeeklyRestaurantPayouts`| **Completed & Verified** |
| `GET /finance/payouts/partners` | `finance.controller.ts:partnerPayouts`| `FinanceController.getPartnerPayouts` | **Completed & Verified** |
| `PATCH /finance/payouts/partners/:id/status` | `finance.controller.ts:updatePartnerPayout`| `FinanceController.updatePartnerPayoutStatus` | **Completed & Verified** |
| `POST /finance/payouts/partners/process-weekly` | `finance.service.ts:weeklyPartnerPayout`| `FinanceController.processWeeklyPartnerPayouts` | **Completed & Verified** |
| `GET /reviews/restaurant/:restaurantId` | `reviews.controller.ts:byRestaurant`| `ReviewsController.getRestaurantReviews` | **Completed & Verified** |
| `POST /reviews/orders/:orderId` | `reviews.controller.ts:create` | `ReviewsController.submitReview` | **Completed & Verified** |
| `GET /reviews/owner` | `reviews.controller.ts:owner` | `ReviewsController.getOwnerReviews` | **Completed & Verified** |
| `POST /reviews/:reviewId/reply` | `reviews.controller.ts:reply` | `ReviewsController.replyToReview` | **Completed & Verified** |

### 2.8 Admin Operations & AI Assistant (`/admin`, `/ai`)
| Legacy Method & Path | Express Handler / Service | Target NestJS Controller & Method | Target Status |
|---|---|---|---|
| `GET /admin/users` | `admin.controller.ts:users` | `AdminController.getUsers` | **Completed & Verified** |
| `GET /admin/restaurants/pending`| `admin.controller.ts:pending` | `AdminController.getPendingRestaurants`| **Completed & Verified** |
| `GET /admin/kpis` | `admin.controller.ts:kpis` | `AdminController.getKpis` | **Completed & Verified** |
| `GET /admin/audit-logs` | `admin.controller.ts:logs` | `AdminController.getAuditLogs` | **Completed & Verified** |
| `GET /admin/tickets` | `admin.controller.ts:tickets` | `AdminController.getTickets` | **Completed & Verified** |
| `POST /ai/chat` | `ai.controller.ts:chat` | `AIController.chat` | **Completed & Verified** |
| `POST /ai/reset` | `ai.controller.ts:reset` | `AIController.resetChat` | **Completed & Verified** |

---

## 3. Server-Rendered EJS Pages to Target React Views

| Legacy EJS Template | Path / Route | Target React Route & Component | Target Status |
|---|---|---|---|
| `views/auth/login.ejs` | `/loginPage` | `/login` (`LoginPage`) | **Completed & Verified** |
| `views/auth/register/*.ejs` | `/registerPage/*` | `/register/*` (`RegisterPage`) | **Completed & Verified** |
| `views/auth/forgot-password.ejs`| `/forgotPasswordPage` | `/forgot-password` (`ForgotPasswordPage`)| **Completed & Verified** |
| `views/auth/reset-password.ejs` | `/resetPasswordPage` | `/reset-password` (`ForgotPasswordPage`) | **Completed & Verified** |
| `views/customer/dashboard.ejs` | `/c` | `/` or `/home` (`MainDashboard`) | **Completed & Verified** |
| `views/customer/restaurant.ejs` | `/restaurant/:id` | `/restaurant/:id` (`RestaurantDetailPage`)| **Completed & Verified** |
| `views/customer/cart.ejs` | `/c/cart` | `/checkout` (`CartDrawer` & `CheckoutPage`) | **Completed & Verified** |
| `views/customer/checkout.ejs` | `/c/checkout` | `/checkout` (`CheckoutPage`) | **Completed & Verified** |
| `views/customer/orders.ejs` | `/c/orders` | `/orders` (`OrderHistoryPage` & `OrderTrackingPage`) | **Completed & Verified** |
| `views/restaurantOwner/*.ejs` | `/ro/*` | `/owner-dashboard` (`RestaurantOwnerDashboard`)| **Completed & Verified** |
| `views/deliveryPartner/*.ejs` | `/d/*` | `/driver-dashboard` (`DeliveryPartnerDashboard`)| **Completed & Verified** |
| `views/fleetManager/*.ejs` | `/fl/*` | `/fleet-dashboard` (`FleetManagerDashboard`)| **Completed & Verified** |
| `views/finance/*.ejs` | `/fi/*` | `/finance-dashboard` (`FinanceManagerDashboard`)| **Completed & Verified** |
| `views/admin/*.ejs` | `/a/*` | `/admin-dashboard` (`AdminDashboard`)| **Completed & Verified** |
| `views/customer/cart.ejs` | `/c/cart` | `/cart` (`CartDrawer`) | Migrated & Verified |
| `views/customer/checkout.ejs` | `/c/checkout` | `/checkout` (`CheckoutPage`) | Migrated & Verified |
| `views/customer/order-confirmation.ejs`| `/c/order-confirmation`| `/orders/:id/confirmed` (`OrderConfirmationPage`)| Unmigrated |
| `views/customer/order-tracking.ejs`| `/c/tracking` | `/orders/:id/track` (`OrderTrackingPage`)| Unmigrated |
| `views/customer/orders.ejs` | `/c/orders` | `/orders` (`OrderHistoryPage`) | **Completed & Verified** |
| `views/customer/profile.ejs` | `/c/profile` | `/profile` (`CustomerProfilePage`) | Unmigrated |
| `views/restaurantOwner/*.ejs` | `/ro/*` | `/owner/*` (`RestaurantOwnerDashboard`)| **Completed & Verified** |
| `views/restaurantStaff/*.ejs` | `/rs/*` | `/staff/*` (`StaffKdsPage`, `StaffOrders`)| **Completed & Verified** |
| `views/deliveryPartner/*.ejs` | `/d/*` | `/driver/*` (`DeliveryPartnerDashboard`)| **Completed & Verified** |
| `views/fleetManager/*.ejs` | `/fl/*` | `/fleet/*` (`FleetManagerDashboard`)| **Completed & Verified** |
| `views/finance/*.ejs` | `/fi/*` | `/finance-dashboard` (`FinanceManagerDashboard`)| **Completed & Verified** |
| `views/admin/*.ejs` | `/a/*` | `/admin-dashboard` (`AdminDashboard`)| **Completed & Verified** |

---

## 4. Supporting Technologies & Integration Inventory

| Integration | Current Role | Migration Strategy / Status |
|---|---|---|
| **Redis** | AI conversation history, Redis GEO partner tracking, cache | Keep using in NestJS `RedisModule` / in-memory cache with TTL. |
| **Google GenAI** | Gemini chat assistant with 9 tool calls | **Completed & Verified** in `AiModule` (`@google/genai`) with schema-safe tool definitions, Struct responses, and intelligent local fallback engine. |
| **JWT / Cookies** | Access/refresh tokens stored in HTTP-only cookies | Standardize via NestJS `PassportModule`, `JwtModule`, and cookie parser. |
| **File Uploads** | Multer for restaurant logos, menu images, documents | NestJS `FileInterceptor` with validation pipes and local static storage in `/uploads`. |
| **Payments** | Local stub/workflow simulation (internal provider IDs) | Preserve workflow contracts, document webhook/SDK readiness. |
| **OpenAPI / Swagger**| `swagger-autogen` served at `/docs` | Migrate to native NestJS `@nestjs/swagger` decorators generating `/docs`. |
| **Background Jobs** | Order timeout worker & cron service | Migrate to NestJS `@nestjs/schedule` cron tasks with proper logging. |
