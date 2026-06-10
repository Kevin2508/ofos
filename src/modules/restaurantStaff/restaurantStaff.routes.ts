import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';

import {
  createRestaurantStaff,
  deleteRestaurantStaff,
  getRestaurantStaffList,
  updateRestaurantStaff,
} from './restaurantStaff.controller.ts';

import {
  createRestaurantStaffSchema,
  updateRestaurantStaffSchema,
} from './restaurantStaff.validation.ts';

const restaurantStaffRouter = Router();

/**
 * GET /branches/:branchId/staff
 * List all staff members for a branch
 */
restaurantStaffRouter.get(
  '/branches/:branchId/staff',
  authenticate,
  getRestaurantStaffList
);

/**
 * POST /branches/:branchId/staff
 * Add staff member to branch
 */
restaurantStaffRouter.post(
  '/branches/:branchId/staff',
  authenticate,
  validate(createRestaurantStaffSchema),
  createRestaurantStaff
);

/**
 * PATCH /branches/:branchId/staff/:id
 * Update designation/status
 */
restaurantStaffRouter.patch(
  '/branches/:branchId/staff/:id',
  authenticate,
  validate(updateRestaurantStaffSchema),
  updateRestaurantStaff
);

/**
 * DELETE /branches/:branchId/staff/:id
 * Remove staff member from branch
 */
restaurantStaffRouter.delete(
  '/branches/:branchId/staff/:id',
  authenticate,
  deleteRestaurantStaff
);

export { restaurantStaffRouter };