import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';
import {
  validate,
  validateParams,
  validateQuery,
} from '../../middlewares/validation.middleware.ts';
import {
  getAdminOrders,
  getAllSystemConfigs,
  getAllUsers,
  getAuditLogs,
  getPendingRestaurants,
  getUserById,
  updateRestaurantStatus,
  updateSystemConfig,
  updateUserRoleStatus,
} from './admin.controller.ts';
import {
  getAdminOrdersQuerySchema,
  getAllUsersSchema,
  getAuditLogsSchema,
  restaurantIdSchema,
  updateRestaurantStatusSchema,
  updateSystemConfigSchema,
  updateUserRoleStatusSchema,
  userIdSchema,
} from './admin.validation.ts';

const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.use(authorize('Admin'));

adminRouter.get('/users', validateQuery(getAllUsersSchema), getAllUsers);

adminRouter.get('/user/:id', validateParams(userIdSchema), getUserById);

adminRouter.patch(
  '/user/:id/status',
  validateParams(userIdSchema),
  validate(updateUserRoleStatusSchema),
  updateUserRoleStatus
);

adminRouter.get('/restaurants/pending', getPendingRestaurants);

adminRouter.patch(
  '/restaurants/:id/status',
  validateParams(restaurantIdSchema),
  validate(updateRestaurantStatusSchema),
  updateRestaurantStatus
);

adminRouter.get(
  '/orders',
  validateQuery(getAdminOrdersQuerySchema),
  getAdminOrders
);

adminRouter.get('/config', getAllSystemConfigs);

adminRouter.patch(
  '/config/update',
  validate(updateSystemConfigSchema),
  updateSystemConfig
);

adminRouter.get('/audit-logs', validateQuery(getAuditLogsSchema), getAuditLogs);

export { adminRouter };
