
interface InitiateCheckoutDTO {
  addressId: bigint;
  deliveryType: 'ASAP' | 'SCHEDULED';
  scheduledFor?: Date;
  paymentMethodId?: bigint;
  couponId?: bigint;
}

interface CheckoutSessionDTO {
  id: bigint;
  cartId: bigint;
  customerUserId: bigint;
  addressId: bigint;
  paymentMethodId?: bigint;
  couponId?: bigint;
  deliveryType: string;
  scheduledFor?: Date;
  estimatedDeliveryMinutes?: number;
  expiresAt: Date;
  createdAt: Date;
}

interface EstimateDeliveryDTO {
  sessionId: bigint;
  restaurantLatitude: number;
  restaurantLongitude: number;
  customerLatitude: number;
  customerLongitude: number;
}

interface PlaceOrderDTO {
  sessionId: bigint;
  paymentProvider: string;
}

interface OrderResponseDTO {
  id: bigint;
  orderNumber: string;
  customerUserId: bigint;
  restaurantId: bigint;
  branchId: bigint;
  orderStatus: string;
  paymentStatus: string;
  subtotalAmount: string;
  discountAmount: string;
  deliveryFee: string;
  taxAmount: string;
  totalAmount: string;
  otp?: string;
  estimatedDeliveryAt?: Date;
  createdAt: Date;
}

export {
  InitiateCheckoutDTO,
  CheckoutSessionDTO,
  EstimateDeliveryDTO,
  PlaceOrderDTO,
  OrderResponseDTO,
};