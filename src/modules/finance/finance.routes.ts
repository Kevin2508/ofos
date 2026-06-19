import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';
import {
  getFinanceOverview,
  getPartnerPayouts,
  getRefunds,
  getRestaurantPayouts,
  updatePartnerPayoutStatus,
  updateRefundStatus,
  updateRestaurantPayoutStatus
} from './finance.controller.ts';

const financeRouter = Router();

financeRouter.use(authenticate);
financeRouter.use(authorize('Finance_manager'));

financeRouter.get('/overview', getFinanceOverview);

financeRouter.get('/payouts/restaurants', getRestaurantPayouts);
financeRouter.patch('/payouts/restaurants/:id/status', updateRestaurantPayoutStatus);

financeRouter.get('/payouts/partners', getPartnerPayouts);
financeRouter.patch('/payouts/partners/:id/status', updatePartnerPayoutStatus);

financeRouter.get('/refunds', getRefunds);
financeRouter.patch('/refunds/:id/status', updateRefundStatus);

export { financeRouter };
