import { prisma } from '../../config/prisma.ts';

async function createCheckoutSession(
  cartId: bigint,
  userId: bigint,
  data: {
    addressId: bigint;
    deliveryType: string;
    scheduledFor?: Date;
    paymentMethodId?: bigint;
    couponId?: bigint;
  }
) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); 

  return prisma.checkoutSession.create({
    data: {
      cartId,
      customerUserId: userId,
      addressId: data.addressId,
      deliveryType: data.deliveryType,
      scheduledFor: data.scheduledFor,
      paymentMethodId: data.paymentMethodId,
      couponId: data.couponId,
      expiresAt,
    },
    include: {
      cart: {
        include: {
          items: {
            include: {
              modifiers: true,
            },
          },
          priceBreakdowns: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
      },
      address: true,
    },
  });
}


async function getCheckoutSession(sessionId: bigint, userId: bigint) {
  return prisma.checkoutSession.findFirst({
    where: {
      id: sessionId,
      customerUserId: userId,
    },
    include: {
      cart: {
        include: {
          items: {
            include: {
              modifiers: true,
            },
          },
          priceBreakdowns: {
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
          branch: true,
        },
      },
      address: true,
    },
  });
}

async function updateCheckoutSession(
  sessionId: bigint,
  data: {
    estimatedDeliveryMinutes?: number;
    paymentMethodId?: bigint;
  }
) {
  return prisma.checkoutSession.update({
    where: { id: sessionId },
    data,
  });
}

async function createOrder(
  userId: bigint,
  sessionId: bigint,
  cartId: bigint,
  data: {
    orderNumber: string;
    restaurantId: bigint;
    branchId: bigint;
    subtotalAmount: number;
    discountAmount: number;
    deliveryFee: number;
    taxAmount: number;
    totalAmount: number;
    estimatedDeliveryMinutes?: number;
  }
) {
  const estimatedDeliveryAt = new Date();
  if (data.estimatedDeliveryMinutes) {
    estimatedDeliveryAt.setMinutes(
      estimatedDeliveryAt.getMinutes() + data.estimatedDeliveryMinutes
    );
  }

  return prisma.order.create({
    data: {
      orderNumber: data.orderNumber,
      customerUserId: userId,
      restaurantId: data.restaurantId,
      branchId: data.branchId,
      checkoutSessionId: sessionId,
      orderStatus: 'PLACED',
      paymentStatus: 'PENDING',
      subtotalAmount: data.subtotalAmount,
      discountAmount: data.discountAmount,
      deliveryFee: data.deliveryFee,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      estimatedDeliveryAt,
    },
  });
}

async function createOrderItems(
  orderId: bigint,
  cartId: bigint
) {
  const cartItems = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      modifiers: true,
      menuItem: true,
    },
  });

  for (const item of cartItems) {
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        menuItemId: item.menuItemId,
        itemName: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        specialInstructions: item.specialInstructions,
      },
    });

    for (const modifier of item.modifiers) {
      await prisma.orderItemModifier.create({
        data: {
          orderItemId: orderItem.id,
          modifierName: 'Unknown',
          optionName: '', 
          additionalPrice: modifier.additionalPrice,
        },
      });
    }
  }
}

async function createOrderAddress(
  orderId: bigint,
  addressId: bigint
) {
  const address = await prisma.customerAddress.findUnique({
    where: { id: addressId },
  });

  if (!address) throw new Error('Address not found');

  return prisma.orderAddress.create({
    data: {
      orderId,
      recipientName: address.contactName,
      recipientPhone: address.contactPhone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude,
    },
  });
}

async function createPayment(
  orderId: bigint,
  data: {
    paymentProvider: string;
    amount: number;
  }
) {
  return prisma.payment.create({
    data: {
      orderId,
      paymentProvider: data.paymentProvider,
      amount: data.amount,
      currency: 'INR',
      status: 'INITIATED',
    },
  });
}

async function updateCartStatus(cartId: bigint, status: string) {
  return prisma.cart.update({
    where: { id: cartId },
    data: { status },
  });
}

async function getCartWithBranch(cartId: bigint) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      branch: {
        include: {
          restaurant: true,
        },
      },
      priceBreakdowns: {
        orderBy: { calculatedAt: 'desc' },
        take: 1,
      },
    },
  });
}

export {
  createCheckoutSession,
  getCheckoutSession,
  updateCheckoutSession,
  createOrder,
  createOrderItems,
  createOrderAddress,
  createPayment,
  updateCartStatus,
  getCartWithBranch,
};