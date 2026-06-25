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
  updateRestaurantDocumentStatus,
  updateSystemConfig,
  createSystemConfig,
  deleteSystemConfig,
  updateUserRoleStatus,
  updateUserStatus,
  getAllRestaurants,
  getSupportTickets,
  respondToSupportTicket,
  resolveSupportTicket,
  triggerDisputeRefund,
  getCoupons,
  createCoupon,
  updateCoupon,
  overrideMenuItem,
  overrideOperatingHour,
  getKpis,
  getFinanceReports,
  getHeatmap,
} from './admin.controller.ts';
import {
  getAdminOrdersQuerySchema,
  getAllUsersSchema,
  getAuditLogsSchema,
  restaurantIdSchema,
  documentIdSchema,
  updateRestaurantStatusSchema,
  updateRestaurantDocumentStatusSchema,
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
