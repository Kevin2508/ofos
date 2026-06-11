import { Router } from 'express';
import * as orderController from './order.controller.ts';
import { authenticate } from '../../middlewares/auth.middleware.ts';

const router = Router();

router.get('/', authenticate, orderController.getOrders);

router.get('/:id', authenticate, orderController.getOrderDetails);

router.get('/:id/tracking', authenticate, orderController.getOrderTracking);

router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

router.post("/", authenticate, orderController.placeOrderController);

export default router;
