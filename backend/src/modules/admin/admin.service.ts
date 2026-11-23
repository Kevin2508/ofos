import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentGatewayStatus,
  Prisma,
  RestaurantStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserRoleStatus,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateSystemConfigDto,
  CreateTicketDto,
  GetAuditLogsQueryDto,
  GetUsersQueryDto,
  TicketRespondDto,
  TicketResolveDto,
  UpdateDocumentStatusDto,
  UpdateRestaurantStatusDto,
  UpdateSystemConfigDto,
  UpdateUserRoleStatusDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. User Management
  async getUsers(query: GetUsersQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (query.role) {
      where.userRoles = {
        some: {
          role: {
            name: { equals: query.role, mode: 'insensitive' },
          },
        },
      };
    }

    const [users, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            include: {
              role: { select: { id: true, name: true, description: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({
        id: u.id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        fullName: `${u.firstName} ${u.lastName || ''}`.trim(),
        email: u.email,
        phone: u.phone,
        status: u.status,
        createdAt: u.createdAt,
        roles: u.userRoles.map((ur) => ({
          roleId: ur.role.id.toString(),
          roleName: ur.role.name,
          status: ur.status,
        })),
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getUserById(idParam: number) {
    const id = BigInt(idParam);
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        customerAddresses: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      roles: user.userRoles.map((ur: any) => ({
        roleId: ur.role.id.toString(),
        roleName: ur.role.name,
        description: ur.role.description,
        status: ur.status,
      })),
      addresses: user.customerAddresses.map((a: any) => ({
        id: a.id.toString(),
        label: a.label,
        addressLine1: a.addressLine1,
        city: a.city,
      })),
    };
  }

  async updateUserRoleStatus(actorUserId: bigint, targetUserIdParam: number, dto: UpdateUserRoleStatusDto) {
    const targetUserId = BigInt(targetUserIdParam);
    const roleId = BigInt(dto.roleId);

    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: targetUserId,
          roleId,
        },
      },
    });

    if (!userRole) {
      throw new NotFoundException('User role mapping not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.userRole.update({
        where: {
          userId_roleId: {
            userId: targetUserId,
            roleId,
          },
        },
        data: {
          status: dto.status,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          entityType: 'UserRole',
          entityId: targetUserId,
          action: 'UPDATE_ROLE_STATUS',
          oldValues: { status: userRole.status },
          newValues: { status: dto.status, roleId: roleId.toString() },
        },
      });

      return res;
    });

    return {
      message: `User role status updated to ${updated.status}`,
      data: {
        userId: targetUserId.toString(),
        roleId: roleId.toString(),
        status: updated.status,
      },
    };
  }

  async updateUserStatus(actorUserId: bigint, targetUserIdParam: number, dto: UpdateUserStatusDto) {
    const targetUserId = BigInt(targetUserIdParam);

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.user.update({
        where: { id: targetUserId },
        data: { status: dto.status },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          entityType: 'User',
          entityId: targetUserId,
          action: 'UPDATE_ACCOUNT_STATUS',
          oldValues: { status: user.status },
          newValues: { status: dto.status },
        },
      });

      return res;
    });

    return {
      message: `User account status updated to ${updated.status}`,
      data: {
        userId: targetUserId.toString(),
        status: updated.status,
      },
    };
  }

  // 2. Restaurant Onboarding & Verification
  async getPendingRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { status: RestaurantStatus.PENDING_VERIFICATION },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        branches: true,
        documents: true,
      },
    });

    return {
      data: restaurants.map((r) => ({
        id: r.id.toString(),
        businessName: r.businessName,
        legalBusinessName: r.legalBusinessName,
        primaryPhone: r.primaryPhone,
        primaryEmail: r.primaryEmail,
        status: r.status,
        cuisineTags: r.cuisineTags,
        createdAt: r.createdAt,
        owner: {
          id: r.owner.id.toString(),
          name: `${r.owner.firstName} ${r.owner.lastName || ''}`.trim(),
          email: r.owner.email,
          phone: r.owner.phone,
        },
        branchesCount: r.branches.length,
        documents: r.documents.map((d) => ({
          id: d.id.toString(),
          documentType: d.documentType,
          documentUrl: d.documentUrl,
          verificationStatus: d.verificationStatus,
          rejectionReason: d.rejectionReason,
        })),
      })),
    };
  }

  async getAllRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        branches: true,
      },
    });

    return {
      data: restaurants.map((r) => ({
        id: r.id.toString(),
        businessName: r.businessName,
        status: r.status,
        ownerName: `${r.owner.firstName} ${r.owner.lastName || ''}`.trim(),
        branchesCount: r.branches.length,
        commissionRate: Number(r.commissionRate || 10),
        createdAt: r.createdAt,
      })),
    };
  }

  async updateRestaurantStatus(actorUserId: bigint, restaurantIdParam: number, dto: UpdateRestaurantStatusDto) {
    const restaurantId = BigInt(restaurantIdParam);

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          status: dto.status,
          ...(dto.status === RestaurantStatus.APPROVED
            ? { approvedBy: actorUserId, approvedAt: new Date() }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          entityType: 'Restaurant',
          entityId: restaurantId,
          action: `UPDATE_RESTAURANT_STATUS_${dto.status}`,
          oldValues: { status: restaurant.status },
          newValues: { status: dto.status, reason: dto.reason || null },
        },
      });

      return res;
    });

    return {
      message: `Restaurant status updated to ${updated.status}`,
      data: {
        id: updated.id.toString(),
        businessName: updated.businessName,
        status: updated.status,
      },
    };
  }

  async updateRestaurantDocumentStatus(
    actorUserId: bigint,
    restaurantIdParam: number,
    docIdParam: number,
    dto: UpdateDocumentStatusDto,
  ) {
    const restaurantId = BigInt(restaurantIdParam);
    const docId = BigInt(docIdParam);

    const doc = await this.prisma.restaurantDocument.findFirst({
      where: { id: docId, restaurantId },
    });

    if (!doc) {
      throw new NotFoundException('Restaurant document not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.restaurantDocument.update({
        where: { id: docId },
        data: {
          verificationStatus: dto.status,
          verifiedBy: actorUserId,
          verifiedAt: new Date(),
          rejectionReason: dto.rejectionReason || dto.reason || null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          entityType: 'RestaurantDocument',
          entityId: docId,
          action: `VERIFY_DOC_${dto.status}`,
          oldValues: { verificationStatus: doc.verificationStatus },
          newValues: { verificationStatus: dto.status, reason: dto.rejectionReason || dto.reason || null },
        },
      });

      return res;
    });

    return {
      message: `Document status updated to ${updated.verificationStatus}`,
      data: {
        id: updated.id.toString(),
        documentType: updated.documentType,
        verificationStatus: updated.verificationStatus,
      },
    };
  }

  // 3. System Configurations
  async getSystemConfigs() {
    const configs = await this.prisma.systemConfiguration.findMany({
      orderBy: { configKey: 'asc' },
    });

    return {
      data: configs.map((c) => ({
        configKey: c.configKey,
        configValue: c.configValue,
        description: c.description,
        updatedAt: c.updatedAt,
      })),
    };
  }

  async createSystemConfig(actorUserId: bigint, dto: CreateSystemConfigDto) {
    const existing = await this.prisma.systemConfiguration.findUnique({
      where: { configKey: dto.configKey },
    });

    if (existing) {
      throw new BadRequestException('Configuration key already exists');
    }

    const config = await this.prisma.$transaction(async (tx) => {
      const res = await tx.systemConfiguration.create({
        data: {
          configKey: dto.configKey,
          configValue: dto.configValue,
          description: dto.description || null,
          updatedBy: actorUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          entityType: 'SystemConfiguration',
          entityId: BigInt(0),
          action: 'CREATE_SYSTEM_CONFIG',
          newValues: { key: res.configKey, value: res.configValue },
        },
      });

      return res;
    });

    return {
      message: 'System configuration created',
      data: config,
    };
  }

  async updateSystemConfig(actorUserId: bigint, dto: UpdateSystemConfigDto) {
    const config = await this.prisma.systemConfiguration.findUnique({
      where: { configKey: dto.configKey },
    });

    if (!config) {
      throw new NotFoundException('Configuration key not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.systemConfiguration.update({
        where: { configKey: dto.configKey },
        data: {
          configValue: dto.configValue,
          description: dto.description !== undefined ? dto.description : config.description,
          updatedBy: actorUserId,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          entityType: 'SystemConfiguration',
          entityId: BigInt(0),
          action: 'UPDATE_SYSTEM_CONFIG',
          oldValues: { key: config.configKey, value: config.configValue },
          newValues: { key: res.configKey, value: res.configValue },
        },
      });

      return res;
    });

    return {
      message: 'System configuration updated successfully',
      data: updated,
    };
  }

  async deleteSystemConfig(configKey: string, actorUserId?: bigint) {
    const config = await this.prisma.systemConfiguration.findUnique({
      where: { configKey },
    });

    if (!config) {
      throw new NotFoundException('Configuration key not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.systemConfiguration.delete({
        where: { configKey },
      });

      if (actorUserId) {
        await tx.auditLog.create({
          data: {
            actorUserId,
            entityType: 'SystemConfiguration',
            entityId: BigInt(0),
            action: 'DELETE_SYSTEM_CONFIG',
            oldValues: { key: config.configKey, value: config.configValue },
          },
        });
      }
    });

    return {
      message: `Configuration ${configKey} deleted successfully`,
    };
  }

  // 4. Audit Logs
  async getAuditLogs(query: GetAuditLogsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.action) {
      where.action = { contains: query.action, mode: 'insensitive' };
    }

    if (query.actorUserId) {
      where.actorUserId = BigInt(query.actorUserId);
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((l) => ({
        id: l.id.toString(),
        actorUserId: l.actorUserId.toString(),
        actorName: `${l.actor.firstName} ${l.actor.lastName || ''}`.trim(),
        actorEmail: l.actor.email,
        entityType: l.entityType,
        entityId: l.entityId.toString(),
        action: l.action,
        oldValues: l.oldValues,
        newValues: l.newValues,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 5. Support Tickets
  async getSupportTickets(status?: TicketStatus) {
    const where: Prisma.SupportTicketWhereInput = {};
    if (status) {
      where.status = status;
    }

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true, totalAmount: true } },
        customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return {
      data: tickets.map((t) => ({
        id: t.id.toString(),
        ticketNumber: t.ticketNumber,
        orderId: t.orderId.toString(),
        orderNumber: t.order.orderNumber,
        customerName: t.customer ? `${t.customer.firstName} ${t.customer.lastName || ''}`.trim() : 'Customer',
        customerEmail: t.customer?.email,
        customerPhone: t.customer?.phone,
        category: t.category,
        priority: t.priority,
        status: t.status,
        subject: t.subject,
        description: t.description,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messages: t.messages.map((m) => ({
          id: m.id.toString(),
          senderName: `${m.sender.firstName} ${m.sender.lastName || ''}`.trim(),
          senderEmail: m.sender.email,
          message: m.message,
          createdAt: m.createdAt,
        })),
      })),
    };
  }

  async createSupportTicket(userId: bigint, dto: CreateTicketDto) {
    const orderId = BigInt(dto.orderId);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerUserId !== userId) {
      throw new ForbiddenException('You are not authorized to create a ticket for this order');
    }

    const ticketNumber = `TCK-${Date.now()}-${order.id}`;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        orderId,
        customerUserId: userId,
        category: dto.category,
        priority: dto.priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        subject: dto.subject,
        description: dto.description,
      },
    });

    return {
      message: 'Support ticket submitted successfully',
      data: {
        id: ticket.id.toString(),
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    };
  }

  async respondToSupportTicket(adminUserId: bigint, ticketIdParam: number, dto: TicketRespondDto) {
    const ticketId = BigInt(ticketIdParam);

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.supportMessage.create({
        data: {
          ticketId,
          senderUserId: adminUserId,
          message: dto.message,
        },
      });

      const updatedTicket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.IN_PROGRESS,
          assignedAdminUserId: adminUserId,
        },
      });

      return { msg, updatedTicket };
    });

    return {
      message: 'Response added to ticket',
      data: {
        ticketId: ticketId.toString(),
        status: result.updatedTicket.status,
        messageId: result.msg.id.toString(),
      },
    };
  }

  async resolveSupportTicket(adminUserId: bigint, ticketIdParam: number, dto: TicketResolveDto) {
    const ticketId = BigInt(ticketIdParam);

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.RESOLVED,
          assignedAdminUserId: adminUserId,
        },
      });

      if (dto.remarks) {
        await tx.supportMessage.create({
          data: {
            ticketId,
            senderUserId: adminUserId,
            message: `[RESOLVED]: ${dto.remarks}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          entityType: 'SupportTicket',
          entityId: ticketId,
          action: 'RESOLVE_TICKET',
          oldValues: { status: ticket.status },
          newValues: { status: TicketStatus.RESOLVED, remarks: dto.remarks || null },
        },
      });

      return res;
    });

    return {
      message: 'Ticket marked as resolved',
      data: {
        id: updated.id.toString(),
        status: updated.status,
      },
    };
  }

  // 6. Platform High-Level KPIs
  async getKpis() {
    const [
      totalUsers,
      totalRestaurants,
      pendingRestaurants,
      totalOrders,
      activeOrders,
      paymentsAgg,
      refundsAgg,
      openTickets,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.restaurant.count({ where: { status: RestaurantStatus.APPROVED } }),
      this.prisma.restaurant.count({ where: { status: RestaurantStatus.PENDING_VERIFICATION } }),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: {
          orderStatus: {
            in: [
              OrderStatus.PLACED,
              OrderStatus.ACCEPTED,
              OrderStatus.PREPARING,
              OrderStatus.READY_FOR_PICKUP,
              OrderStatus.PICKED_UP,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: PaymentGatewayStatus.CAPTURED },
        _sum: { amount: true },
      }),
      this.prisma.refund.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.supportTicket.count({ where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } } }),
    ]);

    return {
      totalUsers,
      totalRestaurants,
      pendingRestaurants,
      totalOrders,
      activeOrders,
      openTickets,
      grossRevenue: Number(paymentsAgg._sum.amount) || 0,
      totalRefunds: Number(refundsAgg._sum.amount) || 0,
    };
  }
}
