import Joi from 'joi';
import { UserStatus } from '../../generated/prisma/enums.ts';

const getAllUsersSchema = Joi.object({
  search: Joi.string().optional(),
  role: Joi.string().optional(),
  status: Joi.string()
    .valid(...Object.values(UserStatus))
    .optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  page: Joi.number().integer().min(1).optional(),
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

const updateUserStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(UserStatus))
    .required(),
  reason: Joi.string().trim().min(5).max(500).required(),
});

const restaurantIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const updateRestaurantStatusSchema = Joi.object({
  status: Joi.string()
    .valid('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED')
    .required(),
  reason: Joi.string().optional()
});

const documentIdSchema = Joi.object({
  docId: Joi.number().integer().positive().required(),
  id: Joi.number().integer().positive().required(),
});

const updateRestaurantDocumentStatusSchema = Joi.object({
  status: Joi.string()
    .valid('APPROVED', 'REJECTED')
    .required(),
  remark: Joi.string().optional()
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
  newKey: Joi.string()
    .pattern(/^[a-zA-Z0-9 \-_]{1,50}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Config key must be 1-50 characters, letters, numbers, space or dash only',
    }),
  description: Joi.string().allow('').optional(),
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
  updateUserStatusSchema,
  restaurantIdSchema,
  updateRestaurantStatusSchema,
  documentIdSchema,
  updateRestaurantDocumentStatusSchema,
  getAdminOrdersQuerySchema,
  updateSystemConfigSchema,
  getAuditLogsSchema,
};
