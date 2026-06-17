import Joi from 'joi';

const getAllUsersSchema = Joi.object({
  search: Joi.string().trim().optional(),

  role: Joi.string().trim().optional(),

  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED')
    .optional(),
});

const userIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const updateUserRoleStatusSchema = Joi.object({
  roleName: Joi.string().trim().required(),

  status: Joi.string()
    .valid('REQUESTED', 'ASSIGNED', 'REJECTED', 'SUSPENDED')
    .required(),
});

const restaurantIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const updateRestaurantStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED')
    .required(),
});

const getAdminOrdersQuerySchema = Joi.object({
  orderStatus: Joi.string()
    .valid(
      'PLACED',
      'REJECTED',
      'ACCEPTED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'PICKED_UP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    )
    .optional(),
});

const updateSystemConfigSchema = Joi.object({
  key: Joi.string()
    .pattern(/^[a-zA-Z0-9 \-_]{1,50}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Config key must be 1-50 characters, letters, numbers, space or dash only',
    }),
  value: Joi.string().required().messages({
    'string.empty': 'Config value is required',
  }),
});

const getAuditLogsSchema = Joi.object({
  actorUserId: Joi.string().pattern(/^\d+$/).optional().messages({
    'string.pattern.base': 'Actor User ID must be a numeric string',
  }),

  entityType: Joi.string().max(100).optional(),

  entityId: Joi.string().pattern(/^\d+$/).optional().messages({
    'string.pattern.base': 'Entity ID must be a numeric string',
  }),
});

export {
  getAllUsersSchema,
  userIdSchema,
  updateUserRoleStatusSchema,
  restaurantIdSchema,
  updateRestaurantStatusSchema,
  getAdminOrdersQuerySchema,
  updateSystemConfigSchema,
  getAuditLogsSchema,
};
