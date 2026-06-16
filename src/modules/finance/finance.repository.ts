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

  async updateRefundStatus(id: bigint, status: RefundStatus): Promise<Refund> {
    return prisma.refund.update({
      where: { id },
      data: { status }
    });
  }
}
