import Joi from 'joi';

const getDeliveryPartnerByIdSchema = Joi.object({
  id: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Partner ID must be a numeric string',
  }),
});

const updatePartnerStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED')
    .required(),
});

const assignDeliverySchema = Joi.object({
  partnerUserId: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'partnerUserId must be a numeric string',
  }),
});

const reassignDeliverySchema = Joi.object({
  partnerUserId: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'New partnerUserId must be a numeric string',
  }),
  reason: Joi.string().optional().allow("", null),
});

export {
  getDeliveryPartnerByIdSchema,
  updatePartnerStatusSchema,
  assignDeliverySchema,
  reassignDeliverySchema,
};
