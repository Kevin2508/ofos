import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, CouponType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  private appliedCouponsMap = new Map<
    string,
    { code: string; couponId: bigint; couponType: CouponType; value: number }
  >();

  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: bigint) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        customerUserId: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        branch: {
          include: {
            restaurant: true,
          },
        },
        items: {
          include: {
            menuItem: {
              include: {
                images: true,
              },
            },
            modifiers: {
              include: {
                modifierOption: true,
              },
            },
          },
        },
        priceBreakdowns: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!cart) {
      return null;
    }

    if (!cart.items || cart.items.length === 0) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: {
          status: CartStatus.ABANDONED,
          subtotalAmount: 0,
          totalAmount: 0,
        },
      });
      return null;
    }

    const now = new Date();
    const candidateCoupons = await this.prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      include: {
        couponRestaurants: true,
      },
    });

    const applicableCoupons = candidateCoupons
      .filter((c) => {
        if (c.couponRestaurants && c.couponRestaurants.length > 0) {
          return c.couponRestaurants.some(
            (cr) => cr.restaurantId === cart.branch.restaurantId,
          );
        }
        return true;
      })
      .map((c) => ({
        code: c.code,
        couponType: c.couponType,
        value: Number(c.value),
        description:
          c.couponType === CouponType.PERCENTAGE
            ? `${c.value}% OFF`
            : c.couponType === CouponType.FLAT
              ? `₹${c.value} OFF`
              : c.couponType === CouponType.FREE_DELIVERY
                ? 'Free Delivery'
                : 'Buy 1 Get 1 Free',
      }));

    const minimumOrderValue = Number(cart.branch.minimumOrderValue || 0);
    const subtotal = cart.priceBreakdowns[0]
      ? Number(cart.priceBreakdowns[0].subtotal)
      : Number(cart.subtotalAmount);
    const distanceToMinimum = Math.max(0, minimumOrderValue - subtotal);
    const progressPercentage =
      minimumOrderValue > 0
        ? Math.min(100, (subtotal / minimumOrderValue) * 100)
        : 100;

    return {
      id: cart.id.toString(),
      customerUserId: cart.customerUserId.toString(),
      restaurantBranchId: cart.restaurantBranchId.toString(),
      status: cart.status,
      restaurantBranch: {
        id: cart.branch.id.toString(),
        branchName: cart.branch.branchName,
        restaurantId: cart.branch.restaurantId.toString(),
        restaurant: {
          id: cart.branch.restaurant.id.toString(),
          businessName: cart.branch.restaurant.businessName,
          logoUrl: cart.branch.restaurant.logoUrl,
        },
      },
      items: cart.items.map((item) => ({
        id: item.id.toString(),
        menuItemId: item.menuItemId.toString(),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice).toFixed(2),
        lineTotal: Number(item.lineTotal).toFixed(2),
        specialInstructions: item.specialInstructions,
        menuItem: item.menuItem
          ? {
              id: item.menuItem.id.toString(),
              name: item.menuItem.name,
              foodType: item.menuItem.foodType,
              imageUrl:
                item.menuItem.images?.[0]?.imageUrl ||
                item.menuItem.imageUrl ||
                null,
            }
          : null,
        modifiers: item.modifiers.map((mod) => ({
          id: mod.id.toString(),
          modifierOptionId: mod.modifierOptionId.toString(),
          optionName: mod.modifierOption?.optionName || '',
          additionalPrice: Number(mod.additionalPrice).toFixed(2),
        })),
      })),
      priceBreakdown: cart.priceBreakdowns[0]
        ? {
            subtotal: Number(cart.priceBreakdowns[0].subtotal).toFixed(2),
            discountAmount: Number(
              cart.priceBreakdowns[0].discountAmount,
            ).toFixed(2),
            deliveryFee: Number(cart.priceBreakdowns[0].deliveryFee).toFixed(2),
            taxAmount: Number(cart.priceBreakdowns[0].taxAmount).toFixed(2),
            totalAmount: Number(cart.priceBreakdowns[0].totalAmount).toFixed(2),
            calculatedAt: cart.priceBreakdowns[0].calculatedAt,
          }
        : {
            subtotal: subtotal.toFixed(2),
            discountAmount: '0.00',
            deliveryFee: Number(cart.branch.deliveryFee || 0).toFixed(2),
            taxAmount: (subtotal * 0.05).toFixed(2),
            totalAmount: (
              subtotal +
              Number(cart.branch.deliveryFee || 0) +
              subtotal * 0.05
            ).toFixed(2),
            calculatedAt: new Date(),
          },
      minimumOrderValue: minimumOrderValue.toFixed(2),
      distanceToMinimum: distanceToMinimum.toFixed(2),
      progressPercentage: Math.round(progressPercentage),
      applicableCoupons,
      appliedCoupon:
        this.appliedCouponsMap.has(cart.id.toString()) &&
        Number(cart.priceBreakdowns[0]?.discountAmount || 0) > 0
          ? {
              code: this.appliedCouponsMap.get(cart.id.toString())!.code,
              couponId: this.appliedCouponsMap
                .get(cart.id.toString())!
                .couponId.toString(),
              discountAmount: Number(
                cart.priceBreakdowns[0].discountAmount,
              ).toFixed(2),
            }
          : null,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async addToCart(userId: bigint, dto: AddToCartDto) {
    const targetBranchId = BigInt(dto.restaurantBranchId);
    const targetMenuItemId = BigInt(dto.menuItemId);

    let cart = await this.prisma.cart.findFirst({
      where: {
        customerUserId: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        branch: {
          include: {
            restaurant: true,
          },
        },
        items: {
          include: {
            modifiers: true,
          },
        },
      },
    });

    if (cart && (!cart.items || cart.items.length === 0)) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.ABANDONED },
      });
      cart = null;
    }

    if (cart && cart.restaurantBranchId !== targetBranchId) {
      throw new BadRequestException({
        message: 'DIFFERENT_RESTAURANT_CART_EXISTS',
        existingBranchId: cart.restaurantBranchId.toString(),
        existingBranchName: cart.branch?.branchName || '',
        existingRestaurantName: cart.branch?.restaurant?.businessName || '',
      });
    }

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: targetMenuItemId },
      include: { category: true },
    });

    if (!menuItem || menuItem.deletedAt) {
      throw new NotFoundException('Menu item not found');
    }

    if (!menuItem.isAvailable) {
      throw new BadRequestException('Menu item is currently unavailable');
    }

    if (menuItem.category.branchId !== targetBranchId) {
      throw new BadRequestException(
        'Menu item does not belong to the selected branch',
      );
    }

    const requestedModifiers = dto.modifiers || [];
    let modifiersTotal = 0;
    const modifierOptionIds = requestedModifiers.map((m) =>
      BigInt(m.modifierOptionId),
    );

    if (modifierOptionIds.length > 0) {
      const options = await this.prisma.modifierOption.findMany({
        where: {
          id: { in: modifierOptionIds },
          modifierGroup: {
            branchId: targetBranchId,
          },
        },
      });

      if (options.length !== modifierOptionIds.length) {
        throw new BadRequestException('One or more modifier options are invalid');
      }

      modifiersTotal = options.reduce(
        (sum, opt) => sum + Number(opt.additionalPrice),
        0,
      );
    }

    const unitPrice = Number(menuItem.basePrice) + modifiersTotal;

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          customerUserId: userId,
          restaurantBranchId: targetBranchId,
          status: CartStatus.ACTIVE,
          subtotalAmount: 0,
          totalAmount: 0,
        },
        include: {
          branch: {
            include: {
              restaurant: true,
            },
          },
          items: {
            include: {
              modifiers: true,
            },
          },
        },
      });
    }

    const sortedRequestedModIds = modifierOptionIds
      .map((id) => id.toString())
      .sort();

    const existingMatchingItem = cart.items.find((item) => {
      if (item.menuItemId !== targetMenuItemId) return false;
      const existingModIds = (item.modifiers || [])
        .map((m) => m.modifierOptionId.toString())
        .sort();
      return (
        existingModIds.length === sortedRequestedModIds.length &&
        existingModIds.every((val, idx) => val === sortedRequestedModIds[idx])
      );
    });

    if (existingMatchingItem) {
      const newQuantity = existingMatchingItem.quantity + dto.quantity;
      const newLineTotal = unitPrice * newQuantity;

      await this.prisma.cartItem.update({
        where: { id: existingMatchingItem.id },
        data: {
          quantity: newQuantity,
          lineTotal: newLineTotal,
          specialInstructions:
            dto.specialInstructions ?? existingMatchingItem.specialInstructions,
        },
      });
    } else {
      const lineTotal = unitPrice * dto.quantity;
      const createdItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          menuItemId: targetMenuItemId,
          quantity: dto.quantity,
          unitPrice,
          lineTotal,
          specialInstructions: dto.specialInstructions || null,
        },
      });

      if (modifierOptionIds.length > 0) {
        const options = await this.prisma.modifierOption.findMany({
          where: { id: { in: modifierOptionIds } },
        });

        await this.prisma.cartItemModifier.createMany({
          data: options.map((opt) => ({
            cartItemId: createdItem.id,
            modifierOptionId: opt.id,
            additionalPrice: opt.additionalPrice,
          })),
        });
      }
    }

    await this.syncCartTotals(cart.id);
    return this.getCart(userId);
  }

  async updateCartItem(userId: bigint, itemId: bigint, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.customerUserId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity !== undefined && dto.quantity < 1) {
      return this.removeCartItem(userId, itemId);
    }

    const updateData: any = {};
    if (dto.quantity !== undefined) {
      updateData.quantity = dto.quantity;
      updateData.lineTotal = Number(item.unitPrice) * dto.quantity;
    }
    if (dto.specialInstructions !== undefined) {
      updateData.specialInstructions = dto.specialInstructions;
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: updateData,
    });

    await this.syncCartTotals(item.cartId);
    return this.getCart(userId);
  }

  async removeCartItem(userId: bigint, itemId: bigint) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.customerUserId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItemModifier.deleteMany({
      where: { cartItemId: itemId },
    });
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    const remainingItemsCount = await this.prisma.cartItem.count({
      where: { cartId: item.cartId },
    });

    if (remainingItemsCount === 0) {
      await this.prisma.cart.update({
        where: { id: item.cartId },
        data: {
          status: CartStatus.ABANDONED,
          subtotalAmount: 0,
          totalAmount: 0,
        },
      });
      return null;
    }

    await this.syncCartTotals(item.cartId);
    return this.getCart(userId);
  }

  async clearCart(userId: bigint) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        customerUserId: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        items: true,
      },
    });

    if (cart) {
      this.appliedCouponsMap.delete(cart.id.toString());
      const itemIds = cart.items.map((i) => i.id);
      if (itemIds.length > 0) {
        await this.prisma.cartItemModifier.deleteMany({
          where: { cartItemId: { in: itemIds } },
        });
        await this.prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      await this.prisma.cart.update({
        where: { id: cart.id },
        data: {
          status: CartStatus.ABANDONED,
          subtotalAmount: 0,
          totalAmount: 0,
        },
      });
    }

    return { message: 'Cart cleared successfully' };
  }

  async applyCoupon(userId: bigint, code: string) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        customerUserId: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        branch: true,
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: { couponRestaurants: true },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      throw new BadRequestException('Coupon is not yet valid');
    }
    if (coupon.validUntil < now) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.couponRestaurants && coupon.couponRestaurants.length > 0) {
      const isApplicable = coupon.couponRestaurants.some(
        (cr) => cr.restaurantId === cart.branch.restaurantId,
      );
      if (!isApplicable) {
        throw new BadRequestException('Coupon is not valid for this restaurant');
      }
    }

    if (coupon.usageLimit) {
      const usageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (usageCount >= coupon.usageLimit) {
        throw new BadRequestException('Coupon usage limit reached');
      }
    }

    if (coupon.perUserLimit) {
      const userUsageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, customerUserId: userId },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        throw new BadRequestException('You have reached the limit for this coupon');
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );

    if (
      coupon.minimumOrderAmount &&
      subtotal < Number(coupon.minimumOrderAmount)
    ) {
      throw new BadRequestException(
        `Minimum order amount of ₹${coupon.minimumOrderAmount} not met`,
      );
    }

    let discountAmount = 0;
    if (coupon.couponType === CouponType.PERCENTAGE) {
      discountAmount = (subtotal * Number(coupon.value)) / 100;
      if (
        coupon.maximumDiscountAmount &&
        discountAmount > Number(coupon.maximumDiscountAmount)
      ) {
        discountAmount = Number(coupon.maximumDiscountAmount);
      }
    } else if (coupon.couponType === CouponType.FLAT) {
      discountAmount = Math.min(Number(coupon.value), subtotal);
    } else if (coupon.couponType === CouponType.FREE_DELIVERY) {
      discountAmount = Number(cart.branch.deliveryFee || 0);
    } else if (coupon.couponType === CouponType.BOGO) {
      const totalQty = cart.items.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      );
      if (totalQty >= 2) {
        const cheapestItem = cart.items.reduce((prev, curr) =>
          Number(prev.unitPrice) < Number(curr.unitPrice) ? prev : curr,
        );
        discountAmount = Number(cheapestItem.unitPrice);
        if (
          coupon.maximumDiscountAmount &&
          discountAmount > Number(coupon.maximumDiscountAmount)
        ) {
          discountAmount = Number(coupon.maximumDiscountAmount);
        }
      } else {
        throw new BadRequestException(
          'BOGO coupon requires at least 2 items in cart',
        );
      }
    }

    const isFreeDelivery = coupon.couponType === CouponType.FREE_DELIVERY;
    const foodDiscount = isFreeDelivery ? 0 : discountAmount;
    const deliveryDiscount = isFreeDelivery ? Number(cart.branch.deliveryFee || 0) : 0;
    const totalDiscountAmount = foodDiscount + deliveryDiscount;

    const deliveryFee = Number(cart.branch.deliveryFee || 0);
    const taxableAmount = Math.max(0, subtotal - foodDiscount);
    const taxAmount = taxableAmount * 0.05;
    const totalAmount = Math.max(
      0,
      subtotal + (deliveryFee - deliveryDiscount) + taxAmount - foodDiscount,
    );

    this.appliedCouponsMap.set(cart.id.toString(), {
      code: coupon.code,
      couponId: coupon.id,
      couponType: coupon.couponType,
      value: Number(coupon.value),
    });

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        subtotalAmount: subtotal,
        totalAmount,
      },
    });

    await this.prisma.cartPriceBreakdown.create({
      data: {
        cartId: cart.id,
        subtotal,
        discountAmount: totalDiscountAmount,
        deliveryFee,
        taxAmount,
        totalAmount,
      },
    });

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: totalDiscountAmount.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      appliedCoupon: {
        code: coupon.code,
        couponId: coupon.id.toString(),
        discountAmount: totalDiscountAmount.toFixed(2),
      },
      calculatedAt: new Date(),
    };
  }

  async removeCoupon(userId: bigint) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        customerUserId: userId,
        status: CartStatus.ACTIVE,
      },
      include: { branch: true, items: true },
    });

    if (!cart) {
      throw new BadRequestException('No active cart found');
    }

    this.appliedCouponsMap.delete(cart.id.toString());
    await this.syncCartTotals(cart.id, 0);
    return this.getPriceBreakdown(userId);
  }

  async getPriceBreakdown(userId: bigint) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        customerUserId: userId,
        status: CartStatus.ACTIVE,
      },
      include: {
        branch: true,
        items: true,
        priceBreakdowns: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!cart) {
      throw new BadRequestException('No active cart found');
    }

    const breakdown = cart.priceBreakdowns[0];
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );
    const discountAmount = breakdown ? Number(breakdown.discountAmount) : 0;
    const deliveryFee = Number(cart.branch.deliveryFee || 0);
    const taxAmount = Math.max(0, subtotal - discountAmount) * 0.05;
    const totalAmount = Math.max(
      0,
      subtotal + deliveryFee + taxAmount - discountAmount,
    );

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      calculatedAt: breakdown ? breakdown.calculatedAt : new Date(),
    };
  }

  private async syncCartTotals(cartId: bigint, overrideDiscount?: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: true,
        branch: true,
        priceBreakdowns: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!cart) return;

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.lineTotal),
      0,
    );

    let foodDiscount = 0;
    let deliveryDiscount = 0;

    const applied = this.appliedCouponsMap.get(cartId.toString());
    if (overrideDiscount !== undefined) {
      foodDiscount = overrideDiscount;
    } else if (applied) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { id: applied.couponId },
      });
      if (
        coupon &&
        coupon.isActive &&
        (!coupon.minimumOrderAmount || subtotal >= Number(coupon.minimumOrderAmount))
      ) {
        if (coupon.couponType === CouponType.PERCENTAGE) {
          foodDiscount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maximumDiscountAmount) {
            foodDiscount = Math.min(
              foodDiscount,
              Number(coupon.maximumDiscountAmount),
            );
          }
        } else if (coupon.couponType === CouponType.FLAT) {
          foodDiscount = Math.min(Number(coupon.value), subtotal);
        } else if (coupon.couponType === CouponType.FREE_DELIVERY) {
          deliveryDiscount = Number(cart.branch?.deliveryFee || 0);
        } else if (coupon.couponType === CouponType.BOGO) {
          const totalQty = cart.items.reduce(
            (s, i) => s + Number(i.quantity),
            0,
          );
          if (totalQty >= 2) {
            const cheapestItem = cart.items.reduce((prev, curr) =>
              Number(prev.unitPrice) < Number(curr.unitPrice) ? prev : curr,
            );
            foodDiscount = Number(cheapestItem.unitPrice);
            if (coupon.maximumDiscountAmount) {
              foodDiscount = Math.min(
                foodDiscount,
                Number(coupon.maximumDiscountAmount),
              );
            }
          }
        }
      } else {
        this.appliedCouponsMap.delete(cartId.toString());
      }
    }

    const totalDiscountAmount = foodDiscount + deliveryDiscount;
    const deliveryFee = Number(cart.branch?.deliveryFee || 0);
    const taxableAmount = Math.max(0, subtotal - foodDiscount);
    const taxAmount = taxableAmount * 0.05;
    const totalAmount = Math.max(
      0,
      subtotal + (deliveryFee - deliveryDiscount) + taxAmount - foodDiscount,
    );

    await this.prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotalAmount: subtotal,
        totalAmount,
      },
    });

    await this.prisma.cartPriceBreakdown.create({
      data: {
        cartId,
        subtotal,
        discountAmount: totalDiscountAmount,
        deliveryFee,
        taxAmount,
        totalAmount,
      },
    });
  }
}
