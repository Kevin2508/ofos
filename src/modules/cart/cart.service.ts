import cartRepository from "./cart.repository.ts";
import redisService from "../../services/redisService.ts";
import { AddCartItemDto, UpdateCartItemDto } from "./cart.dto.ts";

const CART_TTL = 60 * 60 * 24; // 24 hours

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCacheKey(userId: bigint): string {
  return `cart:${userId}`;
}

async function invalidateCache(userId: bigint): Promise<void> {
  await redisService.del(getCacheKey(userId));
}

async function recalcTotals(cartId: bigint): Promise<void> {
  const cart = await cartRepository.findActiveCart_ById(cartId);
  if (!cart) return;

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.lineTotal),
    0
  );

  const taxAmount = parseFloat((subtotal * 0.05).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

  await cartRepository.updateCartTotals(cartId, subtotal, totalAmount);
}

// ── Public Service Methods ────────────────────────────────────────────────────

async function getCart(userId: bigint) {
  const cacheKey = getCacheKey(userId);

  const cached = await redisService.get(cacheKey);
  if (cached) return cached;

  const cart = await cartRepository.findActiveCart(userId);
  if (!cart) return null;

  await redisService.set(cacheKey, cart, CART_TTL);
  return cart;
}

async function addItem(userId: bigint, payload: AddCartItemDto) {
  const { restaurantBranchId, menuItemId, quantity, specialInstructions, modifiers } = payload;

  const menuItem = await cartRepository.findMenuItem(menuItemId);
  if (!menuItem) throw new Error("Menu item not found");
  if (!menuItem.isAvailable) throw new Error("Menu item is not available");

  const unitPrice = Number(menuItem.basePrice);

  let cart = await cartRepository.findActiveCart(userId);

  if (cart && cart.restaurantBranchId !== restaurantBranchId) {
    await cartRepository.deleteAllCartItems(cart.id);
    await cartRepository.deleteCart(cart.id);
    cart = null;
  }

  if (!cart) {
    cart = await cartRepository.createCart({ customerUserId: userId, restaurantBranchId });
  }

  let modifierTotal = 0;
  const resolvedModifiers: { modifierOptionId: bigint; additionalPrice: number }[] = [];

  if (modifiers && modifiers.length > 0) {
    for (const mod of modifiers) {
      const option = await cartRepository.findModifierOption(mod.modifierOptionId);
      if (!option) throw new Error(`Modifier option ${mod.modifierOptionId} not found`);
      const price = Number(option.additionalPrice ?? 0);
      modifierTotal += price;
      resolvedModifiers.push({ modifierOptionId: mod.modifierOptionId, additionalPrice: price });
    }
  }

  const lineTotal = parseFloat(((unitPrice + modifierTotal) * quantity).toFixed(2));

  const cartItem = await cartRepository.createCartItem({
    cartId: cart.id,
    menuItemId,
    quantity,
    unitPrice,
    lineTotal,
    specialInstructions: specialInstructions ?? null,
  });

  if (resolvedModifiers.length > 0) {
    await cartRepository.addModifiers(cartItem.id, resolvedModifiers);
  }

  await recalcTotals(cart.id);
  await invalidateCache(userId);

  return cartRepository.findActiveCart(userId);
}

async function updateItem(userId: bigint, itemId: bigint, payload: UpdateCartItemDto) {
  const cart = await cartRepository.findActiveCart(userId);
  if (!cart) throw new Error("No active cart found");

  const cartItem = await cartRepository.findCartItem(itemId, cart.id);
  if (!cartItem) throw new Error("Cart item not found");

  const updates: { quantity?: number; lineTotal?: number; specialInstructions?: string | null } = {};

  if (payload.quantity !== undefined) {
    const modifierTotal = cartItem.modifiers.reduce(
      (sum, m) => sum + Number(m.additionalPrice),
      0
    );
    const unitPrice = Number(cartItem.unitPrice);
    updates.quantity = payload.quantity;
    updates.lineTotal = parseFloat(((unitPrice + modifierTotal) * payload.quantity).toFixed(2));
  }

  if (payload.specialInstructions !== undefined) {
    updates.specialInstructions = payload.specialInstructions;
  }

  await cartRepository.updateCartItem(itemId, updates);
  await recalcTotals(cart.id);
  await invalidateCache(userId);

  return cartRepository.findActiveCart(userId);
}

async function removeItem(userId: bigint, itemId: bigint) {
  const cart = await cartRepository.findActiveCart(userId);
  if (!cart) throw new Error("No active cart found");

  const cartItem = await cartRepository.findCartItem(itemId, cart.id);
  if (!cartItem) throw new Error("Cart item not found");

  await cartRepository.removeModifiers(itemId);
  await cartRepository.deleteCartItem(itemId);
  await recalcTotals(cart.id);
  await invalidateCache(userId);
}

async function clearCart(userId: bigint) {
  const cart = await cartRepository.findActiveCart(userId);
  if (!cart) throw new Error("No active cart found");

  await cartRepository.deleteAllCartItems(cart.id);
  await cartRepository.deleteCart(cart.id);
  await invalidateCache(userId);
}

async function getPriceBreakdown(userId: bigint) {
  const cart = await cartRepository.findActiveCart(userId);
  if (!cart) throw new Error("No active cart found");

  const subtotal = Number(cart.subtotalAmount);
  const discountAmount = 0;
  const deliveryFee = 30;
  const taxAmount = parseFloat((subtotal * 0.05).toFixed(2));
  const totalAmount = parseFloat((subtotal - discountAmount + deliveryFee + taxAmount).toFixed(2));

  return cartRepository.savePriceBreakdown({
    cartId: cart.id,
    subtotal,
    discountAmount,
    deliveryFee,
    taxAmount,
    totalAmount,
  });
}

export default { getCart, addItem, updateItem, removeItem, clearCart, getPriceBreakdown };