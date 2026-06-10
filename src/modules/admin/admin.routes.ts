import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';

const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.use(authorize('Fleet_manager'));

// GET /admin/users
// Search and list all users with role and status filters.

// GET /admin/users/:id
// Get detailed profile for any user.

// PATCH /admin/users/:id/
// status Approve, suspend, or permanently deactivate a user account.

// GET /admin/restaurants/pending
// List restaurants awaiting verification approval.

// PATCH /admin/restaurants/:id/approve
// Approve a restaurant's onboarding application.

// PATCH /admin/restaurants/:id/reject
// Reject with a reason and optional document request.

// PATCH /admin/restaurants/:id/delist
// Temporarily delist an approved restaurant.

// GET /admin/orders
// Real-time order monitoring board across the entire platform.

// GET /admin/config
// Get all current system configuration values.

// PATCH /admin/config/:key
// Update a configuration value.

// GET /admin/audit-logs
// Paginated immutable audit trail with actor and entity filters.

export { adminRouter };
