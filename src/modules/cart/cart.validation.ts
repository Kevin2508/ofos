import Joi from "joi";

export const addCartItemSchema = Joi.object({
  restaurantBranchId: Joi.number().integer().positive().required(),
  menuItemId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  specialInstructions: Joi.string().max(150).allow("", null).optional(),
  modifiers: Joi.array()
    .items(
      Joi.object({
        modifierOptionId: Joi.number().integer().positive().required(),
      })
    )
    .optional(),
});

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).optional(),
  specialInstructions: Joi.string().max(150).allow("", null).optional(),
}).min(1);

export const applyCouponSchema = Joi.object({
  couponCode: Joi.string().trim().required(),
});