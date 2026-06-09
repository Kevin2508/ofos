export interface CartItemModifierDto {
  modifierOptionId: bigint;
}

export interface AddCartItemDto {
  restaurantBranchId: bigint;
  menuItemId: bigint;
  quantity: number;
  specialInstructions?: string;
  modifiers?: CartItemModifierDto[];
}

export interface UpdateCartItemDto {
  quantity?: number;
  specialInstructions?: string;
}

export interface ApplyCouponDto {
  couponCode: string;
}