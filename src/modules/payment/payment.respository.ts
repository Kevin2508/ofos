import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "../../config/prisma.ts"


async function createPayment(data:{orderId:bigint;
                                   paymentProvider: 'RAZORPAY' |
                                   'STRIPE' | 'PAYPAL' | 'COD';
                                   providerOrderId: string;
                                   providerPaymentId?: string;
                                   amount: Decimal
}) {

        return prisma.payment.create({
        data: {
            orderId: data.orderId,

            paymentProvider: data.paymentProvider,

            providerOrderId: data.providerOrderId,

            providerPaymentId: data.providerPaymentId,

            amount: data.amount,

            status: 'INITIATED'
        }
    });
}

async function findLatestPaymentByOrderId(orderId: number) {
    return await prisma.payment.findFirst({
        where: {
            orderId: BigInt(orderId)
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
}

const verifySuccessfulPayment = (paymentId: bigint, orderId: bigint, providerPaymentId: string | undefined) =>{
    return prisma.$transaction(
        async (tx) =>{
            const updatedPayment = await tx.payment.update({
                where: {
                    id: paymentId
                },
                data: {
                    providerPaymentId,
                    status: 'CAPTURED'
                }
            });

            await tx.order.update({
                where: {
                    id:orderId
                },
                data: {
                        paymentStatus: 'PAID'
                }
            });

            await tx.financialTransaction.create({
                data: {
                    transactionId: providerPaymentId || `TXN-${paymentId}-${Date.now()}`,
                    amount: updatedPayment.amount,
                    currency: updatedPayment.currency,
                    gatewayResponseCode: 'SUCCESS',
                    status: 'COMPLETED',
                    referenceType: 'PAYMENT',
                    referenceId: paymentId
                }
            });

            return updatedPayment
        }
    )
}

const verifyFailedPayment = (paymentId: bigint, orderId: bigint, failureReason: string) =>{
    return prisma.$transaction(
        async (tx) =>{
            const updatedPayment = await tx.payment.update({
                where: {
                    id: paymentId
                },
                data: {
                    status: 'FAILED',
                    failureReason
                }
            });

            await tx.order.update({
                where: {
                    id:orderId
                },
                data: {
                        paymentStatus: 'FAILED'
                }
            });

            await tx.financialTransaction.create({
                data: {
                    transactionId: updatedPayment.providerPaymentId || `TXN-${paymentId}-${Date.now()}`,
                    amount: updatedPayment.amount,
                    currency: updatedPayment.currency,
                    gatewayResponseCode: failureReason,
                    status: 'FAILED',
                    referenceType: 'PAYMENT',
                    referenceId: paymentId
                }
            });

            return updatedPayment
        }
    )
}

const findLatestPaymentDetailsByOrderId = async(orderId: number) =>{

    return await prisma.payment.findFirst({
        where: {
            orderId: BigInt(orderId)
        },

        orderBy: {
            createdAt: 'desc'
        }
    });
}

export {
    createPayment,
    findLatestPaymentByOrderId,
    verifySuccessfulPayment,
    verifyFailedPayment,
    findLatestPaymentDetailsByOrderId
}