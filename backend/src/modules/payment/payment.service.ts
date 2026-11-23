import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentGatewayStatus, PaymentProvider, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(userId: bigint, dto: InitiatePaymentDto) {
    const orderId = BigInt(dto.orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerUserId !== userId) {
      throw new ForbiddenException('You do not have access to initiate payment for this order');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already PAID');
    }

    if (order.orderStatus === 'CANCELLED' || order.orderStatus === 'REJECTED') {
      throw new BadRequestException('Cannot initiate payment for a cancelled or rejected order');
    }

    if (
      order.paymentStatus === PaymentStatus.REFUNDED ||
      order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException('Cannot initiate payment for a refunded order');
    }

    // Check if an existing captured payment already exists
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        status: { in: [PaymentGatewayStatus.CAPTURED, PaymentGatewayStatus.AUTHORIZED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already completed or authorized for this order');
    }

    const providerOrderId = `ORD_${Date.now()}_${order.id}`;

    if (dto.paymentProvider === PaymentProvider.COD) {
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          paymentProvider: PaymentProvider.COD,
          providerOrderId: '',
          amount: order.totalAmount,
          status: PaymentGatewayStatus.INITIATED,
        },
      });

      return {
        message: 'Cash on delivery selected.',
        data: {
          paymentId: payment.id.toString(),
          orderId: payment.orderId.toString(),
          amount: Number(payment.amount),
          paymentProvider: payment.paymentProvider,
          status: payment.status,
        },
      };
    }

    // Razorpay or Stripe
    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        paymentProvider: dto.paymentProvider,
        providerOrderId,
        amount: order.totalAmount,
        status: PaymentGatewayStatus.INITIATED,
      },
    });

    return {
      message: 'Payment initiated successfully',
      data: {
        paymentId: payment.id.toString(),
        orderId: payment.orderId.toString(),
        providerOrderId,
        amount: Number(payment.amount),
        currency: payment.currency,
        paymentProvider: payment.paymentProvider,
        status: payment.status,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_ofos_mock_key',
      },
    };
  }

  async verifyPayment(userId: bigint, dto: VerifyPaymentDto) {
    const orderId = BigInt(dto.orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerUserId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const payment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        providerOrderId: dto.providerOrderId,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException('Matching payment session not found for this order');
    }

    if (payment.status === PaymentGatewayStatus.CAPTURED) {
      return {
        message: 'Payment already verified successfully',
        data: {
          id: payment.id.toString(),
          orderId: payment.orderId.toString(),
          status: payment.status,
        },
      };
    }

    if (dto.status === 'SUCCESS') {
      // Enforce cryptographic signature verification when gateway secret is configured
      if (
        payment.paymentProvider === PaymentProvider.RAZORPAY &&
        process.env.RAZORPAY_KEY_SECRET
      ) {
        if (!dto.signature) {
          throw new BadRequestException('Payment gateway signature is required');
        }
        if (!dto.providerPaymentId) {
          throw new BadRequestException('Payment gateway payment ID is required');
        }
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${dto.providerOrderId}|${dto.providerPaymentId}`)
          .digest('hex');

        if (expectedSignature !== dto.signature) {
          throw new BadRequestException('Invalid payment gateway signature');
        }
      }

      const providerPaymentId = dto.providerPaymentId || `PAY_${Date.now()}_${orderId}`;

      const updatedPayment = await this.prisma.$transaction(async (tx) => {
        // Concurrency guard: re-check status inside atomic transaction
        const freshPayment = await tx.payment.findUnique({
          where: { id: payment.id },
        });

        if (!freshPayment) {
          throw new NotFoundException('Payment record no longer exists');
        }

        if (freshPayment.status === PaymentGatewayStatus.CAPTURED) {
          return freshPayment;
        }

        const effectivePaymentId = freshPayment.providerPaymentId || providerPaymentId;

        const p = await tx.payment.update({
          where: { id: payment.id },
          data: {
            providerPaymentId: effectivePaymentId,
            status: PaymentGatewayStatus.CAPTURED,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
          },
        });

        await tx.financialTransaction.create({
          data: {
            transactionId: effectivePaymentId,
            amount: p.amount,
            currency: p.currency,
            gatewayResponseCode: 'SUCCESS',
            status: 'COMPLETED',
            referenceType: 'PAYMENT',
            referenceId: p.id,
          },
        });

        await tx.paymentEvent.create({
          data: {
            paymentId: p.id,
            eventType: 'PAYMENT_CAPTURED',
            payload: {
              providerPaymentId: effectivePaymentId,
              orderId: orderId.toString(),
              amount: Number(p.amount),
            },
          },
        });

        return p;
      });

      return {
        message: 'Payment verified successfully',
        data: {
          id: updatedPayment.id.toString(),
          orderId: updatedPayment.orderId.toString(),
          providerPaymentId,
          amount: Number(updatedPayment.amount),
          status: updatedPayment.status,
        },
      };
    }

    // Payment failed
    const failureReason = dto.failureReason || 'Transaction rejected by payment gateway';

    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentGatewayStatus.FAILED,
          failureReason,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: p.id,
          eventType: 'PAYMENT_FAILED',
          payload: {
            failureReason,
            orderId: orderId.toString(),
          },
        },
      });

      return p;
    });

    return {
      message: 'Payment failed',
      data: {
        id: updatedPayment.id.toString(),
        orderId: updatedPayment.orderId.toString(),
        status: updatedPayment.status,
        failureReason,
      },
    };
  }

  async getPaymentDetails(userId: bigint, userRoles: string[], orderIdParam: number) {
    const orderId = BigInt(orderIdParam);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { ownerUserId: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const isCustomer = order.customerUserId === userId;
    const isOwner = order.restaurant.ownerUserId === userId;
    const isStaffOrAdmin =
      userRoles.includes('Admin') ||
      userRoles.includes('Finance_manager') ||
      userRoles.includes('Restaurant_staff');

    if (!isCustomer && !isOwner && !isStaffOrAdmin) {
      throw new ForbiddenException('You do not have access to view payment details for this order');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        events: { orderBy: { receivedAt: 'desc' } },
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('No payment records found for this order');
    }

    return {
      id: payment.id.toString(),
      orderId: payment.orderId.toString(),
      paymentProvider: payment.paymentProvider,
      providerOrderId: payment.providerOrderId,
      providerPaymentId: payment.providerPaymentId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      events: payment.events.map((e) => ({
        id: e.id.toString(),
        eventType: e.eventType,
        receivedAt: e.receivedAt,
        payload: e.payload,
      })),
      refunds: payment.refunds.map((r) => ({
        id: r.id.toString(),
        refundReference: r.refundReference,
        amount: Number(r.amount),
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }
}
