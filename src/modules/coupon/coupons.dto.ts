import { CouponType } from "../../generated/prisma/enums.ts";

export interface CreateCouponDto {
  code: string;
  couponType: CouponType;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  restaurantIds?: string[]; // For restaurant-specific coupons
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {
  isActive?: boolean;
}

export interface ValidateCouponDto {
  code: string;
  cartValue: number;
  restaurantId: string;
}