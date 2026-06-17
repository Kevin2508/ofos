import { prisma } from '../../config/prisma.ts';
import { UserStatus } from '../../generated/prisma/enums.ts';
import { UserWhereInput } from '../../generated/prisma/models.ts';
import { UpdateUserRoleStatusPayload } from './admin.interface.ts';

interface GetAllUsersParams {
  search?: string;
  role?: string;
  status?: UserStatus;
}

async function getAllUsersRepo(params: GetAllUsersParams) {
  const { search, role, status } = params;

  const where: UserWhereInput = {
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      {
        firstName: {
          contains: search,
        },
      },
      {
        lastName: {
          contains: search,
        },
      },
      {
        email: {
          contains: search,
        },
      },
      {
        phone: {
          contains: search,
        },
      },
    ];
  }

  if (role) {
    where.userRoles = {
      some: {
        role: {
          name: role,
        },
      },
    };
  }

  const [users, totalCount] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        userRoles: {
          include: {
            role: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.user.count({
      where,
    }),
  ]);

  return {
    users,
    totalCount,
  };
}

async function getUserByIdRepo(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: BigInt(userId),
      deletedAt: null,
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
        orderBy: {
          assignedAt: 'desc',
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return { user };
}

async function updateUserRoleStatusRepo(payload: UpdateUserRoleStatusPayload) {
  const { userId, roleName, status } = payload;

  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: BigInt(userId),
      role: {
        name: roleName,
      },
    },
    include: {
      role: true,
    },
  });

  if (!userRole) {
    throw new Error(`Role '${roleName}' not found for this user`);
  }

  const updatedUserRole = await prisma.userRole.update({
    where: {
      userId_roleId: {
        userId: userRole.userId,
        roleId: userRole.roleId,
      },
    },
    data: {
      status,
    },
  });

  return {
    userRole: updatedUserRole,
  };
}

async function getPendingRestaurantsRepo() {
  const [restaurants, totalCount] = await prisma.$transaction([
    prisma.restaurant.findMany({
      where: {
        status: 'PENDING_VERIFICATION',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),

    prisma.restaurant.count({
      where: {
        status: 'PENDING_VERIFICATION',
        deletedAt: null,
      },
    }),
  ]);

  return {
    restaurants,
    totalCount,
  };
}

async function updateRestaurantStatusRepo({
  restaurantId,
  status,
  adminUserId,
}: {
  restaurantId: string;
  status: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  adminUserId: string;
}) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: BigInt(restaurantId),
      deletedAt: null,
    },
  });

  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  const updateData: any = {
    status,
  };

  if (status === 'APPROVED') {
    updateData.approvedBy = BigInt(adminUserId);
    updateData.approvedAt = new Date();
  }

  const updatedRestaurant = await prisma.restaurant.update({
    where: {
      id: restaurant.id,
    },
    data: updateData,
  });

  return {
    restaurant: updatedRestaurant,
  };
}

import { Prisma } from '../../generated/prisma/client.ts';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    restaurant: true;
    branch: true;

    deliveryAssignments: {
      include: {
        partner: true;
      };
    };

    deliveryEvents: true;
  };
}>;

async function getAdminOrdersRepo(params: { orderStatus?: string }) {
  const { orderStatus } = params;

  const where: any = {
    // add soft delete
  };

  if (orderStatus) {
    where.orderStatus = orderStatus;
  }

  const orders: OrderWithRelations[] = await prisma.order.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      customer: true,
      restaurant: true,
      branch: true,

      deliveryAssignments: {
        include: {
          partner: true,
        },
      },

      deliveryEvents: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    take: 100,
  });

  return { orders };
}

async function getAllSystemConfigsRepo() {
  const configs = await prisma.systemConfiguration.findMany({
    orderBy: {
      configKey: 'asc',
    },
  });

  return configs;
}

async function updateSystemConfigRepo(
  key: string,
  value: string,
  updatedBy: bigint
) {
  const config = await prisma.systemConfiguration.updateMany({
    where: { configKey: key },
    data: {
      configValue: value,
      updatedBy: updatedBy,
    },
  });

  if (config.count === 0) {
    return null;
  }

  const updatedConfig = await prisma.systemConfiguration.findUnique({
    where: { configKey: key },
  });

  return updatedConfig;
}

async function getAuditLogsRepo(filters: {
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
}) {
  const { actorUserId, entityType, entityId } = filters;

  const where: Prisma.AuditLogWhereInput = {};

  if (actorUserId) {
    where.actorUserId = BigInt(actorUserId);
  }

  if (entityType) {
    where.entityType = entityType;
  }

  if (entityId) {
    where.entityId = BigInt(entityId);
  }

  const auditLogs = await prisma.auditLog.findMany({
    where,
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    auditLogs,
  };
}

async function createAuditLogRepo(data: {
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: Prisma.InputJsonValue;
  newValues?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: BigInt(data.actorUserId),
      entityType: data.entityType,
      entityId: BigInt(data.entityId),
      action: data.action,
      oldValues: data.oldValues ?? Prisma.JsonNull,
      newValues: data.newValues ?? Prisma.JsonNull,
      ipAddress: data.ipAddress,
    },
  });
}

export {
  getAllUsersRepo,
  getUserByIdRepo,
  updateUserRoleStatusRepo,
  getPendingRestaurantsRepo,
  updateRestaurantStatusRepo,
  getAdminOrdersRepo,
  getAllSystemConfigsRepo,
  updateSystemConfigRepo,
  getAuditLogsRepo,
  createAuditLogRepo,
};
