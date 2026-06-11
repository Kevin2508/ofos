import { prisma } from "../../config/prisma.ts"
import { GetAllRefundsDto } from "./refund.dto.ts";

async function findOrderById(orderId: number) {
    return await prisma.order.findUnique({
        where: {
            id: BigInt(orderId)
        }
    });
}

async function findOrderCancellation(orderId: number) {
    return await prisma.orderCancellation.findUnique({
        where: {
            orderId: BigInt(orderId)
        }
    });
}

async function findPaymentByOrderId(orderId: number) {
    return await prisma.payment.findFirst({
        where: {
            orderId: BigInt(orderId)
        }
    });
}

async function findRefundByOrderId(orderId: number) {
    return await prisma.refund.findFirst({
        where: {
            orderId: BigInt(orderId)
        }
    });
}

async function createRefundRecord(
    data: {
        paymentId: bigint;
        orderId: bigint;
        refundReference: string;
        amount: number;
        reason: string;
    }
) {

return await prisma.refund.create({
        data: {
            paymentId: data.paymentId,
            orderId: data.orderId,
            refundReference: data.refundReference,
            amount: data.amount,
            reason: data.reason,
            status: 'INITIATED'
        }
    });
}

async function findRefundDetailsByOrderId( orderId: number) {
   return await prisma.refund.findFirst({
        where: {
            orderId: BigInt(orderId)
        },
        select: {
            id: true,
            refundReference: true,
            amount: true,
            status: true,

            payment: {
                select: {
                    id: true,
                    status: true,
                    paymentProvider: true
                }
            },

            order: {
                select: {
                    id: true,
                    orderStatus: true,
                    paymentStatus: true
                }
            }
        }
    });
}

async function findAllRefunds(filters:GetAllRefundsDto) {
    
    const {page, limit, status, fromDate, toDate} = filters;

    const skip:number = (page - 1) * limit;

    const where:any = {};

    if(status){
        where.status = status;
    }

    if(fromDate || toDate){
        where.cratedAt = {};
        
        if(fromDate){
            where.createdAt.gte = new Date(fromDate);
        }

        if(toDate){
            where.createdAt.lte = new Date(toDate);
        }
    }

    const [refunds, total] = await Promise.all([

        prisma.refund.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },

            select: {
                id: true,
                refundReference: true,
                amount: true,
                reason: true,
                status: true,
                createdAt: true,
            }
        }),

        prisma.refund.count ({
            where
        })
    ]);

    return {
        data: refunds,
        pagination: {
            page,
            limit,
            total,
            totalPage: Math.ceil(total / limit)
        }
    }
}
export {findOrderById, findOrderCancellation, findPaymentByOrderId, findRefundByOrderId, createRefundRecord,
        findRefundDetailsByOrderId,
        findAllRefunds
}