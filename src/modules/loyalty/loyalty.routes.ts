import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.ts';
import * as loyaltyController from './loyalty.controller.ts';

const loyaltyRouter = Router();

loyaltyRouter.use(authenticate);

// Get current points balance and history
loyaltyRouter.get('/', loyaltyController.getLoyaltyDetails);

// Apply points to cart
loyaltyRouter.post('/apply', loyaltyController.applyLoyaltyPoints);

// Remove points from cart
loyaltyRouter.post('/remove', loyaltyController.removeLoyaltyPoints);

export { loyaltyRouter };
