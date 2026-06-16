
import { findOrderById, findPaymentByOrderId } from "../refund/refund.repository.ts";
import { InitiatePaymentDto, VerifyPaymentDto } from "./payment.dto.ts";
// import { Decimal } from "@prisma/client/runtime/client";
import { createPayment, findLatestPaymentByOrderId,
         verifySuccessfulPayment, verifyFailedPayment,
         findLatestPaymentDetailsByOrderId
 } from "./payment.respository.ts";


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

    if(order.paymentStatus === 'REFUNDED' || order.paymentStatus === 'PARTIALLY_REFUNDED'){
        return{
            status: 'Fail',
            message: 'Cannot Initiate Payment For Refunded Order!'
        }
    }

    const latestPayment = await findLatestPaymentByOrderId(orderId);

    if(latestPayment && ['INITIATED','AUTHORIZED','CAPTURED'].includes(latestPayment.status)){
        return{
            status: 'Fail',
            message: 'Payment Already Exists For This Order!'
        }
    }

     if(latestPayment && ['REFUNDED', 'PARTIALL_REFUNDED'].includes(latestPayment.status)){
        return{
            status: 'Fail',
            message: 'Payment Already Exists For This Order!'
        }
    }

    const providerOrderId = `ORD_${Date.now()}`;
    const providerPaymentId = `PAY_${Date.now()}`;

    if(paymentProvider === 'COD'){

             const payment = await createPayment({
             orderId: order.id,
             paymentProvider: 'COD',
             providerOrderId: '',
             amount: order.totalAmount
         });

         return {
            message: 'Cash On Delivery Selected.',
            data: payment
         }
    }

    const payment = await createPayment({
        orderId: order.id,
        paymentProvider,
        providerOrderId,
        providerPaymentId,
        amount: order.totalAmount
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

const verifyPaymentService = async(payload: VerifyPaymentDto) =>{
    
    const payment = await findPaymentByOrderId(payload.orderId);

    if(!payment){
        return{
            status: 'Fail',
            message: 'Payment Not Found'
        };
    }

    if(payment.providerOrderId !== payload.providerOrderId){

        return{
            status: 'Fail',
            message: 'Invalid Provider Order Id'
        };
    }

    if(payment.status === 'CAPTURED'){


        return{
            status: 'Fail',
            message: 'Payment Already Verified!'
        };
    }

    if(payload.status === 'SUCCESS'){

        const updatePayment = await verifySuccessfulPayment(
            payment.id,
            payment.orderId,
            payload.providerPaymentId
        );

        return {
            message: 'Payment Verified Successfully!',
            data: updatePayment
        };
    }

    const updatePayment = await verifyFailedPayment(
        payment.id,
        payment.orderId,
        payload.failureReason!
    )

    return {
        message: 'Payment Failed!',
        data: updatePayment
    }
}

const getPaymentDetailsService = async(orderId: number) =>{

    const payment = await findLatestPaymentDetailsByOrderId(orderId);

    if(!payment){
        return {
            status: 'Fail',
            message: 'Payment Details Not Found!'
        };
    }

    return {
        status: 'success',
        messsage: 'Payment Details Fetched Successfully!',
        data: payment
    }
      
}
export {inititatePaymentService, verifyPaymentService, getPaymentDetailsService}