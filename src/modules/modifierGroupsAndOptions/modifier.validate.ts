import Joi from 'joi';

const updateModifierGroupSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(150)
    .messages({
      'string.min':
        'Modifier group name must be at least 2 characters',
      'string.max':
        'Modifier group name cannot exceed 150 characters',
    }),

  isRequired: Joi.boolean()
    .messages({
      'boolean.base':
        'isRequired must be true or false',
    }),

  minSelection: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base':
        'Minimum selection must be a number',
      'number.integer':
        'Minimum selection must be an integer',
      'number.min':
        'Minimum selection cannot be less than 0',
    }),

  maxSelection: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base':
        'Maximum selection must be a number',
      'number.integer':
        'Maximum selection must be an integer',
      'number.min':
        'Maximum selection cannot be less than 0',
    }),
})
.min(1) // at least one field required
.messages({
  'object.min':
    'At least one field is required for update',
});


const createModifierOptionSchema = Joi.object({
  optionName: Joi.string()
    .trim()
    .min(1)
    .max(150)
    .required()
    .messages({
      'string.empty': 'Option name is required',
      'any.required': 'Option name is required',
      'string.max':
        'Option name cannot exceed 150 characters',
    }),

  additionalPrice: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base':
        'Additional price must be a valid number',
      'number.min':
        'Additional price cannot be negative',
    }),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base':
        'Display order must be a number',
      'number.integer':
        'Display order must be an integer',
      'number.min':
        'Display order cannot be negative',
    }),
});


const updateModifierOptionSchema = Joi.object({
  optionName: Joi.string()
    .trim()
    .min(1)
    .max(150)
    .messages({
      'string.empty': 'Option name cannot be empty',
      'string.max':
        'Option name cannot exceed 150 characters',
    }),

  additionalPrice: Joi.number()
    .min(0)
    .messages({
      'number.base':
        'Additional price must be a valid number',
      'number.min':
        'Additional price cannot be negative',
    }),

  displayOrder: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base':
        'Display order must be a number',
      'number.integer':
        'Display order must be an integer',
      'number.min':
        'Display order cannot be negative',
    }),
})
.min(1)
.messages({
  'object.min':
    'At least one field is required for update',
});


const attachModifierGroupSchema = Joi.object({
  modifierGroupId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required':
        'Modifier group id is required',

      'number.base':
        'Modifier group id must be a number',

      'number.integer':
        'Modifier group id must be an integer',

      'number.positive':
        'Modifier group id must be positive',
    }),
});


export { updateModifierGroupSchema, createModifierOptionSchema, updateModifierOptionSchema, attachModifierGroupSchema};