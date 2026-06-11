import redisService from '../../services/redisService.ts';
import {
  createCheckoutSession,
  getCheckoutSession,
  updateCheckoutSession,
  createOrder,
  createOrderItems,
  createOrderAddress,
  createPayment,
  updateCartStatus,
  getCartWithBranch,
} from './checkout.repository.ts';
import {
  getActiveCartByUser,
  calculateCartTotals,
} from '../cart/cart.repository.ts';
import { CheckoutSessionDTO, OrderResponseDTO } from './checkout.dto.ts';

const getCheckoutCacheKey = (sessionId: bigint) => {
  return `checkout:${sessionId}`;
};

const CHECKOUT_CACHE_TTL = 900; // 15 minutes

// Haversine formula: Calculate distance between two coordinates
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA: distance / speed + buffer
function calculateEstimateFromDistance(distanceKm: number): number {
  const speedKmPerHour = 30; // Average delivery speed
  const travelTimeMinutes = (distanceKm / speedKmPerHour) * 60;
  const bufferMinutes = 5; // Add 5 minute buffer
  return Math.ceil(travelTimeMinutes + bufferMinutes);
}

async function estimateDeliveryService(
  userId: bigint,
  sessionId: bigint,
  restaurantLatitude: number,
  restaurantLongitude: number,
  customerLatitude: number,
  customerLongitude: number
) {
  const session = await getCheckoutSession(sessionId, userId);
  if (!session) throw new Error('Checkout session not found');

  // Check cache first
  const cacheKey = `delivery:estimate:${sessionId}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Delivery estimate: ${cacheKey}`);
    return cached;
  }

  let distanceKm: number;
  let estimationMethod = 'unknown';

  try {
    // Method 1: Try Redis GEODIST (fastest if data exists)
    const redisGeoKey = 'delivery:locations';
    
    // Add both locations to same Redis key
    await redisService.geoAdd(
      redisGeoKey,
      restaurantLongitude,
      restaurantLatitude,
      `restaurant:${session.cartId}`
    );

    await redisService.geoAdd(
      redisGeoKey,
      customerLongitude,
      customerLatitude,
      `customer:${userId}`
    );

    const redisDist = await redisService.geoDist(
      redisGeoKey,
      `restaurant:${session.cartId}`,
      `customer:${userId}`,
      'km'
    );

    if (redisDist !== null && redisDist > 0) {
      distanceKm = redisDist;
      estimationMethod = 'redis-geo';
      console.log(
        `[Delivery Estimate] Using Redis GEO: ${distanceKm.toFixed(2)} km`
      );
    } else {
      throw new Error('Redis GEO returned no result');
    }
  } catch (error) {
    // Fallback to Method 2: Haversine formula
    console.warn(`Redis GEO failed, falling back to Haversine: ${error}`);
    distanceKm = calculateHaversineDistance(
      restaurantLatitude,
      restaurantLongitude,
      customerLatitude,
      customerLongitude
    );
    estimationMethod = 'haversine';
    console.log(
      `[Delivery Estimate] Using Haversine formula: ${distanceKm.toFixed(2)} km`
    );
  }

  // Calculate ETA from distance
  const estimatedDeliveryMinutes = calculateEstimateFromDistance(distanceKm);

  // Update session in database
  await updateCheckoutSession(sessionId, {
    estimatedDeliveryMinutes,
  });

  const result = {
    estimatedDeliveryMinutes,
    distance: `${distanceKm.toFixed(2)} km`,
    duration: `${estimatedDeliveryMinutes} min`,
    method: estimationMethod,
  };

  // Cache the result for 30 minutes
  await redisService.set(cacheKey, result, 1800);

  return result;
}

async function initiateCheckoutService(
  userId: bigint,
  data: {
    addressId: bigint;
    deliveryType: string;
    scheduledFor?: Date;
    paymentMethodId?: bigint;
    couponId?: bigint;
  }
) {
  // Get active cart
  const cart = await getActiveCartByUser(userId);
  if (!cart) throw new Error('No active cart found');

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Create checkout session
  const session = await createCheckoutSession(cart.id, userId, data);

  const checkoutDTO: CheckoutSessionDTO = {
    id: session.id,
    cartId: session.cartId,
    customerUserId: session.customerUserId,
    addressId: session.addressId,
    paymentMethodId: session.paymentMethodId || undefined,
    couponId: session.couponId || undefined,
    deliveryType: session.deliveryType,
    scheduledFor: session.scheduledFor,
    estimatedDeliveryMinutes: session.estimatedDeliveryMinutes,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };

  // Cache session
  const cacheKey = getCheckoutCacheKey(session.id);
  await redisService.set(cacheKey, checkoutDTO, CHECKOUT_CACHE_TTL);

  return checkoutDTO;
}

async function getCheckoutSessionService(
  userId: bigint,
  sessionId: bigint
): Promise<CheckoutSessionDTO> {
  const cacheKey = getCheckoutCacheKey(sessionId);

  // Try cache first
  const cached = await redisService.get<CheckoutSessionDTO>(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Checkout session: ${cacheKey}`);
    return cached;
  }

  // Get from database
  const session = await getCheckoutSession(sessionId, userId);
  if (!session) throw new Error('Checkout session not found');

  // Check expiry
  if (new Date() > session.expiresAt) {
    throw new Error('Checkout session has expired');
  }

  const checkoutDTO: CheckoutSessionDTO = {
    id: session.id,
    cartId: session.cartId,
    customerUserId: session.customerUserId,
    addressId: session.addressId,
    paymentMethodId: session.paymentMethodId || undefined,
    couponId: session.couponId || undefined,
    deliveryType: session.deliveryType,
    scheduledFor: session.scheduledFor,
    estimatedDeliveryMinutes: session.estimatedDeliveryMinutes,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };

  // Cache it
  await redisService.set(cacheKey, checkoutDTO, CHECKOUT_CACHE_TTL);

  return checkoutDTO;
}

function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `ORD-${timestamp}-${random}`;
}

async function placeOrderService(
  userId: bigint,
  sessionId: bigint,
  paymentProvider: string
): Promise<OrderResponseDTO> {
  // Get checkout session
  const session = await getCheckoutSession(sessionId, userId);
  if (!session) throw new Error('Checkout session not found');

  // Check expiry
  if (new Date() > session.expiresAt) {
    throw new Error('Checkout session has expired');
  }

  // Get cart with branch info
  const cartWithBranch = await getCartWithBranch(session.cartId);
  if (!cartWithBranch) throw new Error('Cart not found');

  // Calculate final totals
  const breakdown = await calculateCartTotals(
    session.cartId,
    session.couponId ? Number(cartWithBranch.priceBreakdowns[0]?.discountAmount || 0) : 0
  );

  // Create order
  const orderNumber = generateOrderNumber();
  const order = await createOrder(userId, sessionId, session.cartId, {
    orderNumber,
    restaurantId: cartWithBranch.branch.restaurant.id,
    branchId: cartWithBranch.branch.id,
    subtotalAmount: Number(breakdown.subtotal),
    discountAmount: Number(breakdown.discountAmount),
    deliveryFee: Number(breakdown.deliveryFee),
    taxAmount: Number(breakdown.taxAmount),
    totalAmount: Number(breakdown.totalAmount),
    estimatedDeliveryMinutes: session.estimatedDeliveryMinutes,
  });

  // Create order items from cart
  await createOrderItems(order.id, session.cartId);

  // Create order address
  await createOrderAddress(order.id, session.addressId);

  // Create payment record
  await createPayment(order.id, {
    paymentProvider,
    amount: Number(breakdown.totalAmount),
  });

  // Update cart status
  await updateCartStatus(session.cartId, 'CHECKED_OUT');

  // Invalidate checkout cache
  const cacheKey = getCheckoutCacheKey(sessionId);
  await redisService.del(cacheKey);

  const orderResponse: OrderResponseDTO = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerUserId: order.customerUserId,
    restaurantId: order.restaurantId,
    branchId: order.branchId,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    subtotalAmount: order.subtotalAmount.toString(),
    discountAmount: order.discountAmount.toString(),
    deliveryFee: order.deliveryFee.toString(),
    taxAmount: order.taxAmount.toString(),
    totalAmount: order.totalAmount.toString(),
    estimatedDeliveryAt: order.estimatedDeliveryAt,
    createdAt: order.createdAt,
  };

  return orderResponse;
}

export {
  initiateCheckoutService,
  getCheckoutSessionService,
  estimateDeliveryService,
  placeOrderService,
};