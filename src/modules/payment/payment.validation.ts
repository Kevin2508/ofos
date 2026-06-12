import Joi from 'joi'

const initiatePaymentSchema = Joi.object({
    orderId: Joi.number().integer().positive().required(),
    paymentProvider: Joi.string().valid(
        'RAZORPAY','STRIPE','PAYPAL','COD'
    ).required()

});

export {initiatePaymentSchema}