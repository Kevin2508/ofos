import { prisma } from '../../config/prisma.ts';
import { CartStatus, OrderStatus, PaymentStatus } from '../../generated/prisma/browser.ts';
import {
  ICheckoutSessionData,
  ICartData,

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
          menuItem: {
            select: {
              isAvailable: true,
            }
          }
        },
      },

      payments: true,
      refunds: true,

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
      branch: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
      address: {
        select: {
          latitude: true,
          longitude: true,
        },
      },
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
    include: {
      payments: true,
    }
  });
}

async function cancelOrder(
  orderId: bigint,
  customerUserId: bigint,
  reason: string,
  refundEligible: boolean,
  refundAmount: number,
  paymentId?: bigint
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
        refundEligible,
        refundAmount,
      },
    });

    if (refundEligible && refundAmount > 0 && paymentId) {
      await tx.refund.create({
        data: {
          orderId,
          paymentId,
          amount: refundAmount,
          reason: 'Order cancelled: ' + reason,
          status: 'INITIATED',
          refundReference: `REF-${orderId}-${Date.now()}`
        }
      });
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        changedByUserId: customerUserId,
        remarks: reason,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId,
        eventType: 'ORDER_STATUS_CHANGED',
        payload: { status: 'CANCELLED', changedByUserId: customerUserId.toString(), remarks: reason },
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

    await tx.orderEvent.create({
      data: {
        orderId,
        eventType: 'ORDER_STATUS_CHANGED',
        payload: { status, changedByUserId: changedByUserId.toString(), remarks },
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
          minimumOrderValue: true,
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
  otpHash?: string;
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

    otpHash,
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
        otpHash,
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

export const createDisputeTicket = async (
  orderId: bigint,
  customerUserId: bigint,
  category: any,
  description: string
) => {
  const ticketNumber = `TKT-${orderId}-${Date.now()}`;
  return prisma.supportTicket.create({
    data: {
      ticketNumber,
      orderId,
      customerUserId,
      category,
      priority: 'HIGH',
      status: 'OPEN',
      subject: 'Order Dispute',
      description,
    }
  });
};

export async function markItemUnavailable(orderId: bigint, itemId: bigint) {
  return prisma.$transaction(async (tx) => {
    const orderItem = await tx.orderItem.findFirst({ where: { id: itemId, orderId } });
    if (!orderItem || orderItem.isUnavailable) throw new Error('Item not found or already unavailable');

    await tx.orderItem.update({
      where: { id: itemId },
      data: { isUnavailable: true }
    });

    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payments: true } });

    if (order?.paymentStatus === 'PAID') {
      const payment = order.payments?.find(p => p.status === 'CAPTURED' || p.status === 'PARTIALLY_REFUNDED');
      if (payment) {
        await tx.refund.create({
          data: {
            orderId,
            paymentId: payment.id,
            refundReference: `REF-${orderId}-${itemId}-${Date.now()}`,
            amount: orderItem.lineTotal,
            reason: `Item ${orderItem.itemName} unavailable`,
            status: 'COMPLETED'
          }
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'PARTIALLY_REFUNDED' }
        });
      }
    }

    return tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true }
    });
  });
}

export async function getRestaurantOrderById(orderId: bigint, ownerUserId: bigint) {
  // ensure order belongs to owner's branch
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      branch: {
        restaurant: {
          ownerUserId
        }
      }
    },
    include: {
      customer: { include: { customerProfile: true } },
      items: { include: { modifiers: true } },
      payments: true,
      address: true,
      branch: true,
    }
  });
  return order;
}

export default {
  getOrders,
  countOrders,
  getOrderById,
  getRestaurantOrderById,
  getOrderTrackingData,
  findOrderForCancellation,
  cancelOrder,
  findCheckoutSession,
  findActiveCart,
  findExistingOrderBySession,
  createOrder,
  updateOrderStatus,
  createDisputeTicket,
  markItemUnavailable,
};
