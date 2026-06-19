import { prisma } from '../../config/prisma.ts';
import { CreateCouponDto, UpdateCouponDto } from './coupons.dto.ts';

export async function findCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code },
    include: { couponRestaurants: true },
  });
}

export async function findAllCoupons() {
  return prisma.coupon.findMany({
    include: {
      couponRestaurants: true, // Includes associated restaurant mappings if any
    },
    orderBy: {
      createdAt: 'desc', // Lists newest coupons first
    },
  });
}

export async function createCoupon(data: CreateCouponDto) {
  const { restaurantIds, ...couponData } = data;
  return prisma.coupon.create({
    data: {
      ...couponData,
      couponRestaurants: restaurantIds
        ? { create: restaurantIds.map((id) => ({ restaurantId: BigInt(id) })) }
        : undefined,
    },
  });
}
export async function deactivateCouponById(id: bigint) {
  return prisma.coupon.update({
    where: { id },
    data: {
      isActive: false,
    },
  });
}
export async function updateCouponById(id: bigint, data: UpdateCouponDto) {
  const { restaurantIds, ...couponData } = data;
  return prisma.coupon.update({
    where: { id },
    data: {
      ...couponData,
      // Note: Full sync of restaurantIds would require a deleteMany + create combo
    },
  });
}

export async function getCouponUsageCount(couponId: bigint, userId?: bigint) {
  return prisma.couponUsage.count({
    where: {
      couponId,
      customerUserId: userId,
    },
  });
}

export async function getCouponStats(couponId: bigint) {
  return prisma.couponUsage.aggregate({
    where: { couponId },
    _count: true,
    _sum: { discountAmount: true },
  });
}

export async function findRestaurantCoupons() {
  return prisma.coupon.findMany({
    where: {
      couponRestaurants: {
        some: {} // Ensures it has at least one restaurant link
      }
    },
    include: {
      couponRestaurants: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

// POST /restaurant-coupons -> Enforce restaurant link creation
export async function createRestaurantCoupon(data: any) {
  const { restaurantIds, ...couponData } = data;
  
  return prisma.coupon.create({
    data: {
      ...couponData,
      couponRestaurants: {
        create: restaurantIds.map((id: string) => ({ restaurantId: BigInt(id) }))
      }
    },
    include: { couponRestaurants: true }
  });
}