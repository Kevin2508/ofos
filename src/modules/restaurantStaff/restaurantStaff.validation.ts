import Joi from 'joi';

const createRestaurantStaffSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'User id is required',
  }),

  designation: Joi.string()
    .valid(
      'MANAGER',
      'KITCHEN_STAFF',
      'CASHIER',
      'SUPERVISOR'
    )
    .required()
    .messages({
      'any.only': 'Invalid designation',
      'any.required': 'Designation is required',
    }),
});

const updateRestaurantStaffSchema = Joi.object({
  designation: Joi.string().valid(
    'MANAGER',
    'KITCHEN_STAFF',
    'CASHIER',
    'SUPERVISOR'
  ),

  status: Joi.string().valid(
    'ACTIVE',
    'INACTIVE'
  ),
}).min(1);

export {
  createRestaurantStaffSchema,
  updateRestaurantStaffSchema,
};