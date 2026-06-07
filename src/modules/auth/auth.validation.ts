import Joi from 'joi';

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
          tlds: { allow: ['com', 'net', 'org', 'io'] },
        })
        .messages({
          'string.email': 'Please enter a valid email address ending in .com',
        })
    )
    .required()
    .messages({
      'any.required': 'please enter email or phone as userIdentifier',
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
        .messages({
          'string.length': 'Contact number must be exactly 10 digits',
          'string.pattern.base': 'Contact number must only contain digits',
        }),

      Joi.string()
        .email({
          minDomainSegments: 2,
          tlds: { allow: ['com', 'net', 'org', 'io'] },
        })
        .messages({
          'string.email': 'Please enter a valid email address ending in .com',
        })
    )
    .required()
    .messages({
      'any.required': 'User identifier is required',
      'alternatives.types':
        'User identifier must be a valid 10-digit phone number or email address',
    }),
});

const resetPasswordSchema = Joi.object({
  userIdentifier: Joi.string().optional(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).min(8).required(),
});

const sendOtpSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net', 'org', 'io'] },
    })
    .messages({
      'string.email': 'Please enter a valid email address',
    }),

  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .messages({
      'string.length': 'Contact number must be exactly 10 digits',
      'string.pattern.base': 'Contact number must only contain digits',
    }),
})
  .or('email', 'phone')
  .messages({
    'object.missing': 'Please provide either an email or a phone number',
  });

const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
    })
    .messages({
      'string.email': 'Please enter a valid email address',
    }),

  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .messages({
      'string.length': 'Contact number must be exactly 10 digits',
      'string.pattern.base': 'Contact number must only contain digits',
    }),

  otp: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must only contain numbers',
      'any.required': 'OTP is required',
    }),
})
  .or('email', 'phone')
  .messages({
    'object.missing':
      'Please provide either an email or a phone number to verify',
  });

const registerSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z]+$/)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 100 characters',
      'string.pattern.base': 'First name can only contain letters',
    }),

  email: Joi.string()
    .email({
      minDomainSegments: 2,
    })
    .messages({ 'string.email': 'Please enter valid email address' }),

  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .allow('')
    .required()
    .messages({
      'string.length': 'Contact number must be exactly 10 digits',
      'string.pattern.base': 'Contact number must only contain digits',
    }),

  password: Joi.string().min(8).required(),

  confirmPassword: Joi.string().valid(Joi.ref('password')).min(8).required(),
});

const registerAdminSchema = Joi.object({
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).allow('', null).optional(),
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ['com', 'net', 'org', 'io'] },
    })
    .required()
    .messages({ 'string.email': 'Please enter a valid email address' }),
  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'Contact number must be exactly 10 digits',
      'string.pattern.base': 'Contact number must only contain digits',
    }),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).min(8).required(),
});

export {
  forgotPasswordSchema,
  loginSchema,
  sendOtpSchema,
  registerSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  registerAdminSchema,
};
