import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';

import {
  CreateMenuCategoryDto,
  MenuCategoryIdParamsDto,
  MenuCategoryParamsDto,
  ReorderMenuCategoryDto,
  UpdateMenuCategoryDto,
  UpdateMenuCategoryAvailabilityDto,
} from './menuCategory.dto.ts';

import {
  createMenuCategoryService,
  deleteMenuCategoryService,
  getMenuCategoryListService,
  reorderMenuCategoryService,
  updateMenuCategoryService,
  updateMenuCategoryAvailabilityService,
  duplicateMenuCategoryService,
} from './menuCategory.service.ts';

/**
 * GET
 * /branches/:branchId/categories
 */
const getMenuCategoryList = catchAsync(
  async (
    req: Request<MenuCategoryParamsDto>,
    res: Response
  ) => {
    const data =
      await getMenuCategoryListService(
        req.params.branchId
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
      data: data.data,
    });
  }
);

/**
 * POST
 * /branches/:branchId/categories
 */
const createMenuCategory = catchAsync(
  async (
    req: Request<
      MenuCategoryParamsDto,
      {},
      CreateMenuCategoryDto
    >,
    res: Response
  ) => {
    const data =
      await createMenuCategoryService(
        req.params.branchId,
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
 * PATCH
 * /branches/:branchId/categories/:id
 */
const updateMenuCategory = catchAsync(
  async (
    req: Request<
      MenuCategoryIdParamsDto,
      {},
      UpdateMenuCategoryDto
    >,
    res: Response
  ) => {
    const data =
      await updateMenuCategoryService(
        req.params.branchId,
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
 * PATCH
 * /branches/:branchId/categories/:id/availability
 */
const updateMenuCategoryAvailability = catchAsync(
  async (
    req: Request<
      MenuCategoryIdParamsDto,
      {},
      UpdateMenuCategoryAvailabilityDto
    >,
    res: Response
  ) => {
    const data =
      await updateMenuCategoryAvailabilityService(
        req.params.branchId,
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
 * DELETE
 * /branches/:branchId/categories/:id
 */
const deleteMenuCategory = catchAsync(
  async (
    req: Request<MenuCategoryIdParamsDto>,
    res: Response
  ) => {
    const data =
      await deleteMenuCategoryService(
        req.params.branchId,
        req.params.id
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

/**
 * PATCH
 * /branches/:branchId/categories/reorder
 */
const reorderMenuCategory = catchAsync(
  async (
    req: Request<
      MenuCategoryParamsDto,
      {},
      ReorderMenuCategoryDto
    >,
    res: Response
  ) => {
    const data =
      await reorderMenuCategoryService(
        req.params.branchId,
        req.body
      );

    return res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

/**
 * POST
 * /branches/:branchId/categories/:id/duplicate
 */
const duplicateMenuCategory = catchAsync(
  async (
    req: Request<MenuCategoryIdParamsDto>,
    res: Response
  ) => {
    const data =
      await duplicateMenuCategoryService(
        req.params.branchId,
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
  getMenuCategoryList,
  createMenuCategory,
  updateMenuCategory,
  updateMenuCategoryAvailability,
  deleteMenuCategory,
  reorderMenuCategory,
  duplicateMenuCategory,
};