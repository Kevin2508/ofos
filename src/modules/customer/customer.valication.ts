import Joi from 'joi';

const createAddressSchema = Joi.object({
  label: Joi.string()
    .valid('HOME', 'WORK', 'OTHER')
    .required()
    .messages({
      'any.required': 'Address label is required',
      'any.only': 'Address label must be HOME, WORK, or OTHER',
      'string.empty': 'Address label is required',
    }),

  contactName: Joi.string().trim()
    .min(2)
    .max(150)
    .required()
    .messages({
      'string.empty': 'Contact name is required',
      'any.required': 'Contact name is required',
      'string.min': 'Contact name must be at least 2 characters',
      'string.max': 'Contact name cannot exceed 150 characters',
    }),

  contactPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.empty': 'Contact phone is required',
      'any.required': 'Contact phone is required',
      'string.pattern.base':
        'Contact phone must contain exactly 10 digits',
    }),

  addressLine1: Joi.string()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Address Line 1 is required',
      'any.required': 'Address Line 1 is required',
      'string.max': 'Address Line 1 cannot exceed 255 characters',
    }),

  addressLine2: Joi.string()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Address Line 2 cannot exceed 255 characters',
    }),

  landmark: Joi.string()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Landmark cannot exceed 255 characters',
    }),

  city: Joi.string().trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'City is required',
      'any.required': 'City is required',
      'string.max': 'City cannot exceed 100 characters',
    }),

  state: Joi.string().trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'State is required',
      'any.required': 'State is required',
      'string.max': 'State cannot exceed 100 characters',
    }),

  postalCode: Joi.string()
    .max(20)
    .required()
    .messages({
      'string.empty': 'Postal code is required',
      'any.required': 'Postal code is required',
      'string.max': 'Postal code cannot exceed 20 characters',
    }),

  country: Joi.string()
    .max(60)
    .required()
    .messages({
      'string.empty': 'Country is required',
      'any.required': 'Country is required',
      'string.max': 'Country cannot exceed 60 characters',
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.base': 'Latitude must be a valid number',
      'any.required': 'Latitude is required',
      'number.min': 'Latitude must be greater than or equal to -90',
      'number.max': 'Latitude must be less than or equal to 90',
    }),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.base': 'Longitude must be a valid number',
      'any.required': 'Longitude is required',
      'number.min': 'Longitude must be greater than or equal to -180',
      'number.max': 'Longitude must be less than or equal to 180',
    }),

  isDefault: Joi.boolean()
    .messages({
      'boolean.base': 'isDefault must be either true or false',
    }),

});

export {createAddressSchema} 