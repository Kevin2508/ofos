// src/modules/cart/cart.dto.ts

interface GetCartDto {
  // No input needed - uses authenticated userId
}

interface CartItemDTO {
  id: bigint;
  menuItemId: bigint;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  specialInstructions?: string | null;
  menuItem?: {
    id: bigint;
    name: string;
    imageUrl: string | null;
  } | null;
  modifiers: {
    id: bigint;
    modifierOptionId: bigint;
    modifierName: string;
    optionName: string;
    additionalPrice: string;
  }[];
}

interface PriceBreakdownDTO {
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  taxAmount: string;
  totalAmount: string;
  calculatedAt: Date;
}

interface CartResponseDTO {
  id: bigint;
  customerUserId: bigint;
  restaurantBranchId: bigint;
  status: string;
  restaurantBranch?: {
    id: bigint;
    restaurant: {
      businessName: string;
    }
  } | null;
  items: CartItemDTO[];
  priceBreakdown: PriceBreakdownDTO;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AddCartItemDTO {
  menuItemId: bigint;
  restaurantBranchId: bigint;
  quantity: number;
  specialInstructions?: string;
  modifiers?: {
    modifierOptionId: bigint;
    additionalPrice: number;
  }[];
}

interface UpdateCartItemDTO {
  quantity?: number;
  specialInstructions?: string;
}

interface ApplyCouponDTO {
  couponCode: string;
}

interface PriceBreakdownResponseDTO {
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  taxAmount: string;
  totalAmount: string;
  appliedCoupon?: {
    code: string;
    discountAmount: string;
  };
  calculatedAt: Date;
}

export type {
  GetCartDto,
  CartItemDTO,
  PriceBreakdownDTO,
  CartResponseDTO,
  AddCartItemDTO,
  UpdateCartItemDTO,
  ApplyCouponDTO,
  PriceBreakdownResponseDTO,
};