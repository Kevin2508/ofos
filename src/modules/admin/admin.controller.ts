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
  updateRestaurantDocumentStatusService,
  updateSystemConfigService,
  updateUserRoleStatusService,
  updateUserStatusService,
  getAllRestaurantsService,
  getSupportTicketsService,
  respondToSupportTicketService,
  resolveSupportTicketService,
  triggerDisputeRefundService,
  getCouponsService,
  createCouponService,
  updateCouponService,
  overrideMenuItemService,
  overrideOperatingHourService,
  getKpisService,
  getFinanceReportsService,
  getHeatmapService,
} from './admin.service.ts';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { search, role, status, limit, page } = req.query;

  const result = await getAllUsersService({
    search: search as string | undefined,
    role: role as string | undefined,
    status: status as UserStatus | undefined,
    limit: limit ? parseInt(limit as string) : 20,
    page: page ? parseInt(page as string) : 1,
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

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const adminUserId = req.user?.id as string;

  const result = await updateUserStatusService(
    {
      userId: id,
      status,
      reason,
    },
    adminUserId
  );

  res.status(200).json({
    success: true,
    message: 'User account status updated successfully',
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
    const { status, reason } = req.body;

    const adminUserId = req.user?.id as string;

    const result = await updateRestaurantStatusService({
      restaurantId: id as string,
      status,
      reason,
      adminUserId,
    });

    res.status(200).json({
      success: true,
      message: 'Restaurant status updated successfully',
      data: result,
    });
  }
);

const updateRestaurantDocumentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id, docId } = req.params;
    const { status, remark } = req.body;
    const adminUserId = req.user?.id as string;

    const result = await updateRestaurantDocumentStatusService({
      restaurantId: id,
      documentId: docId,
      status,
      remark,
      adminUserId
    });

    res.status(200).json({
      success: true,
      message: 'Restaurant document status updated successfully',
      data: result
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

const getSupportTickets = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.query;
  const result = await getSupportTicketsService(status as string | undefined);
  res.status(200).json({ success: true, message: 'Tickets fetched', data: result });
});

const respondToSupportTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  const adminUserId = req.user?.id as string;
  const result = await respondToSupportTicketService(id, message, adminUserId);
  res.status(200).json({ success: true, message: 'Responded to ticket', data: result });
});

const resolveSupportTicket = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolutionMessage } = req.body;
  const adminUserId = req.user?.id as string;
  const result = await resolveSupportTicketService(id, resolutionMessage, adminUserId);
  res.status(200).json({ success: true, message: 'Ticket resolved', data: result });
});

const triggerDisputeRefund = catchAsync(async (req: Request, res: Response) => {
  const { orderId, amount, reason } = req.body;
  const adminUserId = req.user?.id as string;
  const result = await triggerDisputeRefundService(orderId, amount, reason, adminUserId);
  res.status(200).json({ success: true, message: 'Dispute refund triggered', data: result });
});

const getCoupons = catchAsync(async (req: Request, res: Response) => {
  const result = await getCouponsService();
  res.status(200).json({ success: true, data: result });
});

const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const adminUserId = req.user?.id as string;
  const result = await createCouponService(req.body, adminUserId);
  res.status(201).json({ success: true, message: 'Coupon created', data: result });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const adminUserId = req.user?.id as string;
  const { id } = req.params;
  const result = await updateCouponService(id, req.body, adminUserId);
  res.status(200).json({ success: true, message: 'Coupon updated', data: result });
});

const overrideMenuItem = catchAsync(async (req: Request, res: Response) => {
  const adminUserId = req.user?.id as string;
  const { id } = req.params;
  const { isAvailable } = req.body;
  const result = await overrideMenuItemService(id, isAvailable, adminUserId);
  res.status(200).json({ success: true, message: 'Menu item overridden', data: result });
});

const overrideOperatingHour = catchAsync(async (req: Request, res: Response) => {
  const adminUserId = req.user?.id as string;
  const { id } = req.params;
  const { isClosed } = req.body;
  const result = await overrideOperatingHourService(id, isClosed, adminUserId);
  res.status(200).json({ success: true, message: 'Operating hour overridden', data: result });
});

const getKpis = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const result = await getKpisService(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  res.status(200).json({ success: true, data: result });
});

const getFinanceReports = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const result = await getFinanceReportsService(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  res.status(200).json({ success: true, data: result });
});

const getHeatmap = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  const result = await getHeatmapService(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );
  res.status(200).json({ success: true, data: result });
});

export {
  getAllUsers,
  getAdminOrders,
  getPendingRestaurants,
  getAllRestaurants,
  getUserById,
  updateRestaurantStatus,
  updateRestaurantDocumentStatus,
  updateUserRoleStatus,
  updateUserStatus,
  getAllSystemConfigs,
  updateSystemConfig,
  createSystemConfig,
  deleteSystemConfig,
  getAuditLogs,
  getSupportTickets,
  respondToSupportTicket,
  resolveSupportTicket,
  triggerDisputeRefund,
  getCoupons,
  createCoupon,
  updateCoupon,
  overrideMenuItem,
  overrideOperatingHour,
  getKpis,
  getFinanceReports,
  getHeatmap,
};
