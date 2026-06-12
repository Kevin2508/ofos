export interface InitiatePaymentDto {
    orderId: number;
    paymentProvider:
        | 'RAZORPAY'
        | 'STRIPE'
        | 'PAYPAL'
        | 'COD';
}
