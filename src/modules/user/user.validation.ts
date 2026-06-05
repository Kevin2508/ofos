import Joi from "joi";

const editUserSchema = Joi.object({
  fullName: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      "string.pattern.base": "fullName should contains only a-z or A-Z",
    }),

  bio: Joi.string().max(160).allow(""),

  location: Joi.string()
    .max(50)
    .pattern(/^[A-Za-z-,\s]*$/)
    .allow(""),

  website: Joi.string().uri().max(100).allow(""),

  birthDate: Joi.date().max("now").iso().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),

  newPassword: Joi.string().min(8).required(),

  confirmPassword: Joi.string().valid(Joi.ref("password")).min(8).required(),
});

export { editUserSchema, changePasswordSchema };
