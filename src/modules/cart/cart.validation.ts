import Joi from 'joi';

const getCartSchema = Joi.object({
  // No validation needed - branchId comes from query or body
});

const addCartItemSchema = Joi.object({
  menuItemId: Joi.number().required().messages({
    'any.required': 'menuItemId is required',
  }),
  restaurantBranchId: Joi.number().required().messages({
    'any.required': 'restaurantBranchId is required',
  }),
  quantity: Joi.number().min(1).required().messages({
    'any.required': 'quantity is required',
    'number.min': 'quantity must be at least 1',
  }),
  specialInstructions: Joi.string().max(150).optional(),
  modifiers: Joi.array()
    .items(
      Joi.object({
        modifierOptionId: Joi.number().required(),
        additionalPrice: Joi.number().min(0).required(),
      })
    )
    .optional(),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().min(1).optional(),
  specialInstructions: Joi.string().max(150).optional(),
}).min(1);

const applyCouponSchema = Joi.object({
  couponCode: Joi.string().required().messages({
    'any.required': 'couponCode is required',
  }),
});

export {
  getCartSchema,
  addCartItemSchema,
  updateCartItemSchema,
  applyCouponSchema,
};