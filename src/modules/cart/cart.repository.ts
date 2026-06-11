// src/modules/cart/cart.repository.ts

import { prisma } from '../../config/prisma.ts';

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
          menuItem: true,
        },
      },
      priceBreakdowns: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
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
        },
      },
      priceBreakdowns: true,
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

// Update cart item
async function updateCartItem(
  cartItemId: bigint,
  data: {
    quantity?: number;
    specialInstructions?: string;
  }
) {
  return prisma.cartItem.update({
    where: { id: cartItemId },
    data,
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
      subtotalAmount: 0,
      totalAmount: 0,
    },
  });
}

// Get coupon by code
async function getCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code },
  });
}

// Calculate cart totals
async function calculateCartTotals(
  cartId: bigint,
  discountAmount: number = 0
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
  const deliveryFee = Number(cart.branch.deliveryFee) || 0;
  const taxAmount = (subtotal - discountAmount) * 0.05; // 5% tax
  const totalAmount = subtotal + deliveryFee + taxAmount - discountAmount;

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
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
};