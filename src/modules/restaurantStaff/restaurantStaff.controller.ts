import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catch.async.ts';

import {
  createRestaurantStaffDto,
  restaurantStaffIdParamsDto,
  restaurantStaffParamsDto,
  updateRestaurantStaffDto,
} from './restaurantStaff.dto.ts';

import {
  createRestaurantStaffService,
  deleteRestaurantStaffService,
  getRestaurantStaffListService,
  updateRestaurantStaffService,
} from './restaurantStaff.service.ts';

const serializeBigInt = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );

const getRestaurantStaffList = catchAsync(
  async (
    req: Request<restaurantStaffParamsDto>,
    res: Response
  ) => {
    const data = await getRestaurantStaffListService(
      req.params.branchId
    );

    return res.status(200).json({
      status: 'success',
      message: data.message,
      data: serializeBigInt(data.data),
    });
  }
);

const createRestaurantStaff = catchAsync(
  async (
    req: Request<
      restaurantStaffParamsDto,
      {},
      createRestaurantStaffDto
    >,
    res: Response
  ) => {
    const data = await createRestaurantStaffService(
      req.params.branchId,
      req.body
    );

    return res.status(201).json({
      status: 'success',
      message: data.message,
      data: serializeBigInt(data.data),
    });
  }
);

const updateRestaurantStaff = catchAsync(
  async (
    req: Request<
      restaurantStaffIdParamsDto,
      {},
      updateRestaurantStaffDto
    >,
    res: Response
  ) => {
    const data = await updateRestaurantStaffService(
      req.params.branchId,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      status: 'success',
      message: data.message,
      data: serializeBigInt(data.data),
    });
  }
);

const deleteRestaurantStaff = catchAsync(
  async (
    req: Request<restaurantStaffIdParamsDto>,
    res: Response
  ) => {
    const data = await deleteRestaurantStaffService(
      req.params.branchId,
      req.params.id
    );

    return res.status(200).json({
      status: 'success',
      message: data.message,
    });
  }
);

export {
  getRestaurantStaffList,
  createRestaurantStaff,
  updateRestaurantStaff,
  deleteRestaurantStaff,
};