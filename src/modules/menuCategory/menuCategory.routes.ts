import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';

import {
  createMenuCategory,
  deleteMenuCategory,
  getMenuCategoryList,
  reorderMenuCategory,
  updateMenuCategory,
} from './menuCategory.controller.ts';

import {
  createMenuCategorySchema,
  reorderMenuCategorySchema,
  updateMenuCategorySchema,
} from './menuCategory.validation.ts';

const menuCategoryRouter = Router();

/**
 * GET
 * List all categories of branch
 */
menuCategoryRouter.get(
  '/branches/:branchId/categories',
  authenticate,
  getMenuCategoryList
);

/**
 * POST
 * Create category
 */
menuCategoryRouter.post(
  '/branches/:branchId/categories',
  authenticate,
  validate(createMenuCategorySchema),
  createMenuCategory
);




/**
 * PATCH
 * Reorder categories
 */
menuCategoryRouter.patch(
  '/branches/:branchId/categories/reorder',
  authenticate,
  validate(reorderMenuCategorySchema),
  reorderMenuCategory
);

/**
 * PATCH
 * Update category
 */
menuCategoryRouter.patch(
  '/branches/:branchId/categories/:id',
  authenticate,
  validate(updateMenuCategorySchema),
  updateMenuCategory
);

/**
 * DELETE
 * Delete category
 */
menuCategoryRouter.delete(
  '/branches/:branchId/categories/:id',
  authenticate,
  deleteMenuCategory
);


export { menuCategoryRouter };