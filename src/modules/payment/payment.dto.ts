export interface InitiatePaymentDto {
    orderId: number;
    paymentProvider:
        | 'RAZORPAY'
        | 'STRIPE'
        | 'PAYPAL'
        | 'COD';
}

export interface VerifyPaymentDto {
    orderId: number;
    providerOrderId: string;
    providerPaymentId?: string;
    status: 'SUCCESS' | 'FAILED';
    failureReason?: string;
}