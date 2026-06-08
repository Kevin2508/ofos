import Joi from "joi";
import { DocumentType } from "../../generated/prisma/enums.ts";

const createRestaurantSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).required().messages({
    "string.min": "Business name must be at least 2 characters",
    "string.max": "Business name cannot exceed 255 characters",
    "any.required": "Business name is required",
  }),

  legalBusinessName: Joi.string().trim().min(2).max(255).required().messages({
    "string.min": "Legal business name must be at least 2 characters",
    "any.required": "Legal business name is required",
  }),

  primaryPhone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.length": "Phone number must be exactly 10 digits",
      "string.pattern.base": "Phone number must only contain digits",
      "any.required": "Primary phone is required",
    }),

  primaryEmail: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org", "io"] } })
    .required()
    .messages({
      "string.email": "Please enter a valid email address",
      "any.required": "Primary email is required",
    }),

  description: Joi.string().max(300).optional().messages({
    "string.max": "Description cannot exceed 300 characters",
  }),
});

const updateRestaurantSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(255).optional(),
  description: Joi.string().max(300).optional(),
  primaryPhone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .optional()
    .messages({
      "string.length": "Phone number must be exactly 10 digits",
      "string.pattern.base": "Phone number must only contain digits",
    }),
  primaryEmail: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "org", "io"] } })
    .optional()
    .messages({
      "string.email": "Please enter a valid email address",
    }),
});

const uploadDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(...Object.values(DocumentType))
    .required()
    .messages({
      "any.only": `documentType must be one of: ${Object.values(DocumentType).join(", ")}`,
      "any.required": "documentType is required",
    }),
});

const pauseRestaurantSchema = Joi.object({
  resumeAt: Joi.string().isoDate().optional().messages({
    "string.isoDate": "resumeAt must be a valid ISO date string",
  }),
});

export {
  createRestaurantSchema,
  updateRestaurantSchema,
  uploadDocumentSchema,
  pauseRestaurantSchema,
};