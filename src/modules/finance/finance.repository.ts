import { prisma } from '../../config/prisma.ts';
import { PartnerPayout, Refund, RestaurantPayout, PayoutStatus, RefundStatus } from '@prisma/client';

export class FinanceRepository {
  async getTotalPaidOrdersCount(): Promise<number> {
    return prisma.order.count({ where: { paymentStatus: 'PAID' } });
  }

  async getTotalCapturedRevenue(): Promise<number> {
    const payments = await prisma.payment.aggregate({
      where: { status: 'CAPTURED' },
      _sum: { amount: true }
    });
    return Number(payments._sum.amount) || 0;
  }

  async getTotalCompletedRefunds(): Promise<number> {
    const refunds = await prisma.refund.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    });
    return Number(refunds._sum.amount) || 0;
  }

  async getTotalPendingRestaurantPayouts(): Promise<number> {
    const pendingRestaurantPayouts = await prisma.restaurantPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { netAmount: true }
    });
    return Number(pendingRestaurantPayouts._sum.netAmount) || 0;
  }

  async getTotalPendingPartnerPayouts(): Promise<number> {
    const pendingPartnerPayouts = await prisma.partnerPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { netAmount: true }
    });
    return Number(pendingPartnerPayouts._sum.netAmount) || 0;
  }

  async getRestaurantPayouts() {
    return prisma.restaurantPayout.findMany({
      include: {
        restaurant: {
          select: { businessName: true, id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateRestaurantPayoutStatus(id: bigint, status: PayoutStatus): Promise<RestaurantPayout> {
    return prisma.restaurantPayout.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' ? { paidAt: new Date() } : {})
      }
    });
  }

  async getPartnerPayouts(): Promise<PartnerPayout[]> {
    return prisma.partnerPayout.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async updatePartnerPayoutStatus(id: bigint, status: PayoutStatus): Promise<PartnerPayout> {
    return prisma.partnerPayout.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' ? { paidAt: new Date() } : {})
      }
    });
  }

  async getRefunds(): Promise<Refund[]> {
    return prisma.refund.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async processWeeklyPartnerPayouts(): Promise<number> {
    const pendingEarnings = await prisma.partnerEarning.findMany({
      where: { status: 'PENDING' }
    });

    if (pendingEarnings.length === 0) return 0;

    const partnerTotals = new Map<bigint, { amount: number, earnings: bigint[] }>();
    
    pendingEarnings.forEach(e => {
      const uId = e.partnerUserId;
      if (!partnerTotals.has(uId)) {
        partnerTotals.set(uId, { amount: 0, earnings: [] });
      }
      const data = partnerTotals.get(uId)!;
      data.amount += Number(e.totalEarning);
      data.earnings.push(e.id);
    });

    let count = 0;
    for (const [userId, data] of partnerTotals.entries()) {
      await prisma.$transaction(async (tx) => {
        const payout = await tx.partnerPayout.create({
          data: {
            partnerUserId: userId,
            payoutReference: `PAY-${Date.now()}-${userId}`,
            grossAmount: data.amount,
            incentiveAmount: 0,
            netAmount: data.amount,
            status: 'PAID',
            paidAt: new Date()
          }
        });

        await tx.partnerEarning.updateMany({
          where: { id: { in: data.earnings } },
          data: { status: 'PAID' }
        });

        for (const earningId of data.earnings) {
           await tx.partnerPayoutItem.create({
             data: {
               payoutId: payout.id,
               earningId: earningId
             }
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
            referenceId: payout.id
          }
        });
      });
      console.log(`[SMS/PUSH NOTIFICATION] To Delivery Partner ${userId}: Your weekly payout of ₹${data.amount} has been processed and dispatched to your verified bank account!`);
      count++;
    }
    return count;
  }

  async updateRefundStatus(id: bigint, status: RefundStatus): Promise<Refund> {
    return prisma.$transaction(async (tx) => {
      const refund = await tx.refund.update({
        where: { id },
        data: { status }
      });

      if (status === 'COMPLETED' || status === 'FAILED') {
        await tx.financialTransaction.create({
          data: {
            transactionId: refund.refundReference || `REF-${id}-${Date.now()}`,
            amount: refund.amount,
            currency: 'INR',
            gatewayResponseCode: status,
            status: status,
            referenceType: 'REFUND',
            referenceId: refund.id
          }
        });
      }

      return refund;
    });
  }

  async processWeeklyRestaurantPayouts(): Promise<number> {
    const defaultCommissionRateStr = await prisma.systemConfiguration.findUnique({
      where: { configKey: 'PLATFORM_COMMISSION_PERCENTAGE' }
    });
    const defaultCommissionRate = defaultCommissionRateStr ? Number(defaultCommissionRateStr.configValue) : 10.0;

    const unpayoutedOrders = await prisma.order.findMany({
      where: {
        orderStatus: 'DELIVERED',
        paymentStatus: { in: ['PAID', 'PARTIALLY_REFUNDED'] },
        restaurantPayoutItems: { none: {} }
      },
      include: {
        restaurant: {
          select: { id: true, commissionRate: true }
        },
        refunds: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    if (unpayoutedOrders.length === 0) return 0;

    // Group orders by restaurantId
    const restaurantOrders = new Map<bigint, any[]>();
    for (const order of unpayoutedOrders) {
      if (!restaurantOrders.has(order.restaurantId)) {
        restaurantOrders.set(order.restaurantId, []);
      }
      restaurantOrders.get(order.restaurantId)!.push(order);
    }

    let count = 0;
    for (const [restaurantId, orders] of restaurantOrders.entries()) {
      await prisma.$transaction(async (tx) => {
        let totalGross = 0;
        let totalCommission = 0;
        let totalTax = 0;
        let totalRefunds = 0;
        
        for (const order of orders) {
          totalGross += Number(order.subtotalAmount);
          const commissionRate = order.restaurant.commissionRate ? Number(order.restaurant.commissionRate) : defaultCommissionRate;
          totalCommission += Number(order.subtotalAmount) * (commissionRate / 100);
          totalTax += Number(order.taxAmount);
          totalRefunds += order.refunds.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
        }

        const netAmount = totalGross - totalCommission + totalTax - totalRefunds;

        const payout = await tx.restaurantPayout.create({
          data: {
            restaurantId,
            payoutReference: `REST-PAY-${Date.now()}-${restaurantId}`,
            payoutPeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            payoutPeriodEnd: new Date(),
            grossAmount: totalGross,
            commissionAmount: totalCommission,
            taxAmount: totalTax,
            netAmount: netAmount,
            status: 'PAID',
            paidAt: new Date()
          }
        });

        for (const order of orders) {
           await tx.restaurantPayoutItem.create({
             data: {
               payoutId: payout.id,
               orderId: order.id,
               restaurantShare: Number(order.subtotalAmount) - (Number(order.subtotalAmount) * (order.restaurant.commissionRate ? Number(order.restaurant.commissionRate) : defaultCommissionRate) / 100)
             }
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
             referenceId: payout.id
           }
        });
      });
      console.log(`[SYSTEM] Processed weekly payout for Restaurant ${restaurantId}`);
      count++;
    }
    return count;
  }
}
