import { Request, Response } from 'express';
import { UserStatus } from '../../generated/prisma/enums.ts';
import { catchAsync } from '../../middlewares/catch.async.ts';
import {
  createSystemConfigService,
  deleteSystemConfigService,
  getAdminOrdersService,
  getAllSystemConfigsService,
  getAllUsersService,
  getAuditLogsService,
  getPendingRestaurantsService,
  getUserByIdService,
  updateRestaurantStatusService,
  updateSystemConfigService,
  updateUserRoleStatusService,
  getAllRestaurantsService,
} from './admin.service.ts';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { search, role, status } = req.query;

  const result = await getAllUsersService({
    search: search as string | undefined,
    role: role as string | undefined,
    status: status as UserStatus | undefined,
  });

  res.status(200).json({
    success: true,
    message: 'Users fetched successfully',
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await getUserByIdService(id as string);

  res.status(200).json({
    success: true,
    message: 'User details fetched successfully',
    data: result,
  });
});

const updateUserRoleStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roleName, status } = req.body;
  const adminUserId = req.user?.id as string;

  const result = await updateUserRoleStatusService(
    {
      userId: id as string,
      roleName,
      status,
    },
    adminUserId
  );

  res.status(200).json({
    success: true,
    message: 'User role status updated successfully',
    data: result,
  });
});

const getPendingRestaurants = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getPendingRestaurantsService();

    res.status(200).json({
      success: true,
      message: 'Pending restaurants fetched successfully',
      data: result,
    });
  }
);

const getAllRestaurants = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.query;
  const result = await getAllRestaurantsService(status as string);

  res.status(200).json({
    success: true,
    message: 'Restaurants fetched successfully',
    data: result,
  });
});

const updateRestaurantStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const adminUserId = req.user?.id as string;

    const result = await updateRestaurantStatusService({
      restaurantId: id as string,
      status,
      adminUserId,
    });

    res.status(200).json({
      success: true,
      message: 'Restaurant status updated successfully',
      data: result,
    });
  }
);

const getAdminOrders = catchAsync(async (req: Request, res: Response) => {
  const { orderStatus } = req.query;

  const result = await getAdminOrdersService({
    orderStatus: orderStatus as string | undefined,
  });

  res.status(200).json({
    success: true,
    message: 'Orders fetched successfully',
    data: result,
  });
});

const getAllSystemConfigs = catchAsync(async (req: Request, res: Response) => {
  const configs = await getAllSystemConfigsService();

  return res.status(200).json({
    success: true,
    message: 'All system configurations fetched successfully',
    data: configs,
  });
});

const updateSystemConfig = catchAsync(async (req: Request, res: Response) => {
  const { key, value } = req.body;
  const adminUserId = req.user?.id;

  const updatedConfig = await updateSystemConfigService(
    key,
    value,
    BigInt(adminUserId as string)
  );

  if (!updatedConfig) {
    return res.status(404).json({
      success: false,
      message: 'Configuration key not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Configuration updated successfully',
    data: updatedConfig,
  });
});

const createSystemConfig = catchAsync(async (req: Request, res: Response) => {
  const { key, value, description } = req.body;
  const adminUserId = req.user?.id;

  const newConfig = await createSystemConfigService(
    key,
    value,
    description || null,
    BigInt(adminUserId as string)
  );

  return res.status(201).json({
    success: true,
    message: 'Configuration created successfully',
    data: newConfig,
  });
});

const deleteSystemConfig = catchAsync(async (req: Request, res: Response) => {
  const { key } = req.params;
  const adminUserId = req.user?.id;

  await deleteSystemConfigService(
    key as string,
    BigInt(adminUserId as string)
  );

  return res.status(200).json({
    success: true,
    message: 'Configuration deleted successfully',
  });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const { actorUserId, entityType, entityId } = req.query;

  const auditLogs = await getAuditLogsService({
    actorUserId: actorUserId as string | undefined,
    entityType: entityType as string | undefined,
    entityId: entityId as string | undefined,
  });

  return res.status(200).json({
    success: true,
    message: 'Audit logs fetched successfully',
    data: auditLogs,
  });
});

export {
  getAllUsers,
  getAdminOrders,
  getPendingRestaurants,
  getAllRestaurants,
  getUserById,
  updateRestaurantStatus,
  updateUserRoleStatus,
  getAllSystemConfigs,
  updateSystemConfig,
  createSystemConfig,
  deleteSystemConfig,
  getAuditLogs,
};
