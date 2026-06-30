import { Router } from 'express';
import * as orderController from './order.controller.ts';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';

const router = Router();

router.get('/', authenticate, orderController.getOrders);

// Static routes MUST come before wildcard /:id routes
router.get('/restaurant', authenticate, authorize(['Restaurant_owner', 'Restaurant_staff']), orderController.getRestaurantOrders);

router.get('/restaurant/:id', authenticate, authorize(['Restaurant_owner', 'Restaurant_staff']), orderController.getRestaurantOrderDetails);

// Wildcard routes after all static routes
router.get('/:id', authenticate, orderController.getOrderDetails);

router.get('/:id/tracking', authenticate, orderController.getOrderTracking);

router.patch('/:id/cancel', authenticate, orderController.cancelOrder);

router.post('/:id/dispute', authenticate, orderController.raiseDisputeController);

router.post("/", authenticate, orderController.placeOrderController);

router.post("/:id/reorder", authenticate, orderController.reorderPastOrderController);

// Staff Actions
router.patch('/:id/accept', authenticate, authorize(['Restaurant_staff', 'Restaurant_owner']), orderController.staffAcceptOrder);
router.patch('/:id/reject', authenticate, authorize(['Restaurant_staff', 'Restaurant_owner']), orderController.staffRejectOrder);
router.patch('/:id/preparing', authenticate, authorize(['Restaurant_staff', 'Restaurant_owner']), orderController.staffMarkPreparing);
router.patch('/:id/ready', authenticate, authorize(['Restaurant_staff', 'Restaurant_owner']), orderController.staffMarkReady);
router.patch('/:id/items/:itemId/unavailable', authenticate, authorize(['Restaurant_staff', 'Restaurant_owner']), orderController.staffMarkItemUnavailable);
router.patch('/:id/handover', authenticate, authorize(['Restaurant_staff', 'Restaurant_owner']), orderController.staffHandoverOrder);

export default router;
