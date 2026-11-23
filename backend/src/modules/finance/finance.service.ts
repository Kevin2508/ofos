import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayoutStatus, RefundStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateRefundDto,
  FinanceQueryDto,
  UpdatePayoutStatusDto,
  UpdateRefundStatusDto,
} from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const totalOrders = await this.prisma.order.count({
      where: { paymentStatus: 'PAID' },
    });

    const revenueAgg = await this.prisma.payment.aggregate({
      where: { status: 'CAPTURED' },
      _sum: { amount: true },
    });
    const totalRevenue = Number(revenueAgg._sum.amount) || 0;

    const refundsAgg = await this.prisma.refund.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRefunds = Number(refundsAgg._sum.amount) || 0;

    const pendingRestAgg = await this.prisma.restaurantPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { netAmount: true },
    });
    const totalPendingRestaurant = Number(pendingRestAgg._sum.netAmount) || 0;

    const pendingPartnerAgg = await this.prisma.partnerPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { netAmount: true },
    });
    const totalPendingPartner = Number(pendingPartnerAgg._sum.netAmount) || 0;

    return {
      totalOrders,
      totalRevenue,
      totalRefunds,
      totalPendingRestaurantPayouts: totalPendingRestaurant,
      totalPendingPartnerPayouts: totalPendingPartner,
      totalPendingPayouts: totalPendingRestaurant + totalPendingPartner,
    };
  }

  async getRefunds(query: FinanceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && Object.values(RefundStatus).includes(query.status as any)) {
      where.status = query.status as RefundStatus;
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              orderStatus: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          payment: {
            select: {
              id: true,
              paymentProvider: true,
              providerPaymentId: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.refund.count({ where }),
    ]);

    return {
      data: refunds.map((r) => ({
        id: r.id.toString(),
        orderId: r.orderId.toString(),
        orderNumber: r.order.orderNumber,
        customerName: `${r.order.customer.firstName} ${r.order.customer.lastName || ''}`.trim(),
        customerEmail: r.order.customer.email,
        paymentId: r.paymentId.toString(),
        paymentProvider: r.payment.paymentProvider,
        refundReference: r.refundReference,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createRefund(dto: CreateRefundDto) {
    const orderId = BigInt(dto.orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        cancellation: true,
        payments: {
          where: { status: 'CAPTURED' },
          orderBy: { createdAt: 'desc' },
        },
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'REJECTED') {
      throw new BadRequestException('Refund can only be initiated for cancelled or rejected orders');
    }

    if (order.refunds.length > 0) {
      throw new BadRequestException('Refund has already been initiated for this order');
    }

    const payment = order.payments[0];
    if (!payment) {
      throw new BadRequestException('No captured online payment found for this order');
    }

    if (payment.paymentProvider === 'COD') {
      throw new BadRequestException('Refund cannot be initiated for Cash on Delivery orders');
    }

    const refundAmount = order.cancellation?.refundAmount || order.totalAmount;
    const refundReference = `REF-${Date.now()}-${order.id}`;

    const refund = await this.prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: order.id,
        refundReference,
        amount: refundAmount,
        reason: dto.reason,
        status: RefundStatus.INITIATED,
      },
    });

    return {
      message: 'Refund initiated successfully',
      data: {
        id: refund.id.toString(),
        orderId: refund.orderId.toString(),
        refundReference: refund.refundReference,
        amount: Number(refund.amount),
        reason: refund.reason,
        status: refund.status,
        createdAt: refund.createdAt,
      },
    };
  }

  async updateRefundStatus(idParam: number, dto: UpdateRefundStatusDto) {
    const id = BigInt(idParam);

    const refund = await this.prisma.refund.findUnique({
      where: { id },
    });

    if (!refund) {
      throw new NotFoundException('Refund record not found');
    }

    if (refund.status === RefundStatus.COMPLETED) {
      throw new BadRequestException('Completed refunds cannot be modified');
    }

    if (refund.status === RefundStatus.FAILED) {
      throw new BadRequestException('Failed refunds cannot be modified');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.refund.update({
        where: { id },
        data: { status: dto.status },
      });

      // Synchronize order and payment status upon completion
      if (dto.status === RefundStatus.COMPLETED) {
        await tx.order.update({
          where: { id: refund.orderId },
          data: { paymentStatus: 'REFUNDED' },
        });

        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { status: 'REFUNDED' },
        });

        await tx.financialTransaction.create({
          data: {
            transactionId: res.refundReference,
            amount: res.amount,
            currency: 'INR',
            gatewayResponseCode: dto.status,
            status: 'COMPLETED',
            referenceType: 'REFUND',
            referenceId: res.id,
          },
        });
      } else if (dto.status === RefundStatus.FAILED) {
        await tx.financialTransaction.create({
          data: {
            transactionId: res.refundReference,
            amount: res.amount,
            currency: 'INR',
            gatewayResponseCode: dto.status,
            status: 'FAILED',
            referenceType: 'REFUND',
            referenceId: res.id,
          },
        });
      }

      return res;
    });

    return {
      message: `Refund status updated to ${updated.status}`,
      data: {
        id: updated.id.toString(),
        orderId: updated.orderId.toString(),
        refundReference: updated.refundReference,
        amount: Number(updated.amount),
        status: updated.status,
      },
    };
  }

  async getRestaurantPayouts(query: FinanceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && Object.values(PayoutStatus).includes(query.status as any)) {
      where.status = query.status as PayoutStatus;
    }

    const [payouts, total] = await Promise.all([
      this.prisma.restaurantPayout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: {
              id: true,
              businessName: true,
              primaryEmail: true,
              bankAccountName: true,
              bankAccountNumber: true,
              bankIfscCode: true,
            },
          },
          items: true,
        },
      }),
      this.prisma.restaurantPayout.count({ where }),
    ]);

    return {
      data: payouts.map((p) => ({
        id: p.id.toString(),
        restaurantId: p.restaurantId.toString(),
        restaurantName: p.restaurant.businessName,
        bankAccountName: p.restaurant.bankAccountName,
        bankAccountNumber: p.restaurant.bankAccountNumber,
        bankIfscCode: p.restaurant.bankIfscCode,
        payoutReference: p.payoutReference,
        payoutPeriodStart: p.payoutPeriodStart,
        payoutPeriodEnd: p.payoutPeriodEnd,
        grossAmount: Number(p.grossAmount),
        commissionAmount: Number(p.commissionAmount),
        taxAmount: Number(p.taxAmount),
        netAmount: Number(p.netAmount),
        status: p.status,
        paidAt: p.paidAt,
        itemsCount: p.items.length,
        createdAt: p.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateRestaurantPayoutStatus(idParam: number, dto: UpdatePayoutStatusDto) {
    const id = BigInt(idParam);

    const payout = await this.prisma.restaurantPayout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Restaurant payout record not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.restaurantPayout.update({
        where: { id },
        data: {
          status: dto.status,
          paidAt: dto.status === PayoutStatus.PAID ? new Date() : payout.paidAt,
        },
      });

      if (dto.status === PayoutStatus.PAID && payout.status !== PayoutStatus.PAID) {
        await tx.financialTransaction.create({
          data: {
            transactionId: res.payoutReference,
            amount: res.netAmount,
            currency: 'INR',
            gatewayResponseCode: 'SUCCESS',
            status: 'COMPLETED',
            referenceType: 'PAYOUT',
            referenceId: res.id,
          },
        });
      }

      return res;
    });

    return {
      message: `Restaurant payout status updated to ${updated.status}`,
      data: {
        id: updated.id.toString(),
        restaurantId: updated.restaurantId.toString(),
        netAmount: Number(updated.netAmount),
        status: updated.status,
        paidAt: updated.paidAt,
      },
    };
  }

  async processWeeklyRestaurantPayouts() {
    const defaultCommissionRate = 10.0;

    const unpayoutedOrders = await this.prisma.order.findMany({
      where: {
        orderStatus: 'DELIVERED',
        paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
        restaurantPayoutItems: { none: {} },
      },
      include: {
        restaurant: {
          select: { id: true, commissionRate: true },
        },
        refunds: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (unpayoutedOrders.length === 0) {
      return {
        message: 'No eligible unpayouted delivered orders found',
        processedCount: 0,
      };
    }

    const restaurantOrders = new Map<bigint, any[]>();
    for (const order of unpayoutedOrders) {
      if (!restaurantOrders.has(order.restaurantId)) {
        restaurantOrders.set(order.restaurantId, []);
      }
      restaurantOrders.get(order.restaurantId)!.push(order);
    }

    let processedCount = 0;
    const payoutRecords: any[] = [];

    for (const [restaurantId, orders] of restaurantOrders.entries()) {
      await this.prisma.$transaction(async (tx) => {
        // Concurrency guard: re-verify inside transaction that orders have not already been payouted
        const eligibleOrders: any[] = [];
        for (const order of orders) {
          const alreadyClaimed = await tx.restaurantPayoutItem.findFirst({
            where: { orderId: order.id },
          });
          if (!alreadyClaimed) {
            eligibleOrders.push(order);
          }
        }

        if (eligibleOrders.length === 0) return;

        let totalGross = 0;
        let totalCommission = 0;
        let totalTax = 0;
        let totalRefunds = 0;
        const itemShares: { orderId: bigint; share: number }[] = [];

        for (const order of eligibleOrders) {
          const subtotal = Number(order.subtotalAmount);
          const commissionRate = order.restaurant.commissionRate
            ? Number(order.restaurant.commissionRate)
            : defaultCommissionRate;
          const commission = subtotal * (commissionRate / 100);
          const tax = Number(order.taxAmount);
          const orderRefunds = order.refunds.reduce(
            (sum: number, r: any) => sum + Number(r.amount),
            0,
          );
          const share = Math.max(0, subtotal - commission + tax - orderRefunds);

          totalGross += subtotal;
          totalCommission += commission;
          totalTax += tax;
          totalRefunds += orderRefunds;
          itemShares.push({ orderId: order.id, share });
        }

        const netAmount = Math.max(0, totalGross - totalCommission + totalTax - totalRefunds);
        const payoutReference = `REST-PAY-${Date.now()}-${restaurantId}`;

        const payout = await tx.restaurantPayout.create({
          data: {
            restaurantId,
            payoutReference,
            payoutPeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            payoutPeriodEnd: new Date(),
            grossAmount: totalGross,
            commissionAmount: totalCommission,
            taxAmount: totalTax,
            netAmount,
            status: PayoutStatus.PAID,
            paidAt: new Date(),
          },
        });

        for (const item of itemShares) {
          await tx.restaurantPayoutItem.create({
            data: {
              payoutId: payout.id,
              orderId: item.orderId,
              restaurantShare: item.share,
            },
          });
        }

        await tx.financialTransaction.create({
          data: {
            transactionId: payout.payoutReference,
            amount: payout.netAmount,
            currency: 'INR',
            gatewayResponseCode: 'SUCCESS',
            status: 'COMPLETED',
            referenceType: 'PAYOUT',
            referenceId: payout.id,
          },
        });

        payoutRecords.push({
          id: payout.id.toString(),
          restaurantId: restaurantId.toString(),
          netAmount: Number(payout.netAmount),
          payoutReference: payout.payoutReference,
        });
      });

      processedCount++;
    }

    return {
      message: `Processed ${processedCount} restaurant payouts successfully`,
      processedCount,
      payouts: payoutRecords,
    };
  }

  async getPartnerPayouts(query: FinanceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && Object.values(PayoutStatus).includes(query.status as any)) {
      where.status = query.status as PayoutStatus;
    }

    const [payouts, total] = await Promise.all([
      this.prisma.partnerPayout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          partner: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          items: true,
        },
      }),
      this.prisma.partnerPayout.count({ where }),
    ]);

    return {
      data: payouts.map((p) => ({
        id: p.id.toString(),
        partnerUserId: p.partnerUserId.toString(),
        partnerName: `${p.partner.user.firstName} ${p.partner.user.lastName || ''}`.trim(),
        partnerPhone: p.partner.user.phone,
        payoutReference: p.payoutReference,
        grossAmount: Number(p.grossAmount),
        incentiveAmount: Number(p.incentiveAmount),
        netAmount: Number(p.netAmount),
        status: p.status,
        paidAt: p.paidAt,
        itemsCount: p.items.length,
        createdAt: p.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updatePartnerPayoutStatus(idParam: number, dto: UpdatePayoutStatusDto) {
    const id = BigInt(idParam);

    const payout = await this.prisma.partnerPayout.findUnique({
      where: { id },
    });

    if (!payout) {
      throw new NotFoundException('Partner payout record not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.partnerPayout.update({
        where: { id },
        data: {
          status: dto.status,
          paidAt: dto.status === PayoutStatus.PAID ? new Date() : payout.paidAt,
        },
      });

      if (dto.status === PayoutStatus.PAID && payout.status !== PayoutStatus.PAID) {
        await tx.financialTransaction.create({
          data: {
            transactionId: res.payoutReference,
            amount: res.netAmount,
            currency: 'INR',
            gatewayResponseCode: 'SUCCESS',
            status: 'COMPLETED',
            referenceType: 'PAYOUT',
            referenceId: res.id,
          },
        });
      }

      return res;
    });

    return {
      message: `Partner payout status updated to ${updated.status}`,
      data: {
        id: updated.id.toString(),
        partnerUserId: updated.partnerUserId.toString(),
        netAmount: Number(updated.netAmount),
        status: updated.status,
        paidAt: updated.paidAt,
      },
    };
  }

  async processWeeklyPartnerPayouts() {
    const pendingEarnings = await this.prisma.partnerEarning.findMany({
      where: {
        status: { in: ['PENDING', 'PAYABLE'] },
      },
    });

    if (pendingEarnings.length === 0) {
      return {
        message: 'No pending or payable partner earnings found',
        processedCount: 0,
      };
    }

    const partnerTotals = new Map<bigint, { amount: number; earnings: bigint[] }>();

    pendingEarnings.forEach((e) => {
      const uId = e.partnerUserId;
      if (!partnerTotals.has(uId)) {
        partnerTotals.set(uId, { amount: 0, earnings: [] });
      }
      const data = partnerTotals.get(uId)!;
      data.amount += Number(e.totalEarning);
      data.earnings.push(e.id);
    });

    let processedCount = 0;
    const payoutRecords: any[] = [];

    for (const [userId, data] of partnerTotals.entries()) {
      await this.prisma.$transaction(async (tx) => {
        const payoutReference = `PARTNER-PAY-${Date.now()}-${userId}`;

        const payout = await tx.partnerPayout.create({
          data: {
            partnerUserId: userId,
            payoutReference,
            grossAmount: data.amount,
            incentiveAmount: 0,
            netAmount: data.amount,
            status: PayoutStatus.PAID,
            paidAt: new Date(),
          },
        });

        await tx.partnerEarning.updateMany({
          where: { id: { in: data.earnings } },
          data: { status: 'PAID' },
        });

        for (const earningId of data.earnings) {
          await tx.partnerPayoutItem.create({
            data: {
              payoutId: payout.id,
              earningId,
            },
          });
        }

        await tx.financialTransaction.create({
          data: {
            transactionId: payout.payoutReference,
            amount: payout.netAmount,
            currency: 'INR',
            gatewayResponseCode: 'SUCCESS',
            status: 'COMPLETED',
            referenceType: 'PAYOUT',
            referenceId: payout.id,
          },
        });

        payoutRecords.push({
          id: payout.id.toString(),
          partnerUserId: userId.toString(),
          netAmount: Number(payout.netAmount),
          payoutReference: payout.payoutReference,
        });
      });

      processedCount++;
    }

    return {
      message: `Processed ${processedCount} weekly partner payouts successfully`,
      processedCount,
      payouts: payoutRecords,
    };
  }
}
