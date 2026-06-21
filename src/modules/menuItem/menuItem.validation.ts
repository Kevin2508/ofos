import Joi from 'joi';

/**
 * Create Menu Item
 */

const createMenuItemSchema = Joi.object({
  sku: Joi.string().max(50).required(),

  name: Joi.string().max(255).required(),

  description: Joi.string()
    .max(200)
    .allow('', null),

  basePrice: Joi.number()
    .positive()
    .required(),

  foodType: Joi.string()
    .valid(
      'VEG',
      'NON_VEG',
      'VEGAN'
    )
    .required(),

  modifierGroupIds: Joi.array()
    .items(Joi.string())
    .optional(),
});

/**
 * Update Menu Item
 */

const updateMenuItemSchema = Joi.object({
  name: Joi.string().max(255),

  description: Joi.string()
    .max(200)
    .allow('', null),

  basePrice: Joi.number().positive(),

  foodType: Joi.string().valid(
    'VEG',
    'NON_VEG',
    'VEGAN'
  ),
}).min(1);

/**
 * Availability Toggle
 */

const updateAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required(),
});

/**
 * Availability Schedule Create
 */

const createAvailabilityScheduleSchema = Joi.object({
  dayOfWeek: Joi.number().integer().min(0).max(6).required(),
  startTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required().messages({
    'string.pattern.base': 'startTime must be in HH:mm or HH:mm:ss format',
  }),
  endTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).required().messages({
    'string.pattern.base': 'endTime must be in HH:mm or HH:mm:ss format',
  }),
});

/**
 * Bestseller Toggle
 */

const updateBestsellerSchema = Joi.object({
  isBestseller: Joi.boolean().required(),
});

/**
 * Upload Menu Item Image
 *
 * Validation for:
 * POST /menu-items/:id/images
 */

const uploadMenuItemImageSchema =
  Joi.object({
    displayOrder:
      Joi.number()
        .integer()
        .min(0)
        .optional(),
  });


export {
  createMenuItemSchema,
  updateMenuItemSchema,
  updateAvailabilitySchema,
  createAvailabilityScheduleSchema,
  updateBestsellerSchema,

  uploadMenuItemImageSchema,
};