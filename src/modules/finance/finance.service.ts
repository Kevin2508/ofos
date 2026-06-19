import { FinanceRepository } from './finance.repository.ts';
import { PayoutStatus, RefundStatus } from '@prisma/client';

export class FinanceService {
  private repository: FinanceRepository;

  constructor() {
    this.repository = new FinanceRepository();
  }

  async getOverviewStats() {
    const totalOrders = await this.repository.getTotalPaidOrdersCount();
    const totalRevenue = await this.repository.getTotalCapturedRevenue();
    const totalRefunds = await this.repository.getTotalCompletedRefunds();
    const totalPendingRestaurant = await this.repository.getTotalPendingRestaurantPayouts();
    const totalPendingPartner = await this.repository.getTotalPendingPartnerPayouts();

    return {
      totalOrders,
      totalRevenue,
      totalRefunds,
      totalPendingPayouts: totalPendingRestaurant + totalPendingPartner
    };
  }

  async getFormattedRestaurantPayouts() {
    const payouts = await this.repository.getRestaurantPayouts();
    return payouts.map(p => ({
      ...p,
      id: p.id.toString(),
      restaurantId: p.restaurantId.toString(),
      grossAmount: Number(p.grossAmount),
      commissionAmount: Number(p.commissionAmount),
      taxAmount: Number(p.taxAmount),
      netAmount: Number(p.netAmount)
    }));
  }

  async updateRestaurantPayout(id: string, status: PayoutStatus) {
    const payout = await this.repository.updateRestaurantPayoutStatus(BigInt(id), status);
    return {
      ...payout,
      id: payout.id.toString(),
      restaurantId: payout.restaurantId.toString(),
      grossAmount: Number(payout.grossAmount),
      commissionAmount: Number(payout.commissionAmount),
      taxAmount: Number(payout.taxAmount),
      netAmount: Number(payout.netAmount)
    };
  }

  async getFormattedPartnerPayouts() {
    const payouts = await this.repository.getPartnerPayouts();
    return payouts.map(p => ({
      ...p,
      id: p.id.toString(),
      partnerUserId: p.partnerUserId.toString(),
      grossAmount: Number(p.grossAmount),
      incentiveAmount: Number(p.incentiveAmount),
      netAmount: Number(p.netAmount)
    }));
  }

  async updatePartnerPayout(id: string, status: PayoutStatus) {
    const payout = await this.repository.updatePartnerPayoutStatus(BigInt(id), status);
    return {
      ...payout,
      id: payout.id.toString(),
      partnerUserId: payout.partnerUserId.toString(),
      grossAmount: Number(payout.grossAmount),
      incentiveAmount: Number(payout.incentiveAmount),
      netAmount: Number(payout.netAmount)
    };
  }

  async getFormattedRefunds() {
    const refunds = await this.repository.getRefunds();
    return refunds.map(r => ({
      ...r,
      id: r.id.toString(),
      paymentId: r.paymentId.toString(),
      orderId: r.orderId.toString(),
      amount: Number(r.amount)
    }));
  }

  async updateRefund(id: string, status: RefundStatus) {
    const refund = await this.repository.updateRefundStatus(BigInt(id), status);
    return {
      ...refund,
      id: refund.id.toString(),
      paymentId: refund.paymentId.toString(),
      orderId: refund.orderId.toString(),
      amount: Number(refund.amount)
    };
  }
}
