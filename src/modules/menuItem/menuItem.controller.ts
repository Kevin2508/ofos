import { Request, Response } from 'express';

import { catchAsync } from '../../middlewares/catch.async.ts';

import {
  categoryIdParamsDto,
  createMenuItemDto,
  menuItemIdParamsDto,
  branchIdParamsDto,
  scheduleParamsDto,
  updateAvailabilityDto,
  createAvailabilityScheduleDto,
  updateBestsellerDto,
  updateMenuItemDto,
} from './menuItem.dto.ts';

import {
  createMenuItemService,
  deleteMenuItemService,
  getMenuItemByIdService,
  getMenuItemsByCategoryService,
  updateMenuItemAvailabilityService,
  getAvailabilitySchedulesService,
  createAvailabilityScheduleService,
  deleteAvailabilityScheduleService,
  updateMenuItemBestsellerService,
  updateMenuItemService,

  uploadMenuItemImageService,
  deleteMenuItemImageService,
  importMenuItemsService,
  duplicateMenuItemService,
} from './menuItem.service.ts';

/**
 * GET CATEGORY ITEMS
 * GET /categories/:categoryId/items
 */
const getMenuItemsByCategory = catchAsync(
  async (
    req: Request<categoryIdParamsDto>,
    res: Response
  ) => {
    const data =
      await getMenuItemsByCategoryService(
        req.params.categoryId
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * POST /categories/:categoryId/items
 */
const createMenuItem = catchAsync(
  async (
    req: Request<
      categoryIdParamsDto,
      {},
      createMenuItemDto
    >,
    res: Response
  ) => {
    const data =
      await createMenuItemService(
        req.params.categoryId,
        req.body
      );

    return res.status(201).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * GET /menu-items/:id
 */
const getMenuItemById = catchAsync(
  async (
    req: Request<menuItemIdParamsDto>,
    res: Response
  ) => {
    const data =
      await getMenuItemByIdService(
        req.params.id
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * PATCH /menu-items/:id
 */
const updateMenuItem = catchAsync(
  async (
    req: Request<
      menuItemIdParamsDto,
      {},
      updateMenuItemDto
    >,
    res: Response
  ) => {
    const data =
      await updateMenuItemService(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * PATCH /menu-items/:id/availability
 */
const updateMenuItemAvailability =
  catchAsync(
    async (
      req: Request<
        menuItemIdParamsDto,
        {},
        updateAvailabilityDto
      >,
      res: Response
    ) => {
      const data =
        await updateMenuItemAvailabilityService(
          req.params.id,
          req.body
        );

      return res.status(200).json({
        status: 'success',
        message: data.message,
        data: data.data,
      });
    }
  );

/**
 * GET /menu-items/:id/availability-schedules
 */
const getAvailabilitySchedules = catchAsync(
  async (
    req: Request<menuItemIdParamsDto>,
    res: Response
  ) => {
    const data = await getAvailabilitySchedulesService(req.params.id);

    return res.status(200).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * POST /menu-items/:id/availability-schedules
 */
const createAvailabilitySchedule = catchAsync(
  async (
    req: Request<menuItemIdParamsDto, {}, createAvailabilityScheduleDto>,
    res: Response
  ) => {
    const data = await createAvailabilityScheduleService(req.params.id, req.body);

    return res.status(201).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * DELETE /menu-items/:id/availability-schedules/:scheduleId
 */
const deleteAvailabilitySchedule = catchAsync(
  async (
    req: Request<scheduleParamsDto>,
    res: Response
  ) => {
    const data = await deleteAvailabilityScheduleService(req.params.id, req.params.scheduleId);

    return res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

/**
 * PATCH /menu-items/:id/bestseller
 */
const updateMenuItemBestseller =
  catchAsync(
    async (
      req: Request<
        menuItemIdParamsDto,
        {},
        updateBestsellerDto
      >,
      res: Response
    ) => {
      const data =
        await updateMenuItemBestsellerService(
          req.params.id,
          req.body
        );

      return res.status(200).json({
        status: 'success',
        message: data.message,
        data: data.data,
      });
    }
  );

/**
 * DELETE /menu-items/:id
 */
const deleteMenuItem = catchAsync(
  async (
    req: Request<menuItemIdParamsDto>,
    res: Response
  ) => {
    const data =
      await deleteMenuItemService(
        req.params.id
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);


/**
 * POST /menu-items/:id/images
 */
const uploadMenuItemImage = catchAsync(
  async (
    req: Request<menuItemIdParamsDto>,
    res: Response
  ) => {
   
    if (!req.file) {
      throw new Error(
        'Image file is required'
      );
    }

    const data =
      await uploadMenuItemImageService(
        req.params.id,
        req.file
      );

    return res.status(201).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * DELETE /menu-items/:id/images/:imageId
 */
const deleteMenuItemImage = catchAsync(
  async (
    req: Request<
      {
        id: string;
        imageId: string;
      }
    >,
    res: Response
  ) => {
    const data =
      await deleteMenuItemImageService(
        req.params.id,
        req.params.imageId
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

/**
 * POST /branches/:branchId/menu-items/import
 */
const importMenuItems = catchAsync(
  async (
    req: Request<branchIdParamsDto>,
    res: Response
  ) => {
    
    if (!req.file) {
      throw new Error(
        'CSV file is required'
      );
    }

    const data =
      await importMenuItemsService(
        req.params.branchId,
        req.file
      );

    return res.status(201).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);



/**
 * POST /menu-items/:id/duplicate
 */
const duplicateMenuItem = catchAsync(
  async (
    req: Request<menuItemIdParamsDto>,
    res: Response
  ) => {
    const data =
      await duplicateMenuItemService(
        req.params.id
      );

    return res.status(201).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);


export {
  getMenuItemsByCategory,
  createMenuItem,
  getMenuItemById,
  updateMenuItem,
  updateMenuItemAvailability,
  getAvailabilitySchedules,
  createAvailabilitySchedule,
  deleteAvailabilitySchedule,
  updateMenuItemBestseller,
  deleteMenuItem,

  uploadMenuItemImage,
  deleteMenuItemImage,

  importMenuItems,
  duplicateMenuItem,
};