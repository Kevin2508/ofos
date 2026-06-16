// src/modules/cart/cart.routes.ts

import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartHandler,
  applyCoupon,
  removeCoupon,
  getPriceBreakdown,
} from './cart.controller.ts';
import {
  getCartSchema,
  addCartItemSchema,
  updateCartItemSchema,
  applyCouponSchema,
} from './cart.validation.ts';

const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authenticate);

// GET /cart - retrieve active cart
cartRouter.get('/', getCart);

// POST /cart/items - add item to cart
cartRouter.post('/items', validate(addCartItemSchema), addCartItem);

// PATCH /cart/items/:itemId - update cart item
cartRouter.patch('/items/:itemId', validate(updateCartItemSchema), updateCartItem);

// DELETE /cart/items/:itemId - remove item from cart
cartRouter.delete('/items/:itemId', removeCartItem);

// DELETE /cart - clear entire cart
cartRouter.delete('/', clearCartHandler);

// POST /cart/apply-coupon - apply coupon code
cartRouter.post('/apply-coupon', validate(applyCouponSchema), applyCoupon);

// DELETE /cart/coupon - remove applied coupon
cartRouter.delete('/coupon', removeCoupon);

// GET /cart/price-breakdown - get live price breakdown
cartRouter.get('/price-breakdown', getPriceBreakdown);

export default cartRouter;