import { prisma } from '../../config/prisma.ts';
import { CartStatus, OrderStatus, PaymentStatus } from '../../generated/prisma/browser.ts';
import {
  ICheckoutSessionData,
  ICartData,
  IPlaceOrderRequest,
  IPlaceOrderResult
} from './order.interface.ts';
// import { CartStatus, OrderStatus, PaymentStatus } from '@prisma/client';

interface GetOrdersParams {
  customerUserId: bigint;
  page: number;
  limit: number;
}

async function getOrders({ customerUserId, page, limit }: GetOrdersParams) {
  const skip = (page - 1) * limit;

  return prisma.order.findMany({
    where: {
      customerUserId,
    },

    include: {
      restaurant: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
        },
      },

      branch: {
        select: {
          id: true,
          branchName: true,
          city: true,
        },
      },

      items: true,
    },

    orderBy: {
      createdAt: 'desc',
    },

    skip,
    take: limit,
  });
}

async function countOrders(customerUserId: bigint) {
  return prisma.order.count({
    where: {
      customerUserId,
    },
  });
}

async function getOrderById(orderId: bigint, customerUserId: bigint) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      customerUserId,
    },

    include: {
      restaurant: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
        },
      },

      branch: {
        select: {
          id: true,
          branchName: true,
          city: true,
          state: true,
        },
      },

      address: true,

      items: {
        include: {
          modifiers: true,
        },
      },

      payments: true,

      statusHistory: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

async function getOrderTrackingData(orderId: bigint, customerUserId: bigint) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      customerUserId,
    },

    include: {
      deliveryAssignments: {
        orderBy: {
          assignedAt: 'desc',
        },

        take: 1,

        include: {
          partner: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },

          trackingPoints: {
            orderBy: {
              recordedAt: 'desc',
            },

            take: 1,
          },
        },
      },
    },
  });
}

async function findOrderForCancellation(
  orderId: bigint,
  customerUserId: bigint
) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      customerUserId,
    },
  });
}

async function cancelOrder(
  orderId: bigint,
  customerUserId: bigint,
  reason: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: {
        id: orderId,
      },

      data: {
        orderStatus: 'CANCELLED',
      },
    });

    await tx.orderCancellation.create({
      data: {
        orderId,
        cancelledByUserId: customerUserId,
        cancellationReason: reason,
        refundEligible: true,
      },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        changedByUserId: customerUserId,
        remarks: reason,
      },
    });

    return order;
  });
}

export async function updateOrderStatus(
  orderId: bigint,
  status: OrderStatus,
  changedByUserId: bigint,
  remarks: string
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: { orderStatus: status },
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status,
        changedByUserId,
        remarks,
      },
    });

    return order;
  });
}

export const findCheckoutSession = async (
  sessionId: bigint,
  customerUserId: bigint
): Promise<ICheckoutSessionData | null> => {
  const session = await prisma.checkoutSession.findFirst({
    where: { id: sessionId, customerUserId },
    select: {
      id: true,
      cartId: true,
      customerUserId: true,
      addressId: true,
      deliveryType: true,
      scheduledFor: true,
      estimatedDeliveryMinutes: true,
      expiresAt: true,
      address: {
        select: {
          contactName: true,
          contactPhone: true,
          addressLine1: true,
          addressLine2: true,
          landmark: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  })

  return session as ICheckoutSessionData | null;
};

export const findActiveCart = async (
  cartId: bigint,
  customerUserId: bigint
): Promise<ICartData | null> => {
  const cart = await prisma.cart.findFirst({
    where: {
      id: cartId,
      customerUserId,
      status: CartStatus.ACTIVE,
    },
    select: {
      id: true,
      restaurantBranchId: true,
      subtotalAmount: true,
      totalAmount: true,
      items: {
        select: {
          id: true,
          menuItemId: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          specialInstructions: true,
          menuItem: {
            select: {
              name: true,
              description: true,
            },
          },
          modifiers: {
            select: {
              additionalPrice: true,
              modifierOption: {
                select: {
                  optionName: true,
                  modifierGroup: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
      branch: {
        select: {
          id: true,
          isActive: true,
          deliveryFee: true,
          restaurant: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
    },
  });

  return cart as ICartData | null;
};

export const findExistingOrderBySession = async (
  checkoutSessionId: bigint
): Promise<boolean> => {
  const order = await prisma.order.findFirst({
    where: { checkoutSessionId },
    select: { id: true },
  });
  return order !== null;
};

// ─────────────────────────────────────────────────────────────
// WRITE — atomic transaction
// ─────────────────────────────────────────────────────────────

export const createOrder = async (params: {
  customerUserId: bigint;
  session: ICheckoutSessionData;
  cart: ICartData;
  orderNumber: string;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  estimatedDeliveryAt: Date | null;
  specialInstructions?: string;
}) => {
  const {
    customerUserId,
    session,
    cart,
    orderNumber,
    subtotal,
    deliveryFee,
    taxAmount,
    totalAmount,
    estimatedDeliveryAt,
    specialInstructions,
  } = params;

  return await prisma.$transaction(async (tx) => {
    // ── 1. Order ─────────────────────────────────────────────
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerUserId,
        restaurantId: cart.branch.restaurant.id,
        branchId: cart.branch.id,
        checkoutSessionId: session.id,
        orderStatus: OrderStatus.PLACED,
        paymentStatus: PaymentStatus.PENDING,
        subtotalAmount: subtotal,
        discountAmount: 0,
        deliveryFee,
        taxAmount,
        totalAmount,
        estimatedDeliveryAt,
      },
    });

    // ── 2. Order Address snapshot ────────────────────────────
    await tx.orderAddress.create({
      data: {
        orderId: order.id,
        recipientName: session.address.contactName,
        recipientPhone: session.address.contactPhone,
        addressLine1: session.address.addressLine1,
        addressLine2: session.address.addressLine2,
        landmark: session.address.landmark,
        city: session.address.city,
        state: session.address.state,
        postalCode: session.address.postalCode,
        latitude: session.address.latitude,
        longitude: session.address.longitude,
      },
    });

    // ── 3. Order Items + Modifiers snapshot ──────────────────
    for (const item of cart.items) {
      const orderItem = await tx.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: item.menuItemId,
          itemName: item.menuItem.name,
          itemDescription: item.menuItem.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice.toString()),
          lineTotal: parseFloat(item.lineTotal.toString()),
          specialInstructions: item.specialInstructions,
        },
      });

      if (item.modifiers.length > 0) {
        await tx.orderItemModifier.createMany({
          data: item.modifiers.map((mod) => ({
            orderItemId: orderItem.id,
            modifierName: mod.modifierOption.modifierGroup.name,
            optionName: mod.modifierOption.optionName,
            additionalPrice: parseFloat(mod.additionalPrice.toString()),
          })),
        });
      }
    }

    // ── 4. Order Status History — first entry ────────────────
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: OrderStatus.PLACED,
        changedByUserId: customerUserId,
        remarks: 'Order placed by customer.',
      },
    });

    // ── 5. Order Event ───────────────────────────────────────
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        eventType: 'ORDER_CREATED',
        payload: {
          orderNumber,
          totalAmount,
          deliveryType: session.deliveryType,
        },
      },
    });

    // ── 6. Cart → CHECKED_OUT ────────────────────────────────
    await tx.cart.update({
      where: { id: cart.id },
      data: { status: CartStatus.CHECKED_OUT },
    });

    return order;
  });
};

export default {
  getOrders,
  countOrders,
  getOrderById,
  getOrderTrackingData,
  findOrderForCancellation,
  cancelOrder,
  findCheckoutSession,
  findActiveCart,
  findExistingOrderBySession,
  createOrder,
  updateOrderStatus,
};
