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
  const { search, role, status, limit = 20, page = 1 } = params;
  const skip = (page - 1) * limit;

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
      take: limit,
      skip: skip,
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

async function updateUserStatusRepo(payload: { userId: string; status: UserStatus; reason: string }) {
  const { userId, status, reason } = payload;
  const user = await prisma.user.findFirst({ where: { id: BigInt(userId) } });
  if (!user) throw new Error('User not found');

  const updatedUser = await prisma.user.update({
    where: { id: BigInt(userId) },
    data: { status }
  });

  return { user: updatedUser, reason };
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
      include: {
        documents: true,
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

async function getAllRestaurantsRepo(status?: string) {
  const where: any = { deletedAt: null };
  if (status) {
    where.status = status;
  }
  
  const [restaurants, totalCount] = await prisma.$transaction([
    prisma.restaurant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        documents: true,
      },
    }),
    prisma.restaurant.count({ where }),
  ]);

  return { restaurants, totalCount };
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

async function updateRestaurantDocumentStatusRepo(payload: {
  documentId: string;
  status: 'APPROVED' | 'REJECTED';
  remark?: string;
}) {
  const { documentId, status, remark } = payload;
  const document = await prisma.restaurantDocument.update({
    where: { id: BigInt(documentId) },
    data: {
      verificationStatus: status,
      remarks: remark,
    }
  });

  return { document };
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

async function createSystemConfigRepo(
  key: string,
  value: string,
  description: string | null,
  updatedBy: bigint
) {
  return prisma.systemConfiguration.create({
    data: {
      configKey: key,
      configValue: value,
      description,
      updatedBy,
    },
  });
}

async function deleteSystemConfigRepo(key: string) {
  return prisma.systemConfiguration.delete({
    where: { configKey: key },
  });
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

async function getSupportTicketsRepo(status?: string) {
  const where: any = {};
  if (status) {
    where.status = status;
  }
  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      partner: true,
      order: true,
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  return { tickets };
}

async function respondToSupportTicketRepo(ticketId: string, message: string, adminUserId: string) {
  const ticketMessage = await prisma.supportMessage.create({
    data: {
      ticketId: BigInt(ticketId),
      senderUserId: BigInt(adminUserId),
      message,
    },
  });

  const updatedTicket = await prisma.supportTicket.update({
    where: { id: BigInt(ticketId) },
    data: { status: 'IN_PROGRESS' },
  });

  return { ticketMessage, updatedTicket };
}

async function resolveSupportTicketRepo(ticketId: string, resolutionMessage?: string, adminUserId?: string) {
  if (resolutionMessage && adminUserId) {
    await prisma.supportMessage.create({
      data: {
        ticketId: BigInt(ticketId),
        senderUserId: BigInt(adminUserId),
        message: resolutionMessage,
      },
    });
  }

  const updatedTicket = await prisma.supportTicket.update({
    where: { id: BigInt(ticketId) },
    data: { status: 'RESOLVED' },
  });

  return { updatedTicket };
}

async function getCouponsRepo() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return { coupons };
}

async function createCouponRepo(data: any) {
  return prisma.coupon.create({ data });
}

async function updateCouponRepo(id: string, data: any) {
  return prisma.coupon.update({ where: { id: BigInt(id) }, data });
}

async function overrideMenuItemRepo(itemId: string, isAvailable: boolean) {
  return prisma.menuItem.update({
    where: { id: BigInt(itemId) },
    data: { isAvailable }
  });
}

async function overrideOperatingHourRepo(hourId: string, isClosed: boolean, openingTime?: Date, closingTime?: Date) {
  const data: any = { isClosed };
  if (openingTime) data.openingTime = openingTime;
  if (closingTime) data.closingTime = closingTime;
  
  return prisma.restaurantOperatingHour.update({
    where: { id: BigInt(hourId) },
    data
  });
}

async function getKpisRepo(startDate?: Date, endDate?: Date) {
  const whereClause: any = {};
  if (startDate && endDate) {
    whereClause.createdAt = { gte: startDate, lte: endDate };
  }

  const [totalOrders, cancelledOrders, newRestaurants, orders] = await Promise.all([
    prisma.order.count({ where: whereClause }),
    prisma.order.count({ where: { ...whereClause, orderStatus: 'CANCELLED_BY_CUSTOMER' } }), // Simplifying cancellation
    prisma.restaurant.count({ where: whereClause }),
    prisma.order.findMany({ 
      where: whereClause,
      select: { totalAmount: true, orderStatus: true, createdAt: true, deliveredAt: true, customerUserId: true }
    })
  ]);

  let gmv = 0;
  let activeCustomers = new Set();
  let totalDeliveryTimeMs = 0;
  let deliveredCount = 0;

  orders.forEach(o => {
    if (o.orderStatus === 'DELIVERED') {
      gmv += Number(o.totalAmount);
      if (o.deliveredAt) {
        totalDeliveryTimeMs += o.deliveredAt.getTime() - o.createdAt.getTime();
        deliveredCount++;
      }
    }
    activeCustomers.add(o.customerUserId);
  });

  return {
    gmv,
    totalOrders,
    activeCustomers: activeCustomers.size,
    newRestaurants,
    averageDeliveryTimeMins: deliveredCount > 0 ? (totalDeliveryTimeMs / deliveredCount / 60000) : 0,
    cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
  };
}

async function getFinanceReportsRepo(startDate?: Date, endDate?: Date) {
  const whereClause: any = {};
  if (startDate && endDate) {
    whereClause.createdAt = { gte: startDate, lte: endDate };
  }

  // Simplified version: real version would sum payments and payouts
  const payments = await prisma.payment.findMany({
    where: { ...whereClause, status: 'SUCCESS' },
    select: { amount: true }
  });
  const grossSales = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Assuming a generic 10% platform commission for this simplified mock
  const platformCommission = grossSales * 0.10;
  const restaurantPayouts = grossSales * 0.70;
  const deliveryPartnerPayouts = grossSales * 0.20;

  return { grossSales, platformCommission, restaurantPayouts, deliveryPartnerPayouts };
}

async function getHeatmapRepo(startDate?: Date, endDate?: Date) {
  const whereClause: any = {};
  if (startDate && endDate) {
    whereClause.createdAt = { gte: startDate, lte: endDate };
  }

  const addresses = await prisma.orderAddress.findMany({
    where: { order: whereClause },
    select: { latitude: true, longitude: true }
  });

  return addresses.map(a => ({ lat: Number(a.latitude), lng: Number(a.longitude), weight: 1 }));
}

export {
  getAllUsersRepo,
  getUserByIdRepo,
  updateUserRoleStatusRepo,
  updateUserStatusRepo,
  getPendingRestaurantsRepo,
  getAllRestaurantsRepo,
  updateRestaurantStatusRepo,
  updateRestaurantDocumentStatusRepo,
  getAdminOrdersRepo,
  getAllSystemConfigsRepo,
  updateSystemConfigRepo,
  getAuditLogsRepo,
  createAuditLogRepo,
  createSystemConfigRepo,
  deleteSystemConfigRepo,
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
};
