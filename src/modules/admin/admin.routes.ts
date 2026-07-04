import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';
import {
  validate,
  validateParams,
  validateQuery,
} from '../../middlewares/validation.middleware.ts';
import {
  createCoupon,
  createSystemConfig,
  deleteSystemConfig,
  getAdminOrders,
  getAllRestaurants,
  getAllSystemConfigs,
  getAllUsers,
  getAuditLogs,
  getCoupons,
  getFinanceReports,
  getHeatmap,
  getKpis,
  getPendingRestaurants,
  getSupportTickets,
  getUserById,
  overrideMenuItem,
  overrideOperatingHour,
  resolveSupportTicket,
  respondToSupportTicket,
  triggerDisputeRefund,
  updateCoupon,
  updateRestaurantDocumentStatus,
  updateRestaurantStatus,
  updateSystemConfig,
  updateUserRoleStatus,
  updateUserStatus,
} from './admin.controller.ts';
import {
  documentIdSchema,
  getAdminOrdersQuerySchema,
  getAllUsersSchema,
  getAuditLogsSchema,
  restaurantIdSchema,
  updateRestaurantDocumentStatusSchema,
  updateRestaurantStatusSchema,
  updateSystemConfigSchema,
  updateUserRoleStatusSchema,
  updateUserStatusSchema,
  userIdSchema,
} from './admin.validation.ts';

const adminRouter = Router();

adminRouter.use(authenticate);

adminRouter.use(authorize(['Admin']));

adminRouter.get('/users', validateQuery(getAllUsersSchema), getAllUsers);

adminRouter.get('/user/:id', validateParams(userIdSchema), getUserById);

adminRouter.patch(
  '/user/:id/role-status',
  validateParams(userIdSchema),
  validate(updateUserRoleStatusSchema),
  updateUserRoleStatus
);

adminRouter.patch(
  '/user/:id/account-status',
  validateParams(userIdSchema),
  validate(updateUserStatusSchema),
  updateUserStatus
);

adminRouter.get('/restaurants/pending', getPendingRestaurants);

adminRouter.get('/restaurants', getAllRestaurants);

adminRouter.patch(
  '/restaurants/:id/status',
  validateParams(restaurantIdSchema),
  validate(updateRestaurantStatusSchema),
  updateRestaurantStatus
);

adminRouter.patch(
  '/restaurants/:id/documents/:docId/status',
  validateParams(documentIdSchema),
  validate(updateRestaurantDocumentStatusSchema),
  updateRestaurantDocumentStatus
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

adminRouter.post(
  '/config',
  createSystemConfig
);

adminRouter.delete(
  '/config/:key',
  deleteSystemConfig
);

adminRouter.get('/audit-logs', validateQuery(getAuditLogsSchema), getAuditLogs);

adminRouter.get('/tickets', getSupportTickets);

adminRouter.patch('/tickets/:id/respond', respondToSupportTicket);

adminRouter.patch('/tickets/:id/resolve', resolveSupportTicket);

adminRouter.post('/disputes/refund', triggerDisputeRefund);

adminRouter.get('/coupons', getCoupons);
adminRouter.post('/coupons', createCoupon);
adminRouter.patch('/coupons/:id', updateCoupon);

adminRouter.patch('/menu/:id/override', overrideMenuItem);
adminRouter.patch('/hours/:id/override', overrideOperatingHour);

adminRouter.get('/kpis', getKpis);
adminRouter.get('/reports/finance', getFinanceReports);
adminRouter.get('/reports/heatmap', getHeatmap);

export { adminRouter };
