import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';
import * as loyaltyService from './loyalty.service.ts';
import * as cartService from '../cart/cart.service.ts';
import { getActiveCartByUser } from '../cart/cart.repository.ts';

export const getLoyaltyDetails = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const details = await loyaltyService.getLoyaltyDetailsService(BigInt(userId));
  return res.json({ success: true, data: details });
});

export const applyLoyaltyPoints = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { points } = req.body;
  if (!userId || !points) {
    return res.status(400).json({ success: false, message: 'Invalid request' });
  }

  const cart = await getActiveCartByUser(BigInt(userId));
  if (!cart) {
    return res.status(404).json({ success: false, message: 'No active cart found' });
  }

  const result = await loyaltyService.applyLoyaltyPointsService(BigInt(userId), cart.id, Number(points));

  // recalculate cart totals using cartService
  await cartService.syncCartTotalsService(cart.id, BigInt(userId));

  return res.json({ success: true, message: result.message, data: { appliedPoints: result.appliedPoints } });
});

export const removeLoyaltyPoints = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const cart = await getActiveCartByUser(BigInt(userId));
  if (!cart) {
    return res.status(404).json({ success: false, message: 'No active cart found' });
  }

  const result = await loyaltyService.removeLoyaltyPointsService(cart.id);

  // recalculate cart totals using cartService
  await cartService.syncCartTotalsService(cart.id, BigInt(userId));

  return res.json({ success: true, message: result.message });
});
