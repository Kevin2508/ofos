// src/modules/cart/cart.repository.ts

import { prisma } from '../../config/prisma.ts';
import redisService from '../../services/redisService.ts';

// Get active cart with all relations
async function getActiveCartByUser(userId: bigint) {
  return prisma.cart.findFirst({
    where: {
      customerUserId: userId,
      status: 'ACTIVE',
    },
    include: {
      items: {
        include: {
          modifiers: {
            include: {
              modifierOption: {
                include: {
                  modifierGroup: true,
                },
              },
            },
          },
          menuItem: {
            include: {
              images: true
            }
          },
        },
      },
      priceBreakdowns: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
      branch: {
        include: {
          restaurant: true
        }
      },
    },
  });
}

// Create new cart
async function createCart(userId: bigint, branchId: bigint) {
  return prisma.cart.create({
    data: {
      customerUserId: userId,
      restaurantBranchId: branchId,
      status: 'ACTIVE',
      subtotalAmount: 0,
      totalAmount: 0,
    },
    include: {
      items: {
        include: {
          modifiers: {
            include: {
              modifierOption: {
                include: {
                  modifierGroup: true,
                },
              },
            },
          },
          menuItem: {
            include: {
              images: true
            }
          },
        },
      },
      priceBreakdowns: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
      branch: {
        include: {
          restaurant: true
        }
      },
    },
  });
}

// Check if cart exists for user
async function cartExistsByUserAndBranch(
  userId: bigint,
  branchId: bigint
) {
  return prisma.cart.findFirst({
    where: {
      customerUserId: userId,
      restaurantBranchId: branchId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
}

async function countCartItems(cartId: bigint) {
  return prisma.cartItem.count({
    where: { cartId },
  });
}

async function abandonCart(cartId: bigint) {
  return prisma.cart.update({
    where: { id: cartId },
    data: {
      status: 'ABANDONED',
      subtotalAmount: 0,
      totalAmount: 0,
    },
  });
}

// Add item to cart
async function addItemToCart(
  cartId: bigint,
  menuItemId: bigint,
  quantity: number,
  unitPrice: number,
  specialInstructions?: string
) {
  const lineTotal = unitPrice * quantity;
  return prisma.cartItem.create({
    data: {
      cartId,
      menuItemId,
      quantity,
      unitPrice: unitPrice,
      lineTotal: lineTotal,
      specialInstructions: specialInstructions || null,
    },
  });
}

// Add modifier to cart item
async function addModifierToCartItem(
  cartItemId: bigint,
  modifierOptionId: bigint,
  additionalPrice: number
) {
  return prisma.cartItemModifier.create({
    data: {
      cartItemId,
      modifierOptionId,
      additionalPrice,
    },
  });
}

async function getModifierOptionsByIds(ids: bigint[]) {
  if (!ids.length) return [];

  return prisma.modifierOption.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
      additionalPrice: true,
    },
  });
}

async function updateCartItem(
  cartItemId: bigint,
  data: {
    quantity?: number;
    specialInstructions?: string;
  }
) {
  const updateData: any = { ...data };
  if (data.quantity !== undefined) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: { unitPrice: true }
    });
    if (item) {
      updateData.lineTotal = Number(item.unitPrice) * data.quantity;
    }
  }
  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: updateData,
  });
}

// Delete cart item
async function deleteCartItem(cartItemId: bigint) {
  await prisma.cartItemModifier.deleteMany({
    where: { cartItemId },
  });
  return prisma.cartItem.delete({
    where: { id: cartItemId },
  });
}

// Clear cart (delete all items)
async function clearCart(cartId: bigint) {
  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    select: { id: true },
  });

  for (const item of cartItems) {
    await deleteCartItem(item.id);
  }

  return prisma.cart.update({
    where: { id: cartId },
    data: {
      status: 'ABANDONED',
      subtotalAmount: 0,
      totalAmount: 0,
    },
  });
}

// Get coupon by code
async function getCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code },
    include: { couponRestaurants: true }
  });
}

async function getCouponUsageCount(couponId: bigint, userId?: bigint) {
  return prisma.couponUsage.count({
    where: {
      couponId,
      customerUserId: userId,
    },
  });
}

// Calculate cart totals
async function calculateCartTotals(
  cartId: bigint,
  couponDiscountAmount: number = 0
) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: true,
      branch: true,
    },
  });

  if (!cart) throw new Error('Cart not found');

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.lineTotal),
    0
  );

  // Get loyalty discount
  const appliedLoyaltyPointsStr = await redisService.get<number>(`cart:${cartId}:loyalty`);
  const appliedLoyaltyPoints = appliedLoyaltyPointsStr || 0;

  let redemptionRateStr = await prisma.systemConfiguration.findUnique({
    where: { configKey: 'LOYALTY_REDEMPTION_RATE' }
  });
  const redemptionRate = redemptionRateStr ? parseFloat(redemptionRateStr.configValue) : 1;
  const loyaltyDiscount = appliedLoyaltyPoints * redemptionRate;

  let totalDiscountAmount = couponDiscountAmount + loyaltyDiscount;

  const deliveryFee = Number(cart.branch.deliveryFee) || 0;
  const taxAmount = Math.max(0, (subtotal - totalDiscountAmount)) * 0.05; // 5% tax

  // Ensure total doesn't go below 0
  const totalAmount = Math.max(0, subtotal + deliveryFee + taxAmount - totalDiscountAmount);

  await prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotalAmount: subtotal,
      totalAmount: totalAmount,
    },
  });

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: totalDiscountAmount.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}

// Create price breakdown record
async function createPriceBreakdown(
  cartId: bigint,
  breakdown: {
    subtotal: number;
    discountAmount: number;
    deliveryFee: number;
    taxAmount: number;
    totalAmount: number;
  }
) {
  return prisma.cartPriceBreakdown.create({
    data: {
      cartId,
      ...breakdown,
    },
  });
}

// Get cart item by id
async function getCartItemById(cartItemId: bigint) {
  return prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      modifiers: {
        include: {
          modifierOption: true,
        },
      },
    },
  });
}

// Get menu item with price
async function getMenuItemWithPrice(menuItemId: bigint) {
  return prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: {
      id: true,
      name: true,
      basePrice: true,
      category: {
        select: {
          branchId: true,
        },
      },
    },
  });
}

export {
  createCart,
  cartExistsByUserAndBranch,
  countCartItems,
  abandonCart,
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
};
