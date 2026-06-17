import Joi from "joi";

export const createBranchSchema = Joi.object({
  branchName: Joi.string().required(),
  gstin: Joi.string().max(20).required(),
  fssaiLicenseNumber: Joi.string().max(50).required(),
  contactPhone: Joi.string().max(20).required(),
  addressLine1: Joi.string().max(255).required(),
  addressLine2: Joi.string().max(255).optional(),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  postalCode: Joi.string().max(20).required(),
  country: Joi.string().max(100).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  minimumOrderValue: Joi.number().min(0).optional(),
  deliveryFee: Joi.number().min(0).optional(),
});

export const updateBranchSchema = Joi.object({
  branchName: Joi.string(),
  contactPhone: Joi.string().max(20),
  addressLine1: Joi.string().max(255),
  addressLine2: Joi.string().max(255),
  city: Joi.string().max(100),
  state: Joi.string().max(100),
  postalCode: Joi.string().max(20),
  country: Joi.string().max(100),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  minimumOrderValue: Joi.number().min(0),
  deliveryFee: Joi.number().min(0),
}).min(1);