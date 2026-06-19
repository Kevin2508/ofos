import Joi from 'joi'

const initiatePaymentSchema = Joi.object({
    orderId: Joi.number().integer().positive().required(),
    paymentProvider: Joi.string().valid(
        'RAZORPAY','STRIPE','PAYPAL','COD'
    ).required()

});

const verifyPaymentSchema = Joi.object({

    orderId: Joi.number()
        .integer()
        .positive()
        .required(),

    providerOrderId: Joi.string()
        .required(),

    providerPaymentId: Joi.string()
        .when('status', {
            is: 'SUCCESS',
            then: Joi.required(),
            otherwise: Joi.optional()
        }),

    status: Joi.string()
        .valid('SUCCESS', 'FAILED')
        .required(),

    failureReason: Joi.string()
        .when('status', {
            is: 'FAILED',
            then: Joi.required(),
            otherwise: Joi.optional()
        })
});

export {initiatePaymentSchema, verifyPaymentSchema}