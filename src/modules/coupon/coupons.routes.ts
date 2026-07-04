import { Router } from 'express';
import * as couponController from './coupons.controller.ts';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from './coupons.validation.ts';
import { validate } from '../../middlewares/validation.middleware.ts';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';

const couponRouter = Router();
couponRouter.use(authenticate)
// User/Customer Endpoints
couponRouter.post('/validate', validate(validateCouponSchema), couponController.validateCoupon);

// Admin/Restaurant Endpoints
couponRouter.post('/', authorize(["Admin"]), validate(createCouponSchema), couponController.createNewCoupon);
couponRouter.get('/:id/usage', couponController.getUsageStats);
// GET /coupons - List all platform coupons (Admin)
couponRouter.get('/', couponController.getAllCoupons);
couponRouter.patch('/:id', validate(updateCouponSchema), couponController.updateCoupon);
couponRouter.delete('/:id', couponController.deactivateCoupon);
// Restaurant Promotion Targets
couponRouter.get('/restaurant-coupons', couponController.getRestaurantCoupons);
couponRouter.post('/restaurant-coupons', validate(createCouponSchema), couponController.createRestaurantCoupon);
couponRouter.patch('/restaurant-coupons/:id', validate(updateCouponSchema), couponController.updateRestaurantCoupon);
couponRouter.delete('/restaurant-coupons/:id', couponController.deactivateRestaurantCoupon);


export default couponRouter;