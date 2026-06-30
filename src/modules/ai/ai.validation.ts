import Joi from 'joi';

const chatRequestSchema = Joi.object({
  message: Joi.string().required().messages({
    'any.required': 'message is required',
    'string.empty': 'message cannot be empty',
  }),
});

export { chatRequestSchema };
