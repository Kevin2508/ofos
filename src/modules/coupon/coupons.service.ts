import * as couponRepo from './coupons.repository.ts';
import { UpdateCouponDto, ValidateCouponDto } from './coupons.dto.ts';

export async function validateCouponService(
  userId: string,
  data: ValidateCouponDto
) {
  const coupon = await couponRepo.findCouponByCode(data.code);

  if (!coupon || !coupon.isActive) throw new Error('Invalid or expired coupon.');

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new Error('Coupon is not valid at this time.');
  }

  // 1. Check Restaurant Applicability
  if (coupon.couponRestaurants.length > 0) {
    const isApplicable = coupon.couponRestaurants.some(
      (r) => String(r.restaurantId) === data.restaurantId
    );
    if (!isApplicable) throw new Error('Coupon not valid for this restaurant.');
  }

  // 2. Check Minimum Order Amount
  if (coupon.minimumOrderAmount && data.cartValue < Number(coupon.minimumOrderAmount)) {
    throw new Error(`Minimum order amount of ${coupon.minimumOrderAmount} required.`);
  }

  // 3. Check Global Usage Limit
  if (coupon.usageLimit) {
    const totalUsed = await couponRepo.getCouponUsageCount(coupon.id);
    if (totalUsed >= coupon.usageLimit) throw new Error('Coupon usage limit reached.');
  }

  // 4. Check Per User Limit
  if (coupon.perUserLimit) {
    const userUsed = await couponRepo.getCouponUsageCount(coupon.id, BigInt(userId));
    if (userUsed >= coupon.perUserLimit) throw new Error('You have reached the limit for this coupon.');
  }

  // Calculate Discount
  let discount = 0;
  if (coupon.couponType === 'PERCENTAGE') {
    discount = (data.cartValue * Number(coupon.value)) / 100;
    if (coupon.maximumDiscountAmount) {
      discount = Math.min(discount, Number(coupon.maximumDiscountAmount));
    }
  } else {
    discount = Number(coupon.value);
  }

  return {
    couponId: String(coupon.id),
    discountAmount: discount,
    finalAmount: Math.max(0, data.cartValue - discount),
  };
}

export async function getAllCouponsService() {
  const coupons = await couponRepo.findAllCoupons();
  
  // Serialize BigInt values to String safely for JSON transport
  return coupons.map((coupon) => ({
    ...coupon,
    id: String(coupon.id),
    couponRestaurants: coupon.couponRestaurants.map((cr) => ({
      couponId: String(cr.couponId),
      restaurantId: String(cr.restaurantId),
    })),
  }));
}



export async function updateCouponService(id: string, data: UpdateCouponDto) {
  // Convert incoming ID string to BigInt
  const couponId = BigInt(id);

  // Perform the update
  const updatedCoupon = await couponRepo.updateCouponById(couponId, data);

  // Serialize BigInt safely back to string for the client response
  return {
    ...updatedCoupon,
    id: String(updatedCoupon.id),
  };
}


export async function deactivateCouponService(id: string) {
  const couponId = BigInt(id);
  const deactivatedCoupon = await couponRepo.deactivateCouponById(couponId);

  return {
    ...deactivatedCoupon,
    id: String(deactivatedCoupon.id),
  };
}

export async function getRestaurantCouponsService() {
  const coupons = await couponRepo.findRestaurantCoupons();
  return coupons.map(c => ({
    ...c,
    id: String(c.id),
    couponRestaurants: c.couponRestaurants.map(cr => ({
      couponId: String(cr.couponId),
      restaurantId: String(cr.restaurantId)
    }))
  }));
}

export async function createRestaurantCouponService(data: any) {
  if (!data.restaurantIds || data.restaurantIds.length === 0) {
    throw new Error('Restaurant promotions must be linked to at least one restaurant ID.');
  }
  const coupon = await couponRepo.createRestaurantCoupon(data);
  return {
    ...coupon,
    id: String(coupon.id),
    couponRestaurants: coupon.couponRestaurants.map(cr => ({
      couponId: String(cr.couponId),
      restaurantId: String(cr.restaurantId)
    }))
  };
}