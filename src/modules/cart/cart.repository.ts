import { prisma } from "../../config/prisma.ts";

const cartInclude = {
  items: {
    include: {
      modifiers: true,
      menuItem: true,
    },
  },
  priceBreakdowns: {
    orderBy: { calculatedAt: "desc" as const },
    take: 1,
  },
};

// ── Cart ──────────────────────────────────────────────────────────────────────

async function findActiveCart(customerUserId: bigint) {
  return prisma.cart.findFirst({
    where: { customerUserId, status: "ACTIVE" },
    include: cartInclude,
  });
}

async function findActiveCart_ById(cartId: bigint) {
  return prisma.cart.findFirst({
    where: { id: cartId, status: "ACTIVE" },
    include: cartInclude,
  });
}

async function createCart(data: {
  customerUserId: bigint;
  restaurantBranchId: bigint;
}) {
  return prisma.cart.create({
    data,
    include: cartInclude,
  });
}

async function updateCartTotals(
  cartId: bigint,
  subtotalAmount: number,
  totalAmount: number
) {
  return prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotalAmount,
      totalAmount,
      lastActivityAt: new Date(),
    },
  });
}

async function deleteCart(cartId: bigint) {
  return prisma.cart.delete({ where: { id: cartId } });
}

// ── Cart Items ────────────────────────────────────────────────────────────────

async function findCartItem(cartItemId: bigint, cartId: bigint) {
  return prisma.cartItem.findFirst({
    where: { id: cartItemId, cartId },
    include: { modifiers: true, menuItem: true },
  });
}

async function createCartItem(data: {
  cartId: bigint;
  menuItemId: bigint;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string | null;
}) {
  return prisma.cartItem.create({
    data,
    include: { modifiers: true, menuItem: true },
  });
}

async function updateCartItem(
  cartItemId: bigint,
  data: { quantity?: number; lineTotal?: number; specialInstructions?: string | null }
) {
  return prisma.cartItem.update({
    where: { id: cartItemId },
    data,
    include: { modifiers: true, menuItem: true },
  });
}

async function deleteCartItem(cartItemId: bigint) {
  return prisma.cartItem.delete({ where: { id: cartItemId } });
}

async function deleteAllCartItems(cartId: bigint) {
  return prisma.cartItem.deleteMany({ where: { cartId } });
}

// ── Cart Item Modifiers ───────────────────────────────────────────────────────

async function addModifiers(
  cartItemId: bigint,
  modifiers: { modifierOptionId: bigint; additionalPrice: number }[]
) {
  return prisma.cartItemModifier.createMany({
    data: modifiers.map((m) => ({ cartItemId, ...m })),
  });
}

async function removeModifiers(cartItemId: bigint) {
  return prisma.cartItemModifier.deleteMany({ where: { cartItemId } });
}

// ── Price Breakdown ───────────────────────────────────────────────────────────

async function savePriceBreakdown(data: {
  cartId: bigint;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
}) {
  return prisma.cartPriceBreakdown.create({ data });
}

async function getLatestPriceBreakdown(cartId: bigint) {
  return prisma.cartPriceBreakdown.findFirst({
    where: { cartId },
    orderBy: { calculatedAt: "desc" },
  });
}

// ── MenuItem lookup (for price) ───────────────────────────────────────────────

async function findMenuItem(menuItemId: bigint) {
  return prisma.menuItem.findUnique({ where: { id: menuItemId } });
}

async function findModifierOption(modifierOptionId: bigint) {
  return prisma.modifierOption.findUnique({ where: { id: modifierOptionId } });
}

export default {
  findActiveCart,
  findActiveCart_ById,
  createCart,
  updateCartTotals,
  deleteCart,
  findCartItem,
  createCartItem,
  updateCartItem,
  deleteCartItem,
  deleteAllCartItems,
  addModifiers,
  removeModifiers,
  savePriceBreakdown,
  getLatestPriceBreakdown,
  findMenuItem,
  findModifierOption,
};