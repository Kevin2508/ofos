// src/modules/cart/cart.controller.ts

import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import {
  getCartService,
  addItemToCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
  applyCouponService,
  removeCouponService,
  getPriceBreakdownService,
} from './cart.service.ts';

export const getCart = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  if (!user) throw new Error('User not found');

  const userId = BigInt(user.id);
  const cart = await getCartService(userId);

  res.status(200).json({
    status: 'success',
    message: 'Cart retrieved successfully',
    data: cart,
  });
});

export const addCartItem = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  if (!user) throw new Error('User not found');

  const userId = BigInt(user.id);
  const { menuItemId, restaurantBranchId, quantity, specialInstructions, modifiers } = req.body;

  const cart = await addItemToCartService(userId, {
    menuItemId: BigInt(menuItemId),
    restaurantBranchId: BigInt(restaurantBranchId),
    quantity,
    specialInstructions,
    modifiers: modifiers?.map((m: any) => ({
      modifierOptionId: BigInt(m.modifierOptionId),
      additionalPrice: m.additionalPrice,
    })),
  });

  res.status(201).json({
    status: 'success',
    message: 'Item added to cart successfully',
    data: cart,
  });
});

export const updateCartItem = catchAsync(
  async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user) throw new Error('User not found');

    const userId = BigInt(user.id);
    const cartItemId = BigInt(req.params.itemId);
    const { quantity, specialInstructions } = req.body;

    const cart = await updateCartItemService(userId, cartItemId, {
      quantity,
      specialInstructions,
    });

    res.status(200).json({
      status: 'success',
      message: 'Cart item updated successfully',
      data: cart,
    });
  }
);

export const removeCartItem = catchAsync(
  async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user) throw new Error('User not found');

    const userId = BigInt(user.id);
    const cartItemId = BigInt(req.params.itemId);

    const cart = await removeCartItemService(userId, cartItemId);

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart',
      data: cart,
    });
  }
);

export const clearCartHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user) throw new Error('User not found');

    const userId = BigInt(user.id);
    const cart = await clearCartService(userId);

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared successfully',
      data: cart,
    });
  }
);

export const applyCoupon = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  if (!user) throw new Error('User not found');

  const userId = BigInt(user.id);
  const { couponCode } = req.body;

  const breakdown = await applyCouponService(userId, couponCode);

  res.status(200).json({
    status: 'success',
    message: 'Coupon applied successfully',
    data: breakdown,
  });
});

export const removeCoupon = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  if (!user) throw new Error('User not found');

  const userId = BigInt(user.id);
  const breakdown = await removeCouponService(userId);

  res.status(200).json({
    status: 'success',
    message: 'Coupon removed successfully',
    data: breakdown,
  });
});

export const getPriceBreakdown = catchAsync(
  async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user) throw new Error('User not found');

    const userId = BigInt(user.id);
    const breakdown = await getPriceBreakdownService(userId);

    res.status(200).json({
      status: 'success',
      message: 'Price breakdown retrieved successfully',
      data: breakdown,
    });
  }
);