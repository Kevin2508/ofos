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
  duplicateMenuItem,
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

menuItemRouter.get(
  '/categories/:categoryId/items',
  authenticate,
  getMenuItemsByCategory
);

menuItemRouter.post(
  '/categories/:categoryId/items',
  authenticate,
  validate(createMenuItemSchema),
  createMenuItem
);

menuItemRouter.post(
  '/branches/:branchId/menu-items/import',
  authenticate,
  csvUpload.single(
    'file'
  ),
  importMenuItems
);

menuItemRouter.get(
  '/menu-items/:id',
  getMenuItemById
);

menuItemRouter.patch(
  '/menu-items/:id',
  authenticate,
  validate(updateMenuItemSchema),
  updateMenuItem
);

menuItemRouter.post(
  '/menu-items/:id/duplicate',
  authenticate,
  duplicateMenuItem
);

menuItemRouter.patch(
  '/menu-items/:id/availability',
  authenticate,
  validate(updateAvailabilitySchema),
  updateMenuItemAvailability
);

menuItemRouter.get(
  '/menu-items/:id/availability-schedules',
  getAvailabilitySchedules
);

menuItemRouter.post(
  '/menu-items/:id/availability-schedules',
  authenticate,
  validate(createAvailabilityScheduleSchema),
  createAvailabilitySchedule
);

menuItemRouter.delete(
  '/menu-items/:id/availability-schedules/:scheduleId',
  authenticate,
  deleteAvailabilitySchedule
);

menuItemRouter.patch(
  '/menu-items/:id/bestseller',
  authenticate,
  validate(updateBestsellerSchema),
  updateMenuItemBestseller
);

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

menuItemRouter.delete(
  '/menu-items/:id/images/:imageId',

  authenticate,

  deleteMenuItemImage
);

menuItemRouter.delete(
  '/menu-items/:id',
  authenticate,
  deleteMenuItem
);

export { menuItemRouter };