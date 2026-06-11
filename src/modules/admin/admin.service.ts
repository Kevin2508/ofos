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
  updateSystemConfigRepo,
  updateUserRoleStatusRepo,
} from './admin.repository.ts';

async function getAllUsersService(params: GetAllUsersParams) {
  const { users } = await getAllUsersRepo(params);

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

async function updateRestaurantStatusService({
  restaurantId,
  status,
  adminUserId,
  ipAddress,
}: {
  restaurantId: string;
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
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
  return configs;
}

async function updateSystemConfigService(
  key: string,
  value: string,
  updatedBy: bigint,
  ipAddress?: string
) {
  const oldConfig = await prisma.systemConfiguration.findUnique({
    where: { configKey: key },
  });

  const updatedConfig = await updateSystemConfigRepo(key, value, updatedBy);

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

  return updatedConfig;
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

export {
  getAllUsersService,
  getPendingRestaurantsService,
  getUserByIdService,
  getAdminOrdersService,
  updateRestaurantStatusService,
  updateUserRoleStatusService,
  getAllSystemConfigsService,
  updateSystemConfigService,
  getAuditLogsService,
};
