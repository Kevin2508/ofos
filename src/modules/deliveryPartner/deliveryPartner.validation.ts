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

const uploadDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid('AADHAR', ' PAN', 'DRIVING_LICENSE', 'VEHICLE_RC')
    .required()
    .messages({
      'any.required': 'Document type is required',
      'any.only': 'Invalid document type',
    }),
});

const getAssignmentsQuerySchema = Joi.object({
  status: Joi.string()
    .valid(
      'PENDING',
      'ASSIGNED',
      'ACCEPTED',
      'DECLINED',
      'REASSIGNED',
      'COMPLETED'
    )
    .optional()
    .messages({
      'any.only': 'Invalid assignment status filter',
    }),
});

const assignmentIdSchema = Joi.object({
  assignmentId: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Assignment ID must be a valid number',
    'any.required': 'Assignment ID is required',
  }),
});

const getEarningsSchema = Joi.object({
  period: Joi.string()
    .valid('today', 'weekly', 'monthly')
    .default('today')
    .messages({
      'any.only': 'Period must be today, weekly, or monthly',
    }),
});

const getEarningsHistorySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  page: Joi.number().integer().min(1).default(1),
});

export {
  getAssignmentsQuerySchema,
  updateProfileSchema,
  updateStatusSchema,
  uploadDocumentSchema,
  assignmentIdSchema,
  getEarningsHistorySchema,
  getEarningsSchema,
};
