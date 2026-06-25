import redisService from "../../services/redisService.ts";
import { CartResponseDTO, PriceBreakdownResponseDTO } from "./cart.dto.ts";
import {
  createCart,
  getActiveCartByUser,
  addItemToCart,
  addModifierToCartItem,
  getModifierOptionsByIds,
  updateCartItem,
  deleteCartItem,
  clearCart,
  getCouponByCode,
  getCouponUsageCount,
  calculateCartTotals,
  createPriceBreakdown,
  getCartItemById,
  getMenuItemWithPrice,
} from "./cart.repository.ts";
import { findAllCoupons } from "../coupon/coupons.repository.ts";

const getCartCacheKey = (userId: bigint) => {
  return `cart:${userId}`;
};

const CART_CACHE_TTL = 3600;

function formatCartResponse(cart: any): CartResponseDTO {
  return {
    id: cart.id,
    customerUserId: cart.customerUserId,
    restaurantBranchId: cart.restaurantBranchId,
    status: cart.status,
    restaurantBranch: cart.branch ? {
      id: cart.branch.id,
      restaurant: {
        businessName: cart.branch.restaurant?.businessName
      }
    } : null,
    items: (cart.items || []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
      specialInstructions: item.specialInstructions,
      menuItem: item.menuItem ? {
        id: item.menuItem.id,
        name: item.menuItem.name,
        imageUrl: item.menuItem.images?.[0]?.imageUrl
          ? item.menuItem.images[0].imageUrl
          : item.menuItem.imageUrl || null
      } : null,
      modifiers: (item.modifiers || []).map((mod: any) => ({
        id: mod.id,
        modifierOptionId: mod.modifierOptionId,
        modifierName: '',
        optionName: mod.modifierOption?.optionName,
        additionalPrice: mod.additionalPrice.toString(),
      })),
    })),
    priceBreakdown: cart.priceBreakdowns?.[0]
      ? {
          subtotal: cart.priceBreakdowns[0].subtotal.toString(),
          discountAmount: cart.priceBreakdowns[0].discountAmount.toString(),
          deliveryFee: cart.priceBreakdowns[0].deliveryFee.toString(),
          taxAmount: cart.priceBreakdowns[0].taxAmount.toString(),
          totalAmount: cart.priceBreakdowns[0].totalAmount.toString(),
          calculatedAt: cart.priceBreakdowns[0].calculatedAt,
        }
      : {
          subtotal: '0',
          discountAmount: '0',
          deliveryFee: '0',
          taxAmount: '0',
          totalAmount: '0',
          calculatedAt: new Date(),
        },
    minimumOrderValue: (cart.branch?.minimumOrderValue ? Number(cart.branch.minimumOrderValue) : 0).toFixed(2),
    distanceToMinimum: (cart.branch?.minimumOrderValue && cart.priceBreakdowns?.[0]?.subtotal
      ? Math.max(0, Number(cart.branch.minimumOrderValue) - Number(cart.priceBreakdowns[0].subtotal))
      : (cart.branch?.minimumOrderValue ? Number(cart.branch.minimumOrderValue) : 0)).toFixed(2),
    progressPercentage: cart.branch?.minimumOrderValue && cart.priceBreakdowns?.[0]?.subtotal && Number(cart.branch.minimumOrderValue) > 0
      ? Math.min((Number(cart.priceBreakdowns[0].subtotal) / Number(cart.branch.minimumOrderValue)) * 100, 100)
      : (cart.branch?.minimumOrderValue && Number(cart.branch.minimumOrderValue) === 0 ? 100 : 0),
    lastActivityAt: cart.lastActivityAt,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    applicableCoupons: cart.applicableCoupons || [],
  };
}

async function syncCartTotalsService(cartId: bigint, userId: bigint) {
  const cart = await getActiveCartByUser(userId);
  if (!cart) return;

  const appliedDiscountRaw = cart.priceBreakdowns?.[0]?.discountAmount || 0;
  const appliedDiscountNum = Number(appliedDiscountRaw) || 0;

  const breakdown = await calculateCartTotals(cartId, appliedDiscountNum);

  await createPriceBreakdown(cartId, {
    subtotal: Number(breakdown.subtotal),
    discountAmount: Number(breakdown.discountAmount),
    deliveryFee: Number(breakdown.deliveryFee),
    taxAmount: Number(breakdown.taxAmount),
    totalAmount: Number(breakdown.totalAmount),
  });
}

async function getCartService(userId: bigint) {
  const cacheKey = getCartCacheKey(userId);

  try {
    const cachedCart = await redisService.get<CartResponseDTO>(cacheKey);

    if (cachedCart) {
      console.log(`[Cache HIT] Cart loaded from Redis: ${cacheKey}`);
      return cachedCart;
    }

    console.log(`[Cache MISS] Cart not in Redis: ${cacheKey}`);
  } catch (error) {
    console.error(`Redis get error: ${error}. Falling back to DB.`);
  }

  let cart: any = await getActiveCartByUser(userId);

  if (!cart) {
    throw new Error('No active cart found');
  }

  // Find applicable coupons
  const allCoupons = await findAllCoupons();
  const now = new Date();
  const applicableCoupons = allCoupons.filter(c => {
    if (!c.isActive) return false;
    if (c.validFrom > now || c.validUntil < now) return false;
    if (c.couponRestaurants && c.couponRestaurants.length > 0) {
       const isApp = c.couponRestaurants.some(cr => String(cr.restaurantId) === String(cart.branch?.restaurant?.id));
       if (!isApp) return false;
    }
    return true;
  }).map(c => ({
    code: c.code,
    couponType: c.couponType,
    value: Number(c.value),
    description: c.couponType === 'PERCENTAGE' ? `${c.value}% OFF` : c.couponType === 'FLAT' ? `₹${c.value} OFF` : c.couponType === 'FREE_DELIVERY' ? 'Free Delivery' : 'Buy 1 Get 1 Free'
  }));

  cart.applicableCoupons = applicableCoupons;

  const cartResponse: CartResponseDTO = formatCartResponse(cart);

  try {
    await redisService.set(cacheKey, cartResponse, CART_CACHE_TTL);
    console.log(`[Cache SET] Cart cached in Redis: ${cacheKey}`);
  } catch (error) {
    console.error(`Redis set error: ${error}. Cart will not be cached.`);
  }

  return cartResponse;
}

async function addItemToCartService(
  userId: bigint,
  data: {
    menuItemId: bigint;
    restaurantBranchId: bigint;
    quantity: number;
    specialInstructions?: string;
    modifiers?: { modifierOptionId: bigint; additionalPrice: number }[];
  }
) {
  // Get or create cart
  let cart = await getActiveCartByUser(userId);

  if (cart && cart.restaurantBranchId !== data.restaurantBranchId) {
    throw new Error('DIFFERENT_RESTAURANT_CART_EXISTS');
  }

  if (!cart) {
    cart = await createCart(userId, data.restaurantBranchId);
  }

  // Verify menu item and get price
  const menuItem = await getMenuItemWithPrice(data.menuItemId);
  if (!menuItem) throw new Error('Menu item not found');

  const requestedModifiers = data.modifiers || [];
  const modifierOptions = await getModifierOptionsByIds(
    requestedModifiers.map((modifier) => modifier.modifierOptionId)
  );

  if (modifierOptions.length !== requestedModifiers.length) {
    throw new Error('Invalid modifier option selected');
  }

  const modifierPriceMap = new Map(
    modifierOptions.map((option) => [
      option.id.toString(),
      Number(option.additionalPrice),
    ])
  );
  const modifierTotal = requestedModifiers.reduce(
    (sum, modifier) =>
      sum + (modifierPriceMap.get(modifier.modifierOptionId.toString()) || 0),
    0
  );
  const unitPrice = Number(menuItem.basePrice) + modifierTotal;

  // Add item to cart
  const cartItem = await addItemToCart(
    cart.id,
    data.menuItemId,
    data.quantity,
    unitPrice,
    data.specialInstructions
  );

  // Add modifiers if provided
  if (requestedModifiers.length > 0) {
    for (const modifier of requestedModifiers) {
      await addModifierToCartItem(
        cartItem.id,
        modifier.modifierOptionId,
        modifierPriceMap.get(modifier.modifierOptionId.toString()) || 0
      );
    }
  }

  // Sync totals
  await syncCartTotalsService(cart.id, userId);

  // Invalidate cache
  await invalidateCartCache(userId);

  // Fetch and return updated cart
  const updatedCart = await getActiveCartByUser(userId);
  return formatCartResponse(updatedCart!);
}

async function updateCartItemService(
  userId: bigint,
  cartItemId: bigint,
  data: {
    quantity?: number;
    specialInstructions?: string;
  }
) {
  // Verify item belongs to user's cart
  const cartItem = await getCartItemById(cartItemId);
  if (!cartItem) throw new Error('Cart item not found');

  const cart = await getActiveCartByUser(userId);
  if (!cart || !cart.items.some((item: any) => item.id === cartItemId)) {
    throw new Error('Cart item does not belong to user cart');
  }

  // Update item
  await updateCartItem(cartItemId, data);

  // Sync totals
  await syncCartTotalsService(cart.id, userId);

  // Invalidate cache
  await invalidateCartCache(userId);

  // Fetch and return updated cart
  const updatedCart = await getActiveCartByUser(userId);
  return formatCartResponse(updatedCart!);
}

async function removeCartItemService(userId: bigint, cartItemId: bigint) {
  // Verify item belongs to user's cart
  const cart = await getActiveCartByUser(userId);
  if (!cart || !cart.items.some((item: any) => item.id === cartItemId)) {
    throw new Error('Cart item does not belong to user cart');
  }

  // Delete item
  await deleteCartItem(cartItemId);

  // Sync totals
  await syncCartTotalsService(cart.id, userId);

  // Invalidate cache
  await invalidateCartCache(userId);

  // Fetch and return updated cart
  const updatedCart = await getActiveCartByUser(userId);
  return formatCartResponse(updatedCart!);
}

async function clearCartService(userId: bigint) {
  const cart = await getActiveCartByUser(userId);
  if (!cart) throw new Error('No active cart found');

  await clearCart(cart.id);

  // Invalidate cache
  await invalidateCartCache(userId);

  // Return empty cart response
  const updatedCart = await getActiveCartByUser(userId);
  return formatCartResponse(updatedCart!);
}

async function applyCouponService(
  userId: bigint,
  couponCode: string
): Promise<PriceBreakdownResponseDTO> {
  const cart = await getActiveCartByUser(userId);
  if (!cart) throw new Error('No active cart found');

  // Get coupon
  const coupon = await getCouponByCode(couponCode);
  if (!coupon) throw new Error('Coupon not found');

  // Validate coupon
  const now = new Date();
  if (!coupon.isActive) throw new Error('Coupon is not active');
  if (coupon.validFrom > now) throw new Error('Coupon is not yet valid');
  if (coupon.validUntil < now) throw new Error('Coupon has expired');

  // 1. Check Restaurant Applicability
  if (coupon.couponRestaurants && coupon.couponRestaurants.length > 0) {
    const isApplicable = coupon.couponRestaurants.some(
      (r: any) => String(r.restaurantId) === String(cart.branch?.restaurant?.id || cart.restaurantBranchId)
    );
    if (!isApplicable) throw new Error('Coupon not valid for this restaurant.');
  }

  // 2. Check Global Usage Limit
  if (coupon.usageLimit) {
    const totalUsed = await getCouponUsageCount(coupon.id);
    if (totalUsed >= coupon.usageLimit) throw new Error('Coupon usage limit reached.');
  }

  // 3. Check Per User Limit
  if (coupon.perUserLimit) {
    const userUsed = await getCouponUsageCount(coupon.id, userId);
    if (userUsed >= coupon.perUserLimit) throw new Error('You have reached the limit for this coupon.'); 
  }

  const subtotal = cart.items.reduce(
    (sum: number, item: any) => sum + Number(item.lineTotal),
    0
  );
  if (coupon.minimumOrderAmount && subtotal < Number(coupon.minimumOrderAmount)) {
    throw new Error(
      `Minimum order amount of ${coupon.minimumOrderAmount} not met`
    );
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.couponType === 'PERCENTAGE') {
    discountAmount = (subtotal * Number(coupon.value)) / 100;
    if (
      coupon.maximumDiscountAmount &&
      discountAmount > Number(coupon.maximumDiscountAmount)
    ) {
      discountAmount = Number(coupon.maximumDiscountAmount);
    }
  } else if (coupon.couponType === 'FLAT') {
    discountAmount = Math.min(Number(coupon.value), subtotal);
  } else if (coupon.couponType === 'FREE_DELIVERY') {
    discountAmount = Number(cart.branch?.deliveryFee || 0);
  } else if (coupon.couponType === 'BOGO') {
    const totalItems = cart.items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
    if (totalItems >= 2) {
      const cheapestItem = cart.items.reduce((prev: any, curr: any) => 
        Number(prev.unitPrice) < Number(curr.unitPrice) ? prev : curr
      );
      discountAmount = Number(cheapestItem.unitPrice);
      if (coupon.maximumDiscountAmount && discountAmount > Number(coupon.maximumDiscountAmount)) {
        discountAmount = Number(coupon.maximumDiscountAmount);
      }
    } else {
      throw new Error('BOGO coupon requires at least 2 items in the cart');
    }
  }

  // Calculate totals
  const breakdown = await calculateCartTotals(cart.id, discountAmount);

  // Save price breakdown
  await createPriceBreakdown(cart.id, {
    subtotal: Number(breakdown.subtotal),
    discountAmount: Number(breakdown.discountAmount),
    deliveryFee: Number(breakdown.deliveryFee),
    taxAmount: Number(breakdown.taxAmount),
    totalAmount: Number(breakdown.totalAmount),
  });

  // Invalidate cache
  await invalidateCartCache(userId);

  return {
    ...breakdown,
    appliedCoupon: {
      code: coupon.code,
      discountAmount: breakdown.discountAmount,
    },
    calculatedAt: new Date(),
  };
}

async function removeCouponService(userId: bigint) {
  const cart = await getActiveCartByUser(userId);
  if (!cart) throw new Error('No active cart found');

  // Recalculate without discount
  const breakdown = await calculateCartTotals(cart.id, 0);

  // Create new price breakdown
  await createPriceBreakdown(cart.id, {
    subtotal: Number(breakdown.subtotal),
    discountAmount: Number(breakdown.discountAmount),
    deliveryFee: Number(breakdown.deliveryFee),
    taxAmount: Number(breakdown.taxAmount),
    totalAmount: Number(breakdown.totalAmount),
  });

  // Invalidate cache
  await invalidateCartCache(userId);

  return breakdown;
}

async function getPriceBreakdownService(
  userId: bigint
): Promise<PriceBreakdownResponseDTO> {
  const cart = await getActiveCartByUser(userId);
  if (!cart) throw new Error('No active cart found');

  const appliedDiscountRaw = cart.priceBreakdowns?.[0]?.discountAmount || 0;
  const appliedDiscountNum = Number(appliedDiscountRaw) || 0;

  const breakdown = await calculateCartTotals(cart.id, appliedDiscountNum);

  const appliedCoupon = appliedDiscountNum > 0;

  return {
    ...breakdown,
    appliedCoupon: appliedCoupon
      ? {
          code: 'APPLIED',
          discountAmount: breakdown.discountAmount,
        }
      : undefined,
    calculatedAt: new Date(),
  };
}

async function invalidateCartCache(userId: bigint) {
  const cacheKey = getCartCacheKey(userId);

  try {
    await redisService.del(cacheKey);
    console.log(`[Cache INVALIDATE] Cart removed from Redis: ${cacheKey}`);
  } catch (error) {
    console.error(`Redis delete error: ${error}`);
  }
}

export {
  getCartService,
  invalidateCartCache,
  getCartCacheKey,
  addItemToCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
  applyCouponService,
  removeCouponService,
  getPriceBreakdownService,
  syncCartTotalsService,
};
