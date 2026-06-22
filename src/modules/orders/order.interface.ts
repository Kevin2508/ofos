import { Request } from "express";
import { DeliveryType, OrderStatus, PaymentStatus } from "../../generated/prisma/browser.ts";

export interface GetOrdersQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
  date?: string;
  payment?: string;
}

export interface OrderParams {
  id: string;
}

export interface AuthenticatedRequest extends Request<{}, {}, {}, GetOrdersQuery> {
  user?: {
    id: string | number;
  };
}

export interface CancelOrderBody {
  reason: string;
}



// ─────────────────────────────────────────────────────────────
// REQUEST
// ─────────────────────────────────────────────────────────────

export interface IPlaceOrderRequest {
  checkoutSessionId: bigint;
  specialInstructions?: string;
}

// ─────────────────────────────────────────────────────────────
// DB DATA SHAPES  (raw Prisma results)
// ─────────────────────────────────────────────────────────────

export interface ICheckoutSessionData {
  id: bigint;
  cartId: bigint;
  customerUserId: bigint;
  addressId: bigint;
  deliveryType: DeliveryType;
  scheduledFor: Date | null;
  estimatedDeliveryMinutes: number | null;
  expiresAt: Date;
  address: {
    contactName: string;
    contactPhone: string;
    addressLine1: string;
    addressLine2: string | null;
    landmark: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: any;
    longitude: any;
  };
}

export interface ICartItemModifierData {
  additionalPrice: any;
  modifierOption: {
    optionName: string;
    modifierGroup: {
      name: string;
    };
  };
}

export interface ICartItemData {
  id: bigint;
  menuItemId: bigint;
  quantity: number;
  unitPrice: any;
  lineTotal: any;
  specialInstructions: string | null;
  menuItem: {
    name: string;
    description: string | null;
  };
  modifiers: ICartItemModifierData[];
}

export interface ICartData {
  id: bigint;
  restaurantBranchId: bigint;
  subtotalAmount: any;
  totalAmount: any;
  items: ICartItemData[];
  branch: {
    id: bigint;
    isActive: boolean;
    deliveryFee: any;
    minimumOrderValue: any;
    restaurant: {
      id: bigint;
      status: string;
    };
  };
}

// ─────────────────────────────────────────────────────────────
// RESULT
// ─────────────────────────────────────────────────────────────

export interface IPlaceOrderResult {
  orderId: bigint;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  estimatedDeliveryAt: Date | null;
  deliveryType: string;
  scheduledFor: Date | null;
  otp?: string;
}