import Joi from 'joi';

const registerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z]+$/)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 100 characters',
      'string.pattern.base': 'First name can only contain letters',
      'any.required': 'First name is required',
    }),

  email: Joi.string()
    .email({
      minDomainSegments: 2,
    })
    .required()
    .messages({ 'string.email': 'Please enter valid email address' }),

  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .allow('')
    .messages({
      'string.length': 'Contact number must be exactly 10 digits',
      'string.pattern.base': 'Contact number must only contain digits',
    }),

  password: Joi.string().min(8).required(),

  confirmPassword: Joi.string().valid(Joi.ref('password')).min(8).required(),
});

const loginSchema = Joi.object({
  userIdentifier: Joi.alternatives()
    .try(
      Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .allow('')
        .messages({
          'string.length': 'Contact number must be exactly 10 digits',
          'string.pattern.base': 'Contact number must only contain digits',
        }),

      Joi.string()
        .email({
          minDomainSegments: 2,
        })
        .messages({
          'string.email': 'Please enter a valid email address ending in .com',
        })
    )
    .required()
    .messages({
      'any.required': 'please enter email or username as userIdentifier',
    }),

  password: Joi.string().min(8).required(),

  rememberMe: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  userIdentifier: Joi.alternatives()
    .try(
      Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/)
        .allow('')
        .messages({
          'string.length': 'Contact number must be exactly 10 digits',
          'string.pattern.base': 'Contact number must only contain digits',
        }),

      Joi.string()
        .email({
          minDomainSegments: 2,
          tlds: { allow: ['com'] },
        })
        .messages({
          'string.email': 'Please enter a valid email address ending in .com',
        })
    )
    .required()
    .messages({
      'any.required': 'please enter email or username as userIdentifier',
    }),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).required(),

  confirmPassword: Joi.string().valid(Joi.ref('password')).min(8).required(),
});

const sendOtpSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ['com'] },
    })
    .required()
    .messages({ 'string.email': 'Please enter valid email address' }),
});

const verigyOtpSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
    })
    .messages({ 'string.email': 'Please enter valid email address' })
    .required(),

  otp: Joi.string().length(6).pattern(/[0-9]/, 'number').required(),
});

export {
  forgotPasswordSchema,
  loginSchema,
  sendOtpSchema,
  registerSchema,
  resetPasswordSchema,
  verigyOtpSchema,
};
