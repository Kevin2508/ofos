import {
    findOrderById,
    findOrderCancellation,
    findPaymentByOrderId,
    findRefundByOrderId,
    createRefundRecord,
    findRefundDetailsByOrderId,
    findAllRefunds,
    findRefundById,
    updateRefundStatus
} from './refund.repository.ts';

import { CreateRefundDto, GetAllRefundsDto, UpdateRefundStatusDto } from './refund.dto.ts';

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

async function updateRefundStatusService(refundId:number, payload:UpdateRefundStatusDto){

    const refund = await findRefundById(refundId);

    if(!refund){
        throw new Error('Refund Not Found');
    }

    const currentStatus = refund.status;
    const newStatus = payload.status;

    if(currentStatus === 'COMPLETED'){
        return {
            status: 'fail',
            message: 'Sorry! Completed Status Cannot Be Modified!'
        }
    }

    if(currentStatus === 'FAILED'){
        return {
            status: 'fail',
            message: 'Sorry! Failed Refund Cannot Be Modified!'
        }
    }

    if(currentStatus === 'INITIATED' && newStatus === 'COMPLETED'){
        return {
            status: 'fail',
            message: 'Sorry! Refund Must Move To Processing Before Completed!'
        }
    }

    const result = updateRefundStatus(refundId,
                                      refund.paymentId,
                                      refund.orderId,
                                      newStatus
    )

    return {
        message: 'Refund Status Updated Successfully!',
        data: result
    }

}
export {createRefundService, getRefundByOrderIdService, getAllRefundsService,
        updateRefundStatusService
}