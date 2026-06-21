import { IPlaceOrderRequest, IPlaceOrderResult } from './order.interface.ts';
import bcrypt from 'bcrypt';
import orderRepository, {
  createOrder,
  findActiveCart,
  findCheckoutSession,
  findExistingOrderBySession,
} from './order.repository.ts';
import { triggerAutoAssignment } from '../deliveryPartner/deliveryPartner.service.ts';
// import * as orderRepository from "./order.repository.ts";

async function getOrders(customerUserId: bigint, page: number, limit: number) {
  const [orders, total] = await Promise.all([
    orderRepository.getOrders({
      customerUserId,
      page,
      limit,
    }),

    orderRepository.countOrders(customerUserId),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getOrderDetails(orderId: bigint, customerUserId: bigint) {
  const order = await orderRepository.getOrderById(orderId, customerUserId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  return order;
}

export async function getOrderTracking(
  orderId: bigint,
  customerUserId: bigint
) {
  const order = await orderRepository.getOrderTrackingData(
    orderId,
    customerUserId
  );

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  const assignment = order.deliveryAssignments[0];

  if (!assignment) {
    return {
      orderStatus: order.orderStatus,
      trackingAvailable: false,
    };
  }

  const latestLocation = assignment.trackingPoints[0];

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,

    trackingAvailable: true,

    partner: assignment.partner
      ? {
        id: assignment.partner.user.id,
        firstName: assignment.partner.user.firstName,
        lastName: assignment.partner.user.lastName,
        phone: assignment.partner.user.phone,
      }
      : null,

    location: latestLocation
      ? {
        latitude: latestLocation.latitude,
        longitude: latestLocation.longitude,
        recordedAt: latestLocation.recordedAt,
      }
      : null,
  };
}

export async function cancelOrder(
  orderId: bigint,
  customerUserId: bigint,
  reason: string
) {
  const order = await orderRepository.findOrderForCancellation(
    orderId,
    customerUserId
  );

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  if (order.orderStatus !== 'PLACED') {
    throw new Error('ORDER_CANNOT_BE_CANCELLED');
  }

  return orderRepository.cancelOrder(orderId, customerUserId, reason);
}

export async function acceptOrder(orderId: bigint, staffUserId: bigint) {
  return orderRepository.updateOrderStatus(orderId, 'ACCEPTED', staffUserId, 'Staff accepted order');
}

export async function rejectOrder(orderId: bigint, staffUserId: bigint, reason: string) {
  return orderRepository.updateOrderStatus(orderId, 'REJECTED', staffUserId, reason);
}

export async function markPreparing(orderId: bigint, staffUserId: bigint) {
  return orderRepository.updateOrderStatus(orderId, 'PREPARING', staffUserId, 'Food is being prepared');
}

export async function markReadyForPickup(orderId: bigint, staffUserId: bigint) {
  const order = await orderRepository.updateOrderStatus(orderId, 'READY_FOR_PICKUP', staffUserId, 'Ready for pickup');
  await triggerAutoAssignment(orderId);
  return order;
}

const TAX_RATE = 0.05;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const generateOrderNumber = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomPart = Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `ORD-${datePart}-${randomPart}`;
};

// ─────────────────────────────────────────────────────────────
// PLACE ORDER
// ─────────────────────────────────────────────────────────────

export const placeOrder = async (
  customerUserId: bigint,
  req: IPlaceOrderRequest
): Promise<IPlaceOrderResult> => {
  // ── 1. Load & validate checkout session ───────────────────
  const session = await findCheckoutSession(
    req.checkoutSessionId,
    customerUserId
  );
  if (!session) {
    throw new Error('Checkout session not found.');
  }

  // if (new Date() > session.expiresAt) {
  //   throw new Error(
  //     'Checkout session has expired. Please start checkout again.'
  //   );
  // }

  // ── 2. Prevent double submission ──────────────────────────
  const alreadyPlaced = await findExistingOrderBySession(req.checkoutSessionId);

  if (alreadyPlaced) {
    throw new Error(
      'An order has already been placed for this checkout session.'
    );
  }

  // ── 3. Load & validate cart ───────────────────────────────
  const cart = await findActiveCart(session.cartId, customerUserId);

  if (!cart) {
    throw new Error('Cart not found or has already been checked out.');
  }

  if (cart.items.length === 0) {
    throw new Error('Cannot place an order with an empty cart.');
  }

  // ── 4. Validate branch & restaurant ───────────────────────
  if (!cart.branch.isActive) {
    throw new Error(
      'This restaurant branch is currently not accepting orders.'
    );
  }

  // ── 5. Compute price breakdown ────────────────────────────
  const subtotal = parseFloat(cart.subtotalAmount.toString());
  const deliveryFee = parseFloat(cart.branch.deliveryFee.toString());
  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const totalAmount = parseFloat(
    (subtotal + taxAmount + deliveryFee).toFixed(2)
  );

  // ── 6. Compute estimated delivery time ────────────────────
  const estimatedDeliveryAt = session.estimatedDeliveryMinutes
    ? new Date(Date.now() + session.estimatedDeliveryMinutes * 60 * 1000)
    : null;

  // ── 7. Generate order number & OTP ────────────────────────
  const orderNumber = generateOrderNumber();
  const rawOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
  const otpHash = await bcrypt.hash(rawOtp, 10);

  // ── 8. Run atomic DB transaction ─────────────────────────
  const order = await createOrder({
    customerUserId,
    session,
    cart,
    orderNumber,
    subtotal,
    deliveryFee,
    taxAmount,
    totalAmount,
    estimatedDeliveryAt,
    specialInstructions: req.specialInstructions,
    otpHash,
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    subtotalAmount: subtotal,
    deliveryFee,
    taxAmount,
    totalAmount,
    estimatedDeliveryAt,
    deliveryType: session.deliveryType,
    scheduledFor: session.scheduledFor,
    otp: rawOtp,
  };
};

export default {
  getOrders,
  getOrderDetails,
  getOrderTracking,
  cancelOrder,
  placeOrder,
  acceptOrder,
  rejectOrder,
  markPreparing,
  markReadyForPickup,
};
