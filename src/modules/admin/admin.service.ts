import { prisma } from '../../config/prisma.ts';
import {
  GetAllUsersParams,
  UpdateUserRoleStatusPayload,
} from './admin.interface.ts';
import {
  createAuditLogRepo,
  getAdminOrdersRepo,
  getAllSystemConfigsRepo,
  getAllUsersRepo,
  getAuditLogsRepo,
  getPendingRestaurantsRepo,
  getUserByIdRepo,
  updateRestaurantStatusRepo,
  updateRestaurantDocumentStatusRepo,
  updateSystemConfigRepo,
  updateUserRoleStatusRepo,
  updateUserStatusRepo,
  getSupportTicketsRepo,
  respondToSupportTicketRepo,
  resolveSupportTicketRepo,
  getCouponsRepo,
  createCouponRepo,
  updateCouponRepo,
  overrideMenuItemRepo,
  overrideOperatingHourRepo,
  getKpisRepo,
  getFinanceReportsRepo,
  getHeatmapRepo,
  getAllRestaurantsRepo,
  createSystemConfigRepo,
  deleteSystemConfigRepo,
} from './admin.repository.ts';

import { Prisma, UserStatus } from '../../generated/prisma/client.ts';

async function getAllUsersService(params: GetAllUsersParams) {
  const { users, totalCount } = await getAllUsersRepo(params);

  const formattedUsers = users.map((user) => ({
    id: user.id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    joiningDate: user.createdAt,
    roles: user.userRoles.map((userRole) => ({
      id: userRole.role.id.toString(),
      name: userRole.role.name,
      status: userRole.status,
      assignedAt: userRole.assignedAt,
    })),
  }));

  return {
    users: formattedUsers,
    totalCount,
    totalPages: Math.ceil(totalCount / (params.limit || 20)),
    currentPage: params.page || 1,
  };
}

async function getUserByIdService(userId: string) {
  const { user } = await getUserByIdRepo(userId);

  const formattedUser = {
    id: user.id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    failedLoginAttempts: user.failedLoginAttempts,
    lastLoginAt: user.lastLoginAt,
    status: user.status,
    joiningDate: user.createdAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,

    roles: user.userRoles.map((userRole) => ({
      id: userRole.role.id.toString(),
      name: userRole.role.name,
      description: userRole.role.description,
      status: userRole.status,
      assignedAt: userRole.assignedAt,
    })),
  };

  return {
    user: formattedUser,
  };
}

async function updateUserRoleStatusService(
  payload: UpdateUserRoleStatusPayload,
  actorUserId: string,
  ipAddress?: string
) {
  const { userRole } = await updateUserRoleStatusRepo(payload);

  await createAuditLogRepo({
    actorUserId,
    entityType: 'UserRole',
    entityId: userRole.userId.toString(),
    action: 'UPDATE_ROLE_STATUS',
    newValues: {
      userId: userRole.userId.toString(),
      roleId: userRole.roleId.toString(),
      status: userRole.status,
      assignedAt: userRole.assignedAt,
    },
    ipAddress,
  });

  return {
    userId: userRole.userId.toString(),
    roleId: userRole.roleId.toString(),
    status: userRole.status,
    assignedAt: userRole.assignedAt,
  };
}

async function updateUserStatusService(
  payload: { userId: string; status: UserStatus; reason: string },
  actorUserId: string,
  ipAddress?: string
) {
  const { user, reason } = await updateUserStatusRepo(payload);

  await createAuditLogRepo({
    actorUserId,
    entityType: 'User',
    entityId: user.id.toString(),
    action: 'UPDATE_ACCOUNT_STATUS',
    newValues: {
      status: user.status,
      reason,
    },
    ipAddress,
  });

  return {
    userId: user.id.toString(),
    status: user.status,
  };
}

async function getPendingRestaurantsService() {
  const { restaurants } = await getPendingRestaurantsRepo();

  const formattedRestaurants = restaurants.map((restaurant) => ({
    id: restaurant.id.toString(),
    ownerUserId: restaurant.ownerUserId.toString(),
    businessName: restaurant.businessName,
    legalBusinessName: restaurant.legalBusinessName,
    primaryPhone: restaurant.primaryPhone,
    primaryEmail: restaurant.primaryEmail,
    logoUrl: restaurant.logoUrl,
    coverImageUrl: restaurant.coverImageUrl,
    description: restaurant.description,
    status: restaurant.status,
    approvedBy: restaurant.approvedBy?.toString(),
    approvedAt: restaurant.approvedAt,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
  }));

  return {
    restaurants: formattedRestaurants,
  };
}

async function getAllRestaurantsService(status?: string) {
  const { restaurants, totalCount } = await getAllRestaurantsRepo(status);

  const formattedRestaurants = restaurants.map((restaurant) => ({
    id: restaurant.id.toString(),
    ownerUserId: restaurant.ownerUserId.toString(),
    businessName: restaurant.businessName,
    legalBusinessName: restaurant.legalBusinessName,
    primaryPhone: restaurant.primaryPhone,
    primaryEmail: restaurant.primaryEmail,
    logoUrl: restaurant.logoUrl,
    coverImageUrl: restaurant.coverImageUrl,
    description: restaurant.description,
    status: restaurant.status,
    approvedBy: restaurant.approvedBy?.toString(),
    approvedAt: restaurant.approvedAt,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt,
  }));

  return {
    restaurants: formattedRestaurants,
    totalCount,
  };
}

async function updateRestaurantStatusService({
  restaurantId,
  status,
  reason,
  adminUserId,
  ipAddress,
}: {
  restaurantId: string;
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  reason?: string;
  adminUserId: string;
  ipAddress?: string;
}) {
  const oldRestaurant = await prisma.restaurant.findUnique({
    where: { id: BigInt(restaurantId) },
  });

  const { restaurant } = await updateRestaurantStatusRepo({
    restaurantId,
    status,
    adminUserId,
  });

  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'Restaurant',
    entityId: restaurant.id.toString(),
    action: 'UPDATE_RESTAURANT_STATUS',
    oldValues: oldRestaurant
      ? {
        status: oldRestaurant.status,
        approvedBy: oldRestaurant.approvedBy?.toString(),
        approvedAt: oldRestaurant.approvedAt,
      }
      : undefined,
    newValues: {
      status: restaurant.status,
      reason,
      approvedBy: restaurant.approvedBy?.toString(),
      approvedAt: restaurant.approvedAt,
    },
    ipAddress,
  });

  return {
    id: restaurant.id.toString(),
    status: restaurant.status,
    approvedBy: restaurant.approvedBy?.toString(),
    approvedAt: restaurant.approvedAt,
    updatedAt: restaurant.updatedAt,
  };
}

async function updateRestaurantDocumentStatusService({
  restaurantId,
  documentId,
  status,
  remark,
  adminUserId,
  ipAddress
}: {
  restaurantId: string;
  documentId: string;
  status: 'APPROVED' | 'REJECTED';
  remark?: string;
  adminUserId: string;
  ipAddress?: string;
}) {
  const { document } = await updateRestaurantDocumentStatusRepo({ documentId, status, remark });

  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'RestaurantDocument',
    entityId: document.id.toString(),
    action: 'UPDATE_DOCUMENT_STATUS',
    newValues: {
      status: document.verificationStatus,
      remark: document.remarks,
    },
    ipAddress,
  });

  return {
    id: document.id.toString(),
    status: document.verificationStatus,
    remark: document.remarks,
  };
}

async function getAdminOrdersService(params: { orderStatus?: string }) {
  const { orders } = await getAdminOrdersRepo(params);

  const formattedOrders = orders.map((order) => {
    const assignment = order.deliveryAssignments?.[0];

    return {
      id: order.id.toString(),
      orderNumber: order.orderNumber,

      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,

      subtotalAmount: order.subtotalAmount,
      discountAmount: order.discountAmount,
      deliveryFee: order.deliveryFee,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      customer: order.customer
        ? {
          id: order.customer.id.toString(),
          firstName: order.customer.firstName,
          lastName: order.customer.lastName,
          phone: order.customer.phone,
        }
        : null,

      restaurant: order.restaurant
        ? {
          id: order.restaurant.id.toString(),
          businessName: order.restaurant.businessName,
        }
        : null,

      deliveryAssignment: assignment
        ? {
          id: assignment.id.toString(),
          status: assignment.status,
          assignmentType: assignment.assignmentType,
          partnerUserId: assignment.partnerUserId?.toString(),
        }
        : null,

      deliveryPartner: assignment?.partner
        ? {
          userId: assignment.partner.userId.toString(),
          isOnline: assignment.partner.isOnline,
          averageRating: assignment.partner.averageRating,
        }
        : null,

      latestEvent: order.deliveryEvents?.[0]
        ? {
          eventType: order.deliveryEvents[0].eventType,
          eventData: order.deliveryEvents[0].eventData,
          createdAt: order.deliveryEvents[0].createdAt,
        }
        : null,
    };
  });

  return {
    orders: formattedOrders,
  };
}

async function getAllSystemConfigsService() {
  const configs = await getAllSystemConfigsRepo();
  return configs.map(c => ({
    ...c,
    updatedBy: c.updatedBy?.toString(),
  }));
}

async function updateSystemConfigService(
  key: string,
  value: string | undefined,
  updatedBy: bigint,
  newKey?: string,
  description?: string,
  ipAddress?: string
) {
  const oldConfig = await prisma.systemConfiguration.findUnique({
    where: { configKey: key },
  });

  const updatedConfig = await updateSystemConfigRepo(key, updatedBy, {
    value,
    newKey,
    description,
  });

  if (!updatedConfig) {
    return null;
  }

  await createAuditLogRepo({
    actorUserId: updatedBy.toString(),
    entityType: 'SystemConfiguration',
    entityId: updatedBy.toString(),
    action: 'UPDATE_SYSTEM_CONFIG',
    oldValues: oldConfig
      ? {
        configKey: oldConfig.configKey,
        configValue: oldConfig.configValue,
        description: oldConfig.description,
      }
      : undefined,
    newValues: {
      configKey: updatedConfig.configKey,
      configValue: updatedConfig.configValue,
      description: updatedConfig.description,
    },
    ipAddress,
  });

  return {
    ...updatedConfig,
    updatedBy: updatedConfig.updatedBy?.toString(),
  };
}

async function createSystemConfigService(
  key: string,
  value: string,
  description: string | null,
  updatedBy: bigint,
  ipAddress?: string
) {
  const existingConfig = await prisma.systemConfiguration.findUnique({
    where: { configKey: key },
  });

  if (existingConfig) {
    throw new Error('Configuration key already exists');
  }

  const newConfig = await createSystemConfigRepo(key, value, description, updatedBy);

  await createAuditLogRepo({
    actorUserId: updatedBy.toString(),
    entityType: 'SystemConfiguration',
    entityId: updatedBy.toString(),
    action: 'CREATE_SYSTEM_CONFIG',
    newValues: {
      configKey: newConfig.configKey,
      configValue: newConfig.configValue,
      description: newConfig.description,
    },
    ipAddress,
  });

  return {
    ...newConfig,
    updatedBy: newConfig.updatedBy?.toString(),
  };
}

async function deleteSystemConfigService(
  key: string,
  deletedBy: bigint,
  ipAddress?: string
) {
  const oldConfig = await prisma.systemConfiguration.findUnique({
    where: { configKey: key },
  });

  if (!oldConfig) {
    throw new Error('Configuration key not found');
  }

  const deletedConfig = await deleteSystemConfigRepo(key);

  await createAuditLogRepo({
    actorUserId: deletedBy.toString(),
    entityType: 'SystemConfiguration',
    entityId: deletedBy.toString(),
    action: 'DELETE_SYSTEM_CONFIG',
    oldValues: {
      configKey: oldConfig.configKey,
      configValue: oldConfig.configValue,
      description: oldConfig.description,
    },
    ipAddress,
  });

  return deletedConfig;
}

async function getAuditLogsService(filters: {
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
}) {
  const { auditLogs } = await getAuditLogsRepo(filters);

  const formattedLogs = auditLogs.map((log) => ({
    ...log,
    id: log.id.toString(),
    actorUserId: log.actorUserId.toString(),
    entityId: log.entityId.toString(),

    actor: log.actor
      ? {
        id: log.actor.id.toString(),
        firstName: log.actor.firstName,
        lastName: log.actor.lastName,
        email: log.actor.email,
      }
      : null,
  }));

  return {
    auditLogs: formattedLogs,
  };
}

async function getSupportTicketsService(status?: string) {
  const { tickets } = await getSupportTicketsRepo(status);

  return {
    tickets: tickets.map(t => ({
      ...t,
      id: t.id.toString(),
      orderId: t.orderId.toString(),
      customerUserId: t.customerUserId?.toString(),
      partnerUserId: t.partnerUserId?.toString(),
      assignedAdminUserId: t.assignedAdminUserId?.toString(),
      messages: t.messages.map(m => ({
        ...m,
        id: m.id.toString(),
        ticketId: m.ticketId.toString(),
        senderUserId: m.senderUserId.toString(),
      }))
    })),
  };
}

async function respondToSupportTicketService(ticketId: string, message: string, adminUserId: string) {
  const { ticketMessage, updatedTicket } = await respondToSupportTicketRepo(ticketId, message, adminUserId);

  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'SupportTicket',
    entityId: ticketId,
    action: 'RESPOND_TO_TICKET',
    newValues: { message },
  });

  return { ticketMessage, updatedTicket };
}

async function resolveSupportTicketService(ticketId: string, resolutionMessage: string, adminUserId: string) {
  const { updatedTicket } = await resolveSupportTicketRepo(ticketId, resolutionMessage, adminUserId);

  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'SupportTicket',
    entityId: ticketId,
    action: 'RESOLVE_TICKET',
    newValues: { resolutionMessage },
  });

  return { updatedTicket };
}

async function triggerDisputeRefundService(orderId: string, amount: number, reason: string, adminUserId: string) {
  const payment = await prisma.payment.findFirst({
    where: { orderId: BigInt(orderId) },
    orderBy: { createdAt: 'desc' }
  });
  if (!payment) throw new Error('Payment not found');

  const refund = await prisma.refund.create({
    data: {
      paymentId: payment.id,
      orderId: BigInt(orderId),
      refundReference: `DISP-${Date.now()}`,
      amount,
      reason,
      status: 'INITIATED',
    }
  });

  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'Refund',
    entityId: refund.id.toString(),
    action: 'DISPUTE_REFUND',
    newValues: { amount, reason, orderId },
  });

  return refund;
}

async function getCouponsService() {
  return getCouponsRepo();
}

async function createCouponService(data: any, adminUserId: string) {
  const coupon = await createCouponRepo(data);
  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'Coupon',
    entityId: coupon.id.toString(),
    action: 'CREATE_COUPON',
    newValues: { code: coupon.code, value: coupon.value },
  });
  return coupon;
}

async function updateCouponService(id: string, data: any, adminUserId: string) {
  const coupon = await updateCouponRepo(id, data);
  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'Coupon',
    entityId: coupon.id.toString(),
    action: 'UPDATE_COUPON',
    newValues: { isActive: coupon.isActive },
  });
  return coupon;
}

async function overrideMenuItemService(itemId: string, isAvailable: boolean, adminUserId: string) {
  const item = await overrideMenuItemRepo(itemId, isAvailable);
  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'MenuItem',
    entityId: item.id.toString(),
    action: 'OVERRIDE_MENU_ITEM',
    newValues: { isAvailable },
  });
  return item;
}

async function overrideOperatingHourService(hourId: string, isClosed: boolean, adminUserId: string) {
  const hour = await overrideOperatingHourRepo(hourId, isClosed);
  await createAuditLogRepo({
    actorUserId: adminUserId,
    entityType: 'RestaurantOperatingHour',
    entityId: hour.id.toString(),
    action: 'OVERRIDE_OPERATING_HOUR',
    newValues: { isClosed },
  });
  return hour;
}



async function getKpisService(startDate?: Date, endDate?: Date) {
  return getKpisRepo(startDate, endDate);
}

async function getFinanceReportsService(startDate?: Date, endDate?: Date) {
  return getFinanceReportsRepo(startDate, endDate);
}

async function getHeatmapService(startDate?: Date, endDate?: Date) {
  return getHeatmapRepo(startDate, endDate);
}

export {
  getAllUsersService,
  getPendingRestaurantsService,
  getAllRestaurantsService,
  getUserByIdService,
  getAdminOrdersService,
  updateRestaurantStatusService,
  updateRestaurantDocumentStatusService,
  updateUserRoleStatusService,
  updateUserStatusService,
  getAllSystemConfigsService,
  updateSystemConfigService,
  getAuditLogsService,
  createSystemConfigService,
  deleteSystemConfigService,
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
};
