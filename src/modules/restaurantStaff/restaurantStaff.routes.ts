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

restaurantStaffRouter.get(
  '/branches/:branchId/staff',
  authenticate,
  getRestaurantStaffList
);

restaurantStaffRouter.post(
  '/branches/:branchId/staff',
  authenticate,
  validate(createRestaurantStaffSchema),
  createRestaurantStaff
);

restaurantStaffRouter.patch(
  '/branches/:branchId/staff/:id',
  authenticate,
  validate(updateRestaurantStaffSchema),
  updateRestaurantStaff
);

restaurantStaffRouter.delete(
  '/branches/:branchId/staff/:id',
  authenticate,
  deleteRestaurantStaff
);

export { restaurantStaffRouter };