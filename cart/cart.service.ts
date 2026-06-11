import redisService from "../src/services/redisService.ts";
import { CartResponseDTO, PriceBreakdownResponseDTO } from "./cart.dto.ts";
import {
  createCart,
  getActiveCartByUser,
  addItemToCart,
  addModifierToCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  getCouponByCode,
  calculateCartTotals,
  createPriceBreakdown,
  getCartItemById,
  getMenuItemWithPrice,
} from "./cart.repository.ts";

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
    items: (cart.items || []).map((item: any) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
      specialInstructions: item.specialInstructions,
      modifiers: (item.modifiers || []).map((mod: any) => ({
        id: mod.id,
        modifierOptionId: mod.modifierOptionId,
        modifierName: '',
        optionName: mod.modifierOption.optionName,
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
    lastActivityAt: cart.lastActivityAt,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
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

  let cart = await getActiveCartByUser(userId);

  if (!cart) {
    throw new Error('No active cart found');
  }

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

  if (!cart) {
    cart = await createCart(userId, data.restaurantBranchId);
  }

  // Verify menu item and get price
  const menuItem = await getMenuItemWithPrice(data.menuItemId);
  if (!menuItem) throw new Error('Menu item not found');

  // Add item to cart
  const cartItem = await addItemToCart(
    cart.id,
    data.menuItemId,
    data.quantity,
    Number(menuItem.basePrice),
    data.specialInstructions
  );

  // Add modifiers if provided
  if (data.modifiers && data.modifiers.length > 0) {
    for (const modifier of data.modifiers) {
      await addModifierToCartItem(
        cartItem.id,
        modifier.modifierOptionId,
        modifier.additionalPrice
      );
    }
  }

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

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.lineTotal),
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
    discountAmount = Number(cart.branch.deliveryFee);
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

  const breakdown = await calculateCartTotals(cart.id);

  const appliedDiscount = cart.priceBreakdowns?.[0]?.discountAmount || 0;
  const appliedCoupon = appliedDiscount > 0 ? true : false;

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
};