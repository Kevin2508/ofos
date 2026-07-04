import bcrypt from 'bcryptjs';
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
import { invalidateCartCache } from '../cart/cart.service.ts';
import { CheckoutSessionDTO, OrderResponseDTO } from './checkout.dto.ts';
import * as loyaltyService from '../loyalty/loyalty.service.ts';
import * as loyaltyRepo from '../loyalty/loyalty.repository.ts';

const getCheckoutCacheKey = (sessionId: bigint) => {
  return `checkout:${sessionId}`;
};

const CHECKOUT_CACHE_TTL = 900; 

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; 
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

function calculateEstimateFromDistance(distanceKm: number): number {
  const speedKmPerHour = 30; 
  const travelTimeMinutes = (distanceKm / speedKmPerHour) * 60;
  const bufferMinutes = 5; 
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

  const cacheKey = `delivery:estimate:${sessionId}`;
  const cached = await redisService.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Delivery estimate: ${cacheKey}`);
    return cached;
  }

  let distanceKm: number;
  let estimationMethod = 'unknown';

  try {
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey && restaurantLatitude !== 0 && customerLatitude !== 0) {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${restaurantLatitude},${restaurantLongitude}&destinations=${customerLatitude},${customerLongitude}&key=${googleApiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data: any = await res.json();
      
      if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        distanceKm = element.distance.value / 1000;
        estimationMethod = 'google-maps';
        const estimatedDeliveryMinutes = Math.ceil(element.duration.value / 60) + 5;
        
        await updateCheckoutSession(sessionId, { estimatedDeliveryMinutes });
        const result = {
          estimatedDeliveryMinutes,
          distance: element.distance.text,
          duration: element.duration.text,
          method: estimationMethod,
        };
        await redisService.set(cacheKey, result, 1800);
        console.log(`[Delivery Estimate] Using Google Maps: ${result.distance}`);
        return result;
      } else {
        throw new Error(`API error: ${data.status}`);
      }
    } else {
      throw new Error('API key not configured or coordinates missing');
    }
  } catch (apiError: any) {
    console.warn(`[Delivery Estimate] Google Maps skipped/failed: ${apiError.message}. Falling back.`);
    
    try {
      const redisGeoKey = 'delivery:locations';
      
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
  }

  const estimatedDeliveryMinutes = calculateEstimateFromDistance(distanceKm);

  await updateCheckoutSession(sessionId, {
    estimatedDeliveryMinutes,
  });

  const result = {
    estimatedDeliveryMinutes,
    distance: `${distanceKm.toFixed(2)} km`,
    duration: `${estimatedDeliveryMinutes} min`,
    method: estimationMethod,
  };

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
  const cart = await getActiveCartByUser(userId);
  if (!cart) throw new Error('No active cart found');

  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  const session = await createCheckoutSession(cart.id, userId, data);

  const checkoutDTO: CheckoutSessionDTO = {
    id: session.id,
    cartId: session.cartId,
    customerUserId: session.customerUserId,
    addressId: session.addressId,
    paymentMethodId: session.paymentMethodId || undefined,
    couponId: session.couponId || undefined,
    deliveryType: session.deliveryType,
    scheduledFor: session.scheduledFor || undefined,
    estimatedDeliveryMinutes: session.estimatedDeliveryMinutes || undefined,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };

  const cacheKey = getCheckoutCacheKey(session.id);
  await redisService.set(cacheKey, checkoutDTO, CHECKOUT_CACHE_TTL);

  return checkoutDTO;
}

async function getCheckoutSessionService(
  userId: bigint,
  sessionId: bigint
): Promise<CheckoutSessionDTO> {
  const cacheKey = getCheckoutCacheKey(sessionId);

  const cached = await redisService.get<CheckoutSessionDTO>(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] Checkout session: ${cacheKey}`);
    return cached;
  }

  const session = await getCheckoutSession(sessionId, userId);
  if (!session) throw new Error('Checkout session not found');

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
    scheduledFor: session.scheduledFor || undefined,
    estimatedDeliveryMinutes: session.estimatedDeliveryMinutes || undefined,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };

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
  const session = await getCheckoutSession(sessionId, userId);
  if (!session) throw new Error('Checkout session not found');

  if (new Date() > session.expiresAt) {
    throw new Error('Checkout session has expired');
  }

  const cartWithBranch = await getCartWithBranch(session.cartId);
  if (!cartWithBranch) throw new Error('Cart not found');

  const breakdown = await calculateCartTotals(
    session.cartId,
    session.couponId ? Number(cartWithBranch.priceBreakdowns[0]?.discountAmount || 0) : 0
  );

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const saltRounds = parseInt(process.env.OTP_HASH_SALT || '12', 10);
  const otpHash = await bcrypt.hash(otp, saltRounds);

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
    otpHash: otpHash,
    estimatedDeliveryMinutes: session.estimatedDeliveryMinutes || undefined,
  });

  await createOrderItems(order.id, session.cartId);

  await createOrderAddress(order.id, session.addressId);

  await createPayment(order.id, {
    paymentProvider,
    amount: Number(breakdown.totalAmount),
  });

  await updateCartStatus(session.cartId, 'CHECKED_OUT');
  await invalidateCartCache(userId);

  // Handle Loyalty Points Redeem
  const appliedLoyaltyPoints = await loyaltyService.getAppliedLoyaltyPoints(session.cartId);
  if (appliedLoyaltyPoints > 0) {
    await loyaltyRepo.addLoyaltyTransaction(
      userId,
      'REDEEM',
      appliedLoyaltyPoints,
      order.id,
      `Redeemed points for Order ${order.orderNumber}`
    );
    await loyaltyService.removeLoyaltyPointsService(session.cartId);
  }

  // Handle Loyalty Points Earn
  const earningRate = await loyaltyService.getEarningRate();
  const earnedPoints = Math.floor(Number(breakdown.totalAmount) * earningRate);
  if (earnedPoints > 0) {
    await loyaltyRepo.addLoyaltyTransaction(
      userId,
      'EARN',
      earnedPoints,
      order.id,
      `Earned points for Order ${order.orderNumber}`
    );
  }

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
    otp: otp,
    estimatedDeliveryAt: order.estimatedDeliveryAt || undefined,
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
