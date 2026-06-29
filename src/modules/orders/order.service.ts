import { IPlaceOrderRequest, IPlaceOrderResult } from './order.interface.ts';
import bcrypt from 'bcryptjs';
import orderRepository, {
  createOrder,
  findActiveCart,
  findCheckoutSession,
  findExistingOrderBySession,
} from './order.repository.ts';
import { triggerAutoAssignment } from '../deliveryPartner/deliveryPartner.service.ts';
import redisService from '../../services/redisService.ts';
import { getActiveCartByUser } from '../cart/cart.repository.ts';
import { clearCartService, addItemToCartService, invalidateCartCache } from '../cart/cart.service.ts';
import { prisma } from '../../config/prisma.ts';


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
    data: orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRestaurantOrders(
  userId: bigint,
  role: string,
  page: number,
  limit: number,
  status?: string,
  search?: string,
  date?: string,
  payment?: string
) {
  let branchIds: bigint[] = [];
  if (role === 'Restaurant_staff') {
    const staff = await prisma.restaurantStaff.findMany({
      where: { userId },
      select: { branchId: true }
    });
    branchIds = staff.map(s => s.branchId);
  } else {
    const branches = await prisma.restaurantBranch.findMany({
      where: {
        restaurant: {
          ownerUserId: userId
        }
      },
      select: { id: true }
    });
    branchIds = branches.map(b => b.id);
  }

  const skip = (page - 1) * limit;

  const whereClause: any = {
    branchId: { in: branchIds }
  };

  if (status && status !== 'ALL') {
    if (status === 'ACTIVE') {
      whereClause.orderStatus = { in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'] };
    } else {
      whereClause.orderStatus = status;
    }
  }

  if (search) {
    const parsedId = !isNaN(Number(search)) ? BigInt(search) : undefined;
    whereClause.OR = [
      { orderNumber: { contains: search } }
    ];
    if (parsedId) {
      whereClause.OR.push({ id: parsedId });
    }
  }

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    whereClause.createdAt = {
      gte: startDate,
      lte: endDate
    };
  }

  if (payment && payment !== 'ALL') {
    whereClause.paymentStatus = payment;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          include: { customerProfile: true }
        },
        items: {
          include: {
            menuItem: true,
            modifiers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({ where: whereClause })
  ]);

  return {
    data: orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getOrderDetails(orderId: bigint, customerUserId: bigint) {
  const order = await orderRepository.getOrderById(orderId, customerUserId);

  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  return order;
}

export async function getRestaurantOrderDetails(orderId: bigint, userId: bigint, role: string) {
  let order;
  if (role === 'Restaurant_staff') {
    // Check if the order belongs to a branch the staff is assigned to
    const staff = await prisma.restaurantStaff.findMany({
      where: { userId },
      select: { branchId: true }
    });
    const branchIds = staff.map(s => s.branchId);

    order = await prisma.order.findFirst({
      where: {
        id: orderId,
        branchId: { in: branchIds }
      },
      include: {
        customer: { include: { customerProfile: true } },
        items: { include: { modifiers: true } },
        payments: true,
        address: true,
        branch: true,
      }
    });
  } else {
    order = await orderRepository.getRestaurantOrderById(orderId, userId);
  }

  if (!order) throw new Error('ORDER_NOT_FOUND');
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

  const payload: any = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    lat: order.address?.latitude,
    lng: order.address?.longitude,
    restaurantLat: order.branch?.latitude,
    restaurantLng: order.branch?.longitude,
    trackingAvailable: !!assignment,
  };

  if (!assignment) {
    return payload;
  }

  const latestLocation = assignment.trackingPoints[0];

  if (latestLocation && order.address?.latitude && order.address?.longitude) {
    const cacheKey = `tracking:eta:${orderId}`;
    let eta = await redisService.get(cacheKey);

    if (!eta) {
      // Recalculate ETA based on Haversine distance
      const lat1 = Number(latestLocation.latitude);
      const lon1 = Number(latestLocation.longitude);
      const lat2 = Number(order.address.latitude);
      const lon2 = Number(order.address.longitude);

      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;

      // Calculate mins: e.g. 15km/h avg speed -> 4 mins per km + 2 mins buffer
      const mins = Math.ceil(distanceKm * 4) + 2;
      const calculatedEta = new Date(Date.now() + mins * 60000).toISOString();

      // Store in redis for 2 minutes (120 seconds)
      await redisService.set(cacheKey, calculatedEta, 120);
      eta = calculatedEta;
    }
    payload.estimatedDeliveryAt = eta;
  } else {
    // Fallback if no location data available yet
    payload.estimatedDeliveryAt = order.estimatedDeliveryAt ? order.estimatedDeliveryAt.toISOString() : null;
  }

  payload.partner = assignment.partner
    ? {
      id: assignment.partner.user.id,
      firstName: assignment.partner.user.firstName,
      lastName: assignment.partner.user.lastName,
      phone: assignment.partner.user.phone,
    }
    : null;

  payload.location = latestLocation
    ? {
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      recordedAt: latestLocation.recordedAt,
    }
    : null;

  return payload;
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

  const allowedStatuses = ['PLACED', 'ACCEPTED', 'PREPARING'];
  if (!allowedStatuses.includes(order.orderStatus)) {
    throw new Error('ORDER_CANNOT_BE_CANCELLED');
  }

  let refundEligible = false;
  let refundAmount = 0;

  // Find completed payment
  const completedPayment = order.payments?.find((p: any) => p.status === 'COMPLETED');

  if (completedPayment) {
    if (order.orderStatus === 'PLACED') {
      // 100% refund
      refundEligible = true;
      refundAmount = Number(order.totalAmount);
    } else if (order.orderStatus === 'ACCEPTED') {
      // 50% refund penalty
      refundEligible = true;
      refundAmount = Number(order.totalAmount) * 0.5;
    } else if (order.orderStatus === 'PREPARING') {
      // 0% refund
      refundEligible = false;
      refundAmount = 0;
    }
  }

  return orderRepository.cancelOrder(orderId, customerUserId, reason, refundEligible, refundAmount, completedPayment?.id);
}

export async function acceptOrder(orderId: bigint, staffUserId: bigint) {
  return orderRepository.updateOrderStatus(orderId, 'ACCEPTED', staffUserId, 'Staff accepted order');
}

export async function rejectOrder(orderId: bigint, staffUserId: bigint | null, reason: string) {
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

export async function markItemUnavailable(orderId: bigint, itemId: bigint, staffUserId: bigint) {
  return orderRepository.markItemUnavailable(orderId, itemId);
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

  if (cart.branch.minimumOrderValue && subtotal < Number(cart.branch.minimumOrderValue)) {
    throw new Error(`Minimum order amount of ${cart.branch.minimumOrderValue} not met.`);
  }

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

  await invalidateCartCache(customerUserId);

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

export async function reorderPastOrder(
  orderId: bigint,
  customerUserId: bigint,
  forceClear: boolean = false
) {
  const order = await orderRepository.getOrderById(orderId, customerUserId);
  if (!order) {
    throw new Error('Order not found');
  }

  // Check current cart
  const currentCart = await getActiveCartByUser(customerUserId);
  if (currentCart && currentCart.restaurantBranchId !== order.branch!.id) {
    if (!forceClear) {
      return { requireConfirmation: true, message: 'Cart contains items from another restaurant. Clear it to reorder?' };
    }
    await clearCartService(customerUserId);
  } else if (currentCart && forceClear) {
    await clearCartService(customerUserId);
  }

  const unavailableItems: string[] = [];
  const addedItems: string[] = [];

  for (const item of order.items) {
    if (item.menuItem && item.menuItem.isAvailable && item.menuItem.isAvailable) {
      try {
        await addItemToCartService(customerUserId, {
          menuItemId: item.menuItemId!,
          restaurantBranchId: order.branch!.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || undefined,
          modifiers: [] // Modifiers are skipped for reorder due to missing option ID mapping
        });
        addedItems.push(item.itemName);
      } catch (err) {
        unavailableItems.push(item.itemName);
      }
    } else {
      unavailableItems.push(item.itemName);
    }
  }

  return {
    success: true,
    addedItems,
    unavailableItems,
  };
}

export async function raiseDispute(
  orderId: bigint,
  customerUserId: bigint,
  category: string,
  description: string
) {
  const order = await orderRepository.getOrderById(orderId, customerUserId);
  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  // Validate category
  const validCategories = ['MISSING_ITEM', 'WRONG_ITEM', 'POOR_QUALITY', 'LATE_DELIVERY', 'REFUND_REQUEST', 'OTHER'];
  if (!validCategories.includes(category)) {
    throw new Error('INVALID_CATEGORY');
  }

  const ticket = await orderRepository.createDisputeTicket(orderId, customerUserId, category, description);
  return ticket;
}

export async function processPendingOrderTimeouts() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const timedOutOrders = await prisma.order.findMany({
    where: {
      orderStatus: 'PLACED',
      createdAt: { lt: fiveMinutesAgo }
    },
    select: { id: true }
  });

  for (const order of timedOutOrders) {
    // null is used as staffUserId for system actions
    try {
      await rejectOrder(order.id, null, 'Auto-rejected: No action taken within 5 minutes');
    } catch (err) {
      console.error(`Failed to auto-reject order ${order.id}:`, err);
    }
  }
}

export default {
  getOrders,
  getRestaurantOrders,
  getRestaurantOrderDetails,
  getOrderDetails,
  getOrderTracking,
  cancelOrder,
  placeOrder,
  acceptOrder,
  rejectOrder,
  markPreparing,
  markReadyForPickup,
  markItemUnavailable,
  reorderPastOrder,
  raiseDispute,
  processPendingOrderTimeouts,
};
