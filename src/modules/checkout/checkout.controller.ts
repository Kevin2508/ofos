// src/modules/checkout/checkout.controller.ts

import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import {
  initiateCheckoutService,
  getCheckoutSessionService,
  estimateDeliveryService,
  placeOrderService,
} from './checkout.service.ts';



export const getCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user) throw new Error('User not found');

    const userId = BigInt(user.id);
    const sessionId = BigInt(req.params.sessionId as string);

    const session = await getCheckoutSessionService(userId, sessionId);

    res.status(200).json({
      status: 'success',
      message: 'Checkout session retrieved',
      data: session,
    });
  }
);
export const initiateCheckout = catchAsync(
  async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user) throw new Error('User not found');

    const userId = BigInt(user.id);
    const {
      addressId,
      deliveryType,
      scheduledFor,
      paymentMethodId,
      couponId,
    } = req.body;

    const session = await initiateCheckoutService(userId, {
      addressId: BigInt(addressId),
      deliveryType,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      paymentMethodId: paymentMethodId ? BigInt(paymentMethodId) : undefined,
      couponId: couponId ? BigInt(couponId) : undefined,
    });

    res.status(201).json({
      status: 'success',
      message: 'Checkout session initiated',
      data: session,
    });
  }
);
export const estimateDelivery = catchAsync(
  async (req: Request, res: Response) => {
    const user: any = req.user;
    if (!user) throw new Error('User not found');

    const userId = BigInt(user.id);
    const sessionId = BigInt(req.params.sessionId as string);
    const {
      restaurantLatitude,
      restaurantLongitude,
      customerLatitude,
      customerLongitude,
    } = req.body;

    const estimate = await estimateDeliveryService(
      userId,
      sessionId,
      restaurantLatitude,
      restaurantLongitude,
      customerLatitude,
      customerLongitude
    );

    res.status(200).json({
      status: 'success',
      message: 'Delivery estimate calculated',
      data: estimate,
    });
  }
);

export const placeOrder = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  if (!user) throw new Error('User not found');

  const userId = BigInt(user.id);
  const sessionId = BigInt(req.params.sessionId as string);
  const { paymentProvider } = req.body;

  const order = await placeOrderService(userId, sessionId, paymentProvider);

  res.status(201).json({
    status: 'success',
    message: 'Order placed successfully',
    data: order,
  });
});