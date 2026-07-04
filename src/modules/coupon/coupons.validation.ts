import Joi from 'joi';

export const createCouponSchema = Joi.object({
  code: Joi.string().uppercase().required(),
  couponType: Joi.string().valid('FIXED', 'PERCENTAGE').required(),
  value: Joi.number().positive().required(),
  minimumOrderAmount: Joi.number().min(0).optional(),
  maximumDiscountAmount: Joi.number().min(0).optional(),
  usageLimit: Joi.number().integer().min(1).optional(),
  perUserLimit: Joi.number().integer().min(1).optional(),
  validFrom: Joi.date().iso().required(),
  validUntil: Joi.date().iso().greater(Joi.ref('validFrom')).required(),
  restaurantIds: Joi.array().items(Joi.string()).optional(),
});

export const validateCouponSchema = Joi.object({
  code: Joi.string().required(),
  cartValue: Joi.number().positive().required(),
  restaurantId: Joi.string().required(),
});

// coupons.validation.ts
export const updateCouponSchema = Joi.object({
  code: Joi.string().uppercase().optional(),
  couponType: Joi.string().valid('FIXED', 'PERCENTAGE').optional(),
  value: Joi.number().positive().optional(),
  minimumOrderAmount: Joi.number().min(0).optional(),
  maximumDiscountAmount: Joi.number().min(0).optional(),
  usageLimit: Joi.number().integer().min(1).optional(),
  perUserLimit: Joi.number().integer().min(1).optional(),
  validFrom: Joi.date().iso().optional(),
  validUntil: Joi.date().iso().optional(),
  isActive: Joi.boolean().optional(),
}).min(1); // Ensure at least one field is provided for the update execution