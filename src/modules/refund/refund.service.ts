import {
    findOrderById,
    findOrderCancellation,
    findPaymentByOrderId,
    findRefundByOrderId,
    createRefundRecord,
    findRefundDetailsByOrderId,
    findAllRefunds
} from './refund.repository.ts';

import { CreateRefundDto, GetAllRefundsDto } from './refund.dto.ts';

async function createRefundService(payload: CreateRefundDto) {

    const { orderId, reason } = payload;

    const order = await findOrderById(orderId);

    if (!order) {
        throw new Error(
            'Order not found'
        );
    }

    if (order.orderStatus !== 'CANCELLED') {
        throw new Error(
            'Refund can only be initiated for cancelled orders'
        );
    }

    const cancellation = await findOrderCancellation(orderId);

    if (!cancellation) {
        throw new Error(
            'Order cancellation record not found'
        );
    }

    if (!cancellation.refundEligible) {
        throw new Error(
            'Order is not eligible for refund'
        );
    }

    if ( !cancellation.refundAmount || Number(cancellation.refundAmount) <= 0) {
        throw new Error(
            'Invalid refund amount'
        );
    }

    const payment = await findPaymentByOrderId(orderId);

    if (!payment) {
        throw new Error(
            'Payment record not found'
        );
    }

    if ( payment.paymentProvider === 'COD' ) {
        throw new Error(
            'Refund cannot be initiated for COD orders'
        );
    }

    if ( payment.status !== 'CAPTURED') {
        throw new Error(
            'Payment is not eligible for refund'
        );
    }

    const existingRefund = await findRefundByOrderId(orderId);

    if (existingRefund) {
        throw new Error(
            'Refund already initiated for this order'
        );
    }

    const refundReference =
        `REF-${Date.now()}`;

    const refund = await createRefundRecord({
            paymentId: payment.id,
            orderId: BigInt(orderId),
            refundReference,
            amount: Number(
                cancellation.refundAmount
            ),
            reason
        });

    return {
        message:'Refund initiated successfully',
        data: refund
    };
}

async function getRefundByOrderIdService(orderId:number){

    const refund = await findRefundDetailsByOrderId(orderId);

    if (!refund) {
        throw new Error(
            'Refund not found for this order'
        );
    }

    return {
        message:'Refund details fetched successfully',
        data: refund
    };
}

async function getAllRefundsService(filters:GetAllRefundsDto) {
    
    const result = await findAllRefunds(filters);

    
        return {
            message: result.data.length ? 'Refunds fetched successfully.' : 'No refunds found',
            data: result.data,
            pagination: result.pagination
        };
    
}
export {createRefundService, getRefundByOrderIdService, getAllRefundsService}