import { Decimal } from "@prisma/client/runtime/client";
import { prisma } from "../../config/prisma.ts"


async function createPayment(data:{orderId:bigint;
                                   paymentProvider: 'RAZORPAY' |
                                   'STRIPE' | 'PAYPAL' | 'COD';
                                   providerOrderId: string;
                                   amount: Decimal
}) {

        return prisma.payment.create({
        data: {
            orderId: data.orderId,

            paymentProvider: data.paymentProvider,

            providerOrderId: data.providerOrderId,

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
export {
    createPayment,
    findLatestPaymentByOrderId
}