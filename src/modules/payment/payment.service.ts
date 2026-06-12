
import { findOrderById, findPaymentByOrderId } from "../refund/refund.repository.ts";
import { InitiatePaymentDto } from "./payment.dto.ts";
import { Decimal } from "@prisma/client/runtime/client";
import { createPayment } from "./payment.respository.ts";
async function inititatePaymentService(payload:InitiatePaymentDto){

    const {orderId, paymentProvider} = payload;

    const order = await findOrderById(orderId);

    if(!order){
        return{
            status: 'Fail',
            message: 'Order Not Found!'
        }
    }

    if(order.paymentStatus === 'PAID'){
         return{
            status: 'Fail',
            message: 'Order Is Already PAID!'
        }
    } 

    if(order.orderStatus === 'CANCELLED'){
         return{
            status: 'Fail',
            message: 'Cannot Initiate Payment For Cancelled Order!'
        }
    } 

    const existingPayment = await findPaymentByOrderId(orderId);

    if(existingPayment){
        return{
            status: 'Fail',
            message: 'Payment Already Initiated For This Order!'
        }
    }

    const providerOrderId = `ORD_${Date.now()}`;

    const payment = await createPayment({
        orderId: order.id,
        paymentProvider,
        providerOrderId,
        amount: Decimal(order.totalAmount)
    });

    return {
        message: 'Payment Initiated Successfully!!',
        data :{
            paymentId: payment.id,
            orderId: payment.orderId,
            providerOrderId,
            amount: payment.amount,
            paymentProvider: payment.paymentProvider,
            status: payment.status
        }
    };
}

export {inititatePaymentService}