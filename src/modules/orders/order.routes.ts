import { Router } from 'express';
import * as orderController from './order.controller.ts';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';

const router = Router();

router.get('/', authenticate, orderController.getOrders);

router.get('/:id', authenticate, orderController.getOrderDetails);

router.get('/:id/tracking', authenticate, orderController.getOrderTracking);

router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

router.post("/", authenticate, orderController.placeOrderController);

// Staff Actions
router.patch('/:id/accept', authenticate, authorize('RestaurantStaff'), orderController.staffAcceptOrder);
router.patch('/:id/reject', authenticate, authorize('RestaurantStaff'), orderController.staffRejectOrder);
router.patch('/:id/preparing', authenticate, authorize('RestaurantStaff'), orderController.staffMarkPreparing);
router.patch('/:id/ready', authenticate, authorize('RestaurantStaff'), orderController.staffMarkReady);

export default router;
