import Joi from 'joi';

const initiateCheckoutSchema = Joi.object({
  addressId: Joi.number().required().messages({
    'any.required': 'addressId is required',
  }),
  deliveryType: Joi.string().valid('ASAP', 'SCHEDULED').required().messages({
    'any.required': 'deliveryType is required',
    'any.only': 'deliveryType must be ASAP or SCHEDULED',
  }),
  scheduledFor: Joi.date().optional().when('deliveryType', {
    is: 'SCHEDULED',
    then: Joi.required(),
  }),
  paymentMethodId: Joi.number().optional(),
  couponId: Joi.number().optional(),
});

const estimateDeliverySchema = Joi.object({
  restaurantLatitude: Joi.number().required(),
  restaurantLongitude: Joi.number().required(),
  customerLatitude: Joi.number().required(),
  customerLongitude: Joi.number().required(),
});

const placeOrderSchema = Joi.object({
  paymentProvider: Joi.string()
    .valid('RAZORPAY', 'STRIPE', 'PAYPAL', 'COD')
    .required()
    .messages({
      'any.required': 'paymentProvider is required',
    }),
});

export {
  initiateCheckoutSchema,
  estimateDeliverySchema,
  placeOrderSchema,
};