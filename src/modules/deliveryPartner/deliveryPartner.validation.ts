import Joi from 'joi';

const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).allow(null, '').optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string().max(20).optional(),
  profileImageUrl: Joi.string().uri().max(500).allow(null, '').optional(),

  vehicleType: Joi.string().valid('BIKE', 'SCOOTER', 'CAR', 'VAN').optional(),
  vehicleRegistrationNumber: Joi.string().max(50).optional(),
});

const updateStatusSchema = Joi.object({
  isOnline: Joi.boolean().required().messages({
    'boolean.base': 'isOnline must be a boolean value',
    'any.required': 'isOnline status is required',
  }),
});

export { updateProfileSchema, updateStatusSchema };
