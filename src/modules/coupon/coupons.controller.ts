import { Request, Response } from 'express';
import * as couponService from './coupons.service.ts';
import * as couponRepo from './coupons.repository.ts';
import { catchAsync } from '../../middlewares/catch.async.ts';
import { Prisma } from '../../generated/prisma/client.ts';


export const validateCoupon = catchAsync(async (req: Request, res: Response) => {
  // Assuming userId comes from an auth middleware
  const userId = (req as any).user.id;
  const result = await couponService.validateCouponService(userId, req.body);

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

export const createNewCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponRepo.createCoupon(req.body);
  res.status(201).json({
    status: 'success',
    data: { coupon },
  });
});

export const getUsageStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await couponRepo.getCouponStats(BigInt(req.params.id as string));
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

export const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const coupons = await couponService.getAllCouponsService();

  res.status(200).json({
    status: 'success',
    results: coupons.length,
    data: {
      coupons,
    },
  });
});

export const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updatedCoupon = await couponService.updateCouponService(id as string, req.body);

    return res.status(200).json({
      status: 'success',
      message: 'Coupon updated successfully',
      data: { coupon: updatedCoupon },
    });
  } catch (error) {
    // P2025 is Prisma's error code for "Record to update not found"
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({
        status: 'fail',
        message: `Coupon with ID ${id} was not found.`,
      });
    }
    throw error;
  }
});


export const deactivateCoupon = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const coupon = await couponService.deactivateCouponService(id as string);

    return res.status(200).json({
      status: 'success',
      message: `Coupon '${coupon.code}' has been deactivated successfully.`,
      data: { coupon },
    });
  } catch (error) {
    // Catch missing coupon record errors safely
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({
        status: 'fail',
        message: `Coupon with ID ${id} was not found.`,
      });
    }

    throw error;
  }
});

export const getRestaurantCoupons = catchAsync(async (req: Request, res: Response) => {
  const coupons = await couponService.getRestaurantCouponsService();
  res.status(200).json({ status: 'success', results: coupons.length, data: { coupons } });
});

export const createRestaurantCoupon = catchAsync(async (req: Request, res: Response) => {
  try {
    const coupon = await couponService.createRestaurantCouponService(req.body);
    return res.status(201).json({ status: 'success', data: { coupon } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ status: 'fail', message: 'Coupon code already exists.' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ status: 'fail', message: 'One or more provided Restaurant IDs do not exist.' });
    }
    return res.status(400).json({ status: 'fail', message: error.message });
  }
});

export const updateRestaurantCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.updateCouponService(req.params.id as string, req.body);
  res.status(200).json({ status: 'success', message: 'Restaurant promotion updated', data: { coupon } });
});

export const deactivateRestaurantCoupon = catchAsync(async (req: Request, res: Response) => {
  const coupon = await couponService.deactivateCouponService(req.params.id as string);
  res.status(200).json({ status: 'success', message: 'Restaurant promotion deactivated', data: { coupon } });
});