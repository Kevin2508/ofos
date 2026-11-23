import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  AssignmentType,
  CartStatus,
  DeliveryPartnerStatus,
  OrderStatus,
  PaymentGatewayStatus,
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
  StaffStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  GetOrdersQueryDto,
  PlaceOrderDto,
} from './dto/orders.dto';

const OTP_SECRET = process.env.JWT_SECRET || 'ofos-secure-otp-encryption-secret-key-32b';
const CIPHER_KEY = crypto.createHash('sha256').update(OTP_SECRET).digest();

function encryptOtp(plainOtp: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', CIPHER_KEY, iv);
  let encrypted = cipher.update(plainOtp, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decryptOtp(cipherText: string): string | null {
  try {
    const [ivHex, encryptedHex] = cipherText.split(':');
    if (!ivHex || !encryptedHex) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', CIPHER_KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  private async verifyStaffPermission(
    branchId: bigint,
    userId: bigint,
    userRoles: string[],
  ): Promise<boolean> {
    if (userRoles.includes('Admin')) {
      return true;
    }

    const branch = await this.prisma.restaurantBranch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });

    if (!branch) {
      throw new NotFoundException('Restaurant branch not found');
    }

    if (branch.restaurant.ownerUserId === userId) {
      return true;
    }

    const staff = await this.prisma.restaurantStaff.findFirst({
      where: {
        branchId,
        userId,
        status: StaffStatus.ACTIVE,
      },
    });

    if (staff) {
      return true;
    }

    throw new ForbiddenException(
      'You do not have staff or owner permissions for this branch',
    );
  }

  private async autoAssignDeliveryPartner(orderId: bigint, staffUserId?: bigint) {
    const declinedAssignments = await this.prisma.deliveryAssignment.findMany({
      where: {
        orderId,
        status: AssignmentStatus.DECLINED,
      },
      select: { partnerUserId: true },
    });

    const excludedPartnerIds = declinedAssignments
      .map((a) => a.partnerUserId)
      .filter((id): id is bigint => id !== null);

    // Prefer online, active partner with no active assigned/accepted delivery
    let partner = await this.prisma.deliveryPartner.findFirst({
      where: {
        isOnline: true,
        status: DeliveryPartnerStatus.ACTIVE,
        userId: {
          notIn: excludedPartnerIds,
        },
        assignments: {
          none: {
            status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED] },
          },
        },
      },
    });

    // Fallback to any online, active partner not in declined list
    if (!partner) {
      partner = await this.prisma.deliveryPartner.findFirst({
        where: {
          isOnline: true,
          status: DeliveryPartnerStatus.ACTIVE,
          userId: {
            notIn: excludedPartnerIds,
          },
        },
      });
    }

    if (partner) {
      const assignment = await this.prisma.deliveryAssignment.create({
        data: {
          orderId,
          partnerUserId: partner.userId,
          assignedByUserId: staffUserId || null,
          assignmentType: AssignmentType.AUTO,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
        },
        include: {
          partner: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
      return assignment;
    }

    return null;
  }

  // -------------------------------------------------------------
  // Customer Workflow
  // -------------------------------------------------------------
  async placeOrder(userId: bigint, sessionId: bigint, dto: PlaceOrderDto) {
    const session = await this.prisma.checkoutSession.findFirst({
      where: {
        id: sessionId,
        customerUserId: userId,
      },
      include: {
        address: true,
        cart: {
          include: {
            branch: {
              include: {
                restaurant: true,
              },
            },
            items: {
              include: {
                menuItem: true,
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
            priceBreakdowns: {
              orderBy: { calculatedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.expiresAt <= new Date()) {
      throw new BadRequestException('Checkout session has expired. Please initiate checkout again.');
    }

    const cart = session.cart;
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cannot place an order with an empty cart');
    }

    const breakdown = cart.priceBreakdowns[0];
    if (!breakdown) {
      throw new BadRequestException('Cart price breakdown missing');
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const encryptedOtp = encryptOtp(rawOtp);

    const orderDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD-${orderDateStr}-${randomSuffix}`;

    const estimatedMinutes = session.estimatedDeliveryMinutes || 30;
    const estimatedDeliveryAt = new Date(Date.now() + estimatedMinutes * 60000);

    const paymentStatus = PaymentStatus.PENDING;
    const paymentGatewayStatus = PaymentGatewayStatus.INITIATED;

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Atomically verify and transition active cart to prevent double-checkout race conditions
      const updatedCart = await tx.cart.updateMany({
        where: { id: session.cartId, status: CartStatus.ACTIVE },
        data: { status: CartStatus.CHECKED_OUT },
      });

      if (updatedCart.count === 0) {
        throw new BadRequestException('Cart has already been checked out or order already placed');
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerUserId: userId,
          restaurantId: cart.branch.restaurantId,
          branchId: cart.branch.id,
          checkoutSessionId: session.id,
          orderStatus: OrderStatus.PLACED,
          paymentStatus,
          subtotalAmount: breakdown.subtotal,
          discountAmount: breakdown.discountAmount,
          deliveryFee: breakdown.deliveryFee,
          taxAmount: breakdown.taxAmount,
          totalAmount: breakdown.totalAmount,
          estimatedDeliveryAt,
          otpHash: encryptedOtp,
        },
      });

      // 3. Create OrderItems and OrderItemModifiers
      for (const item of cart.items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: item.menuItemId,
            itemName: item.menuItem ? item.menuItem.name : 'Item',
            itemDescription: item.menuItem ? item.menuItem.description : null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            specialInstructions: item.specialInstructions || dto.specialInstructions || null,
          },
        });

        for (const mod of item.modifiers) {
          await tx.orderItemModifier.create({
            data: {
              orderItemId: orderItem.id,
              modifierName: mod.modifierOption?.modifierGroup?.name || 'Modifier',
              optionName: mod.modifierOption?.optionName || 'Option',
              additionalPrice: mod.additionalPrice || mod.modifierOption?.additionalPrice || 0,
            },
          });
        }
      }

      // 4. Create OrderAddress
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

      // 5. Create Payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          paymentProvider: dto.paymentProvider,
          amount: order.totalAmount,
          status: paymentGatewayStatus,
        },
      });

      // 6. Create OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PLACED,
          changedByUserId: userId,
          remarks: 'Order placed by customer',
        },
      });

      // 7. Coupon Usage
      if (session.couponId) {
        await tx.couponUsage.create({
          data: {
            couponId: session.couponId,
            customerUserId: userId,
            orderId: order.id,
            discountAmount: order.discountAmount,
          },
        });
      }

      return order;
    });

    const fullOrder = await this.prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        items: {
          include: {
            modifiers: true,
          },
        },
        address: true,
        branch: {
          select: {
            id: true,
            branchName: true,
            contactPhone: true,
            city: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
          },
        },
        payments: true,
        statusHistory: true,
      },
    });

    if (!fullOrder) {
      throw new NotFoundException('Failed to retrieve placed order');
    }

    const { otpHash, ...sanitized } = fullOrder;

    return {
      ...sanitized,
      otp: rawOtp,
    };
  }

  async getCustomerOrders(userId: bigint, page: number = 1, limit: number = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({
        where: { customerUserId: userId },
      }),
      this.prisma.order.findMany({
        where: { customerUserId: userId },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: {
            select: {
              id: true,
              branchName: true,
              city: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
            },
          },
          items: {
            include: {
              modifiers: true,
            },
          },
          address: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      orders: orders.map((o) => {
        const { otpHash, ...rest } = o;
        return rest;
      }),
    };
  }

  async getOrderDetails(orderId: bigint, userId: bigint, userRoles: string[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        branch: {
          include: {
            restaurant: true,
          },
        },
        restaurant: true,
        address: true,
        items: {
          include: {
            modifiers: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        deliveryAssignments: {
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        cancellation: true,
        payments: true,
        review: { select: { id: true, overallRating: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isAdmin = userRoles.includes('Admin');
    const isCustomer = order.customerUserId === userId;
    const isRestaurantOwner = order.restaurant.ownerUserId === userId;

    let isBranchStaff = false;
    if (!isAdmin && !isCustomer && !isRestaurantOwner) {
      const staff = await this.prisma.restaurantStaff.findFirst({
        where: {
          branchId: order.branchId,
          userId,
          status: StaffStatus.ACTIVE,
        },
      });
      isBranchStaff = !!staff;
    }

    const isAssignedDriver = order.deliveryAssignments.some(
      (a) => a.partnerUserId === userId,
    );

    if (!isAdmin && !isCustomer && !isRestaurantOwner && !isBranchStaff && !isAssignedDriver) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    const canSeeOtp = isCustomer || isAdmin;
    const { otpHash, ...rest } = order;
    const plainOtp = canSeeOtp && otpHash ? decryptOtp(otpHash) || undefined : undefined;

    return {
      ...rest,
      ...(plainOtp ? { otp: plainOtp } : {}),
    };
  }

  async getOrderTracking(orderId: bigint, userId: bigint, userRoles: string[] = []) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        branch: {
          include: {
            restaurant: true,
          },
        },
        address: true,
        items: {
          include: {
            modifiers: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
        deliveryAssignments: {
          where: {
            status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED, AssignmentStatus.COMPLETED] },
          },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: {
            partner: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true,
                  },
                },
              },
            },
            trackingPoints: {
              orderBy: { recordedAt: 'desc' },
              take: 1,
            },
          },
        },
        review: { select: { id: true, overallRating: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Strict Authorization Check: Customer, Admin, Restaurant Owner, Branch Staff, or Assigned Driver
    const isAdmin = userRoles.includes('Admin');
    const isCustomer = order.customerUserId === userId;
    const isRestaurantOwner = order.branch.restaurant.ownerUserId === userId;

    let isBranchStaff = false;
    if (!isAdmin && !isCustomer && !isRestaurantOwner) {
      const staff = await this.prisma.restaurantStaff.findFirst({
        where: {
          branchId: order.branchId,
          userId,
          status: StaffStatus.ACTIVE,
        },
      });
      isBranchStaff = !!staff;
    }

    const latestAssignment = order.deliveryAssignments[0];
    const isAssignedDriver = latestAssignment?.partnerUserId === userId;

    if (!isAdmin && !isCustomer && !isRestaurantOwner && !isBranchStaff && !isAssignedDriver) {
      throw new ForbiddenException('You do not have permission to track this order');
    }

    const partner = latestAssignment?.partner;
    const latestTracking = latestAssignment?.trackingPoints?.[0];

    const canSeeOtp = isCustomer || isAdmin;
    const plainOtp = canSeeOtp && order.otpHash ? decryptOtp(order.otpHash) || undefined : undefined;

    return {
      id: order.id.toString(),
      orderId: order.id.toString(),
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      subtotalAmount: Number(order.subtotalAmount),
      deliveryFee: Number(order.deliveryFee),
      taxAmount: Number(order.taxAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      estimatedDeliveryAt: order.estimatedDeliveryAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      restaurant: {
        id: order.branch.restaurant.id.toString(),
        businessName: order.branch.restaurant.businessName,
        logoUrl: order.branch.restaurant.logoUrl || undefined,
      },
      branch: {
        id: order.branch.id.toString(),
        branchName: order.branch.branchName,
        contactPhone: order.branch.contactPhone,
        addressLine1: order.branch.addressLine1,
        city: order.branch.city,
        latitude: order.branch.latitude,
        longitude: order.branch.longitude,
      },
      items: order.items.map((item) => ({
        id: item.id.toString(),
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        specialInstructions: item.specialInstructions || undefined,
        modifiers: item.modifiers.map((mod) => ({
          id: mod.id.toString(),
          optionName: mod.optionName,
          additionalPrice: Number(mod.additionalPrice),
        })),
      })),
      statusHistory: order.statusHistory.map((sh) => ({
        id: sh.id.toString(),
        status: sh.status,
        remarks: sh.remarks || undefined,
        createdAt: sh.createdAt,
      })),
      deliveryAddress: order.address
        ? {
            recipientName: order.address.recipientName,
            recipientPhone: order.address.recipientPhone,
            addressLine1: order.address.addressLine1,
            addressLine2: order.address.addressLine2,
            city: order.address.city,
            latitude: order.address.latitude,
            longitude: order.address.longitude,
          }
        : null,
      driver: partner
        ? {
            name: `${partner.user.firstName} ${partner.user.lastName || ''}`.trim(),
            phone: partner.user.phone,
            vehicleType: partner.vehicleType,
          }
        : null,
      assignedDeliveryPartner: partner
        ? {
            name: `${partner.user.firstName} ${partner.user.lastName || ''}`.trim(),
            phone: partner.user.phone,
            vehicleType: partner.vehicleType,
            vehicleRegistrationNumber: partner.vehicleRegistrationNumber,
            averageRating: partner.averageRating,
            assignmentStatus: latestAssignment.status,
            currentLocation: latestTracking
              ? {
                  latitude: latestTracking.latitude,
                  longitude: latestTracking.longitude,
                  recordedAt: latestTracking.recordedAt,
                }
              : null,
          }
        : null,
      review: order.review
        ? {
            id: order.review.id.toString(),
            overallRating: Number(order.review.overallRating),
          }
        : null,
      ...(plainOtp ? { otp: plainOtp } : {}),
    };
  }

  async cancelOrder(orderId: bigint, userId: bigint, userRoles: string[], reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryAssignments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isAdmin = userRoles.includes('Admin');
    const isCustomer = order.customerUserId === userId;

    if (!isAdmin && !isCustomer) {
      throw new ForbiddenException('You do not have permission to cancel this order');
    }

    if (isCustomer && !isAdmin) {
      if (order.orderStatus !== OrderStatus.PLACED) {
        throw new BadRequestException('Order can only be cancelled while in PLACED status');
      }
    }

    if (order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Order cannot be cancelled in status ${order.orderStatus}`);
    }

    const isPaid = order.paymentStatus === PaymentStatus.PAID;

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.CANCELLED,
        },
      });

      await tx.orderCancellation.create({
        data: {
          orderId,
          cancelledByUserId: userId,
          cancellationReason: reason,
          refundEligible: isPaid,
          refundAmount: isPaid ? order.totalAmount : null,
        },
      });

      if (isPaid) {
        const payment = await tx.payment.findFirst({
          where: { orderId, status: PaymentGatewayStatus.CAPTURED },
          orderBy: { createdAt: 'desc' },
        });
        if (payment && payment.paymentProvider !== PaymentProvider.COD) {
          await tx.refund.create({
            data: {
              paymentId: payment.id,
              orderId,
              refundReference: `REF-${Date.now()}-${orderId}`,
              amount: order.totalAmount,
              reason: `Customer cancelled order: ${reason}`,
              status: RefundStatus.INITIATED,
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.CANCELLED,
          changedByUserId: userId,
          remarks: `Order cancelled. Reason: ${reason}`,
        },
      });

      await tx.deliveryAssignment.updateMany({
        where: {
          orderId,
          status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.PENDING] },
        },
        data: {
          status: AssignmentStatus.DECLINED,
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  // -------------------------------------------------------------
  // Kitchen Staff & Owner Workflow
  // -------------------------------------------------------------
  async getBranchOrders(
    ownerOrStaffUserId: bigint,
    userRoles: string[],
    query: GetOrdersQueryDto,
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const isAdmin = userRoles.includes('Admin');
    let branchFilter: any = {};

    if (!isAdmin) {
      const [ownedRestaurants, staffPositions] = await Promise.all([
        this.prisma.restaurant.findMany({
          where: { ownerUserId: ownerOrStaffUserId },
          select: { branches: { select: { id: true } } },
        }),
        this.prisma.restaurantStaff.findMany({
          where: {
            userId: ownerOrStaffUserId,
            status: StaffStatus.ACTIVE,
          },
          select: { branchId: true },
        }),
      ]);

      const ownedBranchIds = ownedRestaurants.flatMap((r) => r.branches.map((b) => b.id));
      const staffBranchIds = staffPositions.map((s) => s.branchId);
      const accessibleBranchIds = Array.from(new Set([...ownedBranchIds, ...staffBranchIds]));

      if (accessibleBranchIds.length === 0) {
        return {
          total: 0,
          page,
          limit,
          totalPages: 0,
          orders: [],
        };
      }

      if (query.branchId) {
        const requestedBranchId = BigInt(query.branchId);
        if (!accessibleBranchIds.some((id) => id === requestedBranchId)) {
          throw new ForbiddenException('You do not have access to this branch');
        }
        branchFilter = { branchId: requestedBranchId };
      } else {
        branchFilter = { branchId: { in: accessibleBranchIds } };
      }
    } else if (query.branchId) {
      branchFilter = { branchId: BigInt(query.branchId) };
    }

    const where: any = {
      ...branchFilter,
    };

    if (query.status) {
      where.orderStatus = query.status;
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          branch: {
            select: {
              id: true,
              branchName: true,
            },
          },
          items: {
            include: {
              modifiers: true,
            },
          },
          address: true,
          deliveryAssignments: {
            include: {
              partner: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      orders: orders.map((o) => {
        const { otpHash, ...rest } = o;
        return rest;
      }),
    };
  }

  async acceptOrder(orderId: bigint, staffUserId: bigint, userRoles: string[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.verifyStaffPermission(order.branchId, staffUserId, userRoles);

    if (order.orderStatus !== OrderStatus.PLACED) {
      throw new BadRequestException(`Cannot accept order with status ${order.orderStatus}`);
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.ACCEPTED,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.ACCEPTED,
          changedByUserId: staffUserId,
          remarks: 'Order accepted by kitchen staff',
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async rejectOrder(orderId: bigint, staffUserId: bigint, userRoles: string[], reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.verifyStaffPermission(order.branchId, staffUserId, userRoles);

    if (order.orderStatus !== OrderStatus.PLACED) {
      throw new BadRequestException(`Cannot reject order with status ${order.orderStatus}`);
    }

    const isPaid = order.paymentStatus === PaymentStatus.PAID;

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.REJECTED,
        },
      });

      await tx.orderCancellation.create({
        data: {
          orderId,
          cancelledByUserId: staffUserId,
          cancellationReason: reason,
          refundEligible: isPaid,
          refundAmount: isPaid ? order.totalAmount : null,
        },
      });

      if (isPaid) {
        const payment = await tx.payment.findFirst({
          where: { orderId, status: PaymentGatewayStatus.CAPTURED },
          orderBy: { createdAt: 'desc' },
        });
        if (payment && payment.paymentProvider !== PaymentProvider.COD) {
          await tx.refund.create({
            data: {
              paymentId: payment.id,
              orderId,
              refundReference: `REF-${Date.now()}-${orderId}`,
              amount: order.totalAmount,
              reason: `Restaurant rejected order: ${reason}`,
              status: RefundStatus.INITIATED,
            },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.REJECTED,
          changedByUserId: staffUserId,
          remarks: `Order rejected by restaurant. Reason: ${reason}`,
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async markPreparing(orderId: bigint, staffUserId: bigint, userRoles: string[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.verifyStaffPermission(order.branchId, staffUserId, userRoles);

    if (order.orderStatus !== OrderStatus.ACCEPTED) {
      throw new BadRequestException(`Cannot mark preparing for order with status ${order.orderStatus}`);
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.PREPARING,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.PREPARING,
          changedByUserId: staffUserId,
          remarks: 'Order is being prepared in the kitchen',
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async markReady(orderId: bigint, staffUserId: bigint, userRoles: string[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.verifyStaffPermission(order.branchId, staffUserId, userRoles);

    if (order.orderStatus !== OrderStatus.PREPARING) {
      throw new BadRequestException(`Cannot mark ready for order with status ${order.orderStatus}`);
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.READY_FOR_PICKUP,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.READY_FOR_PICKUP,
          changedByUserId: staffUserId,
          remarks: 'Order is ready for pickup',
        },
      });

      return updated;
    });

    const assignment = await this.autoAssignDeliveryPartner(orderId, staffUserId);

    return {
      ...updatedOrder,
      deliveryAssignment: assignment,
    };
  }

  async handoverOrder(orderId: bigint, staffUserId: bigint, userRoles: string[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.verifyStaffPermission(order.branchId, staffUserId, userRoles);

    if (order.orderStatus !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(`Cannot handover order with status ${order.orderStatus}`);
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.PICKED_UP,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.PICKED_UP,
          changedByUserId: staffUserId,
          remarks: 'Order handed over to delivery partner',
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  // -------------------------------------------------------------
  // Delivery Partner Workflow
  // -------------------------------------------------------------
  async acceptAssignment(assignmentId: bigint, partnerUserId: bigint) {
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        order: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }

    if (assignment.partnerUserId !== partnerUserId) {
      throw new ForbiddenException('This assignment is not assigned to you');
    }

    if (assignment.status !== AssignmentStatus.ASSIGNED) {
      throw new BadRequestException(`Cannot accept assignment in status ${assignment.status}`);
    }

    // Exclude otpHash completely from the returned assignment's order to prevent OTP leak to rider
    const updatedAssignment = await this.prisma.deliveryAssignment.update({
      where: { id: assignmentId },
      data: {
        status: AssignmentStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderStatus: true,
            paymentStatus: true,
            subtotalAmount: true,
            deliveryFee: true,
            taxAmount: true,
            totalAmount: true,
            estimatedDeliveryAt: true,
            branch: {
              select: {
                id: true,
                branchName: true,
                contactPhone: true,
                addressLine1: true,
                city: true,
              },
            },
            address: true,
            items: {
              select: {
                id: true,
                itemName: true,
                quantity: true,
                unitPrice: true,
                lineTotal: true,
                specialInstructions: true,
              },
            },
          },
        },
      },
    });

    return updatedAssignment;
  }

  async declineAssignment(assignmentId: bigint, partnerUserId: bigint, reason?: string) {
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }

    if (assignment.partnerUserId !== partnerUserId) {
      throw new ForbiddenException('This assignment is not assigned to you');
    }

    if (assignment.status !== AssignmentStatus.ASSIGNED) {
      throw new BadRequestException(`Cannot decline assignment in status ${assignment.status}`);
    }

    await this.prisma.deliveryAssignment.update({
      where: { id: assignmentId },
      data: {
        status: AssignmentStatus.DECLINED,
      },
    });

    const declinedCount = await this.prisma.deliveryAssignment.count({
      where: {
        orderId: assignment.orderId,
        status: AssignmentStatus.DECLINED,
      },
    });

    if (declinedCount >= 2) {
      await this.prisma.deliveryEvent.create({
        data: {
          orderId: assignment.orderId,
          partnerUserId,
          eventType: 'DELIVERY_ESCALATION_FLEET_MANAGER',
          eventData: {
            reason: reason || 'Declined by multiple delivery partners',
            declinedCount,
            assignmentId: assignment.id.toString(),
          },
        },
      });
      return {
        message: 'Assignment declined. Order escalated to Fleet Manager.',
        declinedCount,
        escalated: true,
      };
    } else {
      const nextAssignment = await this.autoAssignDeliveryPartner(assignment.orderId);
      return {
        message: 'Assignment declined. Next available partner notified.',
        declinedCount,
        escalated: false,
        reassigned: !!nextAssignment,
      };
    }
  }

  async markOutForDelivery(orderId: bigint, partnerUserId: bigint) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryAssignments: {
          where: {
            partnerUserId,
            status: AssignmentStatus.ACCEPTED,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.deliveryAssignments.length === 0) {
      throw new ForbiddenException('You are not the assigned delivery partner for this order');
    }

    if (order.orderStatus !== OrderStatus.PICKED_UP && order.orderStatus !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException(`Cannot mark out for delivery from status ${order.orderStatus}`);
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.OUT_FOR_DELIVERY,
          changedByUserId: partnerUserId,
          remarks: 'Delivery partner is out for delivery',
        },
      });

      return updated;
    });

    return updatedOrder;
  }

  async verifyAndDeliver(orderId: bigint, partnerUserId: bigint, otp: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryAssignments: {
          where: {
            partnerUserId,
            status: AssignmentStatus.ACCEPTED,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.deliveryAssignments.length === 0) {
      throw new ForbiddenException('You are not the assigned delivery partner for this order');
    }

    if (order.orderStatus !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException(`Cannot mark delivered from status ${order.orderStatus}`);
    }

    if (!order.otpHash) {
      throw new BadRequestException('No delivery OTP associated with this order');
    }

    const expectedOtp = decryptOtp(order.otpHash);
    if (!expectedOtp || expectedOtp !== otp.trim()) {
      throw new BadRequestException('Invalid delivery OTP');
    }

    const now = new Date();
    const assignment = order.deliveryAssignments[0];

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: OrderStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          deliveredAt: now,
        },
      });

      // Capture pending or COD payment upon verified delivery
      const pendingPayment = await tx.payment.findFirst({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
      });
      if (pendingPayment && pendingPayment.status !== PaymentGatewayStatus.CAPTURED) {
        const providerPaymentId = pendingPayment.providerPaymentId || `COD_${now.getTime()}_${orderId}`;
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: {
            status: PaymentGatewayStatus.CAPTURED,
            providerPaymentId,
          },
        });

        await tx.financialTransaction.create({
          data: {
            transactionId: providerPaymentId,
            amount: pendingPayment.amount,
            currency: pendingPayment.currency,
            gatewayResponseCode: 'CASH_COLLECTED',
            status: 'COMPLETED',
            referenceType: 'PAYMENT',
            referenceId: pendingPayment.id,
          },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: pendingPayment.id,
            eventType: 'PAYMENT_CAPTURED_ON_DELIVERY',
            payload: {
              orderId: orderId.toString(),
              providerPaymentId,
              amount: Number(pendingPayment.amount),
            },
          },
        });
      }

      if (assignment) {
        await tx.deliveryAssignment.update({
          where: { id: assignment.id },
          data: {
            status: AssignmentStatus.COMPLETED,
            completedAt: now,
          },
        });
      }

      await tx.deliveryPartner.update({
        where: { userId: partnerUserId },
        data: {
          totalCompletedDeliveries: { increment: 1 },
        },
      });

      // Automatically credit partner earnings upon verified delivery
      const baseEarning = Number(order.deliveryFee) > 0 ? order.deliveryFee : 50;
      await tx.partnerEarning.create({
        data: {
          partnerUserId,
          orderId,
          baseEarning,
          incentiveAmount: 0,
          tipAmount: 0,
          totalEarning: baseEarning,
          status: 'PAYABLE',
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.DELIVERED,
          changedByUserId: partnerUserId,
          remarks: 'Order delivered successfully after OTP verification',
        },
      });

      return updated;
    });

    return updatedOrder;
  }
}
