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
    then: Joi.date().min('now').required().custom((value, helpers) => {
      const maxDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      if (value > maxDate) {
        return helpers.message({ custom: 'You can only schedule up to 48 hours in advance' });
      }
      return value;
    }).messages({
      'date.min': 'Scheduled time must be in the future',
    }),
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