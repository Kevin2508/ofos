// src/modules/checkout/checkout.routes.ts

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';
import {
  initiateCheckout,
  getCheckoutSession,
  estimateDelivery,
  placeOrder,
} from './checkout.controller.ts';
import {
  initiateCheckoutSchema,
  estimateDeliverySchema,
  placeOrderSchema,
} from './checkout.validation.ts';

const checkoutRouter = Router();

// All checkout routes require authentication
checkoutRouter.use(authenticate);

// POST /checkout/initiate - Create checkout session
checkoutRouter.post('/initiate', validate(initiateCheckoutSchema), initiateCheckout);

// GET /checkout/:sessionId - Get checkout session
checkoutRouter.get('/:sessionId', getCheckoutSession);

// POST /checkout/:sessionId/estimate-delivery - Estimate delivery
checkoutRouter.post(
  '/:sessionId/estimate-delivery',
  validate(estimateDeliverySchema),
  estimateDelivery
);

// POST /checkout/:sessionId/place-order - Place order
checkoutRouter.post(
  '/:sessionId/place-order',
  validate(placeOrderSchema),
  placeOrder
);

export default checkoutRouter;