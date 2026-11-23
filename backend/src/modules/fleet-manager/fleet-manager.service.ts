import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  AssignmentType,
  DeliveryPartnerStatus,
  OnlineStatus,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AssignDeliveryDto,
  GetRidersQueryDto,
  ReassignDeliveryDto,
  UpdateRiderStatusDto,
} from './dto/fleet-manager.dto';

@Injectable()
export class FleetManagerService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Live Map & Telemetry
  async getLiveMap() {
    const [partners, unassignedOrders] = await Promise.all([
      this.prisma.deliveryPartner.findMany({
        where: { isOnline: true },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          assignments: {
            where: {
              status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED] },
            },
            take: 1,
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  orderStatus: true,
                  branch: {
                    select: {
                      branchName: true,
                      latitude: true,
                      longitude: true,
                    },
                  },
                  address: {
                    select: {
                      recipientName: true,
                      addressLine1: true,
                      latitude: true,
                      longitude: true,
                    },
                  },
                },
              },
              trackingPoints: {
                orderBy: { recordedAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          orderStatus: {
            in: [
              OrderStatus.ACCEPTED,
              OrderStatus.PREPARING,
              OrderStatus.READY_FOR_PICKUP,
              OrderStatus.PICKED_UP,
              OrderStatus.OUT_FOR_DELIVERY,
            ],
          },
          deliveryAssignments: {
            none: {
              status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED] },
            },
          },
        },
        include: {
          branch: {
            select: {
              id: true,
              branchName: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          address: {
            select: {
              recipientName: true,
              addressLine1: true,
              city: true,
              latitude: true,
              longitude: true,
            },
          },
          restaurant: {
            select: {
              businessName: true,
            },
          },
        },
      }),
    ]);

    const onlinePartners = partners.map((p) => {
      const activeAssign = p.assignments[0];
      const latestPoint = activeAssign?.trackingPoints[0];

      return {
        userId: p.userId.toString(),
        name: `${p.user.firstName} ${p.user.lastName || ''}`.trim(),
        phone: p.user.phone,
        vehicleType: p.vehicleType,
        vehicleRegistrationNumber: p.vehicleRegistrationNumber,
        averageRating: Number(p.averageRating),
        status: p.status,
        isOnline: p.isOnline,
        currentLocation: latestPoint
          ? {
              latitude: Number(latestPoint.latitude),
              longitude: Number(latestPoint.longitude),
              recordedAt: latestPoint.recordedAt,
            }
          : null,
        activeAssignment: activeAssign
          ? {
              id: activeAssign.id.toString(),
              orderId: activeAssign.orderId.toString(),
              status: activeAssign.status,
              order: {
                id: activeAssign.order.id.toString(),
                orderNumber: activeAssign.order.orderNumber,
                orderStatus: activeAssign.order.orderStatus,
                branch: activeAssign.order.branch,
                address: activeAssign.order.address,
              },
            }
          : null,
      };
    });

    const inTransitCount = onlinePartners.filter((p) => p.activeAssignment !== null).length;

    return {
      totalOnline: onlinePartners.length,
      totalInTransit: inTransitCount,
      totalIdle: onlinePartners.length - inTransitCount,
      totalUnassigned: unassignedOrders.length,
      onlinePartners,
      unassignedOrders: unassignedOrders.map((o) => ({
        id: o.id.toString(),
        orderNumber: o.orderNumber,
        orderStatus: o.orderStatus,
        totalAmount: Number(o.totalAmount),
        createdAt: o.createdAt,
        restaurantName: o.restaurant.businessName,
        branch: {
          ...o.branch,
          id: o.branch.id.toString(),
        },
        address: o.address,
      })),
    };
  }

  // 2. Rider Roster & Status Management
  async getRiders(query: GetRidersQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.isOnline !== undefined) {
      where.isOnline = query.isOnline;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [total, riders] = await Promise.all([
      this.prisma.deliveryPartner.count({ where }),
      this.prisma.deliveryPartner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          assignments: {
            where: {
              status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED] },
            },
            take: 1,
            select: {
              id: true,
              orderId: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      riders: riders.map((r) => ({
        userId: r.userId.toString(),
        name: `${r.user.firstName} ${r.user.lastName || ''}`.trim(),
        email: r.user.email,
        phone: r.user.phone,
        vehicleType: r.vehicleType,
        vehicleRegistrationNumber: r.vehicleRegistrationNumber,
        isOnline: r.isOnline,
        status: r.status,
        averageRating: Number(r.averageRating),
        totalCompletedDeliveries: r.totalCompletedDeliveries,
        joinedAt: r.joinedAt,
        activeAssignment: r.assignments[0]
          ? {
              id: r.assignments[0].id.toString(),
              orderId: r.assignments[0].orderId.toString(),
              status: r.assignments[0].status,
            }
          : null,
      })),
    };
  }

  async updateRiderStatus(partnerUserId: bigint, dto: UpdateRiderStatusDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId: partnerUserId },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.deliveryPartner.update({
        where: { userId: partnerUserId },
        data: {
          status: dto.status,
          ...(dto.status === DeliveryPartnerStatus.SUSPENDED ? { isOnline: false } : {}),
        },
      });

      if (dto.status === DeliveryPartnerStatus.SUSPENDED && partner.isOnline) {
        await tx.partnerStatusLog.create({
          data: {
            partnerUserId,
            status: OnlineStatus.OFFLINE,
            changedAt: new Date(),
          },
        });
      }

      return p;
    });

    return {
      userId: updated.userId.toString(),
      status: updated.status,
      isOnline: updated.isOnline,
      message: `Rider status updated to ${updated.status}`,
    };
  }

  // 3. Manual Dispatch & Reassignment
  async assignDelivery(orderId: bigint, assignedByUserId: bigint, dto: AssignDeliveryDto) {
    const partnerId = BigInt(dto.partnerUserId);

    const [order, partner] = await Promise.all([
      this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          deliveryAssignments: {
            where: {
              status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED] },
            },
          },
        },
      }),
      this.prisma.deliveryPartner.findUnique({
        where: { userId: partnerId },
      }),
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    if (order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot assign order with status ${order.orderStatus}`);
    }

    if (partner.status !== DeliveryPartnerStatus.ACTIVE) {
      throw new BadRequestException('Cannot assign order to inactive or suspended delivery partner');
    }

    if (order.deliveryAssignments.length > 0) {
      throw new BadRequestException('Order already has an active delivery partner assigned. Use reassign instead.');
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      const assign = await tx.deliveryAssignment.create({
        data: {
          orderId,
          partnerUserId: partnerId,
          assignedByUserId,
          assignmentType: AssignmentType.MANUAL,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      await tx.deliveryEvent.create({
        data: {
          orderId,
          partnerUserId: partnerId,
          eventType: 'MANUAL_DISPATCH_ASSIGNED',
          eventData: {
            assignedByUserId: assignedByUserId.toString(),
            partnerUserId: partnerId.toString(),
          },
        },
      });

      return assign;
    });

    return {
      success: true,
      assignmentId: assignment.id.toString(),
      orderId: assignment.orderId.toString(),
      partnerUserId: assignment.partnerUserId?.toString(),
      status: assignment.status,
      message: 'Order manually assigned to delivery partner',
    };
  }

  async reassignDelivery(
    assignmentId: bigint,
    assignedByUserId: bigint,
    dto: ReassignDeliveryDto,
  ) {
    const newPartnerId = BigInt(dto.newPartnerUserId);

    const [currentAssignment, newPartner] = await Promise.all([
      this.prisma.deliveryAssignment.findUnique({
        where: { id: assignmentId },
        include: { order: true },
      }),
      this.prisma.deliveryPartner.findUnique({
        where: { userId: newPartnerId },
      }),
    ]);

    if (!currentAssignment) {
      throw new NotFoundException('Existing delivery assignment not found');
    }
    if (!newPartner) {
      throw new NotFoundException('New delivery partner not found');
    }

    if (
      currentAssignment.status === AssignmentStatus.COMPLETED ||
      currentAssignment.order.orderStatus === OrderStatus.DELIVERED ||
      currentAssignment.order.orderStatus === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot reassign a delivery that is already completed or cancelled.');
    }

    if (newPartner.status !== DeliveryPartnerStatus.ACTIVE) {
      throw new BadRequestException('New delivery partner must be active');
    }

    const newAssignment = await this.prisma.$transaction(async (tx) => {
      // 1. Mark existing assignment as DECLINED
      await tx.deliveryAssignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.DECLINED },
      });

      // 2. Create replacement assignment
      const created = await tx.deliveryAssignment.create({
        data: {
          orderId: currentAssignment.orderId,
          partnerUserId: newPartnerId,
          assignedByUserId,
          assignmentType: AssignmentType.MANUAL,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
        },
      });

      // 3. Log Reassignment Event
      await tx.deliveryEvent.create({
        data: {
          orderId: currentAssignment.orderId,
          partnerUserId: newPartnerId,
          eventType: 'FLEET_MANAGER_REASSIGNMENT',
          eventData: {
            previousAssignmentId: assignmentId.toString(),
            previousPartnerUserId: currentAssignment.partnerUserId?.toString(),
            newPartnerUserId: newPartnerId.toString(),
            reason: dto.reason || 'Manual reassignment by fleet manager',
          },
        },
      });

      return created;
    });

    return {
      success: true,
      newAssignmentId: newAssignment.id.toString(),
      orderId: newAssignment.orderId.toString(),
      partnerUserId: newAssignment.partnerUserId?.toString(),
      message: 'Delivery successfully reassigned to new partner',
    };
  }
}
