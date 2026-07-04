import Joi from 'joi';

const createMenuCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .required()
    .messages({
      'string.min':
        'Category name must be at least 2 characters',
      'string.max':
        'Category name cannot exceed 150 characters',
      'any.required':
        'Category name is required',
    }),

  description: Joi.string()
    .max(255)
    .allow('', null)
    .optional(),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .optional(),
});

const updateMenuCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150),

  description: Joi.string()
    .max(255)
    .allow('', null),

  displayOrder: Joi.number()
    .integer()
    .min(0),
}).min(1);

const reorderMenuCategorySchema = Joi.object({
  categories: Joi.array()
    .items(
      Joi.object({
        id: Joi.string()
          .required()
          .messages({
            'any.required':
              'Category id is required',
          }),

        displayOrder: Joi.number()
          .integer()
          .min(0)
          .required()
          .messages({
            'any.required':
              'Display order is required',
          }),
      })
    )
    .min(1)
    .required(),
});

const updateMenuCategoryAvailabilitySchema = Joi.object({
  isActive: Joi.boolean().required(),
});

export {
  createMenuCategorySchema,
  updateMenuCategorySchema,
  reorderMenuCategorySchema,
  updateMenuCategoryAvailabilitySchema,
};