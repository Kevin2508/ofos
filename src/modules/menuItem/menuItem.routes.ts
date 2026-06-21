import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';
import { upload } from '../../middlewares/upload.middleware.ts';
import { csvUpload } from '../../middlewares/csvUpload.middleware.ts';

import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItemsByCategory,
  updateMenuItem,
  updateMenuItemAvailability,
  getAvailabilitySchedules,
  createAvailabilitySchedule,
  deleteAvailabilitySchedule,
  updateMenuItemBestseller,

  uploadMenuItemImage,
  deleteMenuItemImage,

  importMenuItems,
} from './menuItem.controller.ts';

import {
  createMenuItemSchema,
  updateAvailabilitySchema,
  createAvailabilityScheduleSchema,
  updateBestsellerSchema,
  updateMenuItemSchema,

  uploadMenuItemImageSchema,
} from './menuItem.validation.ts';

const menuItemRouter = Router();

/**
 * ============================================================
 * CATEGORY ITEMS
 * ============================================================
 */

/**
 * GET /categories/:categoryId/items
 *
 * List all menu items of a category
 */
menuItemRouter.get(
  '/categories/:categoryId/items',
  authenticate,
  getMenuItemsByCategory
);

/**
 * POST /categories/:categoryId/items
 *
 * Create new menu item
 */
menuItemRouter.post(
  '/categories/:categoryId/items',
  authenticate,
  validate(createMenuItemSchema),
  createMenuItem
);

/**
 * ============================================================
 * CSV IMPORT
 * ============================================================
 */

/**
 * POST /branches/:branchId/menu-items/import
 *
 * Bulk import menu items using CSV.
 */
menuItemRouter.post(
  '/branches/:branchId/menu-items/import',

  authenticate,

  csvUpload.single(
    'file'
  ),

  importMenuItems
);

/**
 * ============================================================
 * MENU ITEM
 * ============================================================
 */

/**
 * GET /menu-items/:id
 *
 * Public endpoint
 *
 * Fetch complete menu item
 * with images + modifiers
 */
menuItemRouter.get(
  '/menu-items/:id',
  getMenuItemById
);

/**
 * PATCH /menu-items/:id
 *
 * Update menu item details
 */
menuItemRouter.patch(
  '/menu-items/:id',
  authenticate,
  validate(updateMenuItemSchema),
  updateMenuItem
);

/**
 * PATCH /menu-items/:id/availability
 *
 * Toggle stock availability
 */
menuItemRouter.patch(
  '/menu-items/:id/availability',
  authenticate,
  validate(updateAvailabilitySchema),
  updateMenuItemAvailability
);

/**
 * ============================================================
 * AVAILABILITY SCHEDULES
 * ============================================================
 */

/**
 * GET /menu-items/:id/availability-schedules
 * Fetch schedules
 */
menuItemRouter.get(
  '/menu-items/:id/availability-schedules',
  getAvailabilitySchedules
);

/**
 * POST /menu-items/:id/availability-schedules
 * Create schedule
 */
menuItemRouter.post(
  '/menu-items/:id/availability-schedules',
  authenticate,
  validate(createAvailabilityScheduleSchema),
  createAvailabilitySchedule
);

/**
 * DELETE /menu-items/:id/availability-schedules/:scheduleId
 * Delete schedule
 */
menuItemRouter.delete(
  '/menu-items/:id/availability-schedules/:scheduleId',
  authenticate,
  deleteAvailabilitySchedule
);

/**
 * PATCH /menu-items/:id/bestseller
 *
 * Toggle bestseller badge
 */
menuItemRouter.patch(
  '/menu-items/:id/bestseller',
  authenticate,
  validate(updateBestsellerSchema),
  updateMenuItemBestseller
);

/**
 * ============================================================
 * MENU ITEM IMAGES
 * ============================================================
 */

/**
 * POST /menu-items/:id/images
 *
 * Upload menu item image.
 */
menuItemRouter.post(
  '/menu-items/:id/images',

  authenticate,

  upload.single(
    'menuItemImage'
  ),

  validate(
    uploadMenuItemImageSchema
  ),

  uploadMenuItemImage
);

/**
 * DELETE /menu-items/:id/images/:imageId
 *
 * Delete menu item image.
 */
menuItemRouter.delete(
  '/menu-items/:id/images/:imageId',

  authenticate,

  deleteMenuItemImage
);

/**
 * DELETE /menu-items/:id
 *
 * Soft delete item
 */
menuItemRouter.delete(
  '/menu-items/:id',
  authenticate,
  deleteMenuItem
);

export { menuItemRouter };